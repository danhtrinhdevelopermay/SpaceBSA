import { eq, and, desc, asc, sql, or } from "drizzle-orm";
import { databaseManager } from "./database-manager";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  File,
  InsertFile,
  Folder,
  InsertFolder,
  SharedFile,
  InsertSharedFile,
  Notification,
  InsertNotification,
  UserSession,
  InsertUserSession,
} from "@shared/schema";

class MultiDatabaseStorage {
  
  // ===== USER OPERATIONS =====
  async createUser(userData: InsertUser): Promise<User> {
    const db = databaseManager.getCurrentDatabase();
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    // Tìm trong tất cả databases
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const [user] = await database.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.firebaseUid, firebaseUid))
          .limit(1);
        
        if (user) {
          console.log(`[MultiDB] Found user in database: ${database.name}`);
          return user;
        }
      } catch (error) {
        console.error(`[MultiDB] Error searching user in ${database.name}:`, error);
      }
    }
    
    return null;
  }

  async getUserById(id: number): Promise<User | null> {
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const [user] = await database.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, id))
          .limit(1);
        
        if (user) return user;
      } catch (error) {
        console.error(`[MultiDB] Error searching user by ID in ${database.name}:`, error);
      }
    }
    
    return null;
  }

  // ===== FILE OPERATIONS =====
  
  async getDeletedFilesByUserId(userId: number): Promise<File[]> {
    const allFiles: File[] = [];
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const files = await database.db
          .select()
          .from(schema.files)
          .where(
            and(
              eq(schema.files.userId, userId),
              sql`${schema.files.deletedAt} IS NOT NULL`
            )
          )
          .orderBy(desc(schema.files.deletedAt));
        
        if (files.length > 0) {
          console.log(`[MultiDB] Found ${files.length} deleted files in ${database.name}`);
          allFiles.push(...files);
        }
      } catch (error) {
        console.error(`[MultiDB] Error fetching deleted files from ${database.name}:`, error);
      }
    }
    
    return allFiles.sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    );
  }
  async createFile(fileData: InsertFile): Promise<File> {
    const db = databaseManager.getCurrentDatabase();
    const [file] = await db.insert(schema.files).values(fileData).returning();
    console.log(`[MultiDB] Created file in primary database: ${file.fileName}`);
    return file;
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    const allFiles: File[] = [];
    const databases = databaseManager.getAllDatabases();
    console.log(`[MultiDB] Searching files for user ${userId} across ${databases.length} databases:`, databases.map(d => d.name));
    
    // Lấy files từ tất cả databases
    for (const database of databases) {
      try {
        const files = await database.db
          .select()
          .from(schema.files)
          .where(
            and(
              eq(schema.files.userId, userId),
              sql`${schema.files.deletedAt} IS NULL`
            )
          )
          .orderBy(desc(schema.files.createdAt));
        
        if (files.length > 0) {
          console.log(`[MultiDB] Found ${files.length} files in ${database.name}:`, files.map(f => f.originalName));
          allFiles.push(...files);
        } else {
          console.log(`[MultiDB] No files found in ${database.name} for user ${userId}`);
        }
      } catch (error) {
        console.error(`[MultiDB] Error fetching files from ${database.name}:`, error);
      }
    }
    
    // Sắp xếp tất cả files theo thời gian tạo (mới nhất trước)
    const sortedFiles = allFiles.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    console.log(`[MultiDB] Total files collected: ${allFiles.length}, returning: ${sortedFiles.length}`);
    console.log(`[MultiDB] File names:`, sortedFiles.map(f => f.originalName));
    
    return sortedFiles;
  }

  async getFileById(fileId: string): Promise<File | null> {
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const [file] = await database.db
          .select()
          .from(schema.files)
          .where(eq(schema.files.id, fileId))
          .limit(1);
        
        if (file) {
          console.log(`[MultiDB] Found file in database: ${database.name}`);
          return file;
        }
      } catch (error) {
        console.error(`[MultiDB] Error searching file in ${database.name}:`, error);
      }
    }
    
    return null;
  }

  async updateFile(fileId: string, updates: Partial<File>): Promise<File | null> {
    const databases = databaseManager.getAllDatabases();
    
    // Tìm file trong databases và update
    for (const database of databases) {
      try {
        const [updatedFile] = await database.db
          .update(schema.files)
          .set(updates)
          .where(eq(schema.files.id, fileId))
          .returning();
        
        if (updatedFile) {
          console.log(`[MultiDB] Updated file in database: ${database.name}`);
          return updatedFile;
        }
      } catch (error) {
        console.error(`[MultiDB] Error updating file in ${database.name}:`, error);
      }
    }
    
    return null;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const result = await database.db
          .update(schema.files)
          .set({ deletedAt: sql`NOW()` })
          .where(eq(schema.files.id, fileId));
        
        if (result.rowCount && result.rowCount > 0) {
          console.log(`[MultiDB] Soft deleted file in database: ${database.name}`);
          return true;
        }
      } catch (error) {
        console.error(`[MultiDB] Error deleting file in ${database.name}:`, error);
      }
    }
    
    return false;
  }

  // ===== STORAGE USAGE =====
  async getUserStorageUsage(userId: number): Promise<number> {
    let totalSize = 0;
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const result = await database.db
          .select({
            totalSize: sql<number>`COALESCE(SUM(${schema.files.fileSize}), 0)`,
          })
          .from(schema.files)
          .where(
            and(
              eq(schema.files.userId, userId),
              sql`${schema.files.deletedAt} IS NULL`
            )
          );
        
        if (result[0]) {
          totalSize += Number(result[0].totalSize);
        }
      } catch (error) {
        console.error(`[MultiDB] Error calculating storage in ${database.name}:`, error);
      }
    }
    
    console.log(`[MultiDB] Total storage usage for user ${userId}: ${totalSize} bytes`);
    return totalSize;
  }

  async getTrashFilesByUserId(userId: number): Promise<File[]> {
    const allFiles: File[] = [];
    const databases = databaseManager.getAllDatabases();
    
    // Lấy deleted files từ tất cả databases
    for (const database of databases) {
      try {
        const files = await database.db
          .select()
          .from(schema.files)
          .where(
            and(
              eq(schema.files.userId, userId),
              sql`${schema.files.deletedAt} IS NOT NULL`
            )
          )
          .orderBy(desc(schema.files.deletedAt));
        
        if (files.length > 0) {
          console.log(`[MultiDB] Found ${files.length} trash files in ${database.name}`);
          allFiles.push(...files);
        }
      } catch (error) {
        console.error(`[MultiDB] Error fetching trash files from ${database.name}:`, error);
      }
    }
    
    // Sắp xếp tất cả files theo thời gian xóa (mới nhất trước)
    return allFiles.sort((a, b) => {
      if (!a.deletedAt || !b.deletedAt) return 0;
      return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
    });
  }

  // ===== NOTIFICATION OPERATIONS =====
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const db = databaseManager.getCurrentDatabase();
    const [notification] = await db.insert(schema.notifications).values(notificationData).returning();
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const allNotifications: Notification[] = [];
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const notifications = await database.db
          .select()
          .from(schema.notifications)
          .where(eq(schema.notifications.userId, userId))
          .orderBy(desc(schema.notifications.createdAt));
        
        if (notifications.length > 0) {
          allNotifications.push(...notifications);
        }
      } catch (error) {
        console.error(`[MultiDB] Error fetching notifications from ${database.name}:`, error);
      }
    }
    
    return allNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ===== SHARED FILE OPERATIONS =====
  async createSharedFile(shareData: InsertSharedFile): Promise<SharedFile> {
    const db = databaseManager.getCurrentDatabase();
    const [sharedFile] = await db.insert(schema.sharedFiles).values(shareData).returning();
    return sharedFile;
  }

  async getSharedFileByToken(token: string): Promise<(SharedFile & { file: File; sharedByUser: User }) | null> {
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const result = await database.db
          .select({
            share: schema.sharedFiles,
            file: schema.files,
            sharedByUser: schema.users,
          })
          .from(schema.sharedFiles)
          .innerJoin(schema.files, eq(schema.sharedFiles.fileId, schema.files.id))
          .innerJoin(schema.users, eq(schema.sharedFiles.sharedBy, schema.users.id))
          .where(eq(schema.sharedFiles.shareToken, token))
          .limit(1);
        
        if (result.length > 0) {
          const { share, file, sharedByUser } = result[0];
          return {
            ...share,
            file,
            sharedByUser,
          };
        }
      } catch (error) {
        console.error(`[MultiDB] Error searching shared file in ${database.name}:`, error);
      }
    }
    
    return null;
  }

  // ===== FOLDER OPERATIONS =====
  async createFolder(folderData: InsertFolder): Promise<Folder> {
    const db = databaseManager.getCurrentDatabase();
    const [folder] = await db.insert(schema.folders).values(folderData).returning();
    return folder;
  }

  async getFoldersByUserId(userId: number): Promise<Folder[]> {
    const allFolders: Folder[] = [];
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const folders = await database.db
          .select()
          .from(schema.folders)
          .where(eq(schema.folders.userId, userId))
          .orderBy(asc(schema.folders.name));
        
        if (folders.length > 0) {
          allFolders.push(...folders);
        }
      } catch (error) {
        console.error(`[MultiDB] Error fetching folders from ${database.name}:`, error);
      }
    }
    
    return allFolders.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ===== DATABASE HEALTH & STATS =====
  async getDatabaseStats() {
    return databaseManager.getDatabaseStats();
  }

  async runHealthChecks() {
    await databaseManager.runHealthChecks();
  }

  // Copy file từ database này sang database khác (dùng khi share file)
  async copySharedFileToUser(shareId: number, recipientUserId: number): Promise<File | null> {
    // Tìm shared file trong tất cả databases
    const databases = databaseManager.getAllDatabases();
    
    for (const database of databases) {
      try {
        const [shareInfo] = await database.db
          .select({
            file: schema.files,
            share: schema.sharedFiles,
            sender: schema.users,
          })
          .from(schema.sharedFiles)
          .innerJoin(schema.files, eq(schema.sharedFiles.fileId, schema.files.id))
          .innerJoin(schema.users, eq(schema.sharedFiles.sharedBy, schema.users.id))
          .where(eq(schema.sharedFiles.id, shareId))
          .limit(1);
        
        if (shareInfo) {
          // Copy file vào database hiện tại
          const newFileData: InsertFile = {
            userId: recipientUserId,
            fileName: `[Shared] ${shareInfo.file.fileName}`,
            originalName: shareInfo.file.originalName,
            fileSize: shareInfo.file.fileSize,
            mimeType: shareInfo.file.mimeType,
            filePath: shareInfo.file.filePath,
            cloudUrl: shareInfo.file.cloudUrl,
            cloudPublicId: shareInfo.file.cloudPublicId,
            cloudProviderId: shareInfo.file.cloudProviderId,
            storageType: shareInfo.file.storageType,
            cloudMetadata: shareInfo.file.cloudMetadata,
          };
          
          const copiedFile = await this.createFile(newFileData);
          console.log(`[MultiDB] Copied shared file to recipient: ${copiedFile.fileName}`);
          return copiedFile;
        }
      } catch (error) {
        console.error(`[MultiDB] Error copying shared file from ${database.name}:`, error);
      }
    }
    
    return null;
  }
}

export const multiDbStorage = new MultiDatabaseStorage();