import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { File } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileText, Copy } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  userId: number;
}

export default function ShareModal({ isOpen, onClose, file, userId }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [linkSharingEnabled, setLinkSharingEnabled] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!file || !email.trim()) return;

    setLoading(true);
    try {
      const shareData = {
        fileId: file.id,
        sharedBy: userId,
        sharedWith: email,
        permission,
      };

      const response = await apiRequest('POST', '/api/files/share', shareData);
      const { share } = await response.json();
      
      if (linkSharingEnabled) {
        const link = `${window.location.origin}/share/${share.shareToken}`;
        setShareLink(link);
      }

      toast({
        title: "Chia sẻ tệp thành công",
        description: `${file.originalName} đã được chia sẻ với ${email}`,
      });

      setEmail('');
    } catch (error) {
      toast({
        title: "Chia sẻ thất bại",
        description: "Không thể chia sẻ tệp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Đã sao chép liên kết",
      description: "Liên kết chia sẻ đã được sao chép vào clipboard",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-30px)] sm:max-w-md max-h-[calc(100vh-30px)] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Chia sẻ tệp</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-red-500 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-text-dark">{file.originalName}</h4>
                  <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Chia sẻ với</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập địa chỉ email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="permission">Quyền truy cập</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Có thể xem</SelectItem>
                  <SelectItem value="edit">Có thể chỉnh sửa</SelectItem>
                  <SelectItem value="download">Có thể tải xuống</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link Sharing */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="link-sharing">Chia sẻ bằng liên kết</Label>
                <Switch
                  id="link-sharing"
                  checked={linkSharingEnabled}
                  onCheckedChange={setLinkSharingEnabled}
                />
              </div>
              
              {linkSharingEnabled && shareLink && (
                <div className="flex items-center space-x-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleShare} disabled={loading || !email.trim()}>
              {loading ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
