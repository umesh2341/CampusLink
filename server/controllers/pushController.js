import pool from '../db/pool.js';
import { sendPushNotification } from '../services/pushService.js';

// GET /api/push/vapid-public-key
export const getVapidPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID public key not configured on server' });
  }
  res.json({ publicKey });
};

// POST /api/push/subscribe
export const subscribePush = async (req, res) => {
  const { endpoint, keys, userId } = req.body;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Invalid push subscription payload' });
  }

  try {
    // Upsert into push_subscriptions
    const subQuery = `
      INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key, user_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) 
      DO UPDATE SET p256dh_key = EXCLUDED.p256dh_key, auth_key = EXCLUDED.auth_key, user_id = EXCLUDED.user_id
      RETURNING *;
    `;
    const { rows } = await pool.query(subQuery, [endpoint, keys.p256dh, keys.auth, userId || null]);
    const subscription = rows[0];

    // Upsert default preferences row
    const prefQuery = `
      INSERT INTO subscription_preferences (subscription_id)
      VALUES ($1)
      ON CONFLICT (subscription_id) DO NOTHING;
    `;
    await pool.query(prefQuery, [subscription.id]);

    res.status(201).json({
      status: 'subscribed',
      id: subscription.id,
      endpoint: subscription.endpoint,
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
};

// POST /api/push/unsubscribe
export const unsubscribePush = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ status: 'unsubscribed' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
};

// GET /api/push/preferences?endpoint=...
export const getPreferences = async (req, res) => {
  const { endpoint } = req.query;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    const query = `
      SELECT sp.subscription_id, sp.muted_club_ids, sp.enabled_tags, sp.updated_at
      FROM subscription_preferences sp
      JOIN push_subscriptions ps ON sp.subscription_id = ps.id
      WHERE ps.endpoint = $1;
    `;
    const { rows } = await pool.query(query, [endpoint]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching push preferences:', error);
    res.status(500).json({ error: 'Failed to fetch push preferences' });
  }
};

// PATCH /api/push/preferences
export const updatePreferences = async (req, res) => {
  const { endpoint, muted_club_ids, enabled_tags } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    const mutedArray = Array.isArray(muted_club_ids) ? muted_club_ids : [];
    const tagsArray = Array.isArray(enabled_tags) ? enabled_tags : ['hackathon','tech_event','workshop','cultural_event','college_official'];

    const query = `
      UPDATE subscription_preferences sp
      SET muted_club_ids = $1, enabled_tags = $2, updated_at = NOW()
      FROM push_subscriptions ps
      WHERE sp.subscription_id = ps.id AND ps.endpoint = $3
      RETURNING sp.*;
    `;
    const { rows } = await pool.query(query, [mutedArray, tagsArray, endpoint]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found for the given endpoint' });
    }

    res.json({
      status: 'updated',
      preferences: rows[0],
    });
  } catch (error) {
    console.error('Error updating push preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// POST /api/push/notify-admins-role-request
export const notifyAdminsRoleRequest = async (req, res) => {
  const { requesterName, requesterEmail, requestedRole } = req.body;
  if (!requesterName || !requestedRole) {
    return res.status(400).json({ error: 'Missing requester details' });
  }

  try {
    const adminQuery = `
      SELECT ps.endpoint, ps.p256dh_key, ps.auth_key
      FROM push_subscriptions ps
      JOIN profiles p ON ps.user_id = p.id
      WHERE p.role = 'admin';
    `;
    const { rows: adminSubscriptions } = await pool.query(adminQuery);

    const payload = {
      title: 'New Role Request',
      body: `${requesterName} (${requesterEmail || 'No email'}) wants ${requestedRole} access.`,
      icon: '/campuslink_logo_512.png',
      data: { url: '/admin/requests' }
    };

    const results = await Promise.allSettled(
      adminSubscriptions.map(sub => sendPushNotification(sub, payload))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    res.json({ status: 'sent', attempted: adminSubscriptions.length, successful: successCount });
  } catch (error) {
    console.error('Error notifying admins:', error);
    res.status(500).json({ error: 'Failed to notify admins' });
  }
};
