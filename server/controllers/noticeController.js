import pool from '../db/pool.js';
import { dispatchNoticePushNotification } from '../services/pushService.js';

const VALID_TARGET_YEARS = ['1st', '2nd', '3rd', '4th', 'everyone'];

// GET /api/notices
// Retrieve active notices (published in the past, expires in the future or never)
export const getNotices = async (req, res) => {
  try {
    const query = `
      SELECT id, title, category, body, published_at, expires_at, document_url, created_at, target_year
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
    const { title, category, body, document_url, expires_in_days, send_push, target_year } = req.body;
    if (!title || !category || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate target_year
    const safeTargetYear = VALID_TARGET_YEARS.includes(target_year) ? target_year : 'everyone';
    
    // published_at is set to NOW() by default, we just calculate expires_at
    let query;
    let params;
    
    if (expires_in_days) {
      query = `
        INSERT INTO notices (title, category, body, document_url, expires_at, target_year)
        VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::INTERVAL, $6)
        RETURNING *;
      `;
      params = [title, category, body, document_url || null, parseInt(expires_in_days, 10), safeTargetYear];
    } else {
      query = `
        INSERT INTO notices (title, category, body, document_url, target_year)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      params = [title, category, body, document_url || null, safeTargetYear];
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
