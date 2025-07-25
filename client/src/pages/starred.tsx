import React from 'react';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';

export default function StarredPage() {
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
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tệp đã đánh dấu</h1>
              <p className="text-gray-600">Các tệp yêu thích và quan trọng của bạn</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Tệp yêu thích</span>
            </CardTitle>
            <CardDescription>
              Các tệp bạn đã đánh dấu là yêu thích để truy cập nhanh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có tệp nào được đánh dấu</p>
              <p className="text-sm text-gray-400 mt-2">
                Đánh dấu các tệp quan trọng để tìm chúng nhanh chóng
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}