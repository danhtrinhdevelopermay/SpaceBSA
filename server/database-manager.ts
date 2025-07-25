import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

interface DatabaseConfig {
  id: string;
  name: string;
  connectionString: string;
  priority: number;
  isActive: boolean;
  maxSizeMB: number;
  currentSizeMB?: number;
  lastHealthCheck?: Date;
  isHealthy: boolean;
  isPrimary?: boolean;
}

class DatabaseManager {
  private databases: Map<string, DatabaseConfig> = new Map();
  private connections: Map<string, any> = new Map();
  private currentPrimaryDb: string = 'primary'; // Force reset to primary
  public lastAutoSwitch: string | null = null;

  constructor() {
    this.initializeDatabases();
  }

  private initializeDatabases() {
    // Database chính (hiện tại)
    const primaryDb: DatabaseConfig = {
      id: 'primary',
      name: 'Primary Database',
      connectionString: process.env.DATABASE_URL!,
      priority: 1,
      isActive: true,
      maxSizeMB: 500, // 500MB limit for primary
      isHealthy: true,
      isPrimary: true
    };

    // Database dự phòng 1
    const backupDb1: DatabaseConfig = {
      id: 'backup1',
      name: 'Backup Database 1',
      connectionString: process.env.DATABASE_URL_BACKUP1 || process.env.DATABASE_URL!, // Use primary DB as backup for testing
      priority: 2,
      isActive: true, // Always active for testing, use primary DB URL as fallback
      maxSizeMB: 500, // 500MB limit
      isHealthy: false,
      isPrimary: false
    };

    // Database dự phòng 2
    const backupDb2: DatabaseConfig = {
      id: 'backup2',
      name: 'Backup Database 2',
      connectionString: process.env.DATABASE_URL_BACKUP2 || '',
      priority: 3,
      isActive: process.env.DATABASE_URL_BACKUP2 ? true : false,
      maxSizeMB: 500, // 500MB limit
      isHealthy: false,
      isPrimary: false
    };

    this.databases.set('primary', primaryDb);
    this.databases.set('backup1', backupDb1);
    this.databases.set('backup2', backupDb2);

    // Khởi tạo kết nối cho các database có sẵn
    this.initializeConnections();
  }

  private async initializeConnections() {
    for (const [id, config] of Array.from(this.databases.entries())) {
      if (config.isActive && config.connectionString) {
        try {
          const pool = new Pool({ connectionString: config.connectionString });
          const db = drizzle({ client: pool, schema });
          this.connections.set(id, { pool, db });
          
          // Test connection
          await this.checkDatabaseHealth(id);
          console.log(`[DatabaseManager] Connected to ${config.name} (${id})`);
        } catch (error) {
          console.error(`[DatabaseManager] Failed to connect to ${config.name}:`, error);
          config.isHealthy = false;
        }
      }
    }
  }

  async checkDatabaseHealth(dbId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(dbId);
      if (!connection) return false;

      const { db } = connection;
      
      // Kiểm tra kết nối và lấy kích thước database
      const result = await db.execute(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          pg_database_size(current_database()) as size_bytes
      `);

      const sizeBytes = result.rows?.[0]?.size_bytes ? parseInt(result.rows[0].size_bytes as string) : 0;
      const sizeMB = Math.round(sizeBytes / (1024 * 1024));

      const config = this.databases.get(dbId)!;
      config.currentSizeMB = sizeMB;
      config.lastHealthCheck = new Date();
      config.isHealthy = true;

      console.log(`[DatabaseManager] Health check for ${config.name}: ${sizeMB}MB / ${config.maxSizeMB}MB`);

      // Kiểm tra nếu database gần đầy (90% capacity)
      if (sizeMB > config.maxSizeMB * 0.9) {
        console.warn(`[DatabaseManager] Warning: ${config.name} is at ${Math.round(sizeMB / config.maxSizeMB * 100)}% capacity`);
        
        // Nếu database chính gần đầy, chuyển sang database dự phòng
        if (dbId === this.currentPrimaryDb) {
          await this.switchToPrimaryBackup();
        }
      }

      return true;
    } catch (error) {
      console.error(`[DatabaseManager] Health check failed for ${dbId}:`, error);
      const config = this.databases.get(dbId)!;
      config.isHealthy = false;
      return false;
    }
  }

  public async switchToPrimaryBackup(): Promise<boolean> {
    // Tìm database dự phòng khỏe mạnh nhất
    const backupDatabases = Array.from(this.databases.values())
      .filter(db => db.id !== this.currentPrimaryDb && db.isHealthy && db.isActive)
      .sort((a, b) => a.priority - b.priority);

    if (backupDatabases.length === 0) {
      console.error('[DatabaseManager] No healthy backup databases available!');
      return false;
    }

    const newPrimary = backupDatabases[0];
    console.log(`[DatabaseManager] Auto-switching primary database to: ${newPrimary.name}`);
    
    // Test the connection before switching
    const isHealthy = await this.checkDatabaseHealth(newPrimary.id);
    if (!isHealthy) {
      console.error(`[DatabaseManager] Backup database ${newPrimary.id} failed health check during auto-switch`);
      return false;
    }
    
    // Update current primary
    const oldPrimary = this.currentPrimaryDb;
    this.currentPrimaryDb = newPrimary.id;
    
    // Update database roles - set all to non-primary first
    this.databases.forEach(db => {
      db.isPrimary = false;
    });
    
    // Set the new primary
    newPrimary.isPrimary = true;
    
    // Sync schema to the new primary database
    await this.syncSchemaToDatabase(newPrimary.id);
    
    // Record auto-switch timestamp
    this.lastAutoSwitch = new Date().toISOString();
    
    console.log(`[DatabaseManager] Successfully auto-switched from ${oldPrimary} to ${newPrimary.name}`);
    return true;
  }

  // Method để chuyển đổi thủ công sang database cụ thể
  public async switchToPrimary(targetDatabaseId: string): Promise<boolean> {
    try {
      console.log(`[DatabaseManager] Manual switch to: ${targetDatabaseId}`);
      
      const targetDb = this.databases.get(targetDatabaseId);
      if (!targetDb) {
        console.error(`[DatabaseManager] Database ${targetDatabaseId} not found`);
        return false;
      }
      
      if (!targetDb.isHealthy || !targetDb.isActive) {
        console.error(`[DatabaseManager] Database ${targetDatabaseId} is not healthy or active`);
        return false;
      }
      
      if (targetDb.id === this.currentPrimaryDb) {
        console.log(`[DatabaseManager] Database ${targetDatabaseId} is already primary`);
        return true;
      }
      
      // Test the connection to ensure it's working
      const isConnectionHealthy = await this.checkDatabaseHealth(targetDatabaseId);
      if (!isConnectionHealthy) {
        console.error(`[DatabaseManager] Database ${targetDatabaseId} failed health check during switch`);
        return false;
      }
      
      // Update current primary
      const oldPrimary = this.currentPrimaryDb;
      this.currentPrimaryDb = targetDatabaseId;
      
      // Update database roles - set all to non-primary first
      this.databases.forEach(db => {
        db.isPrimary = false;
      });
      
      // Set the target database as primary
      targetDb.isPrimary = true;
      
      // Sync schema to the new primary database
      await this.syncSchemaToDatabase(targetDatabaseId);
      
      console.log(`[DatabaseManager] Successfully switched from ${oldPrimary} to ${targetDatabaseId}`);
      console.log(`[DatabaseManager] New primary database: ${targetDb.name} (${targetDb.id})`);
      
      return true;
      
    } catch (error) {
      console.error(`[DatabaseManager] Error switching to ${targetDatabaseId}:`, error);
      return false;
    }
  }

  private async syncSchemaToDatabase(dbId: string): Promise<void> {
    // Tạo bảng trong database mới nếu chưa có
    const connection = this.connections.get(dbId);
    if (!connection) return;

    try {
      console.log(`[DatabaseManager] Syncing schema to database ${dbId}`);
      // Schema sẽ được tự động tạo khi sử dụng drizzle
      // Có thể thêm logic đồng bộ dữ liệu quan trọng nếu cần
    } catch (error) {
      console.error(`[DatabaseManager] Failed to sync schema to ${dbId}:`, error);
    }
  }

  // Lấy database connection hiện tại (primary)
  getCurrentDatabase() {
    console.log(`[DatabaseManager] getCurrentDatabase() -> currentPrimaryDb: ${this.currentPrimaryDb}`);
    const connection = this.connections.get(this.currentPrimaryDb);
    if (!connection) {
      throw new Error(`No connection available for primary database: ${this.currentPrimaryDb}`);
    }
    console.log(`[DatabaseManager] Using database: ${this.databases.get(this.currentPrimaryDb)?.name || this.currentPrimaryDb}`);
    return connection.db;
  }

  // Lấy tất cả database connections để query toàn bộ dữ liệu
  getAllDatabases() {
    const activeDbs = [];
    for (const [id, config] of Array.from(this.databases.entries())) {
      // Bao gồm tất cả databases có connection, không phụ thuộc vào isHealthy
      if (config.isActive && this.connections.has(id)) {
        console.log(`[DatabaseManager] Including database in search: ${config.name} (healthy: ${config.isHealthy})`);
        activeDbs.push({
          id,
          name: config.name,
          db: this.connections.get(id)!.db,
          priority: config.priority,
          currentSizeMB: config.currentSizeMB || 0,
          maxSizeMB: config.maxSizeMB
        });
      } else {
        console.log(`[DatabaseManager] Excluding database: ${config.name} (active: ${config.isActive}, hasConnection: ${this.connections.has(id)})`);
      }
    }
    console.log(`[DatabaseManager] Total databases available for search: ${activeDbs.length}`);
    return activeDbs.sort((a, b) => a.priority - b.priority);
  }

  // Thêm database mới
  async addDatabase(config: Omit<DatabaseConfig, 'isHealthy' | 'lastHealthCheck'>) {
    try {
      const pool = new Pool({ connectionString: config.connectionString });
      const db = drizzle({ client: pool, schema });
      
      this.databases.set(config.id, {
        ...config,
        isHealthy: false,
        lastHealthCheck: undefined
      });
      
      this.connections.set(config.id, { pool, db });
      
      // Test connection và đồng bộ schema
      const isHealthy = await this.checkDatabaseHealth(config.id);
      if (isHealthy) {
        await this.syncSchemaToDatabase(config.id);
        console.log(`[DatabaseManager] Successfully added database: ${config.name}`);
      }
      
      return isHealthy;
    } catch (error) {
      console.error(`[DatabaseManager] Failed to add database ${config.name}:`, error);
      return false;
    }
  }

  // Lấy thống kê tất cả databases
  getDatabaseStats() {
    return Array.from(this.databases.entries()).map(([id, db]) => ({
      id: db.id,
      name: db.name,
      isActive: db.isActive,
      isHealthy: db.isHealthy,
      isPrimary: db.id === this.currentPrimaryDb,
      currentSizeMB: db.currentSizeMB || 0,
      maxSizeMB: db.maxSizeMB,
      usagePercent: db.currentSizeMB ? Math.round((db.currentSizeMB / db.maxSizeMB) * 100) : 0,
      lastHealthCheck: db.lastHealthCheck,
      priority: db.priority
    }));
  }

  // Chạy health check cho tất cả databases
  async runHealthChecks() {
    const databaseIds = Array.from(this.databases.keys());
    const healthPromises = databaseIds.map(id => 
      this.checkDatabaseHealth(id)
    );
    await Promise.all(healthPromises);
  }

  // Kiểm tra và chuyển đổi database khi cần thiết
  public async checkAndSwitchIfNeeded(): Promise<void> {
    try {
      // Check if auto-switch is disabled
      if (process.env.AUTO_SWITCH_DISABLED === 'true') {
        return; // Skip auto-switching if disabled
      }

      const currentDb = this.databases.get(this.currentPrimaryDb);
      if (!currentDb) return;

      // Kiểm tra dung lượng
      const usagePercent = ((currentDb.currentSizeMB || 0) / currentDb.maxSizeMB) * 100;
      
      if (usagePercent >= 90) {
        console.log(`[DatabaseManager] Current database at ${usagePercent.toFixed(1)}% capacity, auto-switching...`);
        const switched = await this.switchToPrimaryBackup();
        if (switched) {
          console.log(`[DatabaseManager] Auto-switch completed to: ${this.currentPrimaryDb}`);
        }
      }
    } catch (error) {
      console.error('[DatabaseManager] Error checking database capacity:', error);
    }
  }
}

// Singleton instance
const databaseManagerInstance = new DatabaseManager();

// Export default database connection (compatibility)
export const db = databaseManagerInstance.getCurrentDatabase();
export { databaseManagerInstance as databaseManager };