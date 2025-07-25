import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface ShareRequest {
  shareId: number;
  fileName: string;
  senderName: string;
  permission: string;
  message: string;
}

export function useWebSocket() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const { showNotification, permission } = useNotifications();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingShareRequests, setPendingShareRequests] = useState<ShareRequest[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!user || !firebaseUser || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Skip WebSocket in development to avoid conflicts with Vite HMR
    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocket disabled in development mode');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Send user status to establish session
        if (ws.current && user && firebaseUser) {
          ws.current.send(JSON.stringify({
            type: 'user_status',
            data: {
              userId: user.id,
              firebaseUid: firebaseUser.uid
            }
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [user, firebaseUser]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'share_request':
        handleShareRequest(message.data);
        break;
      case 'share_response':
        handleShareResponse(message.data);
        break;
      case 'notification':
        handleNotification(message.data);
        break;
      case 'user_status':
        console.log('User status updated:', message.data);
        break;
      case 'error':
        console.error('WebSocket error:', message.data);
        toast({
          title: "Lỗi kết nối",
          description: message.data.message,
          variant: "destructive",
        });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [toast]);

  const handleShareRequest = useCallback((data: ShareRequest) => {
    setPendingShareRequests(prev => [...prev, data]);
    
    // Show in-app toast notification
    toast({
      title: "Yêu cầu chia sẻ file",
      description: data.message,
      duration: 10000,
    });

    // Show browser notification if permission granted
    if (permission === 'granted') {
      showNotification('SpaceBSA - Yêu cầu chia sẻ file', {
        body: data.message,
        icon: '/logo.png',
        data: { shareId: data.shareId, type: 'share_request' }
      });
    }
  }, [toast, showNotification, permission]);

  const handleShareResponse = useCallback((data: any) => {
    if (data.success !== undefined) {
      // Response to our share request
      toast({
        title: data.success ? "Chia sẻ thành công" : "Chia sẻ thất bại",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      
      // Show browser notification
      if (permission === 'granted') {
        showNotification(`SpaceBSA - ${data.success ? "Chia sẻ thành công" : "Chia sẻ thất bại"}`, {
          body: data.message,
          icon: '/logo.png'
        });
      }
    } else {
      // Response from recipient
      const isAccepted = data.accepted;
      toast({
        title: isAccepted ? "Chia sẻ được chấp nhận" : "Chia sẻ bị từ chối",
        description: data.message,
        variant: isAccepted ? "default" : "destructive",
      });
      
      // Show browser notification
      if (permission === 'granted') {
        showNotification(`SpaceBSA - ${isAccepted ? "Chia sẻ được chấp nhận" : "Chia sẻ bị từ chối"}`, {
          body: data.message,
          icon: '/logo.png'
        });
      }
    }
  }, [toast, showNotification, permission]);

  const handleNotification = useCallback((data: any) => {
    toast({
      title: "Thông báo",
      description: data.message,
    });
    
    // Show browser notification
    if (permission === 'granted') {
      showNotification('SpaceBSA - Thông báo', {
        body: data.message,
        icon: '/logo.png'
      });
    }
  }, [toast, showNotification, permission]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendShareRequest = useCallback((recipientEmail: string, fileId: string, fileName: string, permission: string) => {
    if (!user) return false;
    
    return sendMessage({
      type: 'share_request',
      data: {
        recipientEmail,
        fileId,
        fileName,
        senderName: user.displayName,
        permission
      }
    });
  }, [user, sendMessage]);

  const respondToShare = useCallback((shareId: number, accepted: boolean, shareData: ShareRequest) => {
    if (!user) return false;
    
    // Remove from pending requests
    setPendingShareRequests(prev => prev.filter(req => req.shareId !== shareId));
    
    return sendMessage({
      type: 'share_response',
      data: {
        shareId,
        accepted,
        senderName: user.displayName,
        fileName: shareData.fileName
      }
    });
  }, [user, sendMessage]);

  // Connect when user is available
  useEffect(() => {
    if (user && firebaseUser) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, firebaseUser, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    pendingShareRequests,
    sendShareRequest,
    respondToShare,
    sendMessage
  };
}