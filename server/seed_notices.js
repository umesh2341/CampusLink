import pool from './db/pool.js';
import 'dotenv/config';

async function seedNotices() {
  try {
    console.log('Ensuring notices table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        body TEXT NOT NULL,
        published_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('Adding expires_at column...');
    await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`);

    console.log('Seeding 3 test notices...');
    // Delete existing test notices to avoid duplicates on multiple runs
    await pool.query(`DELETE FROM notices;`);

    const notices = [
      {
        title: 'Mid-Semester Exam Schedule Released',
        category: 'exam',
        body: 'The mid-semester examination schedule for all branches has been finalized. Please check the student portal for detailed dates and seating arrangements.',
      },
      {
        title: 'Campus Closed for Festival Break',
        category: 'holiday',
        body: 'The campus will remain closed from Thursday to Sunday for the upcoming festival. All classes and club activities are suspended during this period.',
      },
      {
        title: 'New Library Hours Starting Monday',
        category: 'general',
        body: 'The central library will now be open until 11:00 PM on weekdays to accommodate students preparing for placements and exams.',
      }
    ];

    for (const notice of notices) {
      await pool.query(`
        INSERT INTO notices (title, category, body)
        VALUES ($1, $2, $3)
      `, [notice.title, notice.category, notice.body]);
    }

    console.log('✅ Notices seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding notices:', err);
    process.exit(1);
  }
}

seedNotices();
