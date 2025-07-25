import React from 'react';
import './StartupLoader.css';

interface StartupLoaderProps {
  onLoadComplete?: () => void;
}

export default function StartupLoader({ onLoadComplete }: StartupLoaderProps) {
  React.useEffect(() => {
    // Auto complete after animation
    const timer = setTimeout(() => {
      onLoadComplete?.();
    }, 3500); // 3.5 seconds for full animation

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <div className="startup-loader">
      <div className="loader-container">
        {/* Animated Logo */}
        <div className="logo-animation">
          {/* Main logo with pulsing effect */}
          <div className="logo-main">
            <img src="/logo.png" alt="SpaceBSA" className="logo-image" />
            
            {/* Orbital rings around logo */}
            <div className="orbital-ring ring-1">
              <div className="orbit-dot dot-1"></div>
            </div>
            <div className="orbital-ring ring-2">
              <div className="orbit-dot dot-2"></div>
              <div className="orbit-dot dot-3"></div>
            </div>
            <div className="orbital-ring ring-3">
              <div className="orbit-dot dot-4"></div>
              <div className="orbit-dot dot-5"></div>
              <div className="orbit-dot dot-6"></div>
            </div>
            
            {/* Glow effect behind logo */}
            <div className="logo-glow"></div>
          </div>
          
          {/* Loading text */}
          <div className="loading-text">
            <h2 className="app-name">SpaceBSA</h2>
            <p className="loading-subtitle">Khởi động ứng dụng...</p>
            
            {/* Loading dots */}
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <div className="progress-text">Đang tải...</div>
          </div>
        </div>
        
        {/* Background particles */}
        <div className="particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}