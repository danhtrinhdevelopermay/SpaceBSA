import React, { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { File } from '@shared/schema';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw,
  FastForward,
  Rewind,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShareModal from '@/components/ShareModal';
import LoadingPet from '@/components/LoadingPet';

interface FileViewProps {
  params: { fileId: string };
}

export default function FileViewPage() {
  const [, params] = useRoute('/file/:fileId');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileId = params?.fileId;

  // Video controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: file, isLoading, error } = useQuery({
    queryKey: ['/api/file/info', fileId],
    enabled: !!user && !!fileId,
    select: (data: any) => {
      return data.file as File;
    }
  });

  useEffect(() => {
    if (!fileId) {
      setLocation('/dashboard');
      return;
    }
  }, [fileId, setLocation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = `/api/files/download/${file.id}`;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Tải xuống bắt đầu",
      description: `Đang tải ${file.originalName}`,
    });
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  // Video control handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = (value[0] / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <LoadingPet message="Đang tải tệp tin..." />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy tệp</h1>
          <p className="text-gray-600 mb-4">Tệp bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => setLocation('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType.includes('pdf');
  const isText = file.mimeType.startsWith('text/') || file.mimeType.includes('json');

  const fileUrl = `/api/files/download/${file.id}`;

  const renderMediaContent = () => {
    if (isImage) {
      return (
        <div className="w-full flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-[200px] sm:min-h-[300px]">
          <img
            src={fileUrl}
            alt={file.originalName}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: '75vh' }}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div 
          ref={containerRef}
          className="relative w-full bg-black rounded-lg overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={fileUrl}
            className="w-full h-auto min-h-[200px] sm:min-h-[300px]"
            style={{ maxHeight: '75vh' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
          
          {/* Enhanced Video Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Enhanced Progress Bar */}
            <div className="mb-6">
              <div className="mb-2">
                <Slider
                  value={[duration ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  className="w-full [&_.relative]:h-2 [&_.relative_.bg-primary]:bg-gradient-to-r [&_.relative_.bg-primary]:from-purple-500 [&_.relative_.bg-primary]:to-pink-500"
                  max={100}
                  step={0.1}
                />
              </div>
              <div className="flex justify-between text-sm text-white/90 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Enhanced Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(-10)}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 rounded-full p-2"
                >
                  <Rewind className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 rounded-full p-3 mx-2"
                >
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(10)}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 rounded-full p-2"
                >
                  <FastForward className="h-5 w-5" />
                </Button>

                {/* Enhanced Volume Control */}
                <div className="flex items-center space-x-3 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 rounded-full p-2"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <div className="w-24 group">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-full [&_.relative]:h-1.5 [&_.relative_.bg-primary]:bg-gradient-to-r [&_.relative_.bg-primary]:from-purple-400 [&_.relative_.bg-primary]:to-pink-400"
                    />
                  </div>
                  <span className="text-xs text-white/70 w-8 text-center font-medium">{Math.round(isMuted ? 0 : volume)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(Number(e.target.value))}
                  className="bg-white/10 backdrop-blur text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value={0.5} className="bg-gray-800">0.5x</option>
                  <option value={0.75} className="bg-gray-800">0.75x</option>
                  <option value={1} className="bg-gray-800">1x</option>
                  <option value={1.25} className="bg-gray-800">1.25x</option>
                  <option value={1.5} className="bg-gray-800">1.5x</option>
                  <option value={2} className="bg-gray-800">2x</option>
                </select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 rounded-full p-2"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="w-full max-w-md mx-auto p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Volume2 className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{file.originalName}</h3>
            <p className="text-gray-600">Âm thanh • {formatFileSize(file.size)}</p>
          </div>
          
          {/* Custom Audio Player */}
          <div className="space-y-6">
            <audio
              ref={videoRef}
              src={fileUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                className="w-full"
                max={100}
                step={0.1}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Audio Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="text-purple-600 hover:bg-purple-100 rounded-full p-3"
              >
                <Rewind className="h-5 w-5" />
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={togglePlay}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-4 shadow-lg"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="text-purple-600 hover:bg-purple-100 rounded-full p-3"
              >
                <FastForward className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-purple-600 hover:bg-purple-100 rounded-full p-2"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="flex-1 max-w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-600 w-10 text-right">{Math.round(isMuted ? 0 : volume)}%</span>
            </div>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg">
          <iframe
            src={fileUrl}
            className="w-full h-full rounded-lg"
            style={{ minHeight: '75vh' }}
            title={file.originalName}
          />
        </div>
      );
    }

    return (
      <div className="w-full p-12 text-center bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-4">
          <Settings className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể xem trước</h3>
        <p className="text-gray-600 mb-4">Loại tệp này không được hỗ trợ xem trước</p>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Tải xuống để xem
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="text-gray-600 hover:text-gray-900 p-3"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Quay lại</span>
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate px-2">
                {file.originalName}
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {file.mimeType.split('/')[1]?.toUpperCase() || file.mimeType}
                </Badge>
                <span className="text-sm font-medium text-purple-600">
                  {formatFileSize(file.fileSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                  {file.originalName}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {file.mimeType}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Tải xuống</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Chia sẻ</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Main Content - Centered */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
              <CardContent className="p-2 sm:p-4 lg:p-6">
                {renderMediaContent()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* File Info - Below content */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tệp</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tên tệp</label>
                  <p className="text-sm text-gray-900 mt-1 break-words">{file.originalName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Kích thước</label>
                  <p className="text-sm text-gray-900 mt-1">{formatFileSize(file.fileSize)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Loại tệp</label>
                  <p className="text-sm text-gray-900 mt-1">{file.mimeType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(file.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Action buttons - Mobile optimized with better spacing */}
              <div className="space-y-4 sm:space-y-3">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 sm:h-10 text-base sm:text-sm font-medium"
                >
                  <Download className="h-5 w-5 mr-3 sm:h-4 sm:w-4 sm:mr-2" />
                  Tải xuống tệp
                </Button>
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full h-12 sm:h-10 text-base sm:text-sm font-medium border-2 hover:bg-purple-50"
                >
                  <Share2 className="h-5 w-5 mr-3 sm:h-4 sm:w-4 sm:mr-2" />
                  Chia sẻ tệp với người khác
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        file={file || null}
        userId={user?.id || 0}
      />
    </div>
  );
}