import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ToastContainer';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Sparkles, Zap, Heart, Gift } from 'lucide-react';

export default function AlertShowcase() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<'default' | 'destructive' | 'success' | 'warning'>('default');

  const handleToastDemo = (type: string) => {
    switch (type) {
      case 'success':
        showSuccess(
          "Thành công rồi! 🎉", 
          "File của bạn đã được tải lên thành công và sẵn sàng để chia sẻ."
        );
        break;
      case 'error':
        showError(
          "Có lỗi xảy ra", 
          "Không thể tải file lên. Vui lòng kiểm tra kết nối mạng và thử lại."
        );
        break;
      case 'warning':
        showWarning(
          "Cảnh báo dung lượng", 
          "Bạn đã sử dụng 85% dung lượng. Hãy xóa một số file không cần thiết."
        );
        break;
      case 'info':
        showInfo(
          "Thông tin mới", 
          "SpaceBSA vừa được cập nhật với nhiều tính năng mới. Khám phá ngay!"
        );
        break;
    }
  };

  const openConfirmDialog = (type: 'default' | 'destructive' | 'success' | 'warning') => {
    setConfirmType(type);
    setShowConfirm(true);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Hệ thống Alert đẹp mắt
        </h1>
        <p className="text-gray-600 text-lg">
          Demo các loại thông báo và cảnh báo với hiệu ứng đẹp
        </p>
      </div>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span>Toast Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => handleToastDemo('success')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Thành công
            </Button>
            <Button
              onClick={() => handleToastDemo('error')}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Lỗi
            </Button>
            <Button
              onClick={() => handleToastDemo('warning')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Cảnh báo
            </Button>
            <Button
              onClick={() => handleToastDemo('info')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Thông tin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inline Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Inline Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success" dismissible>
            <AlertTitle>Tải file thành công!</AlertTitle>
            <AlertDescription>
              Hình ảnh "vacation-photo.jpg" đã được tải lên thành công và có thể chia sẻ ngay.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive" dismissible>
            <AlertTitle>Không thể xóa file</AlertTitle>
            <AlertDescription>
              File này đang được chia sẻ với người khác. Vui lòng hủy chia sẻ trước khi xóa.
            </AlertDescription>
          </Alert>

          <Alert variant="warning" dismissible>
            <AlertTitle>Dung lượng sắp hết</AlertTitle>
            <AlertDescription>
              Bạn đã sử dụng 90% dung lượng (9GB/10GB). Hãy dọn dẹp để tránh gián đoạn dịch vụ.
            </AlertDescription>
          </Alert>

          <Alert variant="info" dismissible>
            <AlertTitle>Tính năng mới có sẵn</AlertTitle>
            <AlertDescription>
              Giờ bạn có thể tạo folder để tổ chức file tốt hơn. Thử ngay tính năng này!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Confirm Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>Confirm Dialogs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => openConfirmDialog('default')}
            >
              Mặc định
            </Button>
            <Button
              variant="outline"
              onClick={() => openConfirmDialog('destructive')}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Xóa file
            </Button>
            <Button
              variant="outline"
              onClick={() => openConfirmDialog('success')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Hoàn thành
            </Button>
            <Button
              variant="outline"
              onClick={() => openConfirmDialog('warning')}
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            >
              Cảnh báo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Animated Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <span>Tổng hợp hiệu ứng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              // Show multiple notifications in sequence
              setTimeout(() => showInfo("Bắt đầu quá trình...", "Đang chuẩn bị tải file lên"), 100);
              setTimeout(() => showWarning("Đang xử lý...", "Vui lòng đợi trong giây lát"), 1500);
              setTimeout(() => showSuccess("Hoàn tất!", "Tất cả file đã được xử lý thành công"), 3000);
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
          >
            Demo chuỗi thông báo 🎭
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          showSuccess("Đã xác nhận!", "Hành động đã được thực hiện thành công.");
        }}
        title={
          confirmType === 'destructive' ? "Xóa file vĩnh viễn?" :
          confirmType === 'success' ? "Hoàn thành tác vụ?" :
          confirmType === 'warning' ? "Cảnh báo quan trọng" :
          "Xác nhận hành động"
        }
        description={
          confirmType === 'destructive' ? "File này sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?" :
          confirmType === 'success' ? "Bạn đã hoàn thành tác vụ này. Tiếp tục để lưu thay đổi." :
          confirmType === 'warning' ? "Hành động này có thể ảnh hưởng đến dữ liệu của bạn. Vui lòng cân nhắc kỹ trước khi quyết định." :
          "Bạn có chắc chắn muốn thực hiện hành động này không?"
        }
        variant={confirmType}
        icon={
          confirmType === 'destructive' ? 'delete' :
          confirmType === 'success' ? 'success' :
          confirmType === 'warning' ? 'warning' :
          'info'
        }
        confirmText={
          confirmType === 'destructive' ? "Xóa vĩnh viễn" :
          confirmType === 'success' ? "Hoàn thành" :
          "Xác nhận"
        }
      />
    </div>
  );
}