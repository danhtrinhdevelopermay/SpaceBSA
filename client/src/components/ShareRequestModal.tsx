import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, User } from 'lucide-react';

interface ShareRequest {
  shareId: number;
  fileName: string;
  senderName: string;
  permission: string;
  message: string;
}

interface ShareRequestModalProps {
  requests: ShareRequest[];
  onAccept: (shareId: number, shareData: ShareRequest) => void;
  onReject: (shareId: number, shareData: ShareRequest) => void;
}

export default function ShareRequestModal({ requests, onAccept, onReject }: ShareRequestModalProps) {
  if (requests.length === 0) return null;

  return (
    <Dialog open={requests.length > 0} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-[calc(100vw-30px)] sm:max-w-md max-h-[calc(100vh-30px)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Yêu cầu chia sẻ file</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {requests.map((request) => (
            <Card key={request.shareId} className="border-2 border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* File and Sender Info */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{request.fileName}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <User className="w-3 h-3" />
                        <span>{request.senderName}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                    </div>
                  </div>

                  {/* Permission */}
                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Quyền: {
                      request.permission === 'view' ? 'Chỉ xem' :
                      request.permission === 'edit' ? 'Chỉnh sửa' :
                      request.permission === 'download' ? 'Tải xuống' : request.permission
                    }
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onAccept(request.shareId, request)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      Chấp nhận
                    </Button>
                    <Button
                      onClick={() => onReject(request.shareId, request)}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}