import React from 'react';
import { Trash2, ArrowLeft, RotateCcw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TrashPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trashFiles, isLoading } = useQuery({
    queryKey: [`/api/trash/${user?.id}`],
    enabled: !!user?.id,
  });

  const restoreFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trash/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/files/${user?.id}`] });
      toast({
        title: "Khôi phục thành công",
        description: "Tệp đã được khôi phục từ thùng rác",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi khôi phục",
        description: "Không thể khôi phục tệp từ thùng rác",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}/permanent`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to permanently delete file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trash/${user?.id}`] });
      toast({
        title: "Xóa vĩnh viễn thành công",
        description: "Tệp đã được xóa vĩnh viễn khỏi hệ thống",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi xóa vĩnh viễn",
        description: "Không thể xóa vĩnh viễn tệp",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📁';
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const threeDaysLater = new Date(deletedDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((threeDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 px-2 sm:px-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary hover:bg-gray-100/80 p-2 flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Thùng rác</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">Các tệp và thư mục đã xóa</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 mx-2 sm:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Mục đã xóa</span>
            </CardTitle>
            <CardDescription>
              Các tệp sẽ tự động xóa vĩnh viễn sau 3 ngày
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-4">Đang tải thùng rác...</p>
              </div>
            ) : !(trashFiles as any)?.files?.length ? (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Thùng rác trống</p>
                <p className="text-sm text-gray-400 mt-2">
                  Các tệp đã xóa sẽ xuất hiện ở đây và tự động xóa sau 3 ngày
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(trashFiles as any).files.map((file: any) => {
                  const daysRemaining = getDaysRemaining(file.deletedAt);
                  return (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200/50 space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{file.originalName}</h3>
                          <p className="text-sm text-gray-600">
                            Đã xóa {formatDistanceToNow(new Date(file.deletedAt), { 
                              addSuffix: true, 
                              locale: vi 
                            })}
                          </p>
                          <p className="text-xs text-red-600">
                            {daysRemaining > 0 
                              ? `Xóa vĩnh viễn sau ${daysRemaining} ngày`
                              : 'Sẽ xóa vĩnh viễn sớm'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 sm:ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreFileMutation.mutate(file.id)}
                          disabled={restoreFileMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Khôi phục</span>
                          <span className="sm:hidden">Khôi phục</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => permanentDeleteMutation.mutate(file.id)}
                          disabled={permanentDeleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Xóa vĩnh viễn</span>
                          <span className="sm:hidden">Xóa</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}