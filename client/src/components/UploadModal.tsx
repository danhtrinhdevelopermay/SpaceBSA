import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CloudUpload, X, Check, FileText } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  userId: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onUploadComplete, 
  userId 
}: UploadModalProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Start uploads
    newUploadingFiles.forEach(uploadingFile => {
      uploadFile(uploadingFile);
    });
  };

  const uploadFile = async (uploadingFile: UploadingFile) => {
    const formData = new FormData();
    formData.append('file', uploadingFile.file);
    formData.append('userId', userId.toString());

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.id === uploadingFile.id 
                ? { ...uf, progress }
                : uf
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadingFiles(prev => 
            prev.map(uf => 
              uf.id === uploadingFile.id 
                ? { ...uf, status: 'completed', progress: 100 }
                : uf
            )
          );
          onUploadComplete();
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.id === uploadingFile.id 
              ? { ...uf, status: 'error' }
              : uf
          )
        );
      });

      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    } catch (error) {
      setUploadingFiles(prev => 
        prev.map(uf => 
          uf.id === uploadingFile.id 
            ? { ...uf, status: 'error' }
            : uf
        )
      );
      
      toast({
        title: "Tải lên thất bại",
        description: `Không thể tải lên ${uploadingFile.file.name}`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(uf => uf.id !== id));
  };

  const handleClose = () => {
    setUploadingFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg w-full max-w-[calc(100vw-30px)] max-h-[calc(100vh-30px)] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
            Tải lên tệp mới
          </DialogTitle>
          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Vui lòng chọn các tệp bạn muốn tải lên vào kho lưu trữ đám mây của mình. 
            Hãy đảm bảo bạn có quyền chia sẻ những tệp này.
          </p>
        </DialogHeader>
        
        <div className="space-y-6 modal-content-scroll px-2">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl py-8 px-6 text-center transition-all ${
              isDragOver 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* File Icons */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Background icons */}
                <div className="absolute -left-6 -top-2 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center transform rotate-12 opacity-70">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <span className="absolute top-1 right-1 text-xs font-bold text-purple-600">Aa</span>
                </div>
                <div className="absolute -right-6 -top-2 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center transform -rotate-12 opacity-70">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span className="absolute top-1 right-1 text-xs font-bold text-green-600">Aa</span>
                </div>
                
                {/* Main icon */}
                <div className="relative w-16 h-16 bg-sky-100 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-8 w-8 text-sky-600" />
                  <span className="absolute top-2 right-2 text-sm font-bold text-sky-600">Aa</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Kéo và thả tệp vào đây<br/>để tải lên
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Để có khả năng tương thích tốt nhất, hãy tải lên các định dạng<br/>
              JPG, PNG, PDF, DOCX hoặc các tệp phổ biến khác.
            </p>
            
            <Button 
              variant="outline" 
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 px-8 py-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Chọn tệp
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-900">Đang tải lên tệp...</h4>
              {uploadingFiles.map((uploadingFile) => (
                <div key={uploadingFile.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={uploadingFile.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500 min-w-0">
                        {uploadingFile.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {uploadingFile.status === 'completed' && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleClose} className="px-8 py-2">
              Hủy
            </Button>
            {uploadingFiles.length > 0 && uploadingFiles.every(f => f.status === 'completed') ? (
              <Button onClick={handleClose} className="px-8 py-2 bg-sky-500 hover:bg-sky-600">
                Tải lên hoàn tất
              </Button>
            ) : uploadingFiles.length > 0 ? (
              <Button disabled className="px-8 py-2 bg-sky-500">
                Đang tải lên...
              </Button>
            ) : (
              <Button 
                disabled 
                className="px-8 py-2 bg-sky-200 text-sky-700 cursor-not-allowed"
              >
                Tải lên tệp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
