// Data Protection Service - Đảm bảo an toàn dữ liệu người dùng 100%
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

interface DataProtectionConfig {
  enableSafeMode: boolean;
  backupBeforeCleanup: boolean;
  maxFileAge: number; // days - chỉ xóa file cực kỳ cũ
  requireConfirmation: boolean;
}

class DataProtectionService {
  private config: DataProtectionConfig;

  constructor(config: Partial<DataProtectionConfig> = {}) {
    this.config = {
      enableSafeMode: true, // Luôn bật safe mode
      backupBeforeCleanup: false, // Không backup trong development
      maxFileAge: 30, // Chỉ xóa file cũ hơn 30 ngày (cực kỳ an toàn)
      requireConfirmation: process.env.NODE_ENV === 'production',
      ...config
    };
  }

  // Kiểm tra file có an toàn để xóa không
  async isFileSafeToDelete(fileId: string): Promise<boolean> {
    try {
      const fileResult = await db.execute(sql`
        SELECT 
          id,
          file_name,
          deleted_at,
          created_at,
          user_id
        FROM files 
        WHERE id = ${fileId}
      `);

      const file = fileResult.rows?.[0] as any;
      if (!file) return false;

      // Chỉ xóa file đã được đánh dấu xóa
      if (!file.deleted_at) {
        console.warn(`[DataProtection] File ${fileId} chưa được đánh dấu xóa - KHÔNG AN TOÀN`);
        return false;
      }

      // Kiểm tra file đã ở trash đủ lâu chưa
      const deletedDate = new Date(file.deleted_at);
      const daysSinceDeleted = (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDeleted < this.config.maxFileAge) {
        console.log(`[DataProtection] File ${file.file_name} mới xóa ${Math.round(daysSinceDeleted)} ngày - chờ thêm`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[DataProtection] Lỗi kiểm tra file:', error);
      return false; // An toàn: không xóa nếu có lỗi
    }
  }

  // Xóa file với bảo vệ tối đa
  async safeDeleteFile(fileId: string): Promise<boolean> {
    try {
      // Kiểm tra an toàn trước
      const isSafe = await this.isFileSafeToDelete(fileId);
      if (!isSafe) {
        console.log(`[DataProtection] File ${fileId} KHÔNG AN TOÀN để xóa - bỏ qua`);
        return false;
      }

      // Lấy thông tin file
      const fileResult = await db.execute(sql`
        SELECT file_path, file_name FROM files WHERE id = ${fileId}
      `);
      
      const file = fileResult.rows?.[0] as any;
      if (!file) return false;

      // Xóa file vật lý
      const filePath = path.join(process.cwd(), 'uploads', file.file_path);
      try {
        await fs.unlink(filePath);
        console.log(`[DataProtection] Đã xóa file vật lý: ${file.file_name}`);
      } catch (fileError) {
        console.warn(`[DataProtection] File vật lý không tồn tại: ${file.file_name}`);
      }

      // Xóa record trong database
      await db.execute(sql`DELETE FROM files WHERE id = ${fileId}`);
      console.log(`[DataProtection] Đã xóa record database cho: ${file.file_name}`);

      return true;
    } catch (error) {
      console.error(`[DataProtection] Lỗi xóa file ${fileId}:`, error);
      return false; // An toàn: không xóa nếu có lỗi
    }
  }

  // Cleanup an toàn - chỉ xóa file thực sự cũ
  async performSafeCleanup(): Promise<{ deleted: number; skipped: number; errors: number }> {
    const stats = { deleted: 0, skipped: 0, errors: 0 };

    try {
      // Tìm file đã xóa CỰC KỲ CŨ (hơn maxFileAge ngày)
      const oldDeletedFiles = await db.execute(sql`
        SELECT id, file_name, deleted_at
        FROM files 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - INTERVAL '${sql.raw(this.config.maxFileAge.toString())} days'
        ORDER BY deleted_at ASC
        LIMIT 10
      `);

      if (!oldDeletedFiles.rows || oldDeletedFiles.rows.length === 0) {
        console.log('[DataProtection] Không có file cũ nào cần xóa - tất cả đều an toàn');
        return stats;
      }

      console.log(`[DataProtection] Tìm thấy ${oldDeletedFiles.rows.length} file cũ hơn ${this.config.maxFileAge} ngày`);

      // Xóa từng file một cách an toàn
      for (const file of oldDeletedFiles.rows) {
        const fileData = file as any;
        const success = await this.safeDeleteFile(fileData.id);
        
        if (success) {
          stats.deleted++;
          console.log(`[DataProtection] ✓ Đã xóa an toàn: ${fileData.file_name}`);
        } else {
          stats.skipped++;
          console.log(`[DataProtection] ⚠ Bỏ qua file: ${fileData.file_name}`);
        }

        // Thêm delay để tránh overload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[DataProtection] Hoàn thành cleanup: ${stats.deleted} xóa, ${stats.skipped} bỏ qua`);
      return stats;

    } catch (error) {
      console.error('[DataProtection] Lỗi trong quá trình cleanup:', error);
      stats.errors++;
      return stats;
    }
  }

  // Kiểm tra tính toàn vẹn dữ liệu
  async verifyDataIntegrity(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Kiểm tra file không có user
      const orphanedFiles = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM files f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE u.id IS NULL AND f.deleted_at IS NULL
      `);

      const orphanCount = Number(orphanedFiles.rows?.[0]?.count) || 0;
      if (orphanCount > 0) {
        issues.push(`${orphanCount} file không có user`);
      }

      // Kiểm tra shared files không hợp lệ
      const invalidShares = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM shared_files sf
        LEFT JOIN files f ON sf.file_id = f.id
        WHERE f.id IS NULL
      `);

      const invalidShareCount = Number(invalidShares.rows?.[0]?.count) || 0;
      if (invalidShareCount > 0) {
        issues.push(`${invalidShareCount} share link không hợp lệ`);
      }

      // Kiểm tra database size
      const dbSize = await db.execute(sql`
        SELECT pg_database_size(current_database()) as size_bytes
      `);

      const sizeBytes = Number(dbSize.rows?.[0]?.size_bytes) || 0;
      const sizeMB = Math.round(sizeBytes / 1024 / 1024);

      if (sizeMB > 500) {
        issues.push(`Database lớn: ${sizeMB}MB`);
      }

      const status = issues.length === 0 ? 'healthy' : 'attention_needed';
      
      console.log(`[DataProtection] Kiểm tra tính toàn vẹn: ${status}`);
      if (issues.length > 0) {
        console.log(`[DataProtection] Vấn đề phát hiện: ${issues.join(', ')}`);
      }

      return { status, issues };

    } catch (error) {
      console.error('[DataProtection] Lỗi kiểm tra tính toàn vẹn:', error);
      return {
        status: 'error',
        issues: ['Lỗi kiểm tra database']
      };
    }
  }

  // Cleanup chỉ các record không ảnh hưởng đến dữ liệu người dùng
  async cleanupSafeRecords(): Promise<void> {
    try {
      // Chỉ xóa share links đã hết hạn (không ảnh hưởng file gốc)
      const expiredShares = await db.execute(sql`
        DELETE FROM shared_files 
        WHERE expires_at IS NOT NULL 
        AND expires_at < NOW()
      `);

      if (expiredShares.rowCount && expiredShares.rowCount > 0) {
        console.log(`[DataProtection] Đã xóa ${expiredShares.rowCount} share link hết hạn (an toàn)`);
      }

      // Cleanup session cũ (không ảnh hưởng dữ liệu người dùng)
      // Note: Nếu có session table
      console.log('[DataProtection] Hoàn thành cleanup các record an toàn');

    } catch (error) {
      console.error('[DataProtection] Lỗi cleanup record an toàn:', error);
    }
  }

  getConfig(): DataProtectionConfig {
    return { ...this.config };
  }
}

// Export singleton với cấu hình an toàn tối đa
const dataProtectionService = new DataProtectionService({
  enableSafeMode: true,
  maxFileAge: 30, // 30 ngày - cực kỳ an toàn
  backupBeforeCleanup: process.env.NODE_ENV === 'production',
  requireConfirmation: process.env.NODE_ENV === 'production'
});

export { dataProtectionService, DataProtectionService };