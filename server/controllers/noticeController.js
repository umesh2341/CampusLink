import pool from '../db/pool.js';

// GET /api/notices
// Retrieve active notices (published in the past, expires in the future or never)
export const getNotices = async (req, res) => {
  try {
    const query = `
      SELECT id, title, category, body, published_at, expires_at, created_at
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
