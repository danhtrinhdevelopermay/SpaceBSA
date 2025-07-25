import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { nanoid } from 'nanoid';

interface WebSocketWithSession extends WebSocket {
  sessionId?: string;
  userId?: number;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'share_request' | 'share_response' | 'notification' | 'ping' | 'user_status';
  data: any;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketWithSession> = new Map();
  private userSessions: Map<number, string> = new Map(); // userId -> sessionId

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocketWithSession, request) => {
      const sessionId = nanoid();
      ws.sessionId = sessionId;
      ws.isAlive = true;
      
      console.log(`WebSocket client connected: ${sessionId}`);
      this.clients.set(sessionId, ws);

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
          await this.handleMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${sessionId}`);
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });

    // Ping clients every 30 seconds to keep connections alive
    const pingInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: WebSocketWithSession) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(pingInterval);
    });
  }

  private async handleMessage(ws: WebSocketWithSession, message: WebSocketMessage) {
    switch (message.type) {
      case 'user_status':
        await this.handleUserStatus(ws, message.data);
        break;
      case 'share_request':
        await this.handleShareRequest(ws, message.data);
        break;
      case 'share_response':
        await this.handleShareResponse(ws, message.data);
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: {} });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private async handleUserStatus(ws: WebSocketWithSession, data: { userId: number, firebaseUid: string }) {
    try {
      // Verify user exists
      const user = await storage.getUserByFirebaseUid(data.firebaseUid);
      if (!user) {
        this.sendToClient(ws, {
          type: 'error',
          data: { message: 'User not found' }
        });
        return;
      }

      // Update session
      ws.userId = user.id;
      const existingSessionId = this.userSessions.get(user.id);
      
      // Remove old session if exists
      if (existingSessionId && this.clients.has(existingSessionId)) {
        const oldWs = this.clients.get(existingSessionId);
        if (oldWs && oldWs !== ws) {
          oldWs.close();
          this.clients.delete(existingSessionId);
        }
      }

      // Set new session
      this.userSessions.set(user.id, ws.sessionId!);
      
      // Update database session
      await storage.createOrUpdateUserSession({
        userId: user.id,
        sessionId: ws.sessionId!
      });

      // Send confirmation
      this.sendToClient(ws, {
        type: 'user_status',
        data: { status: 'online', userId: user.id }
      });

      console.log(`User ${user.email} is now online with session ${ws.sessionId}`);
    } catch (error) {
      console.error('Error handling user status:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Failed to update user status' }
      });
    }
  }

  private async handleShareRequest(ws: WebSocketWithSession, data: { 
    recipientEmail: string, 
    fileId: string, 
    fileName: string, 
    senderName: string,
    permission: string 
  }) {
    try {
      // Find recipient user
      const recipient = await storage.getUserByEmail(data.recipientEmail);
      if (!recipient) {
        this.sendToClient(ws, {
          type: 'share_response',
          data: { 
            success: false, 
            message: 'Người dùng không tồn tại trong hệ thống' 
          }
        });
        return;
      }

      // Check if recipient is online
      const recipientSessionId = this.userSessions.get(recipient.id);
      const recipientWs = recipientSessionId ? this.clients.get(recipientSessionId) : null;
      
      if (!recipientWs || recipientWs.readyState !== WebSocket.OPEN) {
        this.sendToClient(ws, {
          type: 'share_response',
          data: { 
            success: false, 
            message: 'Người dùng không online. Họ cần mở ứng dụng để nhận file.' 
          }
        });
        return;
      }

      // Create share record with pending status
      const shareToken = nanoid(32);
      const shareData = {
        fileId: data.fileId,
        sharedBy: ws.userId!,
        sharedWith: data.recipientEmail,
        permission: data.permission,
        shareToken,
        status: 'pending'
      };

      const share = await storage.createFileShare(shareData);

      // Create notification for recipient
      await storage.createNotification({
        userId: recipient.id,
        type: 'share_request',
        title: 'Yêu cầu chia sẻ file',
        message: `${data.senderName} muốn chia sẻ file "${data.fileName}" với bạn`,
        metadata: JSON.stringify({
          shareId: share.id,
          fileId: data.fileId,
          fileName: data.fileName,
          senderName: data.senderName,
          permission: data.permission
        })
      });

      // Send real-time notification to recipient
      this.sendToClient(recipientWs, {
        type: 'share_request',
        data: {
          shareId: share.id,
          fileName: data.fileName,
          senderName: data.senderName,
          permission: data.permission,
          message: `${data.senderName} muốn chia sẻ file "${data.fileName}" với bạn`
        }
      });

      // Confirm to sender
      this.sendToClient(ws, {
        type: 'share_response',
        data: { 
          success: true, 
          message: 'Yêu cầu chia sẻ đã được gửi. Đang chờ phản hồi từ người nhận.' 
        }
      });

      console.log(`Share request sent from user ${ws.userId} to ${recipient.email}`);
    } catch (error) {
      console.error('Error handling share request:', error);
      this.sendToClient(ws, {
        type: 'share_response',
        data: { 
          success: false, 
          message: 'Có lỗi xảy ra khi gửi yêu cầu chia sẻ' 
        }
      });
    }
  }

  private async handleShareResponse(ws: WebSocketWithSession, data: { 
    shareId: number, 
    accepted: boolean, 
    senderName: string,
    fileName: string 
  }) {
    try {
      const status = data.accepted ? 'accepted' : 'rejected';
      
      // Update share status
      await storage.updateShareStatus(data.shareId, status);

      // Get the share to find the sender
      const shareData = await storage.getSharedFilesByUserId(ws.userId!);
      const share = shareData.find(s => s.id === data.shareId);
      
      if (share) {
        // Find sender's session
        const senderSessionId = this.userSessions.get(share.sharedBy);
        const senderWs = senderSessionId ? this.clients.get(senderSessionId) : null;

        // Create notification for sender
        await storage.createNotification({
          userId: share.sharedBy,
          type: data.accepted ? 'share_accepted' : 'share_rejected',
          title: data.accepted ? 'Chia sẻ được chấp nhận' : 'Chia sẻ bị từ chối',
          message: data.accepted 
            ? `File "${data.fileName}" đã được chia sẻ thành công`
            : `Người dùng đã từ chối nhận file "${data.fileName}"`,
          metadata: JSON.stringify({
            shareId: data.shareId,
            fileName: data.fileName,
            accepted: data.accepted
          })
        });

        // Send real-time notification to sender if online
        if (senderWs && senderWs.readyState === WebSocket.OPEN) {
          this.sendToClient(senderWs, {
            type: 'share_response',
            data: {
              shareId: data.shareId,
              accepted: data.accepted,
              fileName: data.fileName,
              message: data.accepted 
                ? `File "${data.fileName}" đã được chia sẻ thành công`
                : `Người dùng đã từ chối nhận file "${data.fileName}"`
            }
          });
        }
      }

      // Confirm to recipient
      this.sendToClient(ws, {
        type: 'notification',
        data: { 
          message: data.accepted 
            ? 'Bạn đã chấp nhận chia sẻ file' 
            : 'Bạn đã từ chối chia sẻ file' 
        }
      });

      console.log(`Share ${data.accepted ? 'accepted' : 'rejected'} by user ${ws.userId}`);
    } catch (error) {
      console.error('Error handling share response:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Có lỗi xảy ra khi xử lý phản hồi' }
      });
    }
  }

  private async handleDisconnection(ws: WebSocketWithSession) {
    if (ws.sessionId) {
      this.clients.delete(ws.sessionId);
    }
    
    if (ws.userId) {
      // Remove user session mapping
      this.userSessions.delete(ws.userId);
      
      // Update database to mark user as offline
      try {
        await storage.setUserOffline(ws.userId);
        console.log(`User ${ws.userId} is now offline`);
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    }
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public sendNotificationToUser(userId: number, notification: any) {
    const sessionId = this.userSessions.get(userId);
    if (sessionId) {
      const ws = this.clients.get(sessionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, {
          type: 'notification',
          data: notification
        });
        return true;
      }
    }
    return false;
  }

  public isUserOnline(userId: number): boolean {
    const sessionId = this.userSessions.get(userId);
    if (sessionId) {
      const ws = this.clients.get(sessionId);
      return ws ? ws.readyState === WebSocket.OPEN : false;
    }
    return false;
  }
}

export const wsManager = new WebSocketManager();