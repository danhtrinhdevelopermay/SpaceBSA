import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Image, 
  Video, 
  Music, 
  File,
  Share2,
  ExternalLink,
  Clock,
  User,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingPet from '@/components/LoadingPet';

interface ShareData {
  file: {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    cloudUrl?: string;
    createdAt: string;
  };
  share: {
    id: number;
    permission: string;
    sharedBy: string;
    sharedWith: string;
    shareToken: string;
    status: string;
    expiresAt?: string;
    createdAt: string;
  };
  sharedByUser: {
    displayName: string;
    email: string;
  };
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-green-500" />;
  if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-red-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-purple-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getPermissionText(permission: string) {
  switch (permission) {
    case 'view': return 'Có thể xem';
    case 'edit': return 'Có thể chỉnh sửa';
    case 'download': return 'Có thể tải xuống';
    default: return permission;
  }
}

function getPermissionColor(permission: string) {
  switch (permission) {
    case 'view': return 'bg-blue-100 text-blue-800';
    case 'edit': return 'bg-orange-100 text-orange-800';
    case 'download': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function ShareLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [downloading, setDownloading] = useState(false);

  const { data: shareData, isLoading, error } = useQuery<ShareData>({
    queryKey: ['/api/share', token],
    queryFn: async () => {
      const response = await fetch(`/api/share/${token}`);
      if (!response.ok) {
        throw new Error('Share link not found or expired');
      }
      return response.json().then(data => data.shareData);
    },
    enabled: !!token,
  });

  const handleDownload = async () => {
    if (!shareData || shareData.share.permission === 'view') return;
    
    setDownloading(true);
    try {
      const response = await fetch(`/api/files/download/${shareData.file.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = shareData.file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleViewFile = () => {
    if (!shareData) return;
    window.open(`/api/files/download/${shareData.file.id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <LoadingPet />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-red-600">Liên kết không hợp lệ</CardTitle>
            <CardDescription>
              Liên kết chia sẻ này không tồn tại hoặc đã hết hạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setLocation('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = shareData.share.expiresAt && new Date(shareData.share.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">File được chia sẻ</h1>
          <p className="text-gray-600">
            {shareData.sharedByUser.displayName} đã chia sẻ một file với bạn
          </p>
        </div>

        {/* Status Alert */}
        {isExpired ? (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              Liên kết chia sẻ này đã hết hạn vào {format(new Date(shareData.share.expiresAt!), 'dd/MM/yyyy HH:mm', { locale: vi })}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Liên kết chia sẻ hợp lệ và có thể truy cập.
            </AlertDescription>
          </Alert>
        )}

        {/* File Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon(shareData.file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-semibold text-gray-800 truncate">
                  {shareData.file.originalName}
                </CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    {formatFileSize(shareData.file.fileSize)}
                  </span>
                  <Badge className={`text-xs ${getPermissionColor(shareData.share.permission)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getPermissionText(shareData.share.permission)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Chia sẻ bởi:</span>
                <span className="font-medium">{shareData.sharedByUser.displayName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Ngày chia sẻ:</span>
                <span className="font-medium">
                  {format(new Date(shareData.share.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
              {shareData.share.expiresAt && (
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Hết hạn:</span>
                  <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                    {format(new Date(shareData.share.expiresAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isExpired && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleViewFile}
              variant="outline"
              className="flex items-center space-x-2 h-12 px-6"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Xem file</span>
            </Button>
            
            {shareData.share.permission !== 'view' && (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center space-x-2 h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Download className="w-5 h-5" />
                <span>{downloading ? 'Đang tải...' : 'Tải xuống'}</span>
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Được tạo bởi <strong>SpaceBSA</strong> - Nền tảng chia sẻ file an toàn
          </p>
        </div>
      </div>
    </div>
  );
}