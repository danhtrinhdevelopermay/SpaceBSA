import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, FileText, User, Check, X } from 'lucide-react';

interface ShareRequest {
  shareId: number;
  fileName: string;
  senderName: string;
  permission: string;
  message: string;
}

interface NotificationBellProps {
  requests: ShareRequest[];
  onAccept: (shareId: number, shareData: ShareRequest) => void;
  onReject: (shareId: number, shareData: ShareRequest) => void;
}

export default function NotificationBell({ requests, onAccept, onReject }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (requests.length === 0) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {requests.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Yêu cầu chia sẻ file</h3>
          <p className="text-sm text-gray-600">{requests.length} yêu cầu đang chờ</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {requests.map((request) => (
            <Card key={request.shareId} className="m-3 border-blue-100">
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{request.fileName}</h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span>{request.senderName}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{request.message}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Quyền: {
                      request.permission === 'view' ? 'Chỉ xem' :
                      request.permission === 'edit' ? 'Chỉnh sửa' :
                      request.permission === 'download' ? 'Tải xuống' : request.permission
                    }
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        onAccept(request.shareId, request);
                        setIsOpen(false);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Chấp nhận
                    </Button>
                    <Button
                      onClick={() => {
                        onReject(request.shareId, request);
                        setIsOpen(false);
                      }}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}