import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Folder, FolderPlus, Home, ChevronRight, ArrowLeft } from 'lucide-react';
import { Folder as FolderType } from '@shared/schema';

interface FolderBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onSelectFolder?: (folderId: string | null) => void;
}

export default function FolderBrowserModal({
  isOpen,
  onClose,
  userId,
  onSelectFolder
}: FolderBrowserModalProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: foldersData, isLoading } = useQuery<{ folders: FolderType[] }>({
    queryKey: ['/api/folders', userId],
    enabled: !!userId && isOpen,
  });

  const folders = foldersData?.folders || [];
  
  // Filter folders to show only root level or children of current folder
  const currentFolders = folders.filter(folder => 
    folder.parentId === currentFolderId
  );

  // Get current folder breadcrumb
  const getCurrentFolder = (folderId: string | null): FolderType | null => {
    if (!folderId) return null;
    return folders.find(f => f.id === folderId) || null;
  };

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; userId: number; parentId?: string }) =>
      apiRequest('POST', '/api/folders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders', userId] });
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast({
        title: "Folder created",
        description: "New folder has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      userId,
      parentId: currentFolderId || undefined,
    });
  };

  const handleFolderDoubleClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleGoBack = () => {
    const currentFolder = getCurrentFolder(currentFolderId);
    setCurrentFolderId(currentFolder?.parentId || null);
  };

  const handleSelectFolder = () => {
    onSelectFolder?.(currentFolderId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-30px)] sm:max-w-3xl max-h-[calc(100vh-30px)] overflow-y-auto modal-glass-container shadow-2xl rounded-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-blue-600" />
            Quản lý thư mục
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 modal-content-scroll">
          {/* Breadcrumb */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center space-x-2 text-sm">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">/</span>
              {currentFolderId && (
                <>
                  <span className="font-medium text-gray-900">{getCurrentFolder(currentFolderId)?.name}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </>
              )}
              <span className="text-gray-500">{currentFolderId ? 'Thư mục con' : 'Thư mục gốc'}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentFolderId && (
                <Button variant="outline" size="sm" onClick={handleGoBack} className="hover:bg-blue-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              )}
            </div>
            
            <Button
              onClick={() => setIsCreatingFolder(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg backdrop-blur-sm border border-white/20 rounded-xl"
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Tạo thư mục mới
            </Button>
          </div>

          {/* Create folder input */}
          {isCreatingFolder && (
            <Card className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FolderPlus className="h-4 w-4 mr-2 text-blue-600" />
                  Tạo thư mục mới
                </h3>
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="Nhập tên thư mục..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    autoFocus
                    className="flex-1 border-gray-300/50 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm rounded-lg"
                  />
                  <Button 
                    onClick={handleCreateFolder} 
                    disabled={!newFolderName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg shadow-md"
                  >
                    Tạo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingFolder(false)}
                    className="hover:bg-gray-100 rounded-lg border-gray-300/50"
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folders list */}
          <div className="min-h-[300px] max-h-[350px] overflow-y-auto rounded-xl border border-gray-200/50 bg-white/30 backdrop-blur-sm shadow-inner">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Đang tải thư mục...</p>
                </div>
              </div>
            ) : currentFolders.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    {currentFolderId ? 'Thư mục này trống' : 'Chưa có thư mục nào'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Nhấn "Tạo thư mục mới" để bắt đầu
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {currentFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="hover:bg-blue-50/80 hover:border-blue-300/50 cursor-pointer transition-all duration-200 hover:shadow-lg bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-xl"
                    onDoubleClick={() => handleFolderDoubleClick(folder.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-200/30">
                          <Folder className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{folder.name}</h4>
                          <p className="text-sm text-gray-500">
                            Tạo ngày {new Date(folder.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Nhấp đúp vào thư mục để mở, hoặc chọn thư mục hiện tại
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="hover:bg-gray-100 rounded-lg border-gray-300/50 bg-white/80 backdrop-blur-sm">
                Hủy
              </Button>
              <Button 
                onClick={handleSelectFolder}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg backdrop-blur-sm border border-white/20"
              >
                Chọn {currentFolderId ? 'thư mục này' : 'thư mục gốc'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}