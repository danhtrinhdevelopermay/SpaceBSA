import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastVariants = {
  default: {
    bg: 'bg-gradient-to-r from-gray-50 to-slate-100',
    border: 'border-gray-200',
    text: 'text-gray-800',
    icon: <Info className="h-5 w-5 text-gray-600" />,
    accent: 'bg-gray-500'
  },
  success: {
    bg: 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    accent: 'bg-green-500'
  },
  destructive: {
    bg: 'bg-gradient-to-r from-red-50 via-rose-50 to-pink-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    accent: 'bg-red-500'
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    accent: 'bg-yellow-500'
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="h-5 w-5 text-blue-600" />,
    accent: 'bg-blue-500'
  }
};

export default function EnhancedToast({
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const variantStyle = toastVariants[variant];

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={cn(
        'relative w-full max-w-md mx-auto rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ease-out transform overflow-hidden',
        variantStyle.bg,
        variantStyle.border,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95',
        isLeaving && 'translate-x-full opacity-0 scale-95'
      )}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-black/10 w-full">
        <div 
          className={cn('h-full transition-all duration-100 ease-linear', variantStyle.accent)}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-10">
        <div className="w-20 h-20 rounded-full bg-white transform translate-x-6 -translate-y-6"></div>
      </div>
      <div className="absolute bottom-0 left-0 opacity-5">
        <Sparkles className="h-8 w-8 text-current transform -translate-x-2 translate-y-2" />
      </div>

      <div className="relative p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {variantStyle.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={cn('font-semibold text-sm', variantStyle.text)}>
              {title}
            </div>
            {description && (
              <div className={cn('mt-1 text-xs opacity-90', variantStyle.text)}>
                {description}
              </div>
            )}
            
            {/* Action button */}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  'mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors',
                  'hover:bg-white/20 active:bg-white/30',
                  variantStyle.text
                )}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 p-1 rounded-full transition-colors hover:bg-white/20',
              variantStyle.text
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}