import pool from '../db/pool.js';
import { dispatchEventPushNotification } from '../services/pushService.js';
import { detectSchema } from '../db/schemaHelper.js';

// GET /api/events/:id
// Retrieve details for a single event
export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const schema = await detectSchema();
    const bldCat = schema.buildings.category;
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;

    const query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        e.building_id,
        e.image_url,
        e.${evtReg} AS registration_url,
        e.floor,
        e.room_number,
        e.${evtClub} AS organizing_club,
        e.is_approved,
        e.created_at,
        b.name AS building_name,
        b.${bldCat} AS building_category
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
    const schema = await detectSchema();
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;

    const eventTags = Array.isArray(tags) ? tags : [];

    const isApproved = auto_approve === true || process.env.NODE_ENV === 'development';

    const query = `
      INSERT INTO events (
        title, description, start_time, end_time, building_id, 
        ${evtClub}, image_url, ${evtReg}, floor, room_number, tags, is_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *, ${evtClub} AS organizing_club, ${evtReg} AS registration_url;
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
    const schema = await detectSchema();
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;

    const query = `
      UPDATE events
      SET is_approved = TRUE
      WHERE id = $1
      RETURNING *, ${evtClub} AS organizing_club, ${evtReg} AS registration_url;
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
