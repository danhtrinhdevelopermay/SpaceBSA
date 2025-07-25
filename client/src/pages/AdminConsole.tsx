import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Activity, Database, HardDrive, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureAdminAccess from '@/components/SecureAdminAccess';

interface CloudinaryProvider {
  id: string;
  name: string;
  cloudName: string;
  priority: number;
  isActive: boolean;
  maxStorage: number;
  usedStorage: number;
  availableStorage: number;
  utilization: string;
  status: 'active' | 'inactive' | 'error';
  error?: string;
  lastChecked: string;
}

interface CloudinaryStatus {
  status: string;
  summary: {
    totalProviders: number;
    activeProviders: number;
    currentProvider: string;
    totalStorage: string;
    totalUsed: string;
    totalAvailable: string;
    overallUtilization: string;
  };
  providers: CloudinaryProvider[];
  timestamp: string;
}

interface CacheStats {
  status: string;
  cache: {
    enabled: boolean;
    currentSize: string;
    maxSize: string;
    utilization: string;
    totalFiles: number;
    config: {
      enabled: boolean;
      maxCacheSize: number;
      cacheDuration: number;
      cacheDir: string;
    };
  };
  timestamp: string;
}

export default function AdminConsole() {
  const [hasAccess, setHasAccess] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<CloudinaryStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user already has access (session-based)
  useEffect(() => {
    const accessGranted = localStorage.getItem('admin_access_granted');
    if (accessGranted) {
      const grantedTime = parseInt(accessGranted);
      const now = Date.now();
      // Access expires after 2 hours
      if (now - grantedTime < 2 * 60 * 60 * 1000) {
        setHasAccess(true);
      } else {
        localStorage.removeItem('admin_access_granted');
      }
    }
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      const [cloudinaryRes, cacheRes] = await Promise.all([
        fetch('/api/admin/cloudinary/status'),
        fetch('/api/cache/stats')
      ]);

      if (cloudinaryRes.ok) {
        const cloudinaryData = await cloudinaryRes.json();
        setCloudinaryStatus(cloudinaryData);
      }

      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        setCacheStats(cacheData);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin trạng thái",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const switchProvider = async (providerId: string) => {
    try {
      setSwitching(providerId);
      
      const response = await fetch(`/api/admin/cloudinary/switch/${providerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã chuyển sang ${data.currentProvider}`,
        });
        await fetchStatus(); // Refresh data
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể chuyển provider",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi chuyển provider",
        variant: "destructive"
      });
    } finally {
      setSwitching(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <Activity className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Hoạt động</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Không hoạt động</Badge>;
      case 'error':
        return <Badge variant="destructive">Lỗi</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [hasAccess]);

  // Show secure access screen if not authenticated
  if (!hasAccess) {
    return <SecureAdminAccess onAccessGranted={() => setHasAccess(true)} />;
  }

  if (loading && !cloudinaryStatus) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Đang tải console quản trị...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Console Quản Trị
          </h1>
          <p className="text-gray-600 mt-2">Giám sát hệ thống Cloudinary và Cache</p>
        </div>
        <Button 
          onClick={fetchStatus} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      {cloudinaryStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Providers</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cloudinaryStatus.summary.totalProviders}</div>
              <p className="text-xs text-gray-600">
                {cloudinaryStatus.summary.activeProviders} đang hoạt động
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Provider Hiện Tại</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">
                {cloudinaryStatus.summary.currentProvider}
              </div>
              <p className="text-xs text-gray-600">Đang được sử dụng</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cloudinaryStatus.summary.totalStorage}</div>
              <p className="text-xs text-gray-600">
                Đã dùng: {cloudinaryStatus.summary.totalUsed}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sử Dụng Tổng</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cloudinaryStatus.summary.overallUtilization}%</div>
              <Progress 
                value={parseFloat(cloudinaryStatus.summary.overallUtilization)} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Stats */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              Thống Kê Cache Bandwidth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <p className="text-lg font-bold text-green-600">
                  {cacheStats.cache.enabled ? 'Đang hoạt động' : 'Tắt'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kích thước hiện tại</p>
                <p className="text-lg font-bold">{cacheStats.cache.currentSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số files cached</p>
                <p className="text-lg font-bold">{cacheStats.cache.totalFiles}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sử dụng cache</p>
                <p className="text-lg font-bold">{cacheStats.cache.utilization}</p>
                <Progress 
                  value={parseFloat(cacheStats.cache.utilization.replace('%', ''))} 
                  className="mt-1" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloudinary Providers */}
      {cloudinaryStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Chi Tiết Cloudinary Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cloudinaryStatus.providers.map((provider) => (
                <div 
                  key={provider.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(provider.status)}
                      <div>
                        <h3 className="font-semibold text-lg">{provider.name}</h3>
                        <p className="text-sm text-gray-600">
                          Cloud: {provider.cloudName} | Priority: {provider.priority}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(provider.status)}
                      {provider.status === 'active' ? (
                        <Badge variant="outline" className="bg-blue-50">Đang dùng</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => switchProvider(provider.id)}
                          disabled={switching === provider.id}
                        >
                          {switching === provider.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            'Chuyển sang'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Storage tối đa</p>
                      <p className="font-semibold">{provider.maxStorage}MB</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Đã sử dụng</p>
                      <p className="font-semibold">{provider.usedStorage.toFixed(2)}MB</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Còn lại</p>
                      <p className="font-semibold">{provider.availableStorage.toFixed(2)}MB</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sử dụng</p>
                      <p className="font-semibold">{provider.utilization}%</p>
                    </div>
                  </div>

                  <Progress 
                    value={parseFloat(provider.utilization)} 
                    className="h-2"
                  />

                  {provider.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Lỗi: {provider.error}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Kiểm tra lần cuối: {new Date(provider.lastChecked).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        Tự động làm mới mỗi 30 giây | Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
      </div>
    </div>
  );
}