import pool from '../db/pool.js';
import { dispatchNoticePushNotification } from '../services/pushService.js';

// GET /api/notices
// Retrieve active notices (published in the past, expires in the future or never)
export const getNotices = async (req, res) => {
  try {
    const query = `
      SELECT id, title, category, body, published_at, expires_at, document_url, created_at
      FROM notices
      WHERE published_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY published_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/notices
export const createNotice = async (req, res) => {
  try {
    const { title, category, body, document_url, expires_in_days, send_push } = req.body;
    if (!title || !category || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // published_at is set to NOW() by default, we just calculate expires_at
    let query;
    let params;
    
    if (expires_in_days) {
      query = `
        INSERT INTO notices (title, category, body, document_url, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::INTERVAL)
        RETURNING *;
      `;
      params = [title, category, body, document_url || null, parseInt(expires_in_days, 10)];
    } else {
      query = `
        INSERT INTO notices (title, category, body, document_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      params = [title, category, body, document_url || null];
    }
    
    const { rows } = await pool.query(query, params);
    const newNotice = rows[0];

    if (send_push) {
      dispatchNoticePushNotification(newNotice);
    }

    res.status(201).json(newNotice);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
