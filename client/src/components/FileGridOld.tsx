import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { File } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File as FileIcon,
  Share2, 
  Download, 
  Trash2,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FileGridProps {
  files: File[];
  isLoading?: boolean;
  onShare?: (file: File) => void;
  onRefresh?: () => void;
  formatFileSize?: (bytes: number) => string;
  onFileClick?: (file: File) => void;
  onPreview?: (file: File) => void;
  onDownload?: (file: File) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showViewToggle?: boolean;
}

// Image preview component with fallback
function ImagePreview({ 
  fileId, 
  fileName, 
  IconComponent, 
  iconColor 
}: { 
  fileId: string; 
  fileName: string; 
  IconComponent: any; 
  iconColor: string; 
}) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <IconComponent className={`h-7 w-7 sm:h-10 sm:w-10 ${iconColor} group-hover:scale-110 transition-transform duration-300`} />;
  }

  return (
    <img
      src={`/api/files/download/${fileId}`}
      alt={fileName}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={() => setImageError(true)}
    />
  );
}

export default function FileGrid({ 
  files, 
  isLoading = false, 
  onShare, 
  onRefresh, 
  formatFileSize: formatFileSizeProp,
  onFileClick,
  onPreview,
  onDownload,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = false
}: FileGridProps) {
  // Use the provided formatFileSize function or the default one
  const formatFileSizeFunc = formatFileSizeProp || formatFileSize;
  const { toast } = useToast();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return FileIcon;
  };

  const getFileIconColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'text-blue-600';
    if (mimeType.startsWith('video/')) return 'text-purple-600';
    if (mimeType.startsWith('audio/')) return 'text-orange-600';
    if (mimeType.includes('pdf')) return 'text-green-600';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleDownload = async (file: File) => {
    try {
      const response = await fetch(`/api/files/download/${file.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Bắt đầu tải xuống",
        description: `Đang tải xuống ${file.originalName}`,
      });
    } catch (error) {
      toast({
        title: "Tải xuống thất bại",
        description: "Không thể tải xuống tệp",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: File) => {
    try {
      await apiRequest('DELETE', `/api/files/${file.id}`);
      if (onRefresh) onRefresh();
      toast({
        title: "Đã xóa tệp",
        description: `${file.originalName} đã được xóa`,
      });
    } catch (error) {
      toast({
        title: "Xóa thất bại",
        description: "Không thể xóa tệp",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="group relative">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md rounded-3xl overflow-hidden animate-pulse">
                <CardContent className="p-0">
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200" />
                  <div className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-200 rounded w-16" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-3 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-md rounded-2xl animate-pulse">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-xl mr-4" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <FileIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có tệp nào</h3>
        <p className="text-gray-500 text-center max-w-sm">Tải lên tệp đầu tiên của bạn để bắt đầu quản lý và chia sẻ</p>
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 p-2">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mimeType);
        const iconColor = getFileIconColor(file.mimeType);
        const isImage = file.mimeType.startsWith('image/');
        
        return (
          <div key={file.id} className="group relative">
            <Link href={`/file/${file.id}`}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-xl rounded-3xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {/* Thumbnail/Preview Area */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
                  {/* Thumbnail/Preview Area */}
                  <div className="relative w-full aspect-square bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <ImagePreview 
                        fileId={file.id}
                        fileName={file.originalName}
                        IconComponent={IconComponent}
                        iconColor={iconColor}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/70 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <IconComponent className={`h-8 w-8 sm:h-10 sm:w-10 ${iconColor}`} />
                      </div>
                    )}
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg backdrop-blur-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onShare && onShare(file);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg backdrop-blur-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600 rounded-full shadow-lg backdrop-blur-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 font-medium">
                          {formatFileSizeFunc(file.fileSize)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3 p-2">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mimeType);
        const iconColor = getFileIconColor(file.mimeType);
        const isImage = file.mimeType.startsWith('image/');
        
        return (
          <Link key={file.id} href={`/file/${file.id}`}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                {/* Thumbnail */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
                {/* Thumbnail */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
                  {isImage ? (
                    <ImagePreview 
                      fileId={file.id}
                      fileName={file.originalName}
                      IconComponent={IconComponent}
                      iconColor={iconColor}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/70 rounded-lg flex items-center justify-center">
                      <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 truncate">
                    {file.originalName}
                  </h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 space-x-4">
                    <span className="font-medium">{formatFileSizeFunc(file.fileSize)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onShare && onShare(file);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* View Toggle */}
      {showViewToggle && onViewModeChange && (
        <div className="flex items-center justify-end mb-4 px-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-md border border-gray-200">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-600'}`}
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Lưới
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-600'}`}
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Danh sách
            </Button>
          </div>
        </div>
      )}
      
      {/* Render based on view mode */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
}
