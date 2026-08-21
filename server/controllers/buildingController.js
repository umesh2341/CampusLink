import pool from '../db/pool.js';
import { detectSchema } from '../db/schemaHelper.js';
const FALLBACK_BUILDINGS = [
  { id: 'c-block', svg_element_id: 'c-block', name: 'C Block', category: 'academic', active_event_count: 0 },
  { id: 'd-block', svg_element_id: 'd-block', name: 'D Block', category: 'academic', active_event_count: 0 },
  { id: 'eblock', svg_element_id: 'eblock', name: 'E Block', category: 'academic', active_event_count: 0 },
  { id: 'f-block', svg_element_id: 'f-block', name: 'F Block', category: 'academic', active_event_count: 0 },
  { id: 'sc-block', svg_element_id: 'sc-block', name: 'Science Block', category: 'academic', active_event_count: 0 },
  { id: 'academic-block', svg_element_id: 'academic-block', name: 'Academic Block', category: 'academic', active_event_count: 0 },
  { id: 'center-of-datascience', svg_element_id: 'center-of-datascience', name: 'Center for Data Science', category: 'academic', active_event_count: 0 },
  { id: 'library', svg_element_id: 'library', name: 'Library', category: 'academic', active_event_count: 0 },
  { id: 'studentsection', svg_element_id: 'studentsection', name: 'Student Section', category: 'admin', active_event_count: 0 },
  { id: 'auditorium', svg_element_id: 'auditorium', name: 'Auditorium', category: 'other', active_event_count: 0 },
  { id: 'indoor-stadium', svg_element_id: 'indoor-stadium', name: 'Indoor Stadium', category: 'sports', active_event_count: 0 },
  { id: 'cricket-court1', svg_element_id: 'cricket-court1', name: 'Cricket Court', category: 'sports', active_event_count: 0 },
  { id: 'football-court1', svg_element_id: 'football-court1', name: 'Football Court 1', category: 'sports', active_event_count: 0 },
  { id: 'football-court2', svg_element_id: 'football-court2', name: 'Football Court 2', category: 'sports', active_event_count: 0 },
  { id: 'playground', svg_element_id: 'playground', name: 'Playground', category: 'sports', active_event_count: 0 },
  { id: 'gym', svg_element_id: 'gym', name: 'Gym', category: 'sports', active_event_count: 0 },
  { id: 'garden', svg_element_id: 'garden', name: 'Garden', category: 'gardens', active_event_count: 0 },
  { id: 'food-court', svg_element_id: 'food-court', name: 'Food Court', category: 'cafeteria', active_event_count: 0 },
  { id: 'electronic-office', svg_element_id: 'electronic-office', name: 'Electronics Office', category: 'academic', active_event_count: 0 },
  { id: 'lh1', svg_element_id: 'lh1', name: 'Ladies Hostel 1', category: 'hostel_girls', active_event_count: 0 },
  { id: 'lh2', svg_element_id: 'lh2', name: 'Ladies Hostel 2', category: 'hostel_girls', active_event_count: 0 },
  { id: 'lh3', svg_element_id: 'lh3', name: 'Ladies Hostel 3', category: 'hostel_girls', active_event_count: 0 },
  { id: 'lh4', svg_element_id: 'lh4', name: 'Ladies Hostel 4', category: 'hostel_girls', active_event_count: 0 },
  { id: 'lh5', svg_element_id: 'lh5', name: 'Ladies Hostel 5', category: 'hostel_girls', active_event_count: 0 },
  { id: 'bh1', svg_element_id: 'bh1', name: 'Boys Hostel 1', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh2', svg_element_id: 'bh2', name: 'Boys Hostel 2', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh5', svg_element_id: 'bh5', name: 'Boys Hostel 5', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh6', svg_element_id: 'bh6', name: 'Boys Hostel 6', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh7', svg_element_id: 'bh7', name: 'Boys Hostel 7', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh8', svg_element_id: 'bh8', name: 'Boys Hostel 8', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh9', svg_element_id: 'bh9', name: 'Boys Hostel 9', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh10', svg_element_id: 'bh10', name: 'Boys Hostel 10', category: 'hostel_boys', active_event_count: 0 },
  { id: 'bh12', svg_element_id: 'bh12', name: 'Boys Hostel 12', category: 'hostel_boys', active_event_count: 0 },
  { id: 'drive-ev', svg_element_id: 'drive-ev', name: 'EV Charging Station', category: 'other', active_event_count: 0 },
  { id: 'unknown1', svg_element_id: 'unknown1', name: 'Utility Building 1', category: 'other', active_event_count: 0 },
  { id: 'unknown', svg_element_id: 'unknown', name: 'Utility Building 2', category: 'other', active_event_count: 0 }
];

// GET /api/buildings
// Retrieve all buildings with their categories, names, and active event counts
export const getBuildings = async (req, res) => {
  try {
    const schema = await detectSchema();
    const bldCat = schema.buildings.category;
    const evtApprovedCond = schema.events.has_status 
      ? `(e.is_approved = TRUE OR e.status = 'approved')` 
      : `e.is_approved = TRUE`;

    const query = `
      SELECT b.id, b.svg_element_id, b.name, b.${bldCat} AS category, b.${bldCat} AS type,
             b.slug, b.entrance_x, b.entrance_y, b.description, b.contact_info, b.created_at,
             COALESCE(COUNT(e.id) FILTER (WHERE ${evtApprovedCond} AND e.end_time >= NOW()), 0)::INTEGER AS active_event_count,
             MAX(e.created_at) FILTER (WHERE ${evtApprovedCond} AND e.end_time >= NOW()) AS latest_event_created_at
      FROM buildings b
      LEFT JOIN events e ON b.id = e.building_id
      GROUP BY b.id
      ORDER BY b.name ASC;
    `;
    const { rows } = await pool.query(query);
    if (rows.length === 0) {
      return res.json(FALLBACK_BUILDINGS);
    }
    res.json(rows);
  } catch (error) {
    console.error('Error fetching buildings (using fallback):', error.message);
    res.json(FALLBACK_BUILDINGS);
  }
};

// GET /api/buildings/:id/events
// Retrieve active/approved events for a specific building
export const getBuildingEvents = async (req, res) => {
  const { id } = req.params;
  try {
    const schema = await detectSchema();
    const evtClub = schema.events.organizing_club;
    const evtReg = schema.events.registration_url;
    const evtApprovedCond = schema.events.has_status 
      ? `(is_approved = TRUE OR status = 'approved')` 
      : `is_approved = TRUE`;

    const query = `
      SELECT id, title, description, start_time, end_time, building_id, 
             image_url, ${evtReg} AS registration_url, floor, room_number, 
             tags, is_approved, club_id, ${evtClub} AS organizing_club
      FROM events
      WHERE building_id = $1 AND ${evtApprovedCond} AND end_time >= NOW()
      ORDER BY start_time ASC;
    `;
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching events for building ${id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
