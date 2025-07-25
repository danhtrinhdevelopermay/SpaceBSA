import React, { useState } from 'react';
import { Settings, ArrowLeft, User, Shield, HardDrive, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [fileSharingEnabled, setFileSharingEnabled] = useState(true);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [shareNotificationsEnabled, setShareNotificationsEnabled] = useState(true);

  const handleSaveDisplayName = async () => {
    try {
      // In a real implementation, you would make an API call here
      toast({
        title: "Tên hiển thị đã được cập nhật",
        description: "Tên hiển thị của bạn đã được thay đổi thành công.",
      });
      setIsEditingName(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tên hiển thị. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleUpgradePlan = () => {
    toast({
      title: "Nâng cấp gói dung lượng",
      description: "Tính năng này sẽ sớm được triển khai. Cảm ơn bạn đã quan tâm!",
    });
  };

  const handleChangeProfilePicture = () => {
    toast({
      title: "Thay đổi ảnh đại diện",
      description: "Tính năng này sẽ sớm được triển khai.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary hover:bg-gray-100/80 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
              <p className="text-gray-600">Quản lý tài khoản và tùy chọn của bạn</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* Account Settings */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Cài đặt tài khoản</span>
              </CardTitle>
              <CardDescription>
                Quản lý thông tin tài khoản và tùy chọn của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Ảnh đại diện</h4>
                  <p className="text-sm text-gray-500">Cập nhật ảnh đại diện của bạn</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangeProfilePicture}>
                  Thay đổi
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">Tên hiển thị</h4>
                  {isEditingName ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nhập tên hiển thị mới"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSaveDisplayName}>
                        Lưu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingName(false);
                          setDisplayName(user?.displayName || '');
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {user?.displayName || user?.email || 'Chưa đặt tên hiển thị'}
                    </p>
                  )}
                </div>
                {!isEditingName && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingName(true)}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Bảo mật & Riêng tư</span>
              </CardTitle>
              <CardDescription>
                Kiểm soát cài đặt bảo mật và riêng tư của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Xác thực hai yếu tố</h4>
                  <p className="text-sm text-gray-500">Thêm lớp bảo mật bổ sung</p>
                </div>
                <Switch 
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    toast({
                      title: checked ? "Xác thực hai yếu tố đã bật" : "Xác thực hai yếu tố đã tắt",
                      description: checked 
                        ? "Tài khoản của bạn hiện được bảo vệ bằng xác thực hai yếu tố." 
                        : "Xác thực hai yếu tố đã được tắt.",
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Chia sẻ tệp</h4>
                  <p className="text-sm text-gray-500">Cho phép người khác chia sẻ tệp với bạn</p>
                </div>
                <Switch 
                  checked={fileSharingEnabled}
                  onCheckedChange={(checked) => {
                    setFileSharingEnabled(checked);
                    toast({
                      title: checked ? "Chia sẻ tệp đã bật" : "Chia sẻ tệp đã tắt",
                      description: checked 
                        ? "Bạn có thể nhận tệp được chia sẻ từ người khác." 
                        : "Bạn sẽ không nhận được tệp chia sẻ từ người khác.",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <span>Dung lượng</span>
              </CardTitle>
              <CardDescription>
                Quản lý việc sử dụng và cài đặt dung lượng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Tự động xóa tệp cũ</h4>
                  <p className="text-sm text-gray-500">Tự động xóa tệp sau 90 ngày trong thùng rác</p>
                </div>
                <Switch 
                  checked={autoDeleteEnabled}
                  onCheckedChange={(checked) => {
                    setAutoDeleteEnabled(checked);
                    toast({
                      title: checked ? "Tự động xóa đã bật" : "Tự động xóa đã tắt",
                      description: checked 
                        ? "Tệp sẽ tự động xóa sau 90 ngày trong thùng rác." 
                        : "Tệp sẽ không tự động xóa khỏi thùng rác.",
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Gói dung lượng</h4>
                  <p className="text-sm text-gray-500">Gói hiện tại: Miễn phí (10GB)</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleUpgradePlan}>
                  Nâng cấp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <span>Thông báo</span>
              </CardTitle>
              <CardDescription>
                Kiểm soát cách bạn nhận thông báo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Thông báo email</h4>
                  <p className="text-sm text-gray-500">Nhận cập nhật email về các tệp của bạn</p>
                </div>
                <Switch 
                  checked={emailNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setEmailNotificationsEnabled(checked);
                    toast({
                      title: checked ? "Thông báo email đã bật" : "Thông báo email đã tắt",
                      description: checked 
                        ? "Bạn sẽ nhận email thông báo về các tệp." 
                        : "Bạn sẽ không nhận email thông báo.",
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Thông báo chia sẻ tệp</h4>
                  <p className="text-sm text-gray-500">Nhận thông báo khi ai đó chia sẻ tệp với bạn</p>
                </div>
                <Switch 
                  checked={shareNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setShareNotificationsEnabled(checked);
                    toast({
                      title: checked ? "Thông báo chia sẻ đã bật" : "Thông báo chia sẻ đã tắt",
                      description: checked 
                        ? "Bạn sẽ nhận thông báo khi có tệp được chia sẻ." 
                        : "Bạn sẽ không nhận thông báo chia sẻ tệp.",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}