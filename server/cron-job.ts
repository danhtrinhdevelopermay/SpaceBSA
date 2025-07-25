// Enhanced scheduled tasks for database maintenance and optimization
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import { storage } from './storage.js';
import { dataProtectionService } from './data-protection.js';

interface CronJobConfig {
  trashCleanupInterval: number; // milliseconds
  databaseOptimizeInterval: number; // milliseconds
  enableLogging: boolean;
}

class CronJobService {
  private config: CronJobConfig;
  private trashCleanupTimer?: NodeJS.Timeout;
  private dbOptimizeTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: Partial<CronJobConfig> = {}) {
    this.config = {
      trashCleanupInterval: 60 * 60 * 1000, // 1 hour
      databaseOptimizeInterval: 24 * 60 * 60 * 1000, // 24 hours
      enableLogging: true,
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[CronJobs] Service already running');
      return;
    }

    this.isRunning = true;
    console.log('[CronJobs] Starting scheduled tasks service...');
    
    // Start trash cleanup job
    this.startTrashCleanup();
    
    // Start database optimization job
    this.startDatabaseOptimization();
    
    // Run initial tasks
    await this.runInitialTasks();
    
    console.log('[CronJobs] Scheduled tasks service started successfully');
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('[CronJobs] Stopping scheduled tasks service...');
    
    if (this.trashCleanupTimer) {
      clearInterval(this.trashCleanupTimer);
      this.trashCleanupTimer = undefined;
    }
    
    if (this.dbOptimizeTimer) {
      clearInterval(this.dbOptimizeTimer);
      this.dbOptimizeTimer = undefined;
    }
    
    this.isRunning = false;
    console.log('[CronJobs] Scheduled tasks service stopped');
  }

  private startTrashCleanup(): void {
    this.trashCleanupTimer = setInterval(async () => {
      await this.performTrashCleanup();
    }, this.config.trashCleanupInterval);

    if (this.config.enableLogging) {
      console.log(`[CronJobs] Trash cleanup scheduled (interval: ${this.config.trashCleanupInterval / 1000 / 60} minutes)`);
    }
  }

  private startDatabaseOptimization(): void {
    this.dbOptimizeTimer = setInterval(async () => {
      await this.performDatabaseOptimization();
    }, this.config.databaseOptimizeInterval);

    if (this.config.enableLogging) {
      console.log(`[CronJobs] Database optimization scheduled (interval: ${this.config.databaseOptimizeInterval / 1000 / 60 / 60} hours)`);
    }
  }

  private async runInitialTasks(): Promise<void> {
    // Wait a bit before running initial tasks
    setTimeout(async () => {
      await this.performTrashCleanup();
      setTimeout(async () => {
        await this.performDatabaseOptimization();
      }, 30000); // Wait 30 seconds between initial tasks
    }, 5000); // Wait 5 seconds after service start
  }

  private async performTrashCleanup(): Promise<void> {
    try {
      // Sử dụng safe cleanup thay vì cleanup thông thường
      const cleanupStats = await dataProtectionService.performSafeCleanup();
      
      if (this.config.enableLogging) {
        console.log(`[CronJobs] Safe cleanup completed: ${cleanupStats.deleted} deleted, ${cleanupStats.skipped} skipped, ${cleanupStats.errors} errors`);
      }

      // Cleanup các record an toàn (không ảnh hưởng file người dùng)
      await dataProtectionService.cleanupSafeRecords();
      
    } catch (error) {
      console.error(`[CronJobs] Safe cleanup failed at ${new Date().toISOString()}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async performDatabaseOptimization(): Promise<void> {
    try {
      // Analyze tables for better query performance
      await db.execute(sql`ANALYZE;`);
      
      // Vacuum to reclaim storage space
      await db.execute(sql`VACUUM (ANALYZE);`);
      
      // Kiểm tra tính toàn vẹn dữ liệu (không xóa gì)
      const integrityCheck = await dataProtectionService.verifyDataIntegrity();
      if (integrityCheck.issues.length > 0) {
        console.warn('[CronJobs] Data integrity issues detected:', integrityCheck.issues.join(', '));
      }

      // Update database statistics
      const dbStats = await db.execute(sql`
        SELECT 
          pg_database_size(current_database()) as db_size_bytes,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = 'files') as files_count,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = 'users') as users_count
      `);

      const stats = dbStats.rows?.[0] as any;
      const dbSizeMB = stats ? Math.round(Number(stats.db_size_bytes) / 1024 / 1024) : 0;

      if (this.config.enableLogging) {
        console.log(`[CronJobs] Database optimization completed at ${new Date().toISOString()}`);
        console.log(`[CronJobs] Database size: ${dbSizeMB}MB, Files: ${stats?.files_count || 0}, Users: ${stats?.users_count || 0}`);
      }

      // Warning if database is getting large
      if (dbSizeMB > 1000) { // 1GB warning
        console.warn(`[CronJobs] WARNING: Database size is ${dbSizeMB}MB - consider archiving or cleanup`);
      }

    } catch (error) {
      console.error(`[CronJobs] Database optimization failed at ${new Date().toISOString()}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Get service status
  getStatus(): { isRunning: boolean; config: CronJobConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

// Export singleton instance
const cronJobService = new CronJobService({
  trashCleanupInterval: parseInt(process.env.TRASH_CLEANUP_INTERVAL || '3600000'), // 1 hour default
  databaseOptimizeInterval: parseInt(process.env.DB_OPTIMIZE_INTERVAL || '86400000'), // 24 hours default
  enableLogging: process.env.NODE_ENV !== 'production' // Enable detailed logging in development
});

export { cronJobService, CronJobService };