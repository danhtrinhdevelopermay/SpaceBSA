import React, { useEffect, useState } from 'react';
import { Server, Database, User, Zap, Globe } from 'lucide-react';

export default function InfrastructurePage() {
  const [animationStep, setAnimationStep] = useState(0);
  const [userLocation, setUserLocation] = useState({ lat: 21.0285, lng: 105.8542 }); // Default to Hanoi
  const [metrics, setMetrics] = useState({
    serverCpu: 23,
    serverPing: 45,
    dbConnection: 120,
    dbStorage: 78,
    userBandwidth: 100,
    userLatency: 65
  });

  // Animation sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1500); // Faster animation

    return () => clearInterval(timer);
  }, []);

  // Rapidly updating metrics
  useEffect(() => {
    const metricsTimer = setInterval(() => {
      setMetrics(prev => ({
        serverCpu: Math.max(15, Math.min(35, prev.serverCpu + (Math.random() - 0.5) * 4)),
        serverPing: Math.max(35, Math.min(55, prev.serverPing + (Math.random() - 0.5) * 6)),
        dbConnection: Math.max(100, Math.min(140, prev.dbConnection + (Math.random() - 0.5) * 8)),
        dbStorage: Math.max(75, Math.min(85, prev.dbStorage + (Math.random() - 0.5) * 2)),
        userBandwidth: Math.max(80, Math.min(120, prev.userBandwidth + (Math.random() - 0.5) * 10)),
        userLatency: Math.max(50, Math.min(80, prev.userLatency + (Math.random() - 0.5) * 6))
      }));
    }, 500); // Update every 500ms

    return () => clearInterval(metricsTimer);
  }, []);

  // Get user's approximate location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Keep default location if geolocation fails
        }
      );
    }
  }, []);

  // Convert lat/lng to SVG coordinates (simplified projection)
  const toSVG = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  const singapore = toSVG(1.3521, 103.8198);
  const uk = toSVG(55.3781, -3.4360);
  const user = toSVG(userLocation.lat, userLocation.lng);

  const getAnimationClass = (step: number) => {
    if (animationStep === step) return 'animate-pulse opacity-100';
    return 'opacity-60';
  };

  const getLightAnimation = (step: number) => {
    if (animationStep === step) return 'animate-pulse';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Globe className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Cơ sở hạ tầng SpaceBSA</h1>
          </div>
          <p className="text-blue-200 text-lg">Mô phỏng kiến trúc hệ thống toàn cầu</p>
        </div>

        {/* World Map Container */}
        <div className="relative bg-slate-800/50 rounded-2xl border border-blue-500/20 p-6 backdrop-blur-sm">
          <div className="relative w-full max-h-96 overflow-hidden rounded-xl">
            {/* Real World Map Background */}
            <img 
              src="/world-map.jpg"
              alt="World Map"
              className="w-full h-auto object-cover opacity-75"
              style={{ 
                filter: 'brightness(0.6) contrast(1.2) saturate(0.7) hue-rotate(220deg)',
                mixBlendMode: 'multiply'
              }}
            />
            
            {/* Overlay for better visibility of connections */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-indigo-900/40"
              style={{ mixBlendMode: 'multiply' }}
            />
            
            {/* SVG overlay for connections and points */}
            <svg
              viewBox="0 0 800 400"
              className="absolute inset-0 w-full h-full"
              style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' }}
            >
              <defs>
                {/* Light beam gradient */}
                <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0)" />
                  <stop offset="50%" stopColor="rgba(34, 197, 94, 0.8)" />
                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                </linearGradient>
              </defs>

            {/* Connection Lines with Traveling Light Dots */}
            {/* User to Singapore connection */}
            <line
              x1={user.x}
              y1={user.y}
              x2={singapore.x}
              y2={singapore.y}
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
            />
            
            {/* Singapore to UK connection */}
            <line
              x1={singapore.x}
              y1={singapore.y}
              x2={uk.x}
              y2={uk.y}
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
            />
            
            {/* UK to User connection */}
            <line
              x1={uk.x}
              y1={uk.y}
              x2={user.x}
              y2={user.y}
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
            />

            {/* Complex interconnected light dots with bidirectional flow */}
            
            {/* User to Singapore - Multiple directions */}
            <circle r="4" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }}>
              <animateMotion dur="0.3s" repeatCount="indefinite" path={`M ${user.x},${user.y} L ${singapore.x},${singapore.y}`} />
            </circle>
            <circle r="3" fill="#16a34a" opacity="0.8">
              <animateMotion dur="0.4s" repeatCount="indefinite" begin="0.1s" path={`M ${singapore.x},${singapore.y} L ${user.x},${user.y}`} />
            </circle>
            
            {/* Singapore to UK - Bidirectional */}
            <circle r="4" fill="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }}>
              <animateMotion dur="0.35s" repeatCount="indefinite" begin="0.05s" path={`M ${singapore.x},${singapore.y} L ${uk.x},${uk.y}`} />
            </circle>
            <circle r="3" fill="#2563eb" opacity="0.8">
              <animateMotion dur="0.45s" repeatCount="indefinite" begin="0.2s" path={`M ${uk.x},${uk.y} L ${singapore.x},${singapore.y}`} />
            </circle>
            
            {/* UK to User - Multiple streams */}
            <circle r="4" fill="#8b5cf6" style={{ filter: 'drop-shadow(0 0 8px #8b5cf6)' }}>
              <animateMotion dur="0.38s" repeatCount="indefinite" begin="0.15s" path={`M ${uk.x},${uk.y} L ${user.x},${user.y}`} />
            </circle>
            <circle r="3" fill="#7c3aed" opacity="0.8">
              <animateMotion dur="0.42s" repeatCount="indefinite" begin="0.25s" path={`M ${user.x},${user.y} L ${uk.x},${uk.y}`} />
            </circle>

            {/* Cross-connections creating network mesh effect */}
            <circle r="2" fill="#fbbf24" opacity="0.9">
              <animateMotion dur="0.6s" repeatCount="indefinite" path={`M ${user.x},${user.y} L ${uk.x},${uk.y} L ${singapore.x},${singapore.y} L ${user.x},${user.y}`} />
            </circle>
            <circle r="2" fill="#f59e0b" opacity="0.9">
              <animateMotion dur="0.8s" repeatCount="indefinite" begin="0.3s" path={`M ${singapore.x},${singapore.y} L ${user.x},${user.y} L ${uk.x},${uk.y} L ${singapore.x},${singapore.y}`} />
            </circle>
            
            {/* Ultra-fast micro packets */}
            <circle r="1.5" fill="#06d6a0" opacity="0.8">
              <animateMotion dur="0.12s" repeatCount="indefinite" path={`M ${user.x},${user.y} L ${singapore.x},${singapore.y}`} />
            </circle>
            <circle r="1.5" fill="#10b981" opacity="0.8">
              <animateMotion dur="0.15s" repeatCount="indefinite" begin="0.06s" path={`M ${singapore.x},${singapore.y} L ${uk.x},${uk.y}`} />
            </circle>
            <circle r="1.5" fill="#059669" opacity="0.8">
              <animateMotion dur="0.18s" repeatCount="indefinite" begin="0.12s" path={`M ${uk.x},${uk.y} L ${user.x},${user.y}`} />
            </circle>
            
            {/* Reverse flow micro packets */}
            <circle r="1.5" fill="#ef4444" opacity="0.7">
              <animateMotion dur="0.14s" repeatCount="indefinite" begin="0.07s" path={`M ${singapore.x},${singapore.y} L ${user.x},${user.y}`} />
            </circle>
            <circle r="1.5" fill="#dc2626" opacity="0.7">
              <animateMotion dur="0.16s" repeatCount="indefinite" begin="0.08s" path={`M ${uk.x},${uk.y} L ${singapore.x},${singapore.y}`} />
            </circle>
            <circle r="1.5" fill="#b91c1c" opacity="0.7">
              <animateMotion dur="0.19s" repeatCount="indefinite" begin="0.09s" path={`M ${user.x},${user.y} L ${uk.x},${uk.y}`} />
            </circle>

            {/* Location Points with detailed information */}
            {/* Singapore - Server */}
            <g>
              <circle
                cx={singapore.x}
                cy={singapore.y}
                r="10"
                fill="#ef4444"
                className={getAnimationClass(0)}
                style={{ filter: 'drop-shadow(0 0 15px #ef4444)' }}
              />
              <circle
                cx={singapore.x}
                cy={singapore.y}
                r="18"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.5"
                className="animate-ping"
              />
              {/* Server icon */}
              <rect
                x={singapore.x - 6}
                y={singapore.y - 4}
                width="12"
                height="8"
                rx="1"
                fill="white"
                opacity="0.9"
              />
              <rect
                x={singapore.x - 4}
                y={singapore.y - 2}
                width="8"
                height="1"
                fill="#ef4444"
              />
              <rect
                x={singapore.x - 4}
                y={singapore.y}
                width="8"
                height="1"
                fill="#ef4444"
              />
            </g>

            {/* UK - Database */}
            <g>
              <circle
                cx={uk.x}
                cy={uk.y}
                r="10"
                fill="#ef4444"
                className={getAnimationClass(1)}
                style={{ filter: 'drop-shadow(0 0 15px #ef4444)' }}
              />
              <circle
                cx={uk.x}
                cy={uk.y}
                r="18"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.5"
                className="animate-ping"
              />
              {/* Database icon */}
              <ellipse
                cx={uk.x}
                cy={uk.y - 2}
                rx="5"
                ry="2"
                fill="white"
                opacity="0.9"
              />
              <rect
                x={uk.x - 5}
                y={uk.y - 2}
                width="10"
                height="4"
                fill="white"
                opacity="0.9"
              />
              <ellipse
                cx={uk.x}
                cy={uk.y + 2}
                rx="5"
                ry="2"
                fill="white"
                opacity="0.9"
              />
            </g>

            {/* User Location */}
            <g>
              <circle
                cx={user.x}
                cy={user.y}
                r="10"
                fill="#ef4444"
                className={getAnimationClass(2)}
                style={{ filter: 'drop-shadow(0 0 15px #ef4444)' }}
              />
              <circle
                cx={user.x}
                cy={user.y}
                r="18"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.5"
                className="animate-ping"
              />
              {/* User icon */}
              <circle
                cx={user.x}
                cy={user.y - 2}
                r="3"
                fill="white"
                opacity="0.9"
              />
              <path
                d={`M ${user.x - 4} ${user.y + 4} Q ${user.x} ${user.y + 1} ${user.x + 4} ${user.y + 4}`}
                stroke="white"
                strokeWidth="2"
                fill="none"
                opacity="0.9"
              />
            </g>

            {/* Enhanced Labels with server/database names */}
            <text x={singapore.x} y={singapore.y - 30} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              Singapore Server
            </text>
            <text x={singapore.x} y={singapore.y - 15} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              web-sg-01.spacebsa.com
            </text>
            
            <text x={uk.x} y={uk.y - 30} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              UK Database
            </text>
            <text x={uk.x} y={uk.y - 15} textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              db-uk-primary.spacebsa.com
            </text>
            
            <text x={user.x} y={user.y - 30} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              Người dùng
            </text>
            <text x={user.x} y={user.y - 15} textAnchor="middle" fill="#8b5cf6" fontSize="10" fontWeight="bold">
              {userLocation.lat.toFixed(2)}°N, {userLocation.lng.toFixed(2)}°E
            </text>
            </svg>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Singapore Server */}
          <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 ${getAnimationClass(0)}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Server className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Máy chủ ứng dụng</h3>
                <p className="text-green-400 text-sm">Singapore</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Trạng thái:</span>
                <span className="text-green-400">Hoạt động</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Ping:</span>
                <span className="text-blue-400">{Math.round(metrics.serverPing)}ms</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tải CPU:</span>
                <span className="text-yellow-400">{Math.round(metrics.serverCpu)}%</span>
              </div>
            </div>
          </div>

          {/* UK Database */}
          <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 ${getAnimationClass(1)}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Cơ sở dữ liệu</h3>
                <p className="text-blue-400 text-sm">United Kingdom</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Trạng thái:</span>
                <span className="text-green-400">Hoạt động</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Kết nối:</span>
                <span className="text-blue-400">{Math.round(metrics.dbConnection)}ms</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Lưu trữ:</span>
                <span className="text-purple-400">{Math.round(metrics.dbStorage)}% đã sử dụng</span>
              </div>
            </div>
          </div>

          {/* User */}
          <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 ${getAnimationClass(2)}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Người dùng</h3>
                <p className="text-purple-400 text-sm">Vị trí của bạn</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Kết nối:</span>
                <span className="text-green-400">Ổn định</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Băng thông:</span>
                <span className="text-blue-400">{Math.round(metrics.userBandwidth)} Mbps</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Độ trễ:</span>
                <span className="text-yellow-400">{Math.round(metrics.userLatency)}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Flow Animation */}
        <div className="mt-8 bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-400" />
              <span className="text-white text-sm">Người dùng</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className={`h-5 w-5 text-green-400 ${animationStep === 0 ? 'animate-bounce' : ''}`} />
              <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-green-500 rounded"></div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-green-400" />
              <span className="text-white text-sm">Máy chủ</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className={`h-5 w-5 text-blue-400 ${animationStep === 1 ? 'animate-bounce' : ''}`} />
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded"></div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-400" />
              <span className="text-white text-sm">Cơ sở dữ liệu</span>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              {animationStep === 0 && "Người dùng gửi yêu cầu đến máy chủ Singapore..."}
              {animationStep === 1 && "Máy chủ truy vấn cơ sở dữ liệu tại Anh..."}
              {animationStep === 2 && "Dữ liệu được trả về cho người dùng..."}
              {animationStep === 3 && "Chu kỳ hoàn tất. Đang khởi động lại..."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>SpaceBSA Infrastructure Simulation • Real-time Global Network Monitoring</p>
        </div>
      </div>
    </div>
  );
}