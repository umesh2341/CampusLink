import pool from '../db/pool.js';

// GET /api/clubs
export const getClubs = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, logo_url FROM clubs ORDER BY name ASC');
    
    // If no clubs in DB yet, provide standard fallback campus clubs
    if (rows.length === 0) {
      const fallbackClubs = [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Coding Club', logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100' },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Robotics Society', logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=100' },
        { id: '33333333-3333-3333-3333-333333333333', name: 'Cultural Committee', logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100' },
        { id: '44444444-4444-4444-4444-444444444444', name: 'Sports Club', logo_url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?w=100' },
        { id: '55555555-5555-5555-5555-555555555555', name: 'Literary Society', logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=100' },
      ];
      return res.json(fallbackClubs);
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};
