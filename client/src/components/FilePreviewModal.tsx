import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { File } from '@shared/schema';
import { Download, Share2, X } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onDownload: (file: File) => void;
  onShare: (file: File) => void;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  onShare,
}: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType.includes('pdf');
  const isText = file.mimeType.startsWith('text/') || file.mimeType.includes('json');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    const fileUrl = `/api/files/download/${file.id}`;

    if (isImage) {
      return (
        <div className="flex justify-center max-h-[50vh] sm:max-h-[60vh] overflow-auto">
          <img
            src={fileUrl}
            alt={file.originalName}
            className="max-w-full h-auto rounded-lg object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'block';
              }
            }}
          />
          <div style={{ display: 'none' }} className="text-center py-8">
            <p className="text-gray-500">Không thể xem trước hình ảnh này</p>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex justify-center">
          <video
            controls
            className="max-w-full max-h-[50vh] sm:max-h-[60vh] rounded-lg"
          >
            <source src={fileUrl} type={file.mimeType} />
            Trình duyệt của bạn không hỗ trợ thẻ video.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex justify-center py-8">
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} type={file.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="flex justify-center h-[60vh]">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded-lg"
            title={file.originalName}
          />
        </div>
      );
    }

    // For other file types, show file info
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{file.originalName}</h3>
        <p className="text-gray-500 mb-4">
          {formatFileSize(file.fileSize)} • {file.mimeType}
        </p>
        <p className="text-gray-500">
          Preview not available for this file type
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="enhanced-card w-full max-w-[calc(100vw-30px)] sm:max-w-4xl max-h-[calc(100vh-30px)] overflow-y-auto p-2 sm:p-6 border-0 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-2 text-sm sm:text-base">{file.originalName}</DialogTitle>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(file)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-space-pink">
            {formatFileSize(file.fileSize)} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
          </div>
        </DialogHeader>

        <div className="mt-4 modal-content-scroll">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}