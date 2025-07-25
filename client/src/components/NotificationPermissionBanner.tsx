import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationPermissionBanner() {
  const { permission, requestPermission, isSupported } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check localStorage for dismissal state
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  // Don't show if notifications aren't supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || permission === 'denied' || isDismissed) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } catch (error) {
      console.error('Lỗi khi yêu cầu quyền thông báo:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  return (
    <Card className="m-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">
              Bật thông báo file được chia sẻ
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Cho phép SpaceBSA gửi thông báo khi có người chia sẻ file với bạn. 
              Thông báo sẽ hiển thị ngay cả khi bạn đang sử dụng ứng dụng khác.
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Cho phép thông báo
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Để sau
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}