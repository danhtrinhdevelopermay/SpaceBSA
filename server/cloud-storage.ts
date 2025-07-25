import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Định nghĩa interface cho cloud storage providers
interface CloudStorageProvider {
  id: string;
  name: string;
  type: 'cloudinary' | 'firebase' | 's3';
  config: any;
  maxStorage?: number; // MB
  currentUsage?: number; // MB
  isActive: boolean;
  priority: number; // 1 = highest priority
}

// Interface cho upload result
interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  providerId?: string;
  error?: string;
  metadata?: any;
}

class MultiCloudStorageService {
  private providers: CloudStorageProvider[] = [];
  private currentProvider: CloudStorageProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Load providers từ environment variables hoặc config
    const cloudinaryProviders = this.loadCloudinaryProviders();
    this.providers.push(...cloudinaryProviders);
    
    // Sắp xếp theo priority (1 = cao nhất)
    this.providers.sort((a, b) => a.priority - b.priority);
    
    // Chọn provider active đầu tiên
    this.currentProvider = this.providers.find(p => p.isActive) || null;
    
    this.logProviderStatus();
  }

  private loadCloudinaryProviders(): CloudStorageProvider[] {
    const providers: CloudStorageProvider[] = [];
    
    // Provider 1 - Primary Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      providers.push({
        id: 'cloudinary_primary',
        name: 'Cloudinary Primary',
        type: 'cloudinary',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true
        },
        maxStorage: 25000, // 25GB free plan
        currentUsage: 0,
        isActive: true,
        priority: 1
      });
    }

    // Provider 2 - Secondary Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME_2 && process.env.CLOUDINARY_API_KEY_2 && process.env.CLOUDINARY_API_SECRET_2) {
      providers.push({
        id: 'cloudinary_secondary',
        name: 'Cloudinary Secondary',
        type: 'cloudinary',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME_2,
          api_key: process.env.CLOUDINARY_API_KEY_2,
          api_secret: process.env.CLOUDINARY_API_SECRET_2,
          secure: true
        },
        maxStorage: 25000, // 25GB free plan
        currentUsage: 0,
        isActive: false, // Chỉ activate khi primary đầy
        priority: 2
      });
    }

    // Provider 3 - Tertiary Cloudinary (có thể thêm nhiều hơn)
    if (process.env.CLOUDINARY_CLOUD_NAME_3 && process.env.CLOUDINARY_API_KEY_3 && process.env.CLOUDINARY_API_SECRET_3) {
      providers.push({
        id: 'cloudinary_tertiary',
        name: 'Cloudinary Tertiary',
        type: 'cloudinary',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME_3,
          api_key: process.env.CLOUDINARY_API_KEY_3,
          api_secret: process.env.CLOUDINARY_API_SECRET_3,
          secure: true
        },
        maxStorage: 25000,
        currentUsage: 0,
        isActive: false,
        priority: 3
      });
    }

    return providers;
  }

  private async configureCloudinary(provider: CloudStorageProvider) {
    if (provider.type === 'cloudinary') {
      cloudinary.config(provider.config);
      console.log(`[CloudStorage] Configured ${provider.name}`);
    }
  }

  private async checkProviderUsage(provider: CloudStorageProvider): Promise<number> {
    try {
      if (provider.type === 'cloudinary') {
        await this.configureCloudinary(provider);
        
        // Get usage từ Cloudinary API
        const usage = await cloudinary.api.usage();
        const usageMB = Math.round(usage.storage.usage / 1024 / 1024);
        
        provider.currentUsage = usageMB;
        return usageMB;
      }
    } catch (error) {
      console.error(`[CloudStorage] Error checking usage for ${provider.name}:`, error);
      return 0;
    }
    return 0;
  }

  private async switchToNextProvider(): Promise<boolean> {
    console.log(`[CloudStorage] Switching from ${this.currentProvider?.name} to next available provider`);
    
    // Tìm provider tiếp theo theo priority
    const currentIndex = this.providers.findIndex(p => p.id === this.currentProvider?.id);
    
    for (let i = currentIndex + 1; i < this.providers.length; i++) {
      const nextProvider = this.providers[i];
      
      // Kiểm tra xem provider có available không
      const usage = await this.checkProviderUsage(nextProvider);
      const availableSpace = (nextProvider.maxStorage || 0) - usage;
      
      if (availableSpace > 100) { // Còn ít nhất 100MB
        this.currentProvider = nextProvider;
        nextProvider.isActive = true;
        
        console.log(`[CloudStorage] Switched to ${nextProvider.name}, Available: ${availableSpace}MB`);
        return true;
      }
    }
    
    console.error('[CloudStorage] No available providers found!');
    return false;
  }

  async uploadFile(filePath: string, options: { 
    folder?: string; 
    public_id?: string; 
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    filename?: string;
  } = {}): Promise<UploadResult> {
    
    if (!this.currentProvider) {
      return { success: false, error: 'No cloud storage provider available' };
    }

    try {
      // Kiểm tra usage trước khi upload
      const usage = await this.checkProviderUsage(this.currentProvider);
      const availableSpace = (this.currentProvider.maxStorage || 0) - usage;
      
      // Kiểm tra file size
      const fileStats = fs.statSync(filePath);
      const fileSizeMB = fileStats.size / 1024 / 1024;
      
      // Nếu không đủ space, chuyển sang provider khác
      if (fileSizeMB > availableSpace) {
        console.log(`[CloudStorage] ${this.currentProvider.name} insufficient space (${availableSpace}MB), switching provider...`);
        
        const switchSuccess = await this.switchToNextProvider();
        if (!switchSuccess) {
          return { success: false, error: 'All cloud storage providers are full' };
        }
      }

      // Configure và upload
      await this.configureCloudinary(this.currentProvider);
      
      const uploadOptions = {
        folder: options.folder || 'spacebsa',
        public_id: options.public_id,
        resource_type: options.resource_type || 'auto',
        use_filename: true,
        unique_filename: true,
        ...options
      };

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      
      console.log(`[CloudStorage] Successfully uploaded to ${this.currentProvider.name}: ${result.public_id}`);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        providerId: this.currentProvider.id,
        metadata: {
          bytes: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          resourceType: result.resource_type
        }
      };

    } catch (error: any) {
      console.error(`[CloudStorage] Upload failed on ${this.currentProvider.name}:`, error);
      
      // Nếu lỗi do hết quota, thử chuyển provider
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        console.log('[CloudStorage] Quota exceeded, trying next provider...');
        
        const switchSuccess = await this.switchToNextProvider();
        if (switchSuccess) {
          // Retry upload với provider mới
          return this.uploadFile(filePath, options);
        }
      }
      
      return { 
        success: false, 
        error: error.message || 'Upload failed',
        providerId: this.currentProvider.id
      };
    }
  }

  async deleteFile(publicId: string, providerId?: string): Promise<boolean> {
    try {
      // Tìm provider đã upload file này
      const provider = providerId 
        ? this.providers.find(p => p.id === providerId)
        : this.currentProvider;
        
      if (!provider) {
        console.error('[CloudStorage] Provider not found for deletion');
        return false;
      }

      await this.configureCloudinary(provider);
      const result = await cloudinary.uploader.destroy(publicId);
      
      console.log(`[CloudStorage] File deleted from ${provider.name}: ${publicId}`);
      return result.result === 'ok';
      
    } catch (error) {
      console.error('[CloudStorage] Delete failed:', error);
      return false;
    }
  }

  // Thêm provider mới (cho admin)
  async addProvider(providerConfig: Omit<CloudStorageProvider, 'currentUsage' | 'isActive'>): Promise<boolean> {
    try {
      const newProvider: CloudStorageProvider = {
        ...providerConfig,
        currentUsage: 0,
        isActive: false // Sẽ activate khi cần
      };

      // Test connection
      if (newProvider.type === 'cloudinary') {
        cloudinary.config(newProvider.config);
        await cloudinary.api.ping();
      }

      this.providers.push(newProvider);
      this.providers.sort((a, b) => a.priority - b.priority);
      
      console.log(`[CloudStorage] Added new provider: ${newProvider.name}`);
      return true;
      
    } catch (error) {
      console.error('[CloudStorage] Failed to add provider:', error);
      return false;
    }
  }

  // Get status của tất cả providers
  async getProvidersStatus(): Promise<CloudStorageProvider[]> {
    const statusPromises = this.providers.map(async (provider) => {
      const usage = await this.checkProviderUsage(provider);
      return {
        ...provider,
        currentUsage: usage,
        availableSpace: (provider.maxStorage || 0) - usage,
        usagePercentage: Math.round((usage / (provider.maxStorage || 1)) * 100)
      };
    });

    return Promise.all(statusPromises);
  }

  getCurrentProvider(): CloudStorageProvider | null {
    return this.currentProvider;
  }

  getAllProviders(): CloudStorageProvider[] {
    return this.providers;
  }

  async switchToProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      console.log(`[CloudStorage] Provider ${providerId} not found`);
      return false;
    }

    try {
      await this.configureCloudinary(provider);
      this.currentProvider = provider;
      console.log(`[CloudStorage] Manually switched to provider: ${provider.name}`);
      return true;
    } catch (error) {
      console.error(`[CloudStorage] Failed to switch to provider ${providerId}:`, error);
      return false;
    }
  }

  async getPublicProviderUsage(provider: CloudStorageProvider): Promise<number> {
    return this.checkProviderUsage(provider);
  }

  private logProviderStatus() {
    console.log('[CloudStorage] Initialized providers:');
    this.providers.forEach(provider => {
      console.log(`  - ${provider.name} (Priority: ${provider.priority}, Active: ${provider.isActive})`);
    });
  }

  // Backup file từ cloud về local (emergency)
  async backupToLocal(publicId: string, providerId: string, localPath: string): Promise<boolean> {
    try {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) return false;

      await this.configureCloudinary(provider);
      
      // Generate download URL và download về local
      const url = cloudinary.url(publicId, { resource_type: 'auto' });
      
      // Implement download logic here if needed
      console.log(`[CloudStorage] Backup URL: ${url}`);
      return true;
      
    } catch (error) {
      console.error('[CloudStorage] Backup failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cloudStorageService = new MultiCloudStorageService();
export type { UploadResult, CloudStorageProvider };