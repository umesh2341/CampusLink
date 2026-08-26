import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const buildingsData = [
  { svg_element_id: 'electronic-office',   name: 'Electronics Office',     category: 'academic',     short_name: 'ELEC OFFICE', hide_label: true },
  { svg_element_id: 'lh1',                 name: 'Ladies Hostel 1',        category: 'hostel_girls', short_name: 'LH1'          },
  { svg_element_id: 'lh2',                 name: 'Ladies Hostel 2',        category: 'hostel_girls', short_name: 'LH2'          },
  { svg_element_id: 'lh3',                 name: 'Ladies Hostel 3',        category: 'hostel_girls', short_name: 'LH3'          },
  { svg_element_id: 'lh4',                 name: 'Ladies Hostel 4',        category: 'hostel_girls', short_name: 'LH4'          },
  { svg_element_id: 'lh5',                 name: 'Ladies Hostel 5',        category: 'hostel_girls', short_name: 'LH5'          },
  { svg_element_id: 'bh1',                 name: 'Boys Hostel 1',          category: 'hostel_boys',  short_name: 'BH1'          },
  { svg_element_id: 'bh2',                 name: 'Boys Hostel 2',          category: 'hostel_boys',  short_name: 'BH2'          },
  { svg_element_id: 'bh5',                 name: 'Boys Hostel 5',          category: 'hostel_boys',  short_name: 'BH5'          },
  { svg_element_id: 'bh6',                 name: 'Boys Hostel 6',          category: 'hostel_boys',  short_name: 'BH6'          },
  { svg_element_id: 'bh7',                 name: 'Boys Hostel 7',          category: 'hostel_boys',  short_name: 'BH7'          },
  { svg_element_id: 'bh8',                 name: 'Boys Hostel 8',          category: 'hostel_boys',  short_name: 'BH8'          },
  { svg_element_id: 'bh9',                 name: 'Boys Hostel 9',          category: 'hostel_boys',  short_name: 'BH9'          },
  { svg_element_id: 'bh10',                name: 'Boys Hostel 10',         category: 'hostel_boys',  short_name: 'BH10'         },
  { svg_element_id: 'bh12',                name: 'Boys Hostel 12',         category: 'hostel_boys',  short_name: 'BH12'         },
  { svg_element_id: 'cricket-court1',      name: 'Cricket Court',          category: 'sports',       short_name: 'CRICKET CRT'  },
  { svg_element_id: 'football-court1',     name: 'Football Court 1',       category: 'sports',       short_name: 'FOOTBALL 1'   },
  { svg_element_id: 'football-court2',     name: 'Football Court 2',       category: 'sports',       short_name: 'FOOTBALL 2'   },
  { svg_element_id: 'auditorium',          name: 'Auditorium',             category: 'other',        short_name: 'AUDITORIUM'   },
  { svg_element_id: 'center-of-datascience', name: 'Center for Data Science', category: 'academic', short_name: 'DATA SCI'     },
  { svg_element_id: 'indoor-stadium',      name: 'Indoor Stadium',         category: 'sports',       short_name: 'STADIUM'      },
  { svg_element_id: 'academic-block',      name: 'Academic Block',         category: 'academic',     short_name: 'ACAD BLOCK'   },
  { svg_element_id: 'studentsection',      name: 'Student Section',        category: 'admin',        short_name: 'STU SECTION'  },
  { svg_element_id: 'd-block',             name: 'D Block',                category: 'academic',     short_name: 'D BLOCK'      },
  { svg_element_id: 'library',             name: 'Library',                category: 'academic',     short_name: 'LIBRARY'      },
  { svg_element_id: 'f-block',             name: 'F Block',                category: 'academic',     short_name: 'F BLOCK'      },
  { svg_element_id: 'sc-block',            name: 'Science Block',          category: 'academic',     short_name: 'SC BLOCK'     },
  { svg_element_id: 'eblock',              name: 'E Block',                category: 'academic',     short_name: 'E BLOCK'      },
  { svg_element_id: 'garden',              name: 'Garden',                 category: 'gardens',      short_name: 'GARDEN'       },
  { svg_element_id: 'unknown1',            name: 'Utility Building 1',     category: 'other',        short_name: 'UTIL BLDG 1'  },
  { svg_element_id: 'food-court',          name: 'Food Court',             category: 'cafeteria',    short_name: 'FOOD COURT'   },
  { svg_element_id: 'c-block',             name: 'C Block',                category: 'academic',     short_name: 'C BLOCK'      },
  { svg_element_id: 'playground',          name: 'Playground',             category: 'sports',       short_name: 'PLAYGROUND'   },
  { svg_element_id: 'gym',                 name: 'Gym',                    category: 'sports',       short_name: 'GYM'          },
  { svg_element_id: 'drive-ev',            name: 'EV Charging Station',    category: 'other',        short_name: 'EV STATION', hide_label: true },
  { svg_element_id: 'unknown',             name: 'Utility Building 2',     category: 'other',        short_name: 'UTIL BLDG 2'  },
];

async function run() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const isUri = dbHost.startsWith('postgresql://') || dbHost.startsWith('postgres://');
  const isLocal = dbHost.includes('localhost') || dbHost.includes('127.0.0.1');

  const clientConfig = {};

  if (isUri) {
    clientConfig.connectionString = dbHost;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else if (process.env.DATABASE_URL) {
    clientConfig.connectionString = process.env.DATABASE_URL;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else {
    clientConfig.user = process.env.DB_USER || 'postgres';
    clientConfig.password = process.env.DB_PASSWORD || 'postgres';
    clientConfig.host = dbHost;
    clientConfig.port = parseInt(process.env.DB_PORT || '5432', 10);
    clientConfig.database = process.env.DB_DATABASE || 'postgres';
    
    if (!isLocal) {
      clientConfig.ssl = { rejectUnauthorized: false };
    }
  }

  const dbClient = new Client(clientConfig);

  try {
    await dbClient.connect();
    console.log('Connected to database successfully.');

    // Enable pgcrypto extension for UUID generation
    await dbClient.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    console.log('pgcrypto extension ensured.');

    // Create buildings table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS buildings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        svg_element_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL
      )
    `);
    console.log('Buildings table ensured.');

    // Create events table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        building_id UUID REFERENCES buildings(id) ON DELETE CASCADE NOT NULL,
        club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
        organizing_club VARCHAR(255) NOT NULL,
        image_url VARCHAR(1000),
        registration_url VARCHAR(1000),
        floor TEXT,
        room_number TEXT,
        is_approved BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    await dbClient.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS floor TEXT;`);
    // Create departments table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
        floor TEXT NOT NULL,
        room_number TEXT NOT NULL,
        aliases TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('Departments table ensured.');

    // Create notices table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        body TEXT NOT NULL,
        published_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        document_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Notices table ensured.');

    // ── BUILDINGS (safe upsert, always runs) ───────────────────────────────
    console.log('Seeding buildings data...');
    for (const b of buildingsData) {
      await dbClient.query(`
        INSERT INTO buildings (svg_element_id, name, category, short_name, hide_label)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (svg_element_id) DO UPDATE
        SET name = EXCLUDED.name, category = EXCLUDED.category, short_name = EXCLUDED.short_name, hide_label = EXCLUDED.hide_label
      `, [b.svg_element_id, b.name, b.category, b.short_name, b.hide_label || false]);
    }
    console.log('Buildings seeded.');

    // ── EVENTS & DEPARTMENTS SAMPLE DATA ────────────────────────────────────
    // PRODUCTION GUARD: sample/dummy data is NEVER inserted in production.
    // To run this locally for dev setup: NODE_ENV=development node server/db/init.js
    // Never call this file automatically from a build or start command.
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  NODE_ENV=production detected — skipping all sample data seeding. Real data is preserved.');
      return;
    }

    // Fetch buildings to link events (dev/local only beyond this point)
    const buildingsRes = await dbClient.query('SELECT id, svg_element_id FROM buildings');
    const buildingsMap = {};
    buildingsRes.rows.forEach(row => {
      buildingsMap[row.svg_element_id] = row.id;
    });

    // Seed sample events — uses ON CONFLICT DO NOTHING so existing real data is never overwritten
    console.log('Seeding sample events (dev only)...');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const sampleEvents = [
      {
        title: 'HackSOA 2026 Hackathon',
        description: 'Iterate, build, and pitch your ideas in this 24-hour hackathon. Great prizes and networking opportunities await!',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['electronic-office'],
        organizing_club: 'Coding Club',
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        registration_url: 'https://forms.gle/hacksoa2026',
        floor: '3rd Floor',
        room_number: 'Room 302',
        is_approved: true
      },
      {
        title: 'Robotics Workshop',
        description: 'Hands-on training session on building autonomous line followers and basic Arduino controllers.',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['electronic-office'],
        organizing_club: 'Robotics Society',
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        registration_url: 'https://forms.gle/robotics2026',
        floor: '2nd Floor',
        room_number: 'Lab 204',
        is_approved: true
      },
      {
        title: 'Freshers Icebreaker Connect',
        description: 'An informal meet-and-greet evening featuring interactive games and icebreakers for hostel residents.',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['lh3'],
        organizing_club: 'Hostel Committee',
        image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
        registration_url: 'https://forms.gle/lh3freshers',
        floor: 'Ground Floor',
        room_number: 'Common Room',
        is_approved: true
      },
      {
        title: 'SOA Cricket Championship',
        description: 'Annual inter-departmental cricket tournament. Come and cheer for your department team!',
        start_time: now,
        end_time: dayAfter,
        building_id: buildingsMap['cricket-court1'],
        organizing_club: 'Sports Council',
        image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
        registration_url: 'https://forms.gle/cricketchamp',
        floor: null,
        room_number: null,
        is_approved: true
      },
      {
        title: 'TechTalk: AI & Future Career',
        description: 'Seniors and industry leaders share insights on navigating technical careers in the age of generative AI.',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['academic-block'],
        organizing_club: 'IEEE Student Branch',
        image_url: 'https://images.unsplash.com/photo-1591115411636-609b556f312e?w=800',
        registration_url: 'https://forms.gle/ieeeai2026',
        floor: '1st Floor',
        room_number: 'Seminar Hall 1',
        is_approved: true
      },
      {
        title: 'Hostel Quiz Night',
        description: 'Assemble your teams of 3 and battle it out in a multi-round quiz night spanning pop-culture, general knowledge, and history.',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['bh1'],
        organizing_club: 'Quiz Club',
        image_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800',
        registration_url: 'https://forms.gle/bh1quiz',
        floor: 'Ground Floor',
        room_number: 'TV Hall',
        is_approved: true
      },
      {
        title: 'Food Carnival & Live Music',
        description: 'Celebrate local street food delicacies along with a live unplugged music performance by the campus band.',
        start_time: now,
        end_time: tomorrow,
        building_id: buildingsMap['food-court'],
        organizing_club: 'Music Club',
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        registration_url: 'https://forms.gle/foodmusic',
        floor: null,
        room_number: null,
        is_approved: true
      },
      {
        title: 'Mock Placement Drive',
        description: 'A mock drive containing aptitude rounds and peer-to-peer technical interviews for third-year students (needs admin approval)',
        start_time: dayAfter,
        end_time: dayAfter,
        building_id: buildingsMap['academic-block'],
        organizing_club: 'Placement Cell',
        image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800',
        registration_url: 'https://forms.gle/mockplacement',
        floor: '4th Floor',
        room_number: 'Placement Lab',
        is_approved: false // defaults to pending/unapproved
      }
    ];

    for (const e of sampleEvents) {
      await dbClient.query(`
        INSERT INTO events (title, description, start_time, end_time, building_id, organizing_club, image_url, registration_url, floor, room_number, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [e.title, e.description, e.start_time, e.end_time, e.building_id, e.organizing_club, e.image_url, e.registration_url, e.floor || null, e.room_number || null, e.is_approved]);
    }

    console.log('Events seeded successfully.');

    const departmentsData = [
      {
        name: 'Electrical Engineering',
        svg_element_id: 'eblock',
        floor: '2nd',
        room_number: '204',
        aliases: ['EEE', 'electrical', 'EE dept']
      },
      {
        name: 'Computer Science',
        svg_element_id: 'c-block',
        floor: '3rd',
        room_number: '301',
        aliases: ['CSE', 'comp sci', 'computer science']
      },
      {
        name: 'Electronics & Communication',
        svg_element_id: 'electronic-office',
        floor: '1st',
        room_number: '105',
        aliases: ['ECE', 'electronics']
      },
      {
        name: 'Mechanical Engineering',
        svg_element_id: 'd-block',
        floor: 'Ground',
        room_number: '010',
        aliases: ['mech', 'mechanical']
      },
      {
        name: 'Data Science',
        svg_element_id: 'center-of-datascience',
        floor: 'Ground',
        room_number: '001',
        aliases: ['DS', 'data science', 'ML dept']
      },
      {
        name: 'Physics Department',
        svg_element_id: 'sc-block',
        floor: '1st',
        room_number: '110',
        aliases: ['physics', 'phy dept']
      },
      {
        name: 'Chemistry Department',
        svg_element_id: 'sc-block',
        floor: '2nd',
        room_number: '210',
        aliases: ['chemistry', 'chem dept']
      },
      {
        name: 'Library Administration',
        svg_element_id: 'library',
        floor: 'Ground',
        room_number: '001',
        aliases: ['library', 'books']
      },
      {
        name: 'Student Affairs Office',
        svg_element_id: 'studentsection',
        floor: 'Ground',
        room_number: '001',
        aliases: ['student office', 'admin office']
      }
    ];

    console.log('Seeding departments data (dev only)...');
    for (const d of departmentsData) {
      const buildingId = buildingsMap[d.svg_element_id];
      if (buildingId) {
        await dbClient.query(`
          INSERT INTO departments (name, building_id, floor, room_number, aliases)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name, building_id, floor) DO NOTHING
        `, [d.name, buildingId, d.floor, d.room_number, d.aliases]);
      }
    }
    console.log('Departments seeded successfully.');
  } catch (err) {
    console.error('Error during database initialization/seeding:', err);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

run();
