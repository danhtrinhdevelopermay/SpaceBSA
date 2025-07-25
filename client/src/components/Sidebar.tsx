import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Home, Share2, Clock, Star, Trash2, Plus, Settings, User,
  FolderOpen, HardDrive, Image, FileText, Video, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  totalSize: number;
  maxSize: number;
  usagePercentage: number;
  formatFileSize: (bytes: number) => string;
}

export default function Sidebar({
  isOpen,
  onClose,
  onUpload,
  totalSize,
  maxSize,
  usagePercentage,
  formatFileSize,
}: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { id: 'home', icon: Home, label: 'Tệp của tôi', path: '/dashboard' },
    { id: 'shared', icon: Share2, label: 'Được chia sẻ', path: '/shared' },
    { id: 'recent', icon: Clock, label: 'Gần đây', path: '/recent' },
    { id: 'starred', icon: Star, label: 'Đã đánh dấu', path: '/starred' },
  ];

  const categoryItems = [
    { id: 'images', icon: Image, label: 'Hình ảnh', path: '/category/images' },
    { id: 'documents', icon: FileText, label: 'Tài liệu', path: '/category/documents' },
    { id: 'videos', icon: Video, label: 'Video', path: '/category/videos' },
    { id: 'music', icon: Music, label: 'Âm nhạc', path: '/category/music' },
  ];

  const bottomItems = [
    { id: 'trash', icon: Trash2, label: 'Thùng rác', path: '/trash' },
    { id: 'profile', icon: User, label: 'Hồ sơ', path: '/profile' },
    { id: 'settings', icon: Settings, label: 'Cài đặt', path: '/settings' },
  ];

  return (
    <div
      className={cn(
        "w-72 h-screen z-50 transition-all duration-300 ease-out",
        "fixed md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(229, 231, 235, 0.8)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">SpaceBSA</h2>
              <p className="text-xs text-gray-500">Quản lý tệp</p>
            </div>
          </div>

          {/* Upload Button */}
          <Button 
            onClick={() => {
              onUpload();
              onClose();
            }} 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-200"
          >
            <Plus className="mr-3 h-5 w-5" />
            Tải lên tệp
          </Button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Điều hướng</h3>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path || (item.id === 'home' && location === '/');
                
                return (
                  <Link key={item.id} href={item.path}>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className={cn(
                        "w-full justify-start rounded-lg p-3 mb-1 transition-all duration-200",
                        isActive 
                          ? "bg-blue-50 text-blue-600 border border-blue-200" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Danh mục</h3>
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.id} href={item.path}>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className={cn(
                        "w-full justify-start rounded-lg p-3 mb-1 transition-all duration-200",
                        isActive 
                          ? "bg-blue-50 text-blue-600 border border-blue-200" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-4 py-4 border-t border-gray-200/50 flex-shrink-0">
          <div className="space-y-2 mb-4">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.id} href={item.path}>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className={cn(
                      "w-full justify-start rounded-lg p-3 transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 text-blue-600 border border-blue-200" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Storage Usage */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Dung lượng</h4>
              </div>
              <span className="text-xs text-gray-500">{Math.round(usagePercentage)}%</span>
            </div>
            
            <Progress value={usagePercentage} className="h-2 mb-2" />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatFileSize(totalSize)} đã dùng</span>
              <span>{formatFileSize(maxSize)} tổng cộng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}