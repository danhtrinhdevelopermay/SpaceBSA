import express from 'express';
import { storage } from '../storage';
import { insertNotificationSchema, insertUserSessionSchema } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

// Get notifications for a user
router.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const notifications = await storage.getNotificationsByUserId(userId);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await storage.markNotificationAsRead(notificationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Create a notification (internal use)
router.post('/api/notifications', async (req, res) => {
  try {
    const notificationData = insertNotificationSchema.parse(req.body);
    const notification = await storage.createNotification(notificationData);
    res.json({ notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid notification data', details: error.errors });
    }
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Update user session (for tracking online status)
router.post('/api/sessions', async (req, res) => {
  try {
    const sessionData = insertUserSessionSchema.parse(req.body);
    const session = await storage.createOrUpdateUserSession(sessionData);
    res.json({ session });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid session data', details: error.errors });
    }
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Get online users
router.get('/api/sessions/online', async (req, res) => {
  try {
    const onlineUsers = await storage.getOnlineUsers();
    res.json({ users: onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

export default router;