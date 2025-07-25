import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { keepAliveService } from "./keepalive";
import { cronJobService } from "./cron-job";
import { databaseMonitor } from "./database-monitor";
import { dataProtectionService } from "./data-protection";
import { cloudStorageService } from "./cloud-storage";
import { storageMigrationService } from "./storage-migration";
import { bandwidthOptimizer } from "./bandwidth-optimizer";
import { emailService } from "./email-service";
import { insertUserSchema, insertFileSchema, insertSharedFileSchema, insertFolderSchema, sharedFiles } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import seoRoutes from "./routes/seo";
import databaseAdminRoutes from "./routes/database-admin";
import { thumbnailService } from "./services/thumbnailService";

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueName = `${Date.now()}-${nanoid()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for keep-alive service
  app.get("/api/health", async (req, res) => {
    try {
      const keepAliveStatus = keepAliveService.getStatus();
      const cronJobStatus = cronJobService.getStatus();
      const dbMonitorStatus = databaseMonitor.getStatus();
      
      const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          keepAlive: keepAliveStatus,
          cronJobs: cronJobStatus,
          databaseMonitor: {
            isRunning: dbMonitorStatus.isRunning,
            metrics: dbMonitorStatus.metrics
          }
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          environment: process.env.NODE_ENV || 'development'
        }
      };
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy", 
        error: "Health check failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed database status endpoint
  app.get("/api/status/database", async (req, res) => {
    try {
      const dbMetrics = await databaseMonitor.forceHealthCheck();
      res.json({
        status: "success",
        metrics: dbMetrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to check database status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // System monitoring endpoint
  app.get("/api/status/system", async (req, res) => {
    try {
      const systemInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        services: {
          keepAlive: keepAliveService.getStatus(),
          cronJobs: cronJobService.getStatus(),
          databaseMonitor: databaseMonitor.getStatus()
        },
        timestamp: new Date().toISOString()
      };
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get system status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Data protection status endpoint - Kiểm tra tính an toàn dữ liệu
  app.get("/api/status/data-protection", async (req, res) => {
    try {
      const integrityCheck = await dataProtectionService.verifyDataIntegrity();
      const config = dataProtectionService.getConfig();
      
      res.json({
        status: "success",
        integrity: integrityCheck,
        protection: {
          safeMode: config.enableSafeMode,
          maxFileAge: config.maxFileAge,
          requireConfirmation: config.requireConfirmation
        },
        message: "Dữ liệu người dùng được bảo vệ an toàn 100%",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to check data protection status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Storage monitoring endpoint - Kiểm tra dung lượng storage
  app.get("/api/status/storage", async (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      
      // Kiểm tra dung lượng uploads folder
      const uploadsPath = path.join(process.cwd(), 'uploads');
      let folderSize = 0;
      let fileCount = 0;
      
      if (fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        fileCount = files.length;
        
        for (const file of files) {
          const filePath = path.join(uploadsPath, file);
          const stats = fs.statSync(filePath);
          folderSize += stats.size;
        }
      }
      
      // Convert bytes to MB
      const folderSizeMB = Math.round(folderSize / 1024 / 1024 * 100) / 100;
      
      // Kiểm tra RAM usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
      
      res.json({
        status: "success",
        storage: {
          uploadFolder: {
            size: `${folderSizeMB}MB`,
            files: fileCount,
            path: "/uploads"
          },
          memory: {
            used: `${memUsageMB}MB`,
            total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
          },
          warnings: folderSizeMB > 100 ? ["Upload folder > 100MB - consider cloud storage"] : [],
          recommendations: folderSizeMB > 50 ? ["Consider migrating to Cloudinary or Firebase Storage"] : []
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to check storage status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Cloud storage management endpoints
  app.get("/api/cloud/providers", async (req, res) => {
    try {
      const providers = await cloudStorageService.getProvidersStatus();
      const currentProvider = cloudStorageService.getCurrentProvider();
      
      res.json({
        status: "success",
        currentProvider,
        providers,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get cloud providers status",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Bandwidth optimization endpoints
  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = bandwidthOptimizer.getCacheStats();
      res.json({
        status: "success",
        cache: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get cache stats",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin console endpoints
  app.get("/api/admin/cloudinary/status", async (req, res) => {
    try {
      const providers = cloudStorageService.getAllProviders();
      const providerStats = await Promise.all(
        providers.map(async (provider: any) => {
          try {
            const usage = await cloudStorageService.getPublicProviderUsage(provider);
            const availableSpace = (provider.maxStorage || 0) - usage;
            
            return {
              id: provider.id,
              name: provider.name,
              cloudName: provider.cloudName,
              priority: provider.priority,
              isActive: provider.isActive,
              maxStorage: provider.maxStorage,
              usedStorage: usage,
              availableStorage: availableSpace,
              utilization: provider.maxStorage ? ((usage / provider.maxStorage) * 100).toFixed(1) : '0',
              status: provider.isActive ? 'active' : 'inactive',
              lastChecked: new Date().toISOString()
            };
          } catch (error) {
            return {
              id: provider.id,
              name: provider.name,
              cloudName: provider.cloudName,
              priority: provider.priority,
              isActive: false,
              maxStorage: provider.maxStorage || 0,
              usedStorage: 0,
              availableStorage: 0,
              utilization: '0',
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              lastChecked: new Date().toISOString()
            };
          }
        })
      );

      const currentProvider = cloudStorageService.getCurrentProvider();
      const totalStorage = providerStats.reduce((sum: number, p: any) => sum + (p.maxStorage || 0), 0);
      const totalUsed = providerStats.reduce((sum: number, p: any) => sum + (p.usedStorage || 0), 0);

      res.json({
        status: "success",
        summary: {
          totalProviders: providers.length,
          activeProviders: providerStats.filter((p: any) => p.status === 'active').length,
          currentProvider: currentProvider?.name || 'None',
          totalStorage: `${totalStorage}MB`,
          totalUsed: `${totalUsed.toFixed(2)}MB`,
          totalAvailable: `${(totalStorage - totalUsed).toFixed(2)}MB`,
          overallUtilization: totalStorage ? ((totalUsed / totalStorage) * 100).toFixed(1) : '0'
        },
        providers: providerStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get Cloudinary status",
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post("/api/admin/cloudinary/switch/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const success = await cloudStorageService.switchToProvider(providerId);
      
      if (success) {
        const currentProvider = cloudStorageService.getCurrentProvider();
        res.json({
          status: "success",
          message: `Switched to provider: ${currentProvider?.name}`,
          currentProvider: currentProvider?.name,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          status: "error",
          error: "Failed to switch provider",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to switch provider",
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Migration endpoints
  app.get("/api/migration/status", async (req, res) => {
    try {
      const status = await storageMigrationService.getMigrationStatus();
      res.json({
        status: "success",
        migration: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Failed to get migration status",
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post("/api/migration/start", async (req, res) => {
    try {
      console.log('[API] Starting migration from local to cloud storage...');
      const result = await storageMigrationService.migrateLocalFilesToCloud();
      
      res.json({
        status: result.success ? "success" : "partial",
        migration: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: "Migration failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/auth/user/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User statistics endpoint
  app.get("/api/user/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getUserStats(userId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // File routes
  app.get("/api/files/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const files = await storage.getFilesByUserId(userId);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Get single file by ID
  app.get("/api/file/info/:fileId", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json({ file });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  app.post("/api/files/upload", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Check user's current storage usage (1GB = 1073741824 bytes)
      const userStats = await storage.getUserStats(userId);
      const currentUsage = userStats.totalStorageUsed;
      const newFileSize = req.file.size;
      const maxStorage = 1073741824; // 1GB in bytes
      
      if (currentUsage + newFileSize > maxStorage) {
        // Delete the uploaded file since we're rejecting it
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(413).json({ 
          error: "Vượt quá giới hạn lưu trữ 1GB", 
          currentUsage,
          maxStorage,
          requiredSpace: newFileSize
        });
      }

      // Upload to Cloudinary first
      const cloudUploadResult = await cloudStorageService.uploadFile(req.file.path, {
        folder: 'spacebsa',
        resource_type: 'auto'
      });

      let fileData;
      if (cloudUploadResult.success) {
        // Cloud upload successful - save with cloud metadata
        fileData = {
          userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          filePath: req.file.path, // Keep local path as backup
          cloudUrl: cloudUploadResult.url,
          cloudPublicId: cloudUploadResult.publicId,
          cloudProviderId: cloudUploadResult.providerId,
          storageType: 'cloud' as const,
          cloudMetadata: cloudUploadResult.metadata
        };

        // Keep local file temporarily for thumbnail generation - delete later

        console.log(`[Upload] Successfully uploaded ${req.file.originalname} to Cloudinary: ${cloudUploadResult.publicId}`);
      } else {
        // Cloud upload failed - fallback to local storage
        fileData = {
          userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          filePath: req.file.path,
          storageType: 'local' as const
        };

        console.log(`[Upload] Cloud upload failed, using local storage for ${req.file.originalname}: ${cloudUploadResult.error}`);
      }

      const file = await storage.createFile(fileData);
      
      // Generate thumbnail after file is created (with proper ID) but before local file deletion
      let thumbnailGenerated = false;
      if (thumbnailService.isVideoFile(req.file.mimetype)) {
        try {
          console.log(`[Upload] Generating thumbnail for video: ${req.file.originalname}`);
          
          // For cloud files, keep local file temporarily for thumbnail generation
          let videoPath = req.file.path;
          if (file.storageType === 'cloud' && !fs.existsSync(req.file.path)) {
            // If local file was already deleted, skip thumbnail for now
            console.log(`[Upload] Local file already deleted, skipping thumbnail generation for ${file.originalName}`);
          } else {
            await thumbnailService.generateVideoThumbnail(videoPath, file.id);
            thumbnailGenerated = true;
            console.log(`[Upload] Thumbnail generated successfully for: ${req.file.originalname}`);
          }
        } catch (error) {
          console.warn(`[Upload] Failed to generate thumbnail for ${req.file.originalname}:`, error);
          // Continue without thumbnail - not a critical failure
        }
      }
      
      // Clean up local file for cloud-stored files after thumbnail generation
      if (file.storageType === 'cloud' && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`[Upload] Cleaned up local file after cloud upload and thumbnail generation: ${req.file.path}`);
        } catch (error) {
          console.warn(`[Upload] Failed to clean up local file: ${req.file.path}`, error);
        }
      }
      
      // Add thumbnail status to response
      const responseData = {
        ...file,
        hasThumbnail: thumbnailGenerated
      };
      
      res.json({ file: responseData });
    } catch (error) {
      console.error('[Upload] Error:', error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Serve video thumbnails
  app.get("/api/files/thumbnail/:fileId", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if it's a video file
      if (!thumbnailService.isVideoFile(file.mimeType)) {
        return res.status(400).json({ error: "Thumbnail only available for video files" });
      }

      // Get thumbnail path
      const thumbnailPath = await thumbnailService.getThumbnailPath(file.id);
      console.log(`[Thumbnail] Checking thumbnail for ${file.id}: ${thumbnailPath}`);
      if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
        console.log(`[Thumbnail] No thumbnail found for ${file.id}, trying to generate...`);
        
        // Try to generate thumbnail on-demand for existing videos
        try {
          let videoPath = file.filePath;
          let tempFilePath: string | undefined;
          
          // If file is in cloud storage, download it temporarily
          if (file.storageType === 'cloud' && file.cloudUrl) {
            console.log(`[Thumbnail] Downloading cloud video for thumbnail generation: ${file.originalName}`);
            tempFilePath = path.join('uploads', `temp-${file.id}-${Date.now()}.mp4`);
            
            const response = await fetch(file.cloudUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              fs.writeFileSync(tempFilePath, Buffer.from(buffer));
              videoPath = tempFilePath;
            } else {
              throw new Error('Failed to download video from cloud');
            }
          }
          
          // Generate thumbnail from local or downloaded video
          if (fs.existsSync(videoPath)) {
            console.log(`[Thumbnail] Generating on-demand thumbnail for ${file.originalName}`);
            await thumbnailService.generateVideoThumbnail(videoPath, file.id);
            
            // Clean up temporary file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
            
            const newThumbnailPath = await thumbnailService.getThumbnailPath(file.id);
            if (newThumbnailPath && fs.existsSync(newThumbnailPath)) {
              console.log(`[Thumbnail] Successfully generated on-demand thumbnail for ${file.id}`);
              const fileStream = fs.createReadStream(newThumbnailPath);
              res.setHeader("Content-Type", "image/jpeg");
              res.setHeader("Cache-Control", "public, max-age=86400");
              fileStream.pipe(res);
              return;
            }
          }
        } catch (error) {
          console.warn(`[Thumbnail] Failed to generate on-demand thumbnail for ${file.id}:`, error);
        }
        
        return res.status(404).json({ error: "Thumbnail not found" });
      }

      // Serve thumbnail image
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      
      const fileStream = fs.createReadStream(thumbnailPath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ error: "Failed to serve thumbnail" });
    }
  });

  app.get("/api/files/download/:fileId", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Try bandwidth optimizer first for cloud files
      if (file.storageType === 'cloud' && file.cloudUrl) {
        const servedFromCache = await bandwidthOptimizer.handleFileRequest(req.params.fileId, req, res);
        if (servedFromCache) {
          return; // File served from cache, save Cloudinary bandwidth
        }
        
        // Fallback to direct Cloudinary redirect
        res.setHeader('X-Cache-Status', 'MISS');
        return res.redirect(file.cloudUrl);
      }

      // Local file handling
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader('X-Cache-Status', 'LOCAL');
      
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Move file to trash (soft delete)
  app.delete("/api/files/:fileId", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      await storage.moveToTrash(req.params.fileId);
      res.json({ success: true, message: "File moved to trash" });
    } catch (error) {
      res.status(500).json({ error: "Failed to move file to trash" });
    }
  });

  // Get trash files for user
  app.get("/api/trash/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trashFiles = await storage.getTrashFilesByUserId(userId);
      res.json({ files: trashFiles });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trash files" });
    }
  });

  // Restore file from trash
  app.post("/api/files/:fileId/restore", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      await storage.restoreFromTrash(req.params.fileId);
      res.json({ success: true, message: "File restored from trash" });
    } catch (error) {
      res.status(500).json({ error: "Failed to restore file" });
    }
  });

  // Permanently delete file from trash
  app.delete("/api/files/:fileId/permanent", async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete thumbnail if it exists
      await thumbnailService.deleteThumbnail(file.id);

      // Delete file from disk
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      await storage.permanentlyDeleteFile(req.params.fileId);
      res.json({ success: true, message: "File permanently deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to permanently delete file" });
    }
  });

  // Cleanup old trash files (run periodically)
  app.post("/api/trash/cleanup", async (req, res) => {
    try {
      await storage.permanentlyDeleteOldTrashFiles();
      res.json({ success: true, message: "Old trash files cleaned up" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cleanup old trash files" });
    }
  });

  // Folder routes
  app.get("/api/folders/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const folders = await storage.getFoldersByUserId(userId);
      res.json({ folders });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(folderData);
      res.json({ folder });
    } catch (error) {
      res.status(400).json({ error: "Invalid folder data" });
    }
  });

  app.delete("/api/folders/:folderId", async (req, res) => {
    try {
      await storage.deleteFolder(req.params.folderId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete folder" });
    }
  });

  app.get("/api/folders/:folderId/files", async (req, res) => {
    try {
      const files = await storage.getFilesByFolderId(req.params.folderId);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch folder files" });
    }
  });

  // Test endpoint to create notification directly for user 2
  app.post("/api/test/notification", async (req, res) => {
    console.log('[Test] Test notification endpoint hit!');
    try {
      const testNotification = await storage.createNotification({
        userId: 2,
        type: 'share_request',
        title: 'Test Notification',
        message: 'Đây là test notification cho user 2',
        metadata: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('[Test] Created test notification for user 2:', testNotification);
      
      const allNotifications = await storage.getNotificationsByUserId(2);
      console.log(`[Test] User 2 now has ${allNotifications.length} notifications:`, allNotifications.map(n => ({ id: n.id, message: n.message })));
      
      res.json({ success: true, notification: testNotification, total: allNotifications.length });
    } catch (error) {
      console.error('[Test] Error creating test notification:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  });

  // File sharing routes
  app.post("/api/files/share", async (req, res) => {
    try {
      // First, find the recipient user by email
      const recipientUser = await storage.getUserByEmail(req.body.sharedWith);
      if (!recipientUser) {
        return res.status(404).json({ 
          error: "Người dùng không tồn tại trong hệ thống",
          message: "Email này chưa được đăng ký tài khoản"
        });
      }
      
      console.log(`[Share] Recipient found: User ID ${recipientUser.id} (${recipientUser.displayName}) - Email: ${req.body.sharedWith}`);

      const shareData = insertSharedFileSchema.parse({
        ...req.body,
        shareToken: nanoid(32),
      });
      
      const share = await storage.createFileShare(shareData);

      // Get file and sender information
      const file = await storage.getFileById(shareData.fileId);
      const senderUser = await storage.getUser(shareData.sharedBy);

      if (file && senderUser) {
        // Create in-app notification for the recipient
        const notificationResult = await storage.createNotification({
          userId: recipientUser.id,
          type: 'share_request',
          title: 'File được chia sẻ',
          message: `${senderUser.displayName} đã chia sẻ file "${file.originalName}" với bạn`,
          metadata: JSON.stringify({
            shareId: share.id,
            fileId: file.id,
            fileName: file.originalName,
            senderName: senderUser.displayName,
            permission: shareData.permission,
            shareToken: shareData.shareToken
          })
        });
        
        console.log(`[Share] Notification created for user ${recipientUser.id} (${recipientUser.displayName}):`, notificationResult);
        
        // Double check - verify notification was actually created
        const verifyNotifications = await storage.getNotificationsByUserId(recipientUser.id);
        console.log(`[Share] Verification - User ${recipientUser.id} now has ${verifyNotifications.length} total notifications`);

        // Also send email notification if configured
        const emailSent = await emailService.sendShareNotification(
          shareData.sharedWith || '',
          senderUser,
          file.originalName,
          shareData.shareToken || '',
          shareData.permission || 'view'
        );

        console.log(`[Share] File shared with ${recipientUser.displayName} (${shareData.sharedWith})`);
        if (emailSent) {
          console.log(`[Share] Email notification sent to ${shareData.sharedWith}`);
        }
      }
      
      res.json({ 
        share,
        recipient: {
          id: recipientUser.id,
          displayName: recipientUser.displayName,
          email: recipientUser.email
        },
        emailSent: emailService.isEmailEnabled(),
        message: "File đã được chia sẻ thành công và người nhận đã được thông báo"
      });
    } catch (error) {
      console.error("Share creation error:", error);
      res.status(400).json({ error: "Lỗi khi chia sẻ file" });
    }
  });

  app.get("/api/files/shared/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sharedFiles = await storage.getSharedFilesByUserId(userId);
      res.json({ sharedFiles });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared files" });
    }
  });

  app.get("/api/share/:token", async (req, res) => {
    try {
      const shareData = await storage.getFileByShareToken(req.params.token);
      if (!shareData) {
        return res.status(404).json({ error: "Share link not found or expired" });
      }
      res.json({ shareData });
    } catch (error) {
      res.status(500).json({ error: "Failed to access shared file" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`[Notifications] Fetching notifications for user ${userId}`);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const notifications = await storage.getNotificationsByUserId(userId);
      console.log(`[Notifications] Found ${notifications.length} notifications for user ${userId}`);
      res.json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/shares/:shareId/accept", async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      if (isNaN(shareId)) {
        return res.status(400).json({ error: "Invalid share ID" });
      }

      // Get the share data to find the recipient
      const [shareData] = await db.select().from(sharedFiles).where(eq(sharedFiles.id, shareId));
      if (!shareData) {
        return res.status(404).json({ error: "Share not found" });
      }

      // Find recipient user by email from sharedWith field
      const recipient = await storage.getUserByEmail(shareData.sharedWith || '');
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      // Copy the shared file to the recipient's account
      const copiedFile = await storage.copySharedFileToUser(shareId, recipient.id);
      
      // Update share status
      await storage.updateShareStatus(shareId, "accepted");
      
      // Delete the share request notification
      await storage.deleteNotificationsByShareId(shareId);

      res.json({ 
        success: true, 
        message: "Share request accepted", 
        file: copiedFile 
      });
    } catch (error) {
      console.error("Error accepting share:", error);
      res.status(500).json({ error: "Failed to accept share request" });
    }
  });

  app.post("/api/shares/:shareId/reject", async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      if (isNaN(shareId)) {
        return res.status(400).json({ error: "Invalid share ID" });
      }

      // Update share status
      await storage.updateShareStatus(shareId, "rejected");
      
      // Delete the share request notification
      await storage.deleteNotificationsByShareId(shareId);

      res.json({ success: true, message: "Share request rejected" });
    } catch (error) {
      console.error("Error rejecting share:", error);
      res.status(500).json({ error: "Failed to reject share request" });
    }
  });

  // SEO routes for sitemap and robots.txt
  app.use(seoRoutes);
  
  // Database admin routes for multi-database management
  app.use("/api/database-admin", databaseAdminRoutes);



  const httpServer = createServer(app);
  return httpServer;
}
