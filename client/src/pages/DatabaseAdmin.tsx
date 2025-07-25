import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  Zap
} from "lucide-react";

interface DatabaseInfo {
  id: string;
  name: string;
  isActive: boolean;
  isHealthy: boolean;
  isPrimary: boolean;
  currentSizeMB: number;
  maxSizeMB: number;
  usagePercent: number;
  lastHealthCheck: string;
  priority: number;
}

interface DatabaseStatus {
  currentPrimary: string;
  databases: DatabaseInfo[];
  autoSwitchEnabled: boolean;
  lastAutoSwitch?: string;
}

export default function DatabaseAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch database status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['/api/database-admin/status'],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  // Manual database switch mutation
  const switchDatabaseMutation = useMutation({
    mutationFn: async (databaseId: string) => {
      const response = await fetch(`/api/database-admin/switch/${databaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to switch database');
      return response.json();
    },
    onSuccess: (data, databaseId) => {
      toast({
        title: "Database Switched",
        description: `Successfully switched to ${databaseId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database-admin/status'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Switch Failed", 
        description: error.message,
      });
    },
  });

  // Toggle auto-switch mutation
  const toggleAutoSwitchMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/database-admin/auto-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle auto-switch');
      return response.json();
    },
    onSuccess: (data, enabled) => {
      toast({
        title: enabled ? "Auto-Switch Enabled" : "Auto-Switch Disabled",
        description: enabled 
          ? "Database will automatically switch when capacity reaches 90%"
          : "Manual database switching only",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database-admin/status'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Toggle Failed",
        description: error.message,
      });
    },
  });

  const handleSwitchDatabase = (databaseId: string) => {
    if (databaseId === status?.currentPrimary) {
      toast({
        title: "Already Active",
        description: "This database is already the primary database",
      });
      return;
    }
    switchDatabaseMutation.mutate(databaseId);
  };

  const getStatusColor = (database: DatabaseInfo) => {
    if (!database.isHealthy) return "destructive";
    if (database.usagePercent >= 90) return "destructive";
    if (database.usagePercent >= 70) return "default";
    return "secondary";
  };

  const getStatusText = (database: DatabaseInfo) => {
    if (!database.isHealthy) return "Unhealthy";
    if (database.isPrimary) return "Primary";
    if (database.isActive) return "Active";
    return "Inactive";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Administration</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load database status. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Administration</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Auto Refresh</span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current Primary Database</div>
              <div className="text-xl font-semibold text-blue-600">
                {status?.currentPrimary?.toUpperCase() || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Auto-Switch Status</div>
              <div className="flex items-center gap-2">
                <Badge variant={status?.autoSwitchEnabled ? "default" : "secondary"}>
                  {status?.autoSwitchEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={status?.autoSwitchEnabled || false}
                  onCheckedChange={(enabled) => toggleAutoSwitchMutation.mutate(enabled)}
                  disabled={toggleAutoSwitchMutation.isPending}
                />
              </div>
            </div>
          </div>
          
          {status?.lastAutoSwitch && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Last automatic switch: {new Date(status.lastAutoSwitch).toLocaleString('vi-VN')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database List */}
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold mb-2">Database Instances</h2>
        
        {status?.databases?.map((database) => (
          <Card key={database.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {database.name}
                    {database.isPrimary && (
                      <Badge variant="default">Primary</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Priority: {database.priority} • Last check: {' '}
                    {new Date(database.lastHealthCheck).toLocaleString('vi-VN')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(database)}>
                    {database.isHealthy ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {getStatusText(database)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Storage Usage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage Usage</span>
                  <span className="font-medium">
                    {database.currentSizeMB}MB / {database.maxSizeMB}MB 
                    ({database.usagePercent}%)
                  </span>
                </div>
                <Progress 
                  value={database.usagePercent} 
                  className="h-2"
                />
                {database.usagePercent >= 90 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Storage nearly full - automatic switching may occur
                  </p>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {database.isPrimary 
                    ? "Currently receiving new data"
                    : database.isHealthy 
                      ? "Available for switching"
                      : "Not available"
                  }
                </div>
                
                <Button
                  variant={database.isPrimary ? "secondary" : "default"}
                  size="sm"
                  disabled={
                    database.isPrimary || 
                    !database.isHealthy || 
                    switchDatabaseMutation.isPending
                  }
                  onClick={() => handleSwitchDatabase(database.id)}
                >
                  {database.isPrimary ? "Current Primary" : "Switch to Primary"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Alert */}
      <Alert className="mt-6">
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Auto-Switch Behavior:</strong> When enabled, the system automatically switches to a backup database 
          when the current primary reaches 90% capacity. Manual switching is always available regardless of this setting.
        </AlertDescription>
      </Alert>
    </div>
  );
}