import { useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPermissionHook {
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  isSupported: boolean;
  serviceWorkerReady: boolean;
  startBackgroundNotifications: (userId: number) => void;
  stopBackgroundNotifications: () => void;
}

export function useNotifications(): NotificationPermissionHook {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Check if notifications are supported
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  // Initialize service worker and permission state
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
          setServiceWorkerReady(true);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [isSupported]);
  
  // Function to start background notification checking
  const startBackgroundNotifications = useCallback((userId: number) => {
    if (!serviceWorkerReady || !userId) return;
    
    navigator.serviceWorker.ready.then(registration => {
      console.log('Starting background notifications for user:', userId);
      // Send user ID to service worker
      registration.active?.postMessage({
        type: 'SET_USER_ID',
        userId: userId
      });
    });
  }, [serviceWorkerReady]);
  
  // Function to stop background notification checking
  const stopBackgroundNotifications = useCallback(() => {
    if (!serviceWorkerReady) return;
    
    navigator.serviceWorker.ready.then(registration => {
      console.log('Stopping background notifications');
      registration.active?.postMessage({
        type: 'STOP_BACKGROUND_CHECK'
      });
    });
  }, [serviceWorkerReady]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Trình duyệt không hỗ trợ thông báo');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Thông báo đã được bật",
          description: "Bạn sẽ nhận được thông báo khi có người chia sẻ file",
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Quyền thông báo bị từ chối",
          description: "Vui lòng bật quyền thông báo trong cài đặt trình duyệt",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi yêu cầu quyền thông báo:', error);
      return false;
    }

    return false;
  }, [isSupported, permission, toast]);

  // Show browser notification using Service Worker
  const showNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<void> => {
    console.log('showNotification called with:', { title, options, isSupported, permission, serviceWorkerReady });
    
    if (!isSupported) {
      console.warn('Trình duyệt không hỗ trợ thông báo hoặc Service Worker');
      throw new Error('Browser does not support notifications or service workers');
    }

    if (permission !== 'granted') {
      console.warn('Chưa có quyền hiển thị thông báo, current permission:', permission);
      throw new Error(`Permission not granted: ${permission}`);
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration);

      const notificationOptions = {
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'spacebsa-notification',
        requireInteraction: false,
        ...options
      };

      console.log('Showing notification via Service Worker:', title, notificationOptions);
      
      // Use Service Worker to show notification
      await registration.showNotification(title, notificationOptions);
      
      console.log('Notification shown successfully via Service Worker');

    } catch (error) {
      console.error('Lỗi khi hiển thị thông báo:', error);
      
      // Fallback to direct Notification API if Service Worker fails
      try {
        console.log('Trying fallback to direct Notification API...');
        const notification = new Notification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'spacebsa-notification-fallback',
          requireInteraction: false,
          ...options
        });

        notification.onclick = () => {
          console.log('Fallback notification clicked');
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
        console.log('Fallback notification created successfully');
        
      } catch (fallbackError) {
        console.error('Fallback notification also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }, [isSupported, permission, serviceWorkerReady]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported,
    serviceWorkerReady,
    startBackgroundNotifications,
    stopBackgroundNotifications
  };
}