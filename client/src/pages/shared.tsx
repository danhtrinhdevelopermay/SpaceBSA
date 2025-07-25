import React from 'react';
import { Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { File } from '@shared/schema';
import FileGrid from '@/components/FileGrid';

export default function SharedPage() {
  const { user } = useAuth();

  const { data: filesData, isLoading } = useQuery<{ files: File[] }>({
    queryKey: ['/api/files', user?.id],
    enabled: !!user?.id,
  });

  const files = filesData?.files || [];
  // For now, we'll show all files as potentially shared
  // In a real implementation, you'd filter for actually shared files
  const sharedFiles = files;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary hover:bg-gray-100/80 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tệp được chia sẻ</h1>
              <p className="text-gray-600">Các tệp được chia sẻ với bạn và do bạn chia sẻ</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <span>Được chia sẻ với tôi</span>
              </CardTitle>
              <CardDescription>
                Các tệp mà người khác đã chia sẻ với bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có tệp nào được chia sẻ với bạn</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Khi ai đó chia sẻ tệp với bạn, chúng sẽ xuất hiện ở đây
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-purple-600" />
                <span>Do tôi chia sẻ</span>
              </CardTitle>
              <CardDescription>
                Các tệp bạn đã chia sẻ với người khác
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sharedFiles.length > 0 ? (
                <FileGrid 
                  files={sharedFiles}
                  viewMode="grid"
                  onPreview={() => {}}
                  onShare={() => {}}
                  onDownload={() => {}}
                />
              ) : (
                <div className="text-center py-12">
                  <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có tệp nào được chia sẻ</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Chia sẻ tệp từ bảng điều khiển để xem chúng ở đây
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}