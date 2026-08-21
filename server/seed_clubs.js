import 'dotenv/config';
import pool from './db/pool.js';

async function seedClubs() {
  try {
    console.log('Seeding initial campus clubs into database...');

    // Ensure the category column exists
    await pool.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(100);`);

    const clubsData = [
      { name: 'Coding Club', category: 'Technical', logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100' },
      { name: 'Robotics Society', category: 'Technical', logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=100' },
      { name: 'Cultural Committee', category: 'Cultural', logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100' },
      { name: 'Sports Club', category: 'Sports', logo_url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?w=100' },
      { name: 'Literary Society', category: 'Literary', logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=100' },
    ];

    for (const club of clubsData) {
      await pool.query(`
        INSERT INTO clubs (name, logo_url, category)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET logo_url = EXCLUDED.logo_url, category = EXCLUDED.category;
      `, [club.name, club.logo_url, club.category]);
    }

    console.log('✅ Clubs seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedClubs();
