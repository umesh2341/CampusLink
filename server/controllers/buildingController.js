import pool from '../db/pool.js';

// GET /api/buildings
// Retrieve all buildings with their categories, names, and active event counts
export const getBuildings = async (req, res) => {
  try {
    const query = `
      SELECT b.*, 
             COALESCE(COUNT(e.id) FILTER (WHERE e.is_approved = TRUE AND e.end_time >= NOW()), 0)::INTEGER AS active_event_count,
             MAX(e.created_at) FILTER (WHERE e.is_approved = TRUE AND e.end_time >= NOW()) AS latest_event_created_at
      FROM buildings b
      LEFT JOIN events e ON b.id = e.building_id
      GROUP BY b.id
      ORDER BY b.name ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/buildings/:id/events
// Retrieve active/approved events for a specific building
export const getBuildingEvents = async (req, res) => {
  const { id } = req.params;
  try {
    // We fetch events where is_approved = true AND end_time >= NOW()
    const query = `
      SELECT * FROM events
      WHERE building_id = $1 AND is_approved = TRUE AND end_time >= NOW()
      ORDER BY start_time ASC;
    `;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching events for building ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
