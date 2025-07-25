import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { storage } from './storage';

interface CacheConfig {
  enabled: boolean;
  maxCacheSize: number; // MB
  cacheDuration: number; // hours
  cacheDir: string;
}

interface FileCache {
  filePath: string;
  cachedAt: Date;
  accessCount: number;
  lastAccessed: Date;
  fileSize: number;
}

class BandwidthOptimizer {
  private config: CacheConfig;
  private cacheMap: Map<string, FileCache> = new Map();
  private currentCacheSize: number = 0;

  constructor() {
    this.config = {
      enabled: process.env.CACHE_ENABLED !== 'false',
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '500'), // 500MB default
      cacheDuration: parseInt(process.env.CACHE_DURATION || '24'), // 24 hours
      cacheDir: path.join(process.cwd(), 'cache')
    };

    this.initializeCache();
    this.startCleanupScheduler();
  }

  private initializeCache() {
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true });
    }

    // Load existing cache metadata
    this.loadCacheMetadata();
    console.log(`[BandwidthOptimizer] Cache initialized: ${this.config.maxCacheSize}MB limit`);
  }

  private loadCacheMetadata() {
    try {
      const metadataPath = path.join(this.config.cacheDir, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Convert date strings back to Date objects
        const cacheEntries = (metadata.cacheMap || []).map(([fileId, cacheInfo]: [string, any]) => [
          fileId,
          {
            ...cacheInfo,
            cachedAt: new Date(cacheInfo.cachedAt),
            lastAccessed: new Date(cacheInfo.lastAccessed)
          }
        ]);
        
        this.cacheMap = new Map(cacheEntries);
        this.currentCacheSize = metadata.currentCacheSize || 0;
        
        // Verify cached files still exist
        this.verifyCacheIntegrity();
      }
    } catch (error) {
      console.error('[BandwidthOptimizer] Error loading cache metadata:', error);
      this.cacheMap.clear();
      this.currentCacheSize = 0;
    }
  }

  private saveCacheMetadata() {
    try {
      const metadataPath = path.join(this.config.cacheDir, 'metadata.json');
      const metadata = {
        cacheMap: Array.from(this.cacheMap.entries()),
        currentCacheSize: this.currentCacheSize,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('[BandwidthOptimizer] Error saving cache metadata:', error);
    }
  }

  private verifyCacheIntegrity() {
    const toRemove: string[] = [];
    
    Array.from(this.cacheMap.entries()).forEach(([fileId, cacheInfo]) => {
      if (!fs.existsSync(cacheInfo.filePath)) {
        toRemove.push(fileId);
        this.currentCacheSize -= cacheInfo.fileSize;
      }
    });

    toRemove.forEach(fileId => this.cacheMap.delete(fileId));
    
    if (toRemove.length > 0) {
      console.log(`[BandwidthOptimizer] Removed ${toRemove.length} invalid cache entries`);
      this.saveCacheMetadata();
    }
  }

  async handleFileRequest(fileId: string, req: Request, res: Response): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      const file = await storage.getFileById(fileId);
      if (!file || file.storageType !== 'cloud' || !file.cloudUrl) {
        return false;
      }

      // Check if file is cached and still valid
      const cacheInfo = this.cacheMap.get(fileId);
      if (cacheInfo && this.isCacheValid(cacheInfo)) {
        await this.serveCachedFile(fileId, cacheInfo, res);
        return true;
      }

      // Decide if we should cache this file
      if (this.shouldCacheFile(file)) {
        await this.cacheAndServeFile(fileId, file, res);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[BandwidthOptimizer] Error handling file request:', error);
      return false;
    }
  }

  private isCacheValid(cacheInfo: FileCache): boolean {
    const now = new Date();
    const cacheAge = (now.getTime() - cacheInfo.cachedAt.getTime()) / (1000 * 60 * 60);
    return cacheAge < this.config.cacheDuration && fs.existsSync(cacheInfo.filePath);
  }

  private shouldCacheFile(file: any): boolean {
    // Cache logic based on file characteristics
    const fileSizeMB = file.fileSize / (1024 * 1024);
    
    // Don't cache very large files
    if (fileSizeMB > 50) return false;
    
    // Don't cache if would exceed cache limit
    if (this.currentCacheSize + fileSizeMB > this.config.maxCacheSize) {
      this.cleanupOldCache(fileSizeMB);
    }

    // Cache images and documents more aggressively
    const shouldCache = file.mimeType.startsWith('image/') || 
                       file.mimeType.startsWith('application/pdf') ||
                       file.mimeType.startsWith('text/');

    return shouldCache && (this.currentCacheSize + fileSizeMB <= this.config.maxCacheSize);
  }

  private async cacheAndServeFile(fileId: string, file: any, res: Response) {
    try {
      console.log(`[BandwidthOptimizer] Caching and serving file: ${file.originalName}`);
      
      // Download from Cloudinary once
      const response = await fetch(file.cloudUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Cloudinary: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const cachePath = path.join(this.config.cacheDir, `${fileId}_${Date.now()}`);
      
      fs.writeFileSync(cachePath, Buffer.from(buffer));

      // Update cache metadata
      const cacheInfo: FileCache = {
        filePath: cachePath,
        cachedAt: new Date(),
        accessCount: 1,
        lastAccessed: new Date(),
        fileSize: file.fileSize / (1024 * 1024) // MB
      };

      this.cacheMap.set(fileId, cacheInfo);
      this.currentCacheSize += cacheInfo.fileSize;
      this.saveCacheMetadata();

      // Serve the cached file
      await this.serveCachedFile(fileId, cacheInfo, res);
      
    } catch (error) {
      console.error('[BandwidthOptimizer] Error caching file:', error);
      // Fallback to direct Cloudinary redirect
      res.redirect(file.cloudUrl);
    }
  }

  private async serveCachedFile(fileId: string, cacheInfo: FileCache, res: Response) {
    try {
      const file = await storage.getFileById(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Update access statistics
      cacheInfo.accessCount++;
      cacheInfo.lastAccessed = new Date();
      this.saveCacheMetadata();

      // Serve from cache
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('X-Cache-Status', 'HIT');
      
      const fileStream = fs.createReadStream(cacheInfo.filePath);
      fileStream.pipe(res);

      console.log(`[BandwidthOptimizer] Served from cache: ${file.originalName} (${cacheInfo.accessCount} times)`);
      
    } catch (error) {
      console.error('[BandwidthOptimizer] Error serving cached file:', error);
      res.status(500).json({ error: 'Failed to serve cached file' });
    }
  }

  private cleanupOldCache(neededSpace: number) {
    // Sort by least recently used and lowest access count
    const sortedCache = Array.from(this.cacheMap.entries())
      .sort((a, b) => {
        const scoreA = a[1].accessCount * a[1].lastAccessed.getTime();
        const scoreB = b[1].accessCount * b[1].lastAccessed.getTime();
        return scoreA - scoreB;
      });

    let freedSpace = 0;
    for (const [fileId, cacheInfo] of sortedCache) {
      if (freedSpace >= neededSpace) break;

      try {
        fs.unlinkSync(cacheInfo.filePath);
        this.cacheMap.delete(fileId);
        this.currentCacheSize -= cacheInfo.fileSize;
        freedSpace += cacheInfo.fileSize;
        
        console.log(`[BandwidthOptimizer] Cleaned up cached file: ${fileId}`);
      } catch (error) {
        console.error('[BandwidthOptimizer] Error cleaning up cache:', error);
      }
    }

    this.saveCacheMetadata();
    console.log(`[BandwidthOptimizer] Freed ${freedSpace.toFixed(2)}MB cache space`);
  }

  private startCleanupScheduler() {
    // Clean up expired cache every hour
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 60 * 1000);

    console.log('[BandwidthOptimizer] Cache cleanup scheduler started');
  }

  private cleanupExpiredCache() {
    const now = new Date();
    const toRemove: string[] = [];

    Array.from(this.cacheMap.entries()).forEach(([fileId, cacheInfo]) => {
      const cacheAge = (now.getTime() - cacheInfo.cachedAt.getTime()) / (1000 * 60 * 60);
      
      if (cacheAge > this.config.cacheDuration) {
        toRemove.push(fileId);
        try {
          fs.unlinkSync(cacheInfo.filePath);
          this.currentCacheSize -= cacheInfo.fileSize;
        } catch (error) {
          console.error('[BandwidthOptimizer] Error removing expired cache:', error);
        }
      }
    });

    toRemove.forEach(fileId => this.cacheMap.delete(fileId));
    
    if (toRemove.length > 0) {
      this.saveCacheMetadata();
      console.log(`[BandwidthOptimizer] Cleaned up ${toRemove.length} expired cache entries`);
    }
  }

  getCacheStats() {
    return {
      enabled: this.config.enabled,
      currentSize: `${this.currentCacheSize.toFixed(2)}MB`,
      maxSize: `${this.config.maxCacheSize}MB`,
      utilization: `${((this.currentCacheSize / this.config.maxCacheSize) * 100).toFixed(1)}%`,
      totalFiles: this.cacheMap.size,
      config: this.config
    };
  }
}

export const bandwidthOptimizer = new BandwidthOptimizer();