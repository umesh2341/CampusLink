import pool from './db/pool.js';
import 'dotenv/config';

async function seedNotices() {
  // PRODUCTION GUARD: this script must NEVER run automatically in production.
  // Run manually only for local dev: NODE_ENV=development node server/seed_notices.js
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ABORTED: seed_notices.js refused to run in NODE_ENV=production. Real production data is preserved.');
    process.exit(1);
  }

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

    console.log('Adding document_url column...');
    await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS document_url TEXT;`);

    console.log('Inserting sample notices (skips if title already exists)...');

    const notices = [
      {
        title: 'Mid-Semester Exam Schedule Released',
        category: 'exam',
        body: 'The mid-semester examination schedule for all branches has been finalized. Please check the student portal for detailed dates and seating arrangements.',
        document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      },
      {
        title: 'Campus Closed for Festival Break',
        category: 'holiday',
        body: 'The campus will remain closed from Thursday to Sunday for the upcoming festival. All classes and club activities are suspended during this period.',
        document_url: null
      },
      {
        title: 'New Library Hours Starting Monday',
        category: 'general',
        body: 'The central library will now be open until 11:00 PM on weekdays to accommodate students preparing for placements and exams.',
        document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ];

    for (const notice of notices) {
      await pool.query(`
        INSERT INTO notices (title, category, body, document_url, published_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT DO NOTHING
      `, [notice.title, notice.category, notice.body, notice.document_url || null]);
    }

    console.log('✅ Notices seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding notices:', err);
    process.exit(1);
  }
}

seedNotices();
