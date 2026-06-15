import { Router } from 'express';
import { pool } from './db.js';
import { broadcastNotification } from './notifications-routes.js';
import { createNotification } from './db.js';

const router = Router();

function makeThreadKey(a, b) {
    return [a, b].sort().join('::');
}

// GET /api/chat/conversations
router.get('/conversations', async (req, res) => {
    const userId = req.session.user.id;
    try {
        const { rows } = await pool.query(`
            SELECT DISTINCT ON (cm.thread_key)
                cm.thread_key,
                cm.content AS last_message,
                cm.created_at AS last_message_at,
                CASE WHEN cm.sender_id = $1 THEN cm.receiver_id ELSE cm.sender_id END AS other_id,
                u.full_name AS other_name,
                u.email AS other_email,
                (SELECT COUNT(*) FROM chat_messages
                    WHERE thread_key = cm.thread_key AND receiver_id = $1 AND read = FALSE) AS unread_count
            FROM chat_messages cm
            JOIN users u ON u.id = CASE WHEN cm.sender_id = $1 THEN cm.receiver_id ELSE cm.sender_id END
            WHERE cm.sender_id = $1 OR cm.receiver_id = $1
            ORDER BY cm.thread_key, cm.created_at DESC
        `, [userId]);
        res.json({ conversations: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat/messages/:threadKey
router.get('/messages/:threadKey', async (req, res) => {
    const userId = req.session.user.id;
    const { threadKey } = req.params;
    if (!threadKey.includes(userId)) return res.status(403).json({ error: 'Forbidden' });
    try {
        const { rows } = await pool.query(`
            SELECT cm.*, u.full_name AS sender_name, u.email AS sender_email
            FROM chat_messages cm
            JOIN users u ON u.id = cm.sender_id
            WHERE cm.thread_key = $1
            ORDER BY cm.created_at ASC
            LIMIT 200
        `, [threadKey]);
        // Mark as read
        await pool.query(
            `UPDATE chat_messages SET read = TRUE WHERE thread_key = $1 AND receiver_id = $2 AND read = FALSE`,
            [threadKey, userId]
        );
        res.json({ messages: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat/messages
router.post('/messages', async (req, res) => {
    const senderId = req.session.user.id;
    const { receiver_id, content, type = 'text' } = req.body;
    if (!receiver_id || !content?.trim()) return res.status(400).json({ error: 'receiver_id and content required' });
    const threadKey = makeThreadKey(senderId, receiver_id);
    try {
        const { rows } = await pool.query(`
            INSERT INTO chat_messages (sender_id, receiver_id, thread_key, content, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [senderId, receiver_id, threadKey, content.trim(), type]);
        const msg = rows[0];
        // Get sender info for notification
        const { rows: senderRows } = await pool.query(`SELECT full_name, email FROM users WHERE id = $1`, [senderId]);
        const senderName = senderRows[0]?.name || senderRows[0]?.email || 'Someone';
        // Broadcast SSE + create DB notification
        const notification = { type: 'chat', title: `New message from ${senderName}`, body: content.trim().slice(0, 80), data: { thread_key: threadKey, sender_id: senderId } };
        broadcastNotification(receiver_id, notification);
        await createNotification({ userId: receiver_id, type: 'chat', title: `New message from ${senderName}`, body: content.trim().slice(0, 80), data: notification.data });
        res.json({ message: msg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat/users - list all users to start new conversations
router.get('/users', async (req, res) => {
    const userId = req.session.user.id;
    const q = req.query.q || '';
    try {
        const { rows } = await pool.query(`
            SELECT id, name, email, user_type FROM users
            WHERE id != $1 AND ($2 = '' OR name ILIKE $3 OR email ILIKE $3)
            ORDER BY name LIMIT 30
        `, [userId, q, `%${q}%`]);
        res.json({ users: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat/unread-count
router.get('/unread-count', async (req, res) => {
    const userId = req.session.user.id;
    try {
        const { rows } = await pool.query(
            `SELECT COUNT(*) FROM chat_messages WHERE receiver_id = $1 AND read = FALSE`,
            [userId]
        );
        res.json({ count: parseInt(rows[0].count) });
    } catch (err) {
        res.json({ count: 0 });
    }
});

export default router;
