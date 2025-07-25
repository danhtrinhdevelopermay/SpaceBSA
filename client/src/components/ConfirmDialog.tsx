import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle, XCircle, Info, Trash2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  icon?: 'warning' | 'success' | 'error' | 'info' | 'delete' | 'share';
}

const variantStyles = {
  default: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-100',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    confirmBg: 'bg-gray-900 hover:bg-gray-800',
    confirmText: 'text-white'
  },
  destructive: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    confirmText: 'text-white'
  },
  success: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmBg: 'bg-green-600 hover:bg-green-700',
    confirmText: 'text-white'
  },
  warning: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
    confirmText: 'text-white'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    confirmText: 'text-white'
  }
};

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  info: Info,
  delete: Trash2,
  share: Share2
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'default',
  icon = 'warning'
}: ConfirmDialogProps) {
  const style = variantStyles[variant];
  const IconComponent = iconMap[icon];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={cn('max-w-md border-0 shadow-2xl', style.bg)}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 opacity-10">
          <div className="w-32 h-32 rounded-full bg-white transform translate-x-8 -translate-y-8"></div>
        </div>
        <div className="absolute bottom-0 left-0 opacity-5">
          <div className="w-24 h-24 rounded-full bg-white transform -translate-x-6 translate-y-6"></div>
        </div>

        <AlertDialogHeader className="relative z-10">
          {/* Icon */}
          <div className="mx-auto mb-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', style.iconBg)}>
              <IconComponent className={cn('h-8 w-8', style.iconColor)} />
            </div>
          </div>

          <AlertDialogTitle className="text-center text-xl font-bold text-gray-900 mb-2">
            {title}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center text-gray-700 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="relative z-10 flex flex-col sm:flex-row gap-3 pt-6">
          <AlertDialogCancel 
            className="w-full sm:w-auto order-2 sm:order-1 border-gray-300 hover:bg-gray-50 text-gray-700"
            onClick={onClose}
          >
            {cancelText}
          </AlertDialogCancel>
          
          <AlertDialogAction
            className={cn(
              'w-full sm:w-auto order-1 sm:order-2 border-0 shadow-lg transition-all duration-200 transform hover:scale-105',
              style.confirmBg,
              style.confirmText
            )}
            onClick={handleConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}