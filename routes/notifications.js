/**
 * Notification API Routes
 *
 * Provides real-time notification management with SSE streaming
 * Integrates with PostgreSQL notifications table
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const authService = require('../src/services/auth-service');

// SSE clients registry
const sseClients = new Map();

// Optional authentication middleware for SSE
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      // Use the same JWT verification as auth service
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { userId: decoded.sub, email: decoded.email, role: decoded.role };
    } catch (error) {
      // Token invalid but we allow anonymous access for SSE
      req.user = null;
    }
  }

  next();
};

/**
 * GET /api/notifications
 * Get notifications for authenticated user
 */
router.get('/', authService.authenticateToken, async (req, res) => {
  try {
    console.log('[Notifications] GET request received');
    console.log('[Notifications] User:', req.user);

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      console.log('[Notifications] No userId found in request');
      return res.status(401).json({ error: 'Access token required' });
    }

    console.log('[Notifications] Fetching notifications for user:', userId);
    const { limit = 20, unread_only = false } = req.query;
    const db = getDatabase();

    console.log('[Notifications] Database instance:', !!db);
    await db.initialize();
    console.log('[Notifications] Database initialized');

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(parseInt(limit, 10));

    console.log('[Notifications] Executing query with params:', params);
    const result = await db.query(query, params);
    console.log('[Notifications] Query result rows:', result.rows.length);

    res.json({
      success: true,
      notifications: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    console.error('[Notifications] Error message:', error.message);
    console.error('[Notifications] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      type,
      title,
      message,
      priority = 'normal',
      category,
      action_url,
      action_label,
      data = {}
    } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, type, title, message'
      });
    }

    const db = getDatabase();

    const result = await db.query(
      `INSERT INTO notifications
       (user_id, type, title, message, priority, category, action_url, action_label, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, type, title, message, priority, category, action_url, action_label, JSON.stringify(data)]
    );

    const notification = result.rows[0];

    // Broadcast to SSE clients
    broadcastNotification(user_id, notification);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authService.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const { id } = req.params;
    const db = getDatabase();

    const result = await db.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for user
 */
router.put('/read-all', authService.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const db = getDatabase();

    const result = await db.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE user_id = $1 AND read = false
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length
    });
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notifications'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authService.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const { id } = req.params;
    const db = getDatabase();

    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to real-time notifications (compatibility endpoint)
 */
router.post('/subscribe', authService.authenticateToken, async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Access token required' });
  }

  res.json({
    success: true,
    message: 'Use /api/notifications/stream for SSE connection',
    streamUrl: '/api/notifications/stream'
  });
});

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
router.get('/stream', optionalAuth, (req, res) => {
  const userId = req.user?.userId || req.user?.id || 'anonymous';

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Store client connection
  if (!sseClients.has(userId)) {
    sseClients.set(userId, []);
  }
  sseClients.get(userId).push(res);

  console.log(`[Notifications] SSE client connected: ${userId} (total: ${sseClients.get(userId).length})`);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000); // Every 30 seconds

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);

    const clients = sseClients.get(userId);
    if (clients) {
      const index = clients.indexOf(res);
      if (index > -1) {
        clients.splice(index, 1);
      }

      if (clients.length === 0) {
        sseClients.delete(userId);
      }
    }

    console.log(`[Notifications] SSE client disconnected: ${userId}`);
  });
});

/**
 * Broadcast notification to SSE clients
 */
function broadcastNotification(userId, notification) {
  const clients = sseClients.get(userId);
  if (!clients || clients.length === 0) return;

  const data = JSON.stringify({
    type: 'notification',
    notification
  });

  clients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('[Notifications] Error broadcasting to client:', error);
    }
  });

  console.log(`[Notifications] Broadcasted to ${clients.length} client(s) for user ${userId}`);
}

/**
 * Broadcast system-wide notification
 * Persists to database AND broadcasts via SSE
 */
async function broadcastSystemNotification(userId, notification) {
  try {
    const db = getDatabase();
    await db.initialize();

    // Store in database with 'local-dev' as user for all system notifications
    // This ensures they show up in the frontend without auth requirements
    const targetUserId = 'local-dev';

    const result = await db.query(
      `INSERT INTO notifications
       (user_id, type, title, message, priority, category, action_url, action_label, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        targetUserId,
        notification.type || 'system.info',
        notification.title,
        notification.message,
        notification.priority || 'normal',
        notification.category || 'system',
        notification.action_url || null,
        notification.action_label || null,
        JSON.stringify(notification.data || {})
      ]
    );

    const savedNotification = result.rows[0];

    // Broadcast via SSE to all connected clients
    for (const [clientUserId, clients] of sseClients.entries()) {
      const data = JSON.stringify({
        type: 'system_notification',
        notification: savedNotification
      });

      clients.forEach(client => {
        try {
          client.write(`data: ${data}\n\n`);
        } catch (error) {
          console.error('[Notifications] Error broadcasting system notification:', error);
        }
      });
    }

    return savedNotification;
  } catch (error) {
    console.error('[Notifications] Error persisting system notification:', error);
    // Still try to broadcast even if database fails
    for (const [userId, clients] of sseClients.entries()) {
      const data = JSON.stringify({
        type: 'system_notification',
        notification
      });

      clients.forEach(client => {
        try {
          client.write(`data: ${data}\n\n`);
        } catch (error) {
          console.error('[Notifications] Error broadcasting system notification:', error);
        }
      });
    }
  }
}

module.exports = {
  router,
  broadcastNotification,
  broadcastSystemNotification
};
