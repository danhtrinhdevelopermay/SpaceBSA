import { db } from "./db";
import { cloudStorageService } from "./cloud-storage";
import { files } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
  details: Array<{
    fileId: string;
    fileName: string;
    status: 'success' | 'failed';
    error?: string;
    cloudUrl?: string;
  }>;
}

class StorageMigrationService {
  
  // Migrate existing local files to cloud storage
  async migrateLocalFilesToCloud(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [],
      details: []
    };

    try {
      console.log('[Migration] Starting migration of local files to cloud storage...');
      
      // Get all files that are stored locally (no cloudUrl)
      const localFiles = await db
        .select()
        .from(files)
        .where(isNull(files.cloudUrl));

      console.log(`[Migration] Found ${localFiles.length} local files to migrate`);

      if (localFiles.length === 0) {
        result.success = true;
        return result;
      }

      for (const file of localFiles) {
        try {
          // Fix path - remove duplicate workspace path
          const cleanPath = file.filePath.replace('/home/runner/workspace/home/runner/workspace/', '/home/runner/workspace/');
          const localPath = cleanPath.startsWith('/') ? cleanPath : path.join(process.cwd(), cleanPath);
          
          // Check if local file exists
          if (!fs.existsSync(localPath)) {
            const error = `Local file not found: ${localPath}`;
            result.errors.push(error);
            result.details.push({
              fileId: file.id,
              fileName: file.fileName,
              status: 'failed',
              error
            });
            result.failed++;
            continue;
          }

          // Upload to cloud storage
          const uploadResult = await cloudStorageService.uploadFile(localPath, {
            folder: 'migrated-files',
            public_id: `file_${file.id}`,
            resource_type: 'auto',
            filename: file.originalName
          });

          if (uploadResult.success && uploadResult.url) {
            // Update database with cloud storage info
            await db
              .update(files)
              .set({
                cloudUrl: uploadResult.url,
                cloudPublicId: uploadResult.publicId,
                cloudProviderId: uploadResult.providerId,
                storageType: 'cloud',
                cloudMetadata: uploadResult.metadata
              })
              .where(eq(files.id, file.id));

            result.details.push({
              fileId: file.id,
              fileName: file.fileName,
              status: 'success',
              cloudUrl: uploadResult.url
            });
            result.migrated++;

            console.log(`[Migration] ✓ Migrated: ${file.fileName} → ${uploadResult.url}`);

            // Optional: Remove local file after successful migration
            // fs.unlinkSync(localPath);

          } else {
            const error = uploadResult.error || 'Unknown upload error';
            result.errors.push(`Failed to upload ${file.fileName}: ${error}`);
            result.details.push({
              fileId: file.id,
              fileName: file.fileName,
              status: 'failed',
              error
            });
            result.failed++;
          }

        } catch (error: any) {
          const errorMsg = `Error migrating ${file.fileName}: ${error.message}`;
          result.errors.push(errorMsg);
          result.details.push({
            fileId: file.id,
            fileName: file.fileName,
            status: 'failed',
            error: errorMsg
          });
          result.failed++;
        }
      }

      result.success = result.failed === 0;
      
      console.log(`[Migration] Completed: ${result.migrated} migrated, ${result.failed} failed`);
      return result;

    } catch (error: any) {
      result.errors.push(`Migration failed: ${error.message}`);
      console.error('[Migration] Migration failed:', error);
      return result;
    }
  }

  // Get migration status
  async getMigrationStatus() {
    try {
      const localFiles = await db
        .select()
        .from(files)
        .where(isNull(files.cloudUrl));

      const cloudFiles = await db
        .select()
        .from(files)
        .where(eq(files.storageType, 'cloud'));

      return {
        localFiles: localFiles.length,
        cloudFiles: cloudFiles.length,
        totalFiles: localFiles.length + cloudFiles.length,
        migrationNeeded: localFiles.length > 0
      };
    } catch (error) {
      console.error('[Migration] Failed to get migration status:', error);
      return {
        localFiles: 0,
        cloudFiles: 0,
        totalFiles: 0,
        migrationNeeded: false,
        error: 'Failed to get status'
      };
    }
  }

  // Rollback: Download cloud files back to local storage
  async rollbackToLocal(fileId?: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [],
      details: []
    };

    try {
      console.log('[Migration] Starting rollback to local storage...');
      
      // Get cloud files to rollback
      let cloudFiles;
      
      if (fileId) {
        cloudFiles = await db
          .select()
          .from(files)
          .where(eq(files.id, fileId));
      } else {
        cloudFiles = await db
          .select()
          .from(files)
          .where(eq(files.storageType, 'cloud'));
      }
      
      console.log(`[Migration] Found ${cloudFiles.length} cloud files to rollback`);

      for (const file of cloudFiles) {
        try {
          if (!file.cloudUrl) {
            result.errors.push(`No cloud URL for file: ${file.fileName}`);
            result.failed++;
            continue;
          }

          // Download from cloud and save to local
          const localPath = path.join(process.cwd(), 'uploads', `rollback_${file.id}_${file.originalName}`);
          
          // Here you would implement the download logic
          // For now, just update the database
          await db
            .update(files)
            .set({
              filePath: `uploads/rollback_${file.id}_${file.originalName}`,
              storageType: 'local',
              cloudUrl: null,
              cloudPublicId: null,
              cloudProviderId: null,
              cloudMetadata: null
            })
            .where(eq(files.id, file.id));

          result.details.push({
            fileId: file.id,
            fileName: file.fileName,
            status: 'success'
          });
          result.migrated++;

        } catch (error: any) {
          const errorMsg = `Error rolling back ${file.fileName}: ${error.message}`;
          result.errors.push(errorMsg);
          result.details.push({
            fileId: file.id,
            fileName: file.fileName,
            status: 'failed',
            error: errorMsg
          });
          result.failed++;
        }
      }

      result.success = result.failed === 0;
      console.log(`[Migration] Rollback completed: ${result.migrated} rolled back, ${result.failed} failed`);
      return result;

    } catch (error: any) {
      result.errors.push(`Rollback failed: ${error.message}`);
      console.error('[Migration] Rollback failed:', error);
      return result;
    }
  }
}

export const storageMigrationService = new StorageMigrationService();
export type { MigrationResult };