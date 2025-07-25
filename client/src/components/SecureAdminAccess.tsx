import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecureAdminAccessProps {
  onAccessGranted: () => void;
}

const ADMIN_SECRET_KEY = "SpaceBSA_Admin_2025_Secure_Access_1337";

export default function SecureAdminAccess({ onAccessGranted }: SecureAdminAccessProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is temporarily blocked
    const blockedUntil = localStorage.getItem('admin_blocked_until');
    if (blockedUntil) {
      const blockEndTime = parseInt(blockedUntil);
      const now = Date.now();
      if (now < blockEndTime) {
        setIsBlocked(true);
        setBlockTime(Math.ceil((blockEndTime - now) / 1000));
        
        const interval = setInterval(() => {
          const remaining = Math.ceil((blockEndTime - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsBlocked(false);
            setBlockTime(0);
            localStorage.removeItem('admin_blocked_until');
            clearInterval(interval);
          } else {
            setBlockTime(remaining);
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('admin_blocked_until');
      }
    }

    // Get current attempts
    const currentAttempts = parseInt(localStorage.getItem('admin_attempts') || '0');
    setAttempts(currentAttempts);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Truy cập bị chặn",
        description: `Vui lòng chờ ${blockTime} giây trước khi thử lại.`,
        variant: "destructive",
      });
      return;
    }

    if (password === ADMIN_SECRET_KEY) {
      // Success - reset attempts and grant access
      localStorage.removeItem('admin_attempts');
      localStorage.removeItem('admin_blocked_until');
      localStorage.setItem('admin_access_granted', Date.now().toString());
      toast({
        title: "Truy cập thành công",
        description: "Chào mừng đến với Admin Console!",
      });
      onAccessGranted();
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('admin_attempts', newAttempts.toString());

      if (newAttempts >= 3) {
        // Block access for 5 minutes
        const blockUntil = Date.now() + (5 * 60 * 1000);
        localStorage.setItem('admin_blocked_until', blockUntil.toString());
        setIsBlocked(true);
        setBlockTime(300);
        
        toast({
          title: "Truy cập bị chặn",
          description: "Quá nhiều lần thử sai. Truy cập bị chặn trong 5 phút.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Mật khẩu không đúng",
          description: `Còn lại ${3 - newAttempts} lần thử.`,
          variant: "destructive",
        });
      }
      setPassword('');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/logo-blurred-bg.png')] bg-center bg-cover opacity-10"></div>
      
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-purple-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-purple-500/20 border border-purple-500/30">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-purple-400" />
            Admin Console
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Trang quản trị bảo mật - Chỉ dành cho quản trị viên
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isBlocked ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-red-400 font-medium">Truy cập bị chặn</p>
                <p className="text-red-300 text-sm mt-1">
                  Thời gian còn lại: {formatTime(blockTime)}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Mật khẩu quản trị
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu bí mật..."
                    className="bg-black/50 border-purple-500/30 text-white placeholder-gray-400 pr-10"
                    disabled={isBlocked}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {attempts > 0 && (
                <div className="text-center">
                  <p className="text-yellow-400 text-sm">
                    Số lần thử sai: {attempts}/3
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                disabled={isBlocked || !password.trim()}
              >
                Truy cập Admin Console
              </Button>
            </form>
          )}

          <div className="border-t border-purple-500/30 pt-4">
            <p className="text-xs text-gray-400 text-center">
              ⚠️ Trang này được bảo vệ bởi hệ thống bảo mật cao cấp
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}