import pool from './db/pool.js';

async function seedClubs() {
  try {
    console.log('Seeding initial campus clubs into database...');

    const clubsData = [
      { name: 'Coding Club', logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100' },
      { name: 'Robotics Society', logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=100' },
      { name: 'Cultural Committee', logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100' },
      { name: 'Sports Club', logo_url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?w=100' },
      { name: 'Literary Society', logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=100' },
    ];

    for (const club of clubsData) {
      await pool.query(`
        INSERT INTO clubs (name, logo_url)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET logo_url = EXCLUDED.logo_url;
      `, [club.name, club.logo_url]);
    }

    console.log('✅ Clubs seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedClubs();
