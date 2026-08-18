import pool from '../db/pool.js';
import { dispatchEventPushNotification } from '../services/pushService.js';

// GET /api/events/:id
// Retrieve details for a single event
export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT e.*, b.name AS building_name, b.category AS building_category
      FROM events e
      JOIN buildings b ON e.building_id = b.id
      WHERE e.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/events
// Create a new event (pending approval by default)
export const createEvent = async (req, res) => {
  const {
    title,
    description,
    start_time,
    end_time,
    building_id,
    organizing_club,
    image_url,
    registration_url,
    floor,
    room_number,
    tags,
    auto_approve,
  } = req.body;

  // Basic validation
  if (!title || !description || !start_time || !end_time || !building_id || !organizing_club) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  try {
    const eventTags = Array.isArray(tags) ? tags : [];

    const isApproved = auto_approve === true || process.env.NODE_ENV === 'development';

    const query = `
      INSERT INTO events (
        title, description, start_time, end_time, building_id, 
        organizing_club, image_url, registration_url, floor, room_number, tags, is_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      title,
      description,
      start_time,
      end_time,
      building_id,
      organizing_club,
      image_url || null,
      registration_url || null,
      floor || null,
      room_number || null,
      eventTags,
      isApproved,
    ]);
    
    const newEvent = rows[0];
    
    // If auto-approved immediately, dispatch notifications
    if (isApproved) {
      dispatchEventPushNotification(newEvent);
    }
    
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/events/:id/approve
// Explicitly approve an event and send push notifications
export const approveEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE events
      SET is_approved = TRUE
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const approvedEvent = rows[0];
    
    // Dispatch push notifications for the newly approved event
    dispatchEventPushNotification(approvedEvent);

    res.json(approvedEvent);
  } catch (error) {
    console.error(`Error approving event ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
