import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import SEOHead from '@/components/SEOHead';
import { Cloud, Eye, EyeOff, Mail, Lock, User, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        showSuccess(
          "Chào mừng trở lại!",
          "Bạn đã đăng nhập thành công vào SpaceBSA."
        );
      } else {
        if (password !== confirmPassword) {
          throw new Error("Mật khẩu không khớp");
        }
        await signUp(email, password, displayName);
        showSuccess(
          "Tài khoản đã được tạo!",
          "Chào mừng bạn đến với SpaceBSA. Hãy bắt đầu khám phá!"
        );
      }
    } catch (error: any) {
      showError(
        "Xác thực thất bại",
        error.message || "Vui lòng kiểm tra thông tin đăng nhập và thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title={isLogin ? "Đăng nhập - SpaceBSA" : "Đăng ký - SpaceBSA"}
        description={isLogin 
          ? "Đăng nhập vào tài khoản SpaceBSA để truy cập files và dịch vụ lưu trữ đám mây miễn phí của bạn với bảo mật cao."
          : "Tạo tài khoản SpaceBSA miễn phí để bắt đầu sử dụng dịch vụ chia sẻ file và lưu trữ đám mây với 1GB dung lượng hoàn toàn miễn phí."
        }
        keywords="đăng nhập, đăng ký, tài khoản, SpaceBSA, cloud storage, file sharing, miễn phí, bảo mật"
        canonical="/auth"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": isLogin ? "Đăng nhập SpaceBSA" : "Đăng ký SpaceBSA",
          "description": isLogin 
            ? "Đăng nhập vào SpaceBSA để quản lý files và lưu trữ đám mây"
            : "Tạo tài khoản miễn phí cho SpaceBSA - nền tảng chia sẻ file hiện đại",
          "url": "https://spacebsa.replit.app/auth"
        }}
      />
      <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 left-20 w-16 h-16 bg-pink-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-300/30 rounded-full blur-xl animate-bounce"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-blue-400/20 rounded-full animate-ping"></div>
        </div>
        <div className="absolute top-3/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div className="w-3 h-3 bg-purple-400/20 rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
          <div className="text-center text-white space-y-8">
            {/* Logo Animation */}
            <div className="relative">
              <div className="w-32 h-32 mx-auto relative">
                <img src="/logo.png" alt="SpaceBSA" className="w-full h-full object-contain animate-pulse" />
                <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* Brand Text */}
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                SpaceBSA
              </h1>
              <p className="text-xl text-blue-100 mt-4 max-w-md mx-auto leading-relaxed">
                Nền tảng chia sẻ và lưu trữ file đám mây hiện đại và bảo mật
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-3 text-blue-100">
                <Shield className="w-5 h-5 text-blue-300" />
                <span>Bảo mật tuyệt đối</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <Cloud className="w-5 h-5 text-blue-300" />
                <span>Lưu trữ không giới hạn</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <Sparkles className="w-5 h-5 text-blue-300" />
                <span>Chia sẻ dễ dàng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <img src="/logo.png" alt="SpaceBSA" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpaceBSA
              </h2>
            </div>

            {/* Auth Card */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {isLogin ? "Đăng nhập để tiếp tục" : "Tham gia cộng đồng SpaceBSA"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Display Name Field (Register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-gray-700 font-medium">
                        Họ và tên
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nhập họ và tên của bạn"
                          className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email của bạn"
                        className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? "Nhập mật khẩu của bạn" : "Tạo mật khẩu mới"}
                        className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field (Register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                        Xác nhận mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Xác nhận mật khẩu của bạn"
                          className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Toggle Login/Register */}
                <div className="text-center mt-8">
                  <p className="text-gray-600">
                    {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-200 underline"
                    >
                      {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}