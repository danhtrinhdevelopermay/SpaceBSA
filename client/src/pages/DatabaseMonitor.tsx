import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseStats {
  id: string;
  name: string;
  isActive: boolean;
  isHealthy: boolean;
  isPrimary: boolean;
  currentSizeMB: number;
  maxSizeMB: number;
  usagePercent: number;
  lastHealthCheck?: string;
  priority: number;
}

interface DatabaseMonitorResponse {
  databases: DatabaseStats[];
  timestamp: string;
  totalDatabases: number;
  healthyDatabases: number;
  primaryDatabase: string;
}

export default function DatabaseMonitor() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDbForm, setNewDbForm] = useState({
    name: "",
    connectionString: "",
    priority: 999,
    maxSizeMB: 500
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database stats
  const { data: monitorData, isLoading, refetch } = useQuery<DatabaseMonitorResponse>({
    queryKey: ["/api/database-admin/stats"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Add database mutation
  const addDatabaseMutation = useMutation({
    mutationFn: async (newDb: typeof newDbForm) => {
      const response = await fetch("/api/database-admin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDb),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Database đã được thêm thành công",
      });
      setShowAddForm(false);
      setNewDbForm({ name: "", connectionString: "", priority: 999, maxSizeMB: 500 });
      queryClient.invalidateQueries({ queryKey: ["/api/database-admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm database",
        variant: "destructive",
      });
    },
  });

  // Health check mutation
  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/database-admin/health-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hoàn thành",
        description: "Đã kiểm tra tình trạng tất cả databases",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/database-admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kiểm tra tình trạng database",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (db: DatabaseStats) => {
    if (!db.isActive) return <XCircle className="h-4 w-4 text-gray-400" />;
    if (db.isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (db: DatabaseStats) => {
    if (!db.isActive) return "secondary";
    if (db.isHealthy) return "default";
    return "destructive";
  };

  const getUsageColor = (usagePercent: number) => {
    if (usagePercent < 70) return "bg-green-500";
    if (usagePercent < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleAddDatabase = () => {
    if (!newDbForm.name || !newDbForm.connectionString) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    addDatabaseMutation.mutate(newDbForm);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Đang tải thông tin databases...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Database</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý hệ thống database phân tán
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => healthCheckMutation.mutate()}
            disabled={healthCheckMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${healthCheckMutation.isPending ? 'animate-spin' : ''}`} />
            Kiểm tra tình trạng
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Database
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {monitorData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng số Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitorData.totalDatabases}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database khỏe mạnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {monitorData.healthyDatabases}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database chính</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{monitorData.primaryDatabase}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cập nhật lần cuối</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(monitorData.timestamp).toLocaleString('vi-VN')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Database Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Thêm Database mới</CardTitle>
            <CardDescription>
              Thêm database PostgreSQL mới vào hệ thống dự phòng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dbName">Tên Database</Label>
                <Input
                  id="dbName"
                  value={newDbForm.name}
                  onChange={(e) => setNewDbForm({...newDbForm, name: e.target.value})}
                  placeholder="Ví dụ: Backup Database 3"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Input
                  id="priority"
                  type="number"
                  value={newDbForm.priority}
                  onChange={(e) => setNewDbForm({...newDbForm, priority: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="connectionString">Connection String</Label>
              <Input
                id="connectionString"
                value={newDbForm.connectionString}
                onChange={(e) => setNewDbForm({...newDbForm, connectionString: e.target.value})}
                placeholder="postgresql://user:password@host:port/database"
                type="password"
              />
            </div>
            
            <div>
              <Label htmlFor="maxSize">Giới hạn dung lượng (MB)</Label>
              <Input
                id="maxSize"
                type="number"
                value={newDbForm.maxSizeMB}
                onChange={(e) => setNewDbForm({...newDbForm, maxSizeMB: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAddDatabase}
                disabled={addDatabaseMutation.isPending}
              >
                {addDatabaseMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Thêm Database
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {monitorData?.databases.map((db) => (
          <Card key={db.id} className={db.isPrimary ? "border-blue-500 border-2" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <CardTitle className="text-lg">{db.name}</CardTitle>
                  {db.isPrimary && (
                    <Badge variant="default" className="bg-blue-500">
                      Chính
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(db)}
                  <Badge variant={getStatusColor(db) as any}>
                    {db.isActive ? (db.isHealthy ? "Khỏe mạnh" : "Lỗi") : "Tắt"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Storage Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Dung lượng sử dụng</span>
                  <span>{db.currentSizeMB}MB / {db.maxSizeMB}MB</span>
                </div>
                <Progress 
                  value={db.usagePercent} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {db.usagePercent}% đã sử dụng
                </div>
                
                {db.usagePercent > 90 && (
                  <div className="flex items-center gap-1 text-red-600 text-sm mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Cảnh báo: Gần đầy dung lượng</span>
                  </div>
                )}
              </div>
              
              {/* Database Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <div className="font-mono">{db.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Độ ưu tiên:</span>
                  <div>{db.priority}</div>
                </div>
              </div>
              
              {db.lastHealthCheck && (
                <div className="text-xs text-muted-foreground">
                  Kiểm tra lần cuối: {new Date(db.lastHealthCheck).toLocaleString('vi-VN')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}