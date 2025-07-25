import { 
  users, 
  folders,
  files, 
  sharedFiles,
  notifications,
  userSessions,
  type User, 
  type InsertUser,
  type Folder,
  type InsertFolder,
  type File,
  type InsertFile,
  type SharedFile,
  type InsertSharedFile,
  type Notification,
  type InsertNotification,
  type UserSession,
  type InsertUserSession
} from "@shared/schema";
import { databaseManager } from "./database-manager";
import { multiDbStorage } from "./multi-database-storage";
import { eq, and, isNull, isNotNull, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Folder methods
  getFoldersByUserId(userId: number): Promise<Folder[]>;
  getFolderById(folderId: string): Promise<Folder | undefined>;
  createFolder(insertFolder: InsertFolder): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;
  
  // File methods
  getFilesByUserId(userId: number): Promise<File[]>;
  getFilesByFolderId(folderId: string): Promise<File[]>;
  getFileById(fileId: string): Promise<File | undefined>;
  createFile(insertFile: InsertFile): Promise<File>;
  deleteFile(fileId: string): Promise<void>; // Hard delete
  moveToTrash(fileId: string): Promise<void>; // Soft delete
  restoreFromTrash(fileId: string): Promise<void>; // Restore file
  getTrashFilesByUserId(userId: number): Promise<File[]>; // Get deleted files
  permanentlyDeleteOldTrashFiles(): Promise<void>; // Cleanup old trash files
  permanentlyDeleteFile(fileId: string): Promise<void>; // Permanent delete from trash
  
  // Sharing methods
  createFileShare(insertShare: InsertSharedFile): Promise<SharedFile>;
  getSharedFilesByUserId(userId: number): Promise<SharedFile[]>;
  getFileByShareToken(token: string): Promise<{ file: File; share: SharedFile } | undefined>;
  updateShareStatus(shareId: number, status: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Notification methods
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;
  deleteNotificationsByShareId(shareId: number): Promise<void>;
  
  // Enhanced sharing methods
  copySharedFileToUser(shareId: number, recipientUserId: number): Promise<File>;
  
  // Session methods
  createOrUpdateUserSession(insertSession: InsertUserSession): Promise<UserSession>;
  getUserSession(userId: number): Promise<UserSession | undefined>;
  updateSessionActivity(sessionId: string): Promise<void>;
  setUserOffline(userId: number): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
  
  // Statistics methods
  getUserStats(userId: number): Promise<{
    totalFiles: number;
    totalFolders: number;
    totalStorageUsed: number;
    storageLimit: number;
    totalShares: number;
    totalDownloads: number;
    filesInTrash: number;
    recentActivity: Array<{
      action: string;
      fileName: string;
      timestamp: string;
      type: 'upload' | 'share' | 'download' | 'delete' | 'restore';
    }>;
    filesByType: {
      images: number;
      documents: number;
      videos: number;
      music: number;
      others: number;
    };
    joinedDate: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  private get db() {
    return databaseManager.getCurrentDatabase();
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getFoldersByUserId(userId: number): Promise<Folder[]> {
    return await this.db.select().from(folders).where(eq(folders.userId, userId));
  }

  async getFolderById(folderId: string): Promise<Folder | undefined> {
    const [folder] = await this.db.select().from(folders).where(eq(folders.id, folderId));
    return folder || undefined;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await this.db
      .insert(folders)
      .values(insertFolder)
      .returning();
    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.db.delete(folders).where(eq(folders.id, folderId));
  }

  async getFilesByUserId(userId: number): Promise<File[]> {
    // Lấy files từ tất cả databases, không chỉ database hiện tại
    return await multiDbStorage.getFilesByUserId(userId);
  }

  async getFilesByFolderId(folderId: string): Promise<File[]> {
    return await this.db.select().from(files).where(
      and(eq(files.folderId, folderId), isNull(files.deletedAt))
    );
  }

  async getFileById(fileId: string): Promise<File | undefined> {
    // Tìm file trong tất cả databases
    const file = await multiDbStorage.getFileById(fileId);
    return file || undefined;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    console.log(`[Storage] Creating file in database: ${insertFile.originalName}`);
    const [file] = await this.db
      .insert(files)
      .values(insertFile)
      .returning();
    console.log(`[Storage] File created successfully: ${file.id} in current database`);
    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.db.delete(files).where(eq(files.id, fileId));
  }

  async moveToTrash(fileId: string): Promise<void> {
    await this.db.update(files)
      .set({ deletedAt: new Date() })
      .where(eq(files.id, fileId));
  }

  async restoreFromTrash(fileId: string): Promise<void> {
    await this.db.update(files)
      .set({ deletedAt: null })
      .where(eq(files.id, fileId));
  }

  async getTrashFilesByUserId(userId: number): Promise<File[]> {
    // Lấy trash files từ tất cả databases
    return await multiDbStorage.getTrashFilesByUserId(userId);
  }

  async permanentlyDeleteOldTrashFiles(): Promise<void> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await this.db.delete(files).where(
      and(isNotNull(files.deletedAt), lte(files.deletedAt, threeDaysAgo))
    );
  }

  async permanentlyDeleteFile(fileId: string): Promise<void> {
    await this.db.delete(files).where(eq(files.id, fileId));
  }

  async createFileShare(insertShare: InsertSharedFile): Promise<SharedFile> {
    const [share] = await this.db
      .insert(sharedFiles)
      .values(insertShare)
      .returning();
    return share;
  }

  async getSharedFilesByUserId(userId: number): Promise<SharedFile[]> {
    return await this.db.select().from(sharedFiles).where(eq(sharedFiles.sharedBy, userId));
  }

  async getFileByShareToken(token: string): Promise<{ file: File; share: SharedFile; sharedByUser: User } | undefined> {
    const result = await this.db
      .select({
        file: files,
        share: sharedFiles,
        sharedByUser: users
      })
      .from(sharedFiles)
      .innerJoin(files, eq(sharedFiles.fileId, files.id))
      .innerJoin(users, eq(sharedFiles.sharedBy, users.id))
      .where(eq(sharedFiles.shareToken, token));

    return result[0] || undefined;
  }

  async getUserStats(userId: number): Promise<{
    totalFiles: number;
    totalFolders: number;
    totalStorageUsed: number;
    storageLimit: number;
    totalShares: number;
    totalDownloads: number;
    filesInTrash: number;
    recentActivity: Array<{
      action: string;
      fileName: string;
      timestamp: string;
      type: 'upload' | 'share' | 'download' | 'delete' | 'restore';
    }>;
    filesByType: {
      images: number;
      documents: number;
      videos: number;
      music: number;
      others: number;
    };
    joinedDate: string;
  }> {
    // Get user info for joined date using multi-database storage
    const user = await multiDbStorage.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all files from all databases (not deleted)
    const userFiles = await multiDbStorage.getFilesByUserId(userId);

    // Get deleted files from all databases 
    const trashFiles = await multiDbStorage.getDeletedFilesByUserId(userId);

    // Get folders
    const userFolders = await this.db.select().from(folders).where(eq(folders.userId, userId));

    // Get shares
    const userShares = await this.db.select().from(sharedFiles).where(eq(sharedFiles.sharedBy, userId));

    // Calculate total storage used
    const totalStorageUsed = userFiles.reduce((total, file) => total + file.fileSize, 0);

    // Categorize files by type
    const filesByType = {
      images: 0,
      documents: 0,
      videos: 0,
      music: 0,
      others: 0
    };

    userFiles.forEach(file => {
      const mimeType = file.mimeType.toLowerCase();
      if (mimeType.startsWith('image/')) {
        filesByType.images++;
      } else if (mimeType.startsWith('video/')) {
        filesByType.videos++;
      } else if (mimeType.startsWith('audio/')) {
        filesByType.music++;
      } else if (
        mimeType.includes('pdf') || 
        mimeType.includes('document') || 
        mimeType.includes('text') ||
        mimeType.includes('sheet') ||
        mimeType.includes('presentation')
      ) {
        filesByType.documents++;
      } else {
        filesByType.others++;
      }
    });

    // Generate recent activity (simulate for now, could be enhanced with actual activity tracking)
    const recentActivity = userFiles
      .slice(-10)
      .map(file => ({
        action: 'upload',
        fileName: file.originalName,
        timestamp: file.createdAt.toISOString(),
        type: 'upload' as const
      }))
      .reverse();

    return {
      totalFiles: userFiles.length,
      totalFolders: userFolders.length,
      totalStorageUsed,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB limit
      totalShares: userShares.length,
      totalDownloads: 0, // Could be enhanced with actual tracking
      filesInTrash: trashFiles.length,
      recentActivity,
      filesByType,
      joinedDate: user.createdAt.toISOString()
    };
  }

  async updateShareStatus(shareId: number, status: string): Promise<void> {
    await this.db.update(sharedFiles)
      .set({ status })
      .where(eq(sharedFiles.id, shareId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await this.db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async deleteNotificationsByShareId(shareId: number): Promise<void> {
    // Find notifications with this shareId in metadata
    const notificationsWithShareId = await this.db.select()
      .from(notifications)
      .where(eq(notifications.type, 'share_request'));
    
    for (const notification of notificationsWithShareId) {
      if (notification.metadata) {
        try {
          const metadata = JSON.parse(notification.metadata);
          if (metadata.shareId === shareId) {
            await this.db.delete(notifications).where(eq(notifications.id, notification.id));
          }
        } catch (e) {
          // Skip malformed metadata
        }
      }
    }
  }

  async copySharedFileToUser(shareId: number, recipientUserId: number): Promise<File> {
    // Get the shared file data
    const [shareData] = await this.db
      .select({ 
        file: files, 
        share: sharedFiles 
      })
      .from(sharedFiles)
      .innerJoin(files, eq(sharedFiles.fileId, files.id))
      .where(eq(sharedFiles.id, shareId));

    if (!shareData) {
      throw new Error('Share not found');
    }

    // Create a copy of the file for the recipient using crypto.randomUUID()
    const newFileId = crypto.randomUUID();
    
    const [copiedFile] = await this.db.insert(files).values({
      id: newFileId,
      userId: recipientUserId,
      originalName: `[Shared] ${shareData.file.originalName}`,
      fileName: shareData.file.fileName, // Keep same physical file
      mimeType: shareData.file.mimeType,
      fileSize: shareData.file.fileSize,
      filePath: shareData.file.filePath, // Share same physical file
      cloudUrl: shareData.file.cloudUrl,
      cloudPublicId: shareData.file.cloudPublicId,
      cloudProviderId: shareData.file.cloudProviderId,
      storageType: shareData.file.storageType, // Copy storage type
      cloudMetadata: shareData.file.cloudMetadata, // Copy cloud metadata
      folderId: null // Put in root folder
    }).returning();

    console.log(`[Storage] Copied shared file: ${copiedFile.id} -> ${copiedFile.originalName}, storageType: ${copiedFile.storageType}`);

    return copiedFile;
  }

  async createOrUpdateUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    // Try to find existing session for this user
    const existingSession = await this.getUserSession(insertSession.userId);
    
    if (existingSession) {
      // Update existing session
      const [updatedSession] = await this.db.update(userSessions)
        .set({
          sessionId: insertSession.sessionId,
          isOnline: true,
          lastActiveAt: new Date()
        })
        .where(eq(userSessions.userId, insertSession.userId))
        .returning();
      return updatedSession;
    } else {
      // Create new session
      const [session] = await this.db
        .insert(userSessions)
        .values({
          ...insertSession,
          isOnline: true,
          lastActiveAt: new Date()
        })
        .returning();
      return session;
    }
  }

  async getUserSession(userId: number): Promise<UserSession | undefined> {
    const [session] = await this.db.select().from(userSessions)
      .where(eq(userSessions.userId, userId));
    return session || undefined;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.db.update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId));
  }

  async setUserOffline(userId: number): Promise<void> {
    await this.db.update(userSessions)
      .set({ isOnline: false })
      .where(eq(userSessions.userId, userId));
  }

  async getOnlineUsers(): Promise<User[]> {
    const result = await this.db
      .select({ user: users })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(eq(userSessions.isOnline, true));
    
    return result.map(r => r.user);
  }
}

export const storage = new DatabaseStorage();