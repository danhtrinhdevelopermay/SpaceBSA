import { db } from './db.js';
import { sql } from 'drizzle-orm';

interface KeepAliveConfig {
  selfPingInterval: number; // milliseconds
  dbHealthCheckInterval: number; // milliseconds
  serverUrl?: string;
  enableLogging: boolean;
}

class KeepAliveService {
  private config: KeepAliveConfig;
  private selfPingTimer?: NodeJS.Timeout;
  private dbHealthTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: Partial<KeepAliveConfig>) {
    this.config = {
      selfPingInterval: 25000, // 25 seconds - more frequent than Render's 30s timeout
      dbHealthCheckInterval: 60000, // 1 minute
      enableLogging: true,
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[KeepAlive] Service already running');
      return;
    }

    this.isRunning = true;
    console.log('[KeepAlive] Starting service...');
    
    // Start self-ping to prevent server spin-down
    this.startSelfPing();
    
    // Start database health monitoring
    this.startDatabaseHealthCheck();
    
    // Initial health check
    await this.performDatabaseHealthCheck();
    
    console.log('[KeepAlive] Service started successfully');
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('[KeepAlive] Stopping service...');
    
    if (this.selfPingTimer) {
      clearInterval(this.selfPingTimer);
      this.selfPingTimer = undefined;
    }
    
    if (this.dbHealthTimer) {
      clearInterval(this.dbHealthTimer);
      this.dbHealthTimer = undefined;
    }
    
    this.isRunning = false;
    console.log('[KeepAlive] Service stopped');
  }

  private startSelfPing(): void {
    // Only ping if we have a server URL (deployed environment)
    if (!this.config.serverUrl) {
      console.log('[KeepAlive] No server URL configured, skipping self-ping');
      return;
    }

    this.selfPingTimer = setInterval(async () => {
      try {
        const response = await fetch(`${this.config.serverUrl}/api/health`, {
          method: 'GET',
          headers: {
            'User-Agent': 'SpaceBSA-KeepAlive/1.0'
          }
        });

        if (this.config.enableLogging) {
          console.log(`[KeepAlive] Self-ping successful at ${new Date().toISOString()}: Status ${response.status}`);
        }
      } catch (error) {
        console.error(`[KeepAlive] Self-ping failed at ${new Date().toISOString()}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }, this.config.selfPingInterval);

    console.log(`[KeepAlive] Self-ping started (interval: ${this.config.selfPingInterval}ms)`);
  }

  private startDatabaseHealthCheck(): void {
    this.dbHealthTimer = setInterval(async () => {
      await this.performDatabaseHealthCheck();
    }, this.config.dbHealthCheckInterval);

    console.log(`[KeepAlive] Database health check started (interval: ${this.config.dbHealthCheckInterval}ms)`);
  }

  private async performDatabaseHealthCheck(): Promise<void> {
    try {
      // Simple query to keep connection active and test database health
      const result = await db.execute(sql`SELECT 1 as health_check, NOW() as timestamp`);
      
      if (this.config.enableLogging) {
        console.log(`[KeepAlive] Database health check successful at ${new Date().toISOString()}`);
      }

      // Optional: Perform more detailed health checks
      await this.performDetailedHealthChecks();

    } catch (error) {
      console.error(`[KeepAlive] Database health check failed at ${new Date().toISOString()}:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Try to reconnect or handle database issues
      await this.handleDatabaseError(error);
    }
  }

  private async performDetailedHealthChecks(): Promise<void> {
    try {
      // Check database size and performance
      const dbSizeResult = await db.execute(sql`
        SELECT 
          pg_database_size(current_database()) as db_size_bytes,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
      `);

      const dbStats = dbSizeResult.rows?.[0] as any;
      const dbSizeMB = dbStats ? Math.round(Number(dbStats.db_size_bytes) / 1024 / 1024) : 0;

      if (this.config.enableLogging && dbSizeMB > 0) {
        console.log(`[KeepAlive] Database stats - Size: ${dbSizeMB}MB, Tables: ${dbStats.table_count}`);
      }

      // Warning if database is getting large (>500MB)
      if (dbSizeMB > 500) {
        console.warn(`[KeepAlive] WARNING: Database size is ${dbSizeMB}MB - consider cleanup`);
      }

      // Check for old data that can be cleaned up
      await this.performDataCleanup();

    } catch (error) {
      console.error('[KeepAlive] Detailed health check failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async performDataCleanup(): Promise<void> {
    try {
      // Clean up old deleted files (older than 7 days)
      const cleanupResult = await db.execute(sql`
        DELETE FROM files 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - INTERVAL '7 days'
      `);

      if (cleanupResult.rowCount && cleanupResult.rowCount > 0) {
        console.log(`[KeepAlive] Cleaned up ${cleanupResult.rowCount} old deleted files`);
      }

      // Clean up expired shared files
      const expiredSharesResult = await db.execute(sql`
        DELETE FROM shared_files 
        WHERE expires_at IS NOT NULL 
        AND expires_at < NOW()
      `);

      if (expiredSharesResult.rowCount && expiredSharesResult.rowCount > 0) {
        console.log(`[KeepAlive] Cleaned up ${expiredSharesResult.rowCount} expired shares`);
      }

    } catch (error) {
      console.error('[KeepAlive] Data cleanup failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleDatabaseError(error: unknown): Promise<void> {
    console.error('[KeepAlive] Handling database error...');
    
    // Add retry logic or reconnection attempts here
    // For now, just log the error and continue
    setTimeout(async () => {
      try {
        await this.performDatabaseHealthCheck();
        console.log('[KeepAlive] Database reconnection attempt successful');
      } catch (retryError) {
        console.error('[KeepAlive] Database reconnection failed:', retryError instanceof Error ? retryError.message : 'Unknown error');
      }
    }, 5000); // Retry after 5 seconds
  }

  // Get service status
  getStatus(): { isRunning: boolean; config: KeepAliveConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

// Export singleton instance
const keepAliveService = new KeepAliveService({
  selfPingInterval: 25000, // 25 seconds
  dbHealthCheckInterval: 60000, // 1 minute  
  serverUrl: process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL,
  enableLogging: process.env.NODE_ENV !== 'production' // Enable detailed logging in development
});

export { keepAliveService, KeepAliveService };