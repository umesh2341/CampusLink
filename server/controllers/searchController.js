import pool from '../db/pool.js';
import { detectSchema } from '../db/schemaHelper.js';

// Format plain text directional answer: [Block/Building Name] -> [Floor] -> [Room Number]
const formatDirectionalAnswer = (buildingName, floor, roomNumber) => {
  const parts = [buildingName];
  if (floor && floor.trim()) {
    const f = floor.trim();
    const formattedFloor = (f.toLowerCase().includes('floor') || f.toLowerCase().includes('ground')) ? f : `${f} Floor`;
    parts.push(formattedFloor);
  }
  if (roomNumber && roomNumber.trim()) {
    const r = roomNumber.trim();
    const formattedRoom = (r.toLowerCase().includes('room') || r.toLowerCase().includes('lab') || r.toLowerCase().includes('hall')) ? r : `Room ${r}`;
    parts.push(formattedRoom);
  }
  return parts.join(' -> ');
};

// GET /api/search?q=<query>
export const search = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.json({ buildings: [], departments: [], events: [], results: [] });
  }

  const queryPattern = `%${q.trim()}%`;
  const cleanQuery = `%${q.trim().replace(/[-\s]/g, '')}%`;

  try {
    const schema = await detectSchema();
    const bldCat = schema.buildings.category;
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;

    // 1. Search buildings by name, svg_element_id, or stripped whitespace/hyphens
    const bldQuery = `
      SELECT 
        b.id,
        b.name,
        b.${bldCat} AS category,
        b.svg_element_id
      FROM buildings b
      WHERE b.name ILIKE $1 
         OR b.svg_element_id ILIKE $1
         OR replace(replace(b.name, ' ', ''), '-', '') ILIKE $2
         OR replace(replace(b.svg_element_id, ' ', ''), '-', '') ILIKE $2
      ORDER BY b.name ASC
      LIMIT 10;
    `;
    const bldRes = await pool.query(bldQuery, [queryPattern, cleanQuery]);

    const buildings = bldRes.rows.map((b) => ({
      id: b.id,
      type: 'building',
      name: b.name,
      building_id: b.id,
      building_name: b.name,
      building_svg_element_id: b.svg_element_id,
      building_category: b.category,
      location_string: b.name,
    }));

    // 2. Search departments by name OR any alias in aliases array
    const deptQuery = `
      SELECT 
        d.id,
        d.name,
        d.floor,
        d.room_number,
        d.aliases,
        b.id AS building_id,
        b.name AS building_name,
        b.svg_element_id AS building_svg_element_id,
        b.${bldCat} AS building_category
      FROM departments d
      JOIN buildings b ON d.building_id = b.id
      WHERE d.name ILIKE $1 
         OR EXISTS (
              SELECT 1 FROM unnest(d.aliases) alias WHERE alias ILIKE $1
            )
      ORDER BY d.name ASC
      LIMIT 10;
    `;
    const deptRes = await pool.query(deptQuery, [queryPattern]);

    const departments = deptRes.rows.map((d) => ({
      id: d.id,
      type: 'department',
      name: d.name,
      building_id: d.building_id,
      building_name: d.building_name,
      building_svg_element_id: d.building_svg_element_id,
      building_category: d.building_category,
      floor: d.floor,
      room_number: d.room_number,
      aliases: d.aliases,
      location_string: formatDirectionalAnswer(d.building_name, d.floor, d.room_number),
    }));

    // 3. Search active events by title, description, or organizing club
    const eventQuery = `
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
        b.id AS building_id,
        b.name AS building_name,
        b.svg_element_id AS building_svg_element_id,
        b.${bldCat} AS building_category
      FROM events e
      JOIN buildings b ON e.building_id = b.id
      WHERE e.end_time >= NOW()
        AND (e.title ILIKE $1 OR e.description ILIKE $1 OR e.${evtClub} ILIKE $1)
      ORDER BY e.start_time ASC
      LIMIT 10;
    `;
    const eventRes = await pool.query(eventQuery, [queryPattern]);

    const events = eventRes.rows.map((e) => ({
      id: e.id,
      type: 'event',
      title: e.title,
      description: e.description,
      start_time: e.start_time,
      end_time: e.end_time,
      building_id: e.building_id,
      building_name: e.building_name,
      building_svg_element_id: e.building_svg_element_id,
      building_category: e.building_category,
      organizing_club: e.organizing_club,
      floor: e.floor,
      room_number: e.room_number,
      registration_url: e.registration_url,
      image_url: e.image_url,
      location_string: formatDirectionalAnswer(e.building_name, e.floor, e.room_number),
    }));

    const results = [...buildings, ...departments, ...events];

    res.json({
      query: q.trim(),
      buildings,
      departments,
      events,
      results,
    });
  } catch (error) {
    console.error('Error executing search query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
