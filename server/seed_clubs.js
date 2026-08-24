import 'dotenv/config';
import pool from './db/pool.js';

async function seedClubs() {
  try {
    console.log('Seeding initial campus clubs into database...');

    await pool.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS discord TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lead_name VARCHAR(255);
    `);

    const clubsData = [
      {
        name: 'Coding Club', category: 'Technical',
        description: 'Official student developer community at ITER. Organizers of HackSOA, competitive programming contests, open-source sprints, and dev workshops.',
        logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160',
        banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        instagram: 'codingclub_iter', discord: 'https://discord.gg/codingclub', lead_name: 'Dev Lead',
      },
      {
        name: 'Robotics Society', category: 'Technical',
        description: 'Hardware and robotics lab focusing on autonomous drones, line followers, combat robots, and IoT sensor networks.',
        logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=160',
        banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        instagram: 'robotics_soa', discord: 'https://discord.gg/robotics', lead_name: 'Robo Core',
      },
      {
        name: 'Cultural Committee', category: 'Cultural',
        description: 'The creative heartbeat of the university, coordinating theatre, choreography, street plays, and cultural evenings.',
        logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160',
        banner_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        instagram: 'cultural_iter', discord: 'https://discord.gg/cultural', lead_name: 'Cultural Sec',
      },
      {
        name: 'Sports Club', category: 'Sports',
        description: 'Promoting campus athletic culture through inter-hostel leagues, cricket championships, football tournaments, and indoor stadium games.',
        logo_url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?w=160',
        banner_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
        instagram: 'sports_iter', discord: 'https://discord.gg/sports', lead_name: 'Sports Captain',
      },
      {
        name: 'Literary Society', category: 'Literary',
        description: 'Host of weekly campus trivia nights, business quizzes, pop culture battles, and university representative teams.',
        logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=160',
        banner_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800',
        instagram: 'literary_soa', discord: 'https://discord.gg/literary', lead_name: 'Literary Lead',
      },
    ];

    for (const club of clubsData) {
      await pool.query(`
        INSERT INTO clubs (name, category, description, logo_url, banner_url, instagram, discord, lead_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          logo_url = EXCLUDED.logo_url,
          banner_url = EXCLUDED.banner_url,
          instagram = EXCLUDED.instagram,
          discord = EXCLUDED.discord,
          lead_name = EXCLUDED.lead_name;
      `, [club.name, club.category, club.description, club.logo_url, club.banner_url, club.instagram, club.discord, club.lead_name]);
    }

    console.log('✅ Clubs seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedClubs();
