import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { File } from '@shared/schema';
import FileGrid from '@/components/FileGrid';

export default function RecentPage() {
  const { user } = useAuth();

  const { data: filesData, isLoading } = useQuery<{ files: File[] }>({
    queryKey: ['/api/files', user?.id],
    enabled: !!user?.id,
  });

  const files = filesData?.files || [];
  
  // Sort by creation date and take the most recent 20 files
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

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
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tệp gần đây</h1>
              <p className="text-gray-600">Các tệp được truy cập và tải lên gần đây</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Hoạt động gần đây</span>
            </CardTitle>
            <CardDescription>
              Các tệp được truy cập gần đây trong 30 ngày qua
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentFiles.length > 0 ? (
              <FileGrid 
                files={recentFiles}
                viewMode="grid"
                onPreview={() => {}}
                onShare={() => {}}
                onDownload={() => {}}
              />
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có hoạt động gần đây</p>
                <p className="text-sm text-gray-400 mt-2">
                  Các tệp bạn truy cập sẽ xuất hiện ở đây để truy cập nhanh
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}