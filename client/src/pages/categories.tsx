import React from 'react';
import { Image, FileText, Video, Music, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { File } from '@shared/schema';
import FileGrid from '@/components/FileGrid';

const categoryConfig = {
  images: {
    icon: Image,
    title: 'Hình ảnh',
    description: 'Ảnh, đồ họa và tệp hình ảnh',
    color: 'from-green-500 to-emerald-600',
    textColor: 'text-green-600'
  },
  documents: {
    icon: FileText,
    title: 'Tài liệu',
    description: 'PDF, tệp văn bản và tài liệu',
    color: 'from-blue-500 to-cyan-600',
    textColor: 'text-blue-600'
  },
  videos: {
    icon: Video,
    title: 'Video',
    description: 'Phim, clip và tệp video',
    color: 'from-purple-500 to-pink-600',
    textColor: 'text-purple-600'
  },
  music: {
    icon: Music,
    title: 'Âm nhạc',
    description: 'Tệp âm thanh và nhạc',
    color: 'from-red-500 to-orange-600',
    textColor: 'text-red-600'
  }
};

export default function CategoryPage() {
  const { user } = useAuth();
  const params = useParams();
  const category = params.category as keyof typeof categoryConfig;
  const config = categoryConfig[category];

  const { data: filesData, isLoading } = useQuery<{ files: File[] }>({
    queryKey: ['/api/files', user?.id],
    enabled: !!user?.id,
  });

  const files = filesData?.files || [];

  // Filter files by category
  const filteredFiles = files.filter(file => {
    switch (category) {
      case 'images':
        return file.mimeType.startsWith('image/');
      case 'documents':
        return file.mimeType.includes('pdf') || 
               file.mimeType.includes('document') ||
               file.mimeType.includes('text') ||
               file.mimeType.includes('spreadsheet') ||
               file.mimeType.includes('presentation');
      case 'videos':
        return file.mimeType.startsWith('video/');
      case 'music':
        return file.mimeType.startsWith('audio/');
      default:
        return false;
    }
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-700 hover:text-primary hover:bg-gray-100/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

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
            <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2`}>
              <Icon className={`h-5 w-5 ${config.textColor}`} />
              <span>{config.title} Library</span>
            </CardTitle>
            <CardDescription>
              All your {config.title.toLowerCase()} files in one place ({filteredFiles.length} files)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredFiles.length > 0 ? (
              <FileGrid 
                files={filteredFiles}
                viewMode="grid"
                onPreview={() => {}}
                onShare={() => {}}
                onDownload={() => {}}
              />
            ) : (
              <div className="text-center py-12">
                <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No {config.title.toLowerCase()} found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload some {config.title.toLowerCase()} to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}