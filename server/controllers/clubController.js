import pool from '../db/pool.js';

const fallbackClubs = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Coding Club',
    category: 'Technical',
    description: 'Official student developer community at ITER. Organizers of HackSOA, competitive programming contests, open-source sprints, and dev workshops.',
    logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160',
    banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    instagram: 'codingclub_iter',
    discord: 'https://discord.gg/codingclub',
    lead_name: 'Dev Lead',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Robotics Society',
    category: 'Technical',
    description: 'Hardware and robotics lab focusing on autonomous drones, line followers, combat robots, and IoT sensor networks.',
    logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=160',
    banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    instagram: 'robotics_soa',
    discord: 'https://discord.gg/robotics',
    lead_name: 'Robo Core',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Cultural Committee',
    category: 'Cultural',
    description: 'The creative heartbeat of the university — coordinating theatre, choreography, street plays, and cultural evenings.',
    logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160',
    banner_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    instagram: 'cultural_iter',
    discord: 'https://discord.gg/cultural',
    lead_name: 'Cultural Sec',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Sports Council',
    category: 'Sports',
    description: 'Promoting campus athletic culture through inter-hostel leagues, cricket championships, football tournaments, and indoor stadium games.',
    logo_url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?w=160',
    banner_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
    instagram: 'sports_iter',
    discord: 'https://discord.gg/sports',
    lead_name: 'Sports Captain',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Quiz Club',
    category: 'Literary',
    description: 'Host of weekly campus trivia nights, business quizzes, pop culture battles, and university representative teams.',
    logo_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=160',
    banner_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
    instagram: 'quizclub_soa',
    discord: 'https://discord.gg/quizclub',
    lead_name: 'Quiz Master',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'IEEE Student Branch',
    category: 'Technical',
    description: 'Premier technical professional chapter advancing technology through global webinars, AI symposiums, and research workshops.',
    logo_url: 'https://images.unsplash.com/photo-1591115411636-609b556f312e?w=160',
    banner_url: 'https://images.unsplash.com/photo-1591115411636-609b556f312e?w=800',
    instagram: 'ieee_iter',
    discord: 'https://discord.gg/ieee',
    lead_name: 'Chair IEEE',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Music Club',
    category: 'Cultural',
    description: 'Campus band and vocal collective performing live unplugged acoustic sets, food festival jams, and annual rock nights.',
    logo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160',
    banner_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    instagram: 'musicclub_iter',
    discord: 'https://discord.gg/musicclub',
    lead_name: 'Band Lead',
  },
];

// GET /api/clubs
export const getClubs = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clubs ORDER BY name ASC');
    
    if (rows.length === 0) {
      return res.json(fallbackClubs);
    }

    // Merge database records with fallback metadata if optional columns are null.
    // social_handles is a JSONB column in the live DB (may contain instagram, discord keys).
    const enriched = rows.map(r => {
      const fb = fallbackClubs.find(f => f.name.toLowerCase() === r.name.toLowerCase()) || {};
      const handles = r.social_handles || {};
      return {
        id: r.id,
        name: r.name,
        category: r.category || fb.category || 'General',
        description: r.description || fb.description || 'Active student organization at ITER, SOA University.',
        logo_url: r.logo_url || fb.logo_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160',
        banner_url: r.banner_url || fb.banner_url || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        instagram: handles.instagram || r.instagram || fb.instagram || null,
        discord: handles.discord || r.discord || fb.discord || null,
        lead_name: r.lead_name || fb.lead_name || 'Club Lead',
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching clubs from DB, returning standard fallback list:', error.message);
    res.json(fallbackClubs);
  }
};

