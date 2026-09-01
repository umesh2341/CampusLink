import 'dotenv/config';
import pool from './db/pool.js';

async function seedClubs() {
  // PRODUCTION GUARD: this script must NEVER run automatically in production.
  // Run manually only for local dev: NODE_ENV=development node server/seed_clubs.js
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ABORTED: seed_clubs.js refused to run in NODE_ENV=production. Real production data is preserved.');
    process.exit(1);
  }

  try {
    console.log('Seeding initial campus clubs into database...');

    await pool.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lead_name VARCHAR(255);
    `);

    const clubsData = [
      {
        name: 'Coding Ninja', category: 'Technical',
        description: 'A tech community committed to offering inclusive coding instruction. It provides tutorials, projects, and discussions for both beginners and experts to explore the world of programming and technology.',
        logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160',
        banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        instagram: 'cn.10x.iter', lead_name: 'Lead',
      },
      {
        name: 'Codex', category: 'Technical',
        description: 'The official programming club of ITER. It fosters a legacy of technical mastery through peer-to-peer learning, focusing on full-stack development, AI/ML, competitive programming, and UI/UX design.',
        logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160',
        banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        instagram: 'codexiter', lead_name: 'Coordinator',
        social_handles: JSON.stringify({ instagram: 'codexiter', linkedin: 'codex-club-soa' }),
      },
      {
        name: 'Google Developers Group', category: 'Technical',
        description: 'A student-led tech community backed by Google. It focuses on exploring cutting-edge technologies, skill development, and fostering a collaborative environment through workshops, hackathons, and technical events.',
        logo_url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=160',
        banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        instagram: 'gdg_iter', lead_name: 'Organizer',
      },
      {
        name: 'GFG', category: 'Technical',
        description: 'A dedicated community for tech enthusiasts aiming to improve their coding skills, prepare for placements, and engage in competitive programming, tech contests, and collaborative projects.',
        logo_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=160',
        banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        instagram: 'gfg_iter', lead_name: 'Tech Leads',
      },
      {
        name: 'Virtual Show Reel ', category: 'Cultural',
        description: 'SOA University’s official event broadcasting and advertising crew. They specialize in capturing campus memories, covering college events, and creating engaging promotional videos, trailers, and aftermovies.',
        logo_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=160',
        banner_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
        instagram: 'virtualshowreel', lead_name: 'Coordinator',
      },
      {
        name: 'SOA Photography Club', category: 'Cultural',
        description: 'A creative community for visual storytellers and photography enthusiasts. They capture campus life, organize photowalks, and provide a platform to showcase artistic talent through visual media.',
        logo_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160',
        banner_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
        instagram: 'soa_photography_club', lead_name: 'Coordinator',
      },
      {
        name: 'Toneelstuck', category: 'Cultural',
        description: 'The official dramatics society of SOA. It provides a vibrant stage for students to showcase their acting skills through theatrical plays, stage dramas, and engaging street plays.',
        logo_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=160',
        banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        instagram: 'soa_dramatics_society', lead_name: 'Coordinator',
      },
      {
        name: 'Srishti Club', category: 'Cultural',
        description: 'A dynamic creative and cultural club at SOA. It brings together students passionate about the arts, engaging them in artistic endeavors, creative projects, and vibrant cultural events.',
        logo_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=160',
        banner_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        instagram: 'srishti_club', lead_name: 'Coordinator',
      },
      {
        name: 'Literary Society', category: 'Literary',
        description: 'A platform for students passionate about literature, writing, and poetry. The club encourages creative expression and intellectual discussions by organizing debates, open mics, and writing competitions.',
        logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=160',
        banner_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800',
        instagram: 'literary_soa', lead_name: 'Literary Lead',
      },
      {
        name: 'Danza', category: 'Cultural',
        description: 'A dedicated dance society at SOA where students explore diverse dance styles. They actively participate in competitions, workshops, and cultural fests to celebrate movement and rhythm.',
        logo_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=160',
        banner_url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800',
        instagram: 'danza_soa', lead_name: 'Coordinator',
      },
      {
        name: 'ODanza', category: 'Cultural',
        description: 'A prominent dance community at ITER that hosts events, workshops, and competitions. It brings together passionate dancers to perform at cultural fests and showcase their diverse choreography skills.',
        logo_url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=160',
        banner_url: 'https://images.unsplash.com/photo-1509670161296-18d69c8f2fed?w=800',
        instagram: 'soa_odanz_a', lead_name: 'Coordinator',
      },
      {
        name: 'Soa English Cafe', category: 'Literary',
        description: 'A literary and communication club focused on enhancing English proficiency, content strategy, and public speaking. They achieve this through interactive sessions, debates, and engaging linguistic activities.',
        logo_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=160',
        banner_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
        instagram: 'soaenglishcafe', lead_name: 'Coordinator',
      },
      {
        name: 'IRC', category: 'Technical',
        description: 'A hub for tech enthusiasts passionate about hardware and automation. Students design, build, and innovate with robotics and IoT, frequently competing in events like Robo Race and Robo Sumo.',
        logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc596e?w=160',
        banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        instagram: 'robotics_soa', lead_name: 'Robo Core',
      },
      {
        name: 'SMC', category: 'Cultural',
        description: 'A vibrant community for vocalists and instrumentalists. They nurture musical talent across the university by hosting jam sessions and delivering captivating performances at major campus events.',
        logo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160',
        banner_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        instagram: 'smc.fam', lead_name: 'Coordinator',
      },
    ];

    for (const club of clubsData) {
      await pool.query(`
        INSERT INTO clubs (name, category, description, logo_url, banner_url, instagram, lead_name, social_handles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          logo_url = EXCLUDED.logo_url,
          banner_url = EXCLUDED.banner_url,
          instagram = EXCLUDED.instagram,
          lead_name = EXCLUDED.lead_name,
          social_handles = EXCLUDED.social_handles;
      `, [club.name, club.category, club.description, club.logo_url, club.banner_url, club.instagram, club.lead_name, club.social_handles || null]);
    }

    console.log('✅ Clubs seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedClubs();
