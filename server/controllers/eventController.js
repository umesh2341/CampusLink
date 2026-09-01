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
        e.club_id,
        e.${evtClub} AS organizing_club,
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
// Create a new event — immediately visible, no approval gate
export const createEvent = async (req, res) => {
  const {
    title,
    description,
    start_time,
    end_time,
    building_id,
    club_id,
    organizing_club,
    image_url,
    registration_url,
    floor,
    room_number,
    tags,
  } = req.body;

  // Basic validation — club_id is optional (nullable FK); organizer_name is required when club_id is absent
  const hasClubId = club_id && club_id !== 'null';
  const hasOrganizerName = organizing_club && organizing_club.trim().length > 0;
  if (!title || !description || !start_time || !end_time || !building_id || (!hasClubId && !hasOrganizerName)) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  try {
    const schema = await detectSchema();
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;

    const eventTags = Array.isArray(tags) ? tags : [];

    // Resolve building_id to UUID if svg_element_id was passed
    let resolvedBuildingId = building_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(building_id)) {
      const bRes = await pool.query(
        'SELECT id FROM buildings WHERE svg_element_id = $1 OR id::text = $1 LIMIT 1',
        [building_id]
      );
      if (bRes.rows.length > 0) {
        resolvedBuildingId = bRes.rows[0].id;
      }
    }

    const query = `
      INSERT INTO events (
        title, description, start_time, end_time, building_id, 
        club_id, ${evtClub}, image_url, ${evtReg}, floor, room_number, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *, ${evtClub} AS organizing_club, ${evtReg} AS registration_url;
    `;
    const { rows } = await pool.query(query, [
      title,
      description,
      start_time,
      end_time,
      resolvedBuildingId,
      hasClubId ? club_id : null,
      organizing_club || null,
      image_url || null,
      registration_url || null,
      floor || null,
      room_number || null,
      eventTags,
    ]);
    
    const newEvent = rows[0];
    
    // Dispatch push notification immediately — unconditionally
    dispatchEventPushNotification(newEvent);
    
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
