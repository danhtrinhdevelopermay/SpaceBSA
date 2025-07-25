import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import { useQuery } from '@tanstack/react-query';
import { File } from '@shared/schema';
import { Link } from 'wouter';
import Sidebar from '@/components/Sidebar';
import FileGrid from '@/components/FileGrid';
import UploadModal from '@/components/UploadModal';
import ShareModal from '@/components/ShareModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import FolderBrowserModal from '@/components/FolderBrowserModal';
import NotificationBell from '@/components/NotificationBell';
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner';

import LoadingPet from '@/components/LoadingPet';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotifications } from '@/hooks/useNotifications';
import SEOHead from '@/components/SEOHead';
import PersonalizedWelcome from '@/components/PersonalizedWelcome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Cloud, Search, Grid3X3, List, Menu, Bell, Image, FileText, Video, Music, Home, ChevronRight, Folder, Plus, User } from 'lucide-react';

export default function Dashboard() {
  const { user, firebaseUser, logout } = useAuth();
  const { isConnected, pendingShareRequests: wsShareRequests, respondToShare } = useWebSocket();
  const { showNotification, permission, startBackgroundNotifications, stopBackgroundNotifications } = useNotifications();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Test function to create notification directly
  const createTestNotification = async () => {
    try {
      console.log('[Test] Creating test notification...');
      const response = await fetch('/api/test/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log('[Test] Response status:', response.status);
      console.log('[Test] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('[Test] Response text (first 200 chars):', text.substring(0, 200));
      
      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(text);
        console.log('[Test] Test notification result:', result);
      } catch (jsonError) {
        console.error('[Test] Failed to parse JSON response:', jsonError);
        console.log('[Test] Full response text:', text);
      }
    } catch (error) {
      console.error('[Test] Error creating test notification:', error);
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [folderBrowserOpen, setFolderBrowserOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if welcome was dismissed today
    const today = new Date().toDateString();
    const dismissedDate = localStorage.getItem('welcome_dismissed_date');
    return dismissedDate !== today;
  });

  const { data: filesData, isLoading, refetch } = useQuery<{ files: File[] }>({
    queryKey: ['/api/files', user?.id],
    enabled: !!user?.id,
  });

  // Fetch notifications/share requests
  const { data: notificationsData, dataUpdatedAt } = useQuery<{ notifications: any[] }>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const files = filesData?.files || [];
  const notifications = notificationsData?.notifications || [];
  
  // Track previous notification count to detect new notifications
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);
  
  // Show browser notification for new share requests
  useEffect(() => {
    if (notifications.length > prevNotificationCount && prevNotificationCount > 0) {
      const newNotifications = notifications.slice(0, notifications.length - prevNotificationCount);
      
      newNotifications.forEach(notification => {
        if (notification.type === 'share_request' && !notification.isRead && permission === 'granted') {
          let metadata: any = {};
          try {
            metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
          } catch (e) {
            console.error('Error parsing notification metadata:', e);
          }
          
          showNotification('SpaceBSA - File được chia sẻ', {
            body: notification.message,
            icon: '/logo.png',
            tag: `share-${notification.id}`,
            data: { notificationId: notification.id, shareId: metadata.shareId }
          }).catch(error => {
            console.log('Browser notification failed (expected in dev):', error);
          });
        }
      });
    }
    
    setPrevNotificationCount(notifications.length);
  }, [notifications.length, prevNotificationCount, permission, showNotification, notifications]);
  
  // Start background notifications when user is authenticated and permission is granted
  useEffect(() => {
    if (user?.id && permission === 'granted') {
      startBackgroundNotifications(user.id);
    }
    
    // Cleanup on unmount or logout
    return () => {
      if (user?.id) {
        stopBackgroundNotifications();
      }
    };
  }, [user?.id, permission, startBackgroundNotifications, stopBackgroundNotifications]);

  // Convert notifications to share requests format
  const dbShareRequests = notifications.filter(n => n.type === 'share_request' && !n.isRead).map(n => {
    let metadata: any = {};
    try {
      metadata = n.metadata ? JSON.parse(n.metadata) : {};
    } catch (e) {
      console.error('Error parsing notification metadata:', e);
    }
    
    return {
      shareId: metadata.shareId || 0,
      fileName: metadata.fileName || 'Unknown file',
      senderName: metadata.senderName || 'Unknown user',
      permission: metadata.permission || 'view',
      message: n.message || 'Wants to share a file with you'
    };
  });

  // Combine WebSocket and database notifications (prefer WebSocket for real-time)
  const pendingShareRequests = [...wsShareRequests, ...dbShareRequests.filter(
    dbReq => !wsShareRequests.find(wsReq => wsReq.shareId === dbReq.shareId)
  )];

  const filteredFiles = files.filter((file: File) =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a: File, b: File) => {
    switch (sortBy) {
      case 'name':
        return a.originalName.localeCompare(b.originalName);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'size':
        return b.fileSize - a.fileSize;
      default:
        return 0;
    }
  });

  // File type statistics
  const imageFiles = files.filter(file => file.mimeType.startsWith('image/')).length;
  const documentFiles = files.filter(file => 
    file.mimeType.includes('pdf') || 
    file.mimeType.includes('document') || 
    file.mimeType.includes('text') ||
    file.mimeType.includes('msword') ||
    file.mimeType.includes('officedocument')
  ).length;
  const videoFiles = files.filter(file => file.mimeType.startsWith('video/')).length;
  const audioFiles = files.filter(file => file.mimeType.startsWith('audio/')).length;

  const handleShareFile = (file: File) => {
    setSelectedFile(file);
    setShareModalOpen(true);
  };

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
  };

  const handleDownloadFile = (file: File) => {
    const downloadUrl = `/api/files/download/${file.id}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    // Remember dismissal for today
    const today = new Date().toDateString();
    localStorage.setItem('welcome_dismissed_date', today);
  };

  const totalSize = files.reduce((acc: number, file: File) => acc + file.fileSize, 0);
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  const usagePercentage = (totalSize / maxSize) * 100;

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [sidebarOpen]);

  if (!user) return null;

  return (
    <>
      <SEOHead
        title={`Bảng điều khiển - ${user.displayName} | SpaceBSA`}
        description="Quản lý files và thư mục cá nhân trên SpaceBSA. Tải lên, chia sẻ và tổ chức files một cách dễ dàng và bảo mật với giao diện hiện đại."
        keywords="dashboard, quản lý file, tải lên file, chia sẻ file, cloud storage, lưu trữ đám mây, SpaceBSA"
        noIndex={true}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SpaceBSA Dashboard",
          "description": "Personal file management dashboard for SpaceBSA cloud storage platform",
          "url": "https://spacebsa.replit.app/dashboard",
          "applicationCategory": "ProductivityApplication"
        }}
      />
      <div className="min-h-screen flex" style={{ background: 'rgba(243, 244, 246, 0.3)' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpload={() => {
          console.log('Setting upload modal open to true');
          setUploadModalOpen(true);
        }}
        totalSize={totalSize}
        maxSize={maxSize}
        usagePercentage={usagePercentage}
        formatFileSize={formatFileSize}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 shadow-sm sticky top-0 z-30 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-1 text-gray-700 hover:text-primary hover:bg-gray-100/80"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Demo alerts button */}
              <Link href="/demo/alerts">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all"
                >
                  ✨ Demo Alerts
                </Button>
              </Link>
              
              {/* Test beautiful notifications */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => showSuccess("Thành công!", "Hệ thống alert mới đã được kích hoạt! 🎉")}
                className="hidden sm:flex hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
              >
                Test Toast
              </Button>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <img src="/logo.png" alt="SpaceBSA" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-md scale-150"></div>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-sm">
                  SpaceBSA
                </h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Bell */}
              <NotificationBell
                requests={pendingShareRequests}
                onAccept={async (shareId, shareData) => {
                  // Try WebSocket first, then fallback to API
                  const wsSuccess = respondToShare(shareId, true, shareData);
                  if (!wsSuccess) {
                    try {
                      const response = await fetch(`/api/shares/${shareId}/accept`, { method: 'POST' });
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Share accepted successfully:', result);
                        refetch(); // Refresh notifications and files
                      }
                    } catch (error) {
                      console.error('Failed to accept share:', error);
                    }
                  }
                }}
                onReject={async (shareId, shareData) => {
                  // Try WebSocket first, then fallback to API
                  const wsSuccess = respondToShare(shareId, false, shareData);
                  if (!wsSuccess) {
                    try {
                      const response = await fetch(`/api/shares/${shareId}/reject`, { method: 'POST' });
                      if (response.ok) {
                        console.log('Share rejected successfully');
                        refetch(); // Refresh notifications
                      }
                    } catch (error) {
                      console.error('Failed to reject share:', error);
                    }
                  }
                }}
              />
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-900">{user.displayName}</span>
                <Button variant="ghost" size="sm" onClick={logout} className="text-xs sm:text-sm px-3 py-2 rounded-full text-gray-900 hover:text-accent hover:bg-gray-100 transition-all">
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto relative">
            {/* Notification Permission Banner */}
            <NotificationPermissionBanner />

            {/* Personalized Welcome */}
            {showWelcome && (
              <PersonalizedWelcome onDismiss={handleDismissWelcome} />
            )}

            {/* Breadcrumb Navigation */}
            <div className="mb-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Các tập tin của...</span>
                    <ChevronRight className="h-4 w-4 mx-2" />
                    <span className="text-gray-900 font-medium">Tất cả các tập tin</span>
                    <ChevronRight className="h-4 w-4 mx-2" />
                    <Folder className="h-4 w-4 mr-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary">Truy cập</h2>
                <Link href="/recent">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10">
                    Xem tất cả →
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Images Card */}
                <Link href="/category/images">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <Image className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-3xl font-bold text-blue-600">{imageFiles}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Hình ảnh</h3>
                      <p className="text-sm text-gray-500">Ảnh và hình ảnh</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Documents Card */}
                <Link href="/category/documents">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="text-3xl font-bold text-green-600">{documentFiles}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Tài liệu</h3>
                      <p className="text-sm text-gray-500">PDF và văn bản</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Videos Card */}
                <Link href="/category/videos">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                          <Video className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="text-3xl font-bold text-purple-600">{videoFiles}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Video</h3>
                      <p className="text-sm text-gray-500">Phim và clip</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Audio Card */}
                <Link href="/category/music">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                          <Music className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="text-3xl font-bold text-orange-600">{audioFiles}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Âm nhạc</h3>
                      <p className="text-sm text-gray-500">Nhạc và âm thanh</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Recent Files Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Tệp gần đây</h2>
                <Button variant="ghost" className="text-gray-500 hover:bg-gray-100 text-sm">
                  Reset sau 24h
                </Button>
              </div>
              
              {sortedFiles.length > 0 ? (
                <FileGrid
                  files={sortedFiles.slice(0, 6)}
                  isLoading={isLoading}
                  onShare={handleShareFile}
                  onRefresh={refetch}
                  formatFileSize={formatFileSize}
                  onFileClick={handleFileClick}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  showViewToggle={true}
                />
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">Chưa có tệp nào gần đây</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Folder Browser Section */}
            <div className="mb-8">
              <Card 
                className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setFolderBrowserOpen(true)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">/</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Các tập tin của {user.displayName}</h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary font-medium">Tất cả các tập tin</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-30">
          <Button 
            onClick={() => setUploadModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={refetch}
        userId={user.id}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        file={selectedFile}
        userId={user.id}
      />

      <FilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={selectedFile}
        onDownload={handleDownloadFile}
        onShare={handleShareFile}
      />

      <FolderBrowserModal
        isOpen={folderBrowserOpen}
        onClose={() => setFolderBrowserOpen(false)}
        userId={user.id}
      />
    </div>
    </>
  );
}
