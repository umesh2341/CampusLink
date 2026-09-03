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

    // Upsert default preferences row using user_id if logged in, else subscription_id
    if (userId) {
      const checkRes = await pool.query(`SELECT 1 FROM subscription_preferences WHERE user_id = $1`, [userId]);
      if (checkRes.rowCount === 0) {
        await pool.query(`INSERT INTO subscription_preferences (user_id) VALUES ($1)`, [userId]);
      }
    } else {
      const checkRes = await pool.query(`SELECT 1 FROM subscription_preferences WHERE subscription_id = $1`, [subscription.id]);
      if (checkRes.rowCount === 0) {
        await pool.query(`INSERT INTO subscription_preferences (subscription_id) VALUES ($1)`, [subscription.id]);
      }
    }

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

// GET /api/push/preferences?endpoint=... OR ?user_id=...
export const getPreferences = async (req, res) => {
  const { endpoint, user_id } = req.query;
  if (!endpoint && !user_id) {
    return res.status(400).json({ error: 'endpoint or user_id is required' });
  }

  try {
    let rows;
    if (user_id) {
      // Direct user_id lookup - most reliable path for logged-in users
      const result = await pool.query(
        `SELECT muted_club_ids, enabled_tags, enabled_notice_years, updated_at
         FROM subscription_preferences WHERE user_id = $1`,
        [user_id]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT sp.muted_club_ids, sp.enabled_tags, sp.enabled_notice_years, sp.updated_at
         FROM push_subscriptions ps
         JOIN subscription_preferences sp ON (
           (ps.user_id IS NOT NULL AND sp.user_id = ps.user_id) OR
           (ps.user_id IS NULL AND sp.subscription_id = ps.id)
         )
         WHERE ps.endpoint = $1`,
        [endpoint]
      );
      rows = result.rows;
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching push preferences:', error);
    res.status(500).json({ error: 'Failed to fetch push preferences' });
  }
};

// PATCH /api/push/preferences
export const updatePreferences = async (req, res) => {
  const { endpoint, user_id, muted_club_ids, enabled_tags, enabled_notice_years } = req.body;
  if (!endpoint && !user_id) {
    return res.status(400).json({ error: 'endpoint or user_id is required' });
  }

  try {
    const mutedArray = Array.isArray(muted_club_ids) ? muted_club_ids : [];
    const tagsArray = Array.isArray(enabled_tags) ? enabled_tags : ['hackathon','tech_event','workshop','cultural_event','college_official'];
    const noticeYearsArray = Array.isArray(enabled_notice_years) ? enabled_notice_years : ['1st_year', '2nd_year', '3rd_year', '4th_year', 'general'];

    let rows;

    if (user_id) {
      // Upsert directly by user_id - most reliable path for logged-in users
      const result = await pool.query(
        `INSERT INTO subscription_preferences (user_id, muted_club_ids, enabled_tags, enabled_notice_years, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [user_id, mutedArray, tagsArray, noticeYearsArray]
      );
      if (result.rowCount === 0) {
        // Row already exists, UPDATE it
        const updateResult = await pool.query(
          `UPDATE subscription_preferences
           SET muted_club_ids = $2, enabled_tags = $3, enabled_notice_years = $4, updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          [user_id, mutedArray, tagsArray, noticeYearsArray]
        );
        rows = updateResult.rows;
      } else {
        rows = result.rows;
      }
    } else {
      // Fallback: update by endpoint (anonymous users)
      const result = await pool.query(
        `UPDATE subscription_preferences sp
         SET muted_club_ids = $1, enabled_tags = $2, enabled_notice_years = $3, updated_at = NOW()
         FROM push_subscriptions ps
         WHERE (
           (ps.user_id IS NOT NULL AND sp.user_id = ps.user_id) OR
           (ps.user_id IS NULL AND sp.subscription_id = ps.id)
         ) AND ps.endpoint = $4
         RETURNING sp.*`,
        [mutedArray, tagsArray, noticeYearsArray, endpoint]
      );
      rows = result.rows;
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found for the given user/endpoint' });
    }

    res.json({ status: 'updated', preferences: rows[0] });
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
