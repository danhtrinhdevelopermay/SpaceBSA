import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ThumbnailService {
  private thumbnailDir = path.join(process.cwd(), 'thumbnails');

  constructor() {
    this.ensureThumbnailDir();
  }

  private async ensureThumbnailDir() {
    try {
      await fs.access(this.thumbnailDir);
    } catch {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    }
  }

  /**
   * Generate thumbnail from video file
   * @param videoPath Path to the video file
   * @param fileId File ID for naming the thumbnail
   * @returns Promise<string> Path to generated thumbnail
   */
  async generateVideoThumbnail(videoPath: string, fileId: string): Promise<string> {
    const thumbnailName = `${fileId}-thumb.jpg`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%'], // Take screenshot at 10% of video duration
          filename: thumbnailName,
          folder: this.thumbnailDir,
          size: '320x240'
        })
        .on('end', () => {
          console.log(`[ThumbnailService] Thumbnail generated: ${thumbnailName}`);
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          console.error(`[ThumbnailService] Error generating thumbnail:`, err);
          reject(err);
        });
    });
  }

  /**
   * Get thumbnail path for a file
   * @param fileId File ID
   * @returns string Path to thumbnail or null if doesn't exist
   */
  async getThumbnailPath(fileId: string): Promise<string | null> {
    const thumbnailName = `${fileId}-thumb.jpg`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);
    
    try {
      await fs.access(thumbnailPath);
      return thumbnailPath;
    } catch {
      return null;
    }
  }

  /**
   * Rename thumbnail from temporary ID to actual file ID
   * @param tempId Temporary ID used during generation
   * @param actualFileId Actual file ID from database
   */
  async renameThumbnail(tempId: string, actualFileId: string): Promise<void> {
    const oldThumbnailName = `${tempId}-thumb.jpg`;
    const newThumbnailName = `${actualFileId}-thumb.jpg`;
    const oldPath = path.join(this.thumbnailDir, oldThumbnailName);
    const newPath = path.join(this.thumbnailDir, newThumbnailName);
    
    try {
      await fs.rename(oldPath, newPath);
      console.log(`[ThumbnailService] Thumbnail renamed: ${oldThumbnailName} -> ${newThumbnailName}`);
    } catch (err) {
      console.warn(`[ThumbnailService] Failed to rename thumbnail: ${oldThumbnailName} -> ${newThumbnailName}`, err);
      throw err;
    }
  }

  /**
   * Delete thumbnail for a file
   * @param fileId File ID
   */
  async deleteThumbnail(fileId: string): Promise<void> {
    const thumbnailName = `${fileId}-thumb.jpg`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);
    
    try {
      await fs.unlink(thumbnailPath);
      console.log(`[ThumbnailService] Thumbnail deleted: ${thumbnailName}`);
    } catch (err) {
      // Thumbnail doesn't exist, ignore error
    }
  }

  /**
   * Check if file is a video that can have thumbnails generated
   * @param mimeType File mime type
   * @returns boolean
   */
  isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }
}

export const thumbnailService = new ThumbnailService();