// Advanced database monitoring and connection pool management
import { db } from './db.js';
import { sql } from 'drizzle-orm';

interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  databaseSize: number; // in MB
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    size: number; // in KB
  }>;
  lastHealthCheck: Date;
  averageResponseTime: number; // in ms
}

interface MonitorConfig {
  checkInterval: number; // milliseconds
  connectionPoolSize: number;
  enableDetailedLogging: boolean;
  performanceThreshold: number; // ms - alert if queries take longer
}

class DatabaseMonitor {
  private config: MonitorConfig;
  private metrics: DatabaseMetrics;
  private monitorTimer?: NodeJS.Timeout;
  private isRunning = false;
  private queryTimes: number[] = [];

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 seconds
      connectionPoolSize: 10,
      enableDetailedLogging: process.env.NODE_ENV !== 'production',
      performanceThreshold: 1000, // 1 second
      ...config
    };

    this.metrics = {
      connectionCount: 0,
      activeQueries: 0,
      databaseSize: 0,
      tableStats: [],
      lastHealthCheck: new Date(),
      averageResponseTime: 0
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[DatabaseMonitor] Monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('[DatabaseMonitor] Starting database monitoring...');

    // Initial health check
    await this.performHealthCheck();

    // Start periodic monitoring
    this.monitorTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);

    console.log(`[DatabaseMonitor] Database monitoring started (interval: ${this.config.checkInterval / 1000}s)`);
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('[DatabaseMonitor] Stopping database monitor...');
    
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }
    
    this.isRunning = false;
    console.log('[DatabaseMonitor] Database monitor stopped');
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.testConnectivity();
      
      // Gather database metrics
      await this.gatherMetrics();
      
      // Check performance
      await this.checkPerformance();
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTimes(responseTime);
      
      this.metrics.lastHealthCheck = new Date();
      
      if (this.config.enableDetailedLogging) {
        console.log(`[DatabaseMonitor] Health check completed in ${responseTime}ms`);
        this.logMetrics();
      }

      // Alert if performance is degraded
      if (responseTime > this.config.performanceThreshold) {
        console.warn(`[DatabaseMonitor] WARNING: Slow database response (${responseTime}ms)`);
      }

    } catch (error) {
      console.error(`[DatabaseMonitor] Health check failed:`, error instanceof Error ? error.message : 'Unknown error');
      await this.handleHealthCheckFailure(error);
    }
  }

  private async testConnectivity(): Promise<void> {
    await db.execute(sql`SELECT 1 as connectivity_test`);
  }

  private async gatherMetrics(): Promise<void> {
    try {
      // Database size and basic stats
      const dbStatsResult = await db.execute(sql`
        SELECT 
          pg_database_size(current_database()) as db_size_bytes,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE query != '<IDLE>') as active_queries
      `);

      const dbStats = dbStatsResult.rows?.[0] as any;
      if (dbStats) {
        this.metrics.databaseSize = Math.round(Number(dbStats.db_size_bytes) / 1024 / 1024);
        this.metrics.connectionCount = Number(dbStats.active_connections) || 0;
        this.metrics.activeQueries = Number(dbStats.active_queries) || 0;
      }

      // Table statistics - using safer query for hosted databases
      const tableStatsResult = await db.execute(sql`
        SELECT 
          table_schema as schemaname,
          table_name as tablename,
          0 as total_operations,
          0 as table_size_bytes
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
        LIMIT 10
      `);

      this.metrics.tableStats = (tableStatsResult.rows || []).map((row: any) => ({
        tableName: `${row.schemaname}.${row.tablename}`,
        rowCount: Number(row.total_operations) || 0,
        size: Math.round(Number(row.table_size_bytes) / 1024) || 0 // KB
      }));

    } catch (error) {
      console.error('[DatabaseMonitor] Failed to gather metrics:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async checkPerformance(): Promise<void> {
    try {
      // Check for long-running queries
      const longQueriesResult = await db.execute(sql`
        SELECT 
          query,
          state,
          now() - query_start as duration
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND now() - query_start > interval '30 seconds'
        AND query NOT LIKE '%pg_stat_activity%'
      `);

      if (longQueriesResult.rows && longQueriesResult.rows.length > 0) {
        console.warn(`[DatabaseMonitor] Found ${longQueriesResult.rows.length} long-running queries`);
        if (this.config.enableDetailedLogging) {
          longQueriesResult.rows.forEach((row: any, index: number) => {
            console.warn(`[DatabaseMonitor] Long query ${index + 1}: ${row.duration} - ${row.query?.substring(0, 100)}...`);
          });
        }
      }

      // Check for locks
      const locksResult = await db.execute(sql`
        SELECT count(*) as lock_count
        FROM pg_locks 
        WHERE NOT granted
      `);

      const lockCount = Number(locksResult.rows?.[0]?.lock_count) || 0;
      if (lockCount > 0) {
        console.warn(`[DatabaseMonitor] Found ${lockCount} blocked queries`);
      }

    } catch (error) {
      console.error('[DatabaseMonitor] Performance check failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private updateResponseTimes(responseTime: number): void {
    this.queryTimes.push(responseTime);
    
    // Keep only last 10 measurements
    if (this.queryTimes.length > 10) {
      this.queryTimes.shift();
    }
    
    // Calculate average
    this.metrics.averageResponseTime = Math.round(
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length
    );
  }

  private logMetrics(): void {
    console.log(`[DatabaseMonitor] Metrics: Size=${this.metrics.databaseSize}MB, Connections=${this.metrics.connectionCount}, Avg Response=${this.metrics.averageResponseTime}ms`);
    
    if (this.metrics.tableStats.length > 0) {
      const topTable = this.metrics.tableStats[0];
      console.log(`[DatabaseMonitor] Most active table: ${topTable.tableName} (${topTable.size}KB)`);
    }
  }

  private async handleHealthCheckFailure(error: unknown): Promise<void> {
    console.error('[DatabaseMonitor] Attempting to recover from health check failure...');
    
    // Try simple recovery strategies
    try {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.testConnectivity();
      console.log('[DatabaseMonitor] Recovery successful');
    } catch (retryError) {
      console.error('[DatabaseMonitor] Recovery failed:', retryError instanceof Error ? retryError.message : 'Unknown error');
    }
  }

  // Public method to get current metrics
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  // Public method to get monitor status
  getStatus(): { isRunning: boolean; config: MonitorConfig; metrics: DatabaseMetrics } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      metrics: this.getMetrics()
    };
  }

  // Public method to force a health check
  async forceHealthCheck(): Promise<DatabaseMetrics> {
    await this.performHealthCheck();
    return this.getMetrics();
  }
}

// Export singleton instance
const databaseMonitor = new DatabaseMonitor({
  checkInterval: parseInt(process.env.DB_MONITOR_INTERVAL || '30000'),
  connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  enableDetailedLogging: process.env.NODE_ENV !== 'production',
  performanceThreshold: parseInt(process.env.DB_PERFORMANCE_THRESHOLD || '1000')
});

export { databaseMonitor, DatabaseMonitor, type DatabaseMetrics };