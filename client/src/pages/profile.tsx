import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  FileText, 
  Upload, 
  Share2, 
  Clock, 
  HardDrive, 
  Calendar,
  Download,
  Folder,
  Trash2,
  Star,
  Activity,
  Settings,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UserStats {
  totalFiles: number;
  totalFolders: number;
  totalStorageUsed: number;
  storageLimit: number;
  totalShares: number;
  totalDownloads: number;
  filesInTrash: number;
  recentActivity: {
    action: string;
    fileName: string;
    timestamp: string;
    type: 'upload' | 'share' | 'download' | 'delete' | 'restore';
  }[];
  filesByType: {
    images: number;
    documents: number;
    videos: number;
    music: number;
    others: number;
  };
  joinedDate: string;
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: statsData, isLoading } = useQuery<{ stats: UserStats }>({
    queryKey: [`/api/user/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const stats = statsData?.stats;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.totalStorageUsed / stats.storageLimit) * 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'share': return <Share2 className="h-4 w-4 text-green-500" />;
      case 'download': return <Download className="h-4 w-4 text-purple-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'restore': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (action: string) => {
    switch (action) {
      case 'upload': return 'Đã tải lên';
      case 'share': return 'Đã chia sẻ';
      case 'download': return 'Đã tải xuống';
      case 'delete': return 'Đã xóa';
      case 'restore': return 'Đã khôi phục';
      default: return action;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-300 rounded-2xl"></div>
              <div className="md:col-span-2 h-64 bg-gray-300 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải thông tin hồ sơ</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ người dùng</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi hoạt động của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card className="enhanced-card">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <CardTitle className="text-xl">{user.displayName}</CardTitle>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <Badge variant="secondary" className="mt-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  Tham gia {formatDistanceToNow(new Date(stats.joinedDate), { 
                    addSuffix: true, 
                    locale: vi 
                  })}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Storage Usage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Dung lượng sử dụng</span>
                    <span className="text-sm text-gray-600">{getStoragePercentage()}%</span>
                  </div>
                  <Progress value={getStoragePercentage()} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(stats.totalStorageUsed)} / {formatFileSize(stats.storageLimit)}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt tài khoản
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                  <p className="text-sm text-gray-600">Tệp tin</p>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <Folder className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
                  <p className="text-sm text-gray-600">Thư mục</p>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <Share2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalShares}</p>
                  <p className="text-sm text-gray-600">Chia sẻ</p>
                </CardContent>
              </Card>

              <Card className="enhanced-card">
                <CardContent className="p-4 text-center">
                  <Download className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
                  <p className="text-sm text-gray-600">Tải xuống</p>
                </CardContent>
              </Card>
            </div>

            {/* File Types Distribution */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Phân bổ loại tệp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <p className="font-semibold">{stats.filesByType.images}</p>
                    <p className="text-xs text-gray-600">Hình ảnh</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="font-semibold">{stats.filesByType.documents}</p>
                    <p className="text-xs text-gray-600">Tài liệu</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">🎥</span>
                    </div>
                    <p className="font-semibold">{stats.filesByType.videos}</p>
                    <p className="text-xs text-gray-600">Video</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <p className="font-semibold">{stats.filesByType.music}</p>
                    <p className="text-xs text-gray-600">Âm nhạc</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">📁</span>
                    </div>
                    <p className="font-semibold">{stats.filesByType.others}</p>
                    <p className="text-xs text-gray-600">Khác</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có hoạt động nào</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {getActivityText(activity.action)} <span className="font-normal">{activity.fileName}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { 
                              addSuffix: true, 
                              locale: vi 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}