/**
 * Migration: Add short_name column to buildings and backfill all rows.
 *
 * Run once with: node add_short_name.js
 * Short names are used ONLY for on-map labels; full `name` is used everywhere else.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const SHORT_NAMES = [
  { svg_element_id: 'electronic-office',   short_name: 'ELEC OFFICE'  },
  { svg_element_id: 'lh1',                 short_name: 'LH1'          },
  { svg_element_id: 'lh2',                 short_name: 'LH2'          },
  { svg_element_id: 'lh3',                 short_name: 'LH3'          },
  { svg_element_id: 'lh4',                 short_name: 'LH4'          },
  { svg_element_id: 'lh5',                 short_name: 'LH5'          },
  { svg_element_id: 'bh1',                 short_name: 'BH1'          },
  { svg_element_id: 'bh2',                 short_name: 'BH2'          },
  { svg_element_id: 'bh5',                 short_name: 'BH5'          },
  { svg_element_id: 'bh6',                 short_name: 'BH6'          },
  { svg_element_id: 'bh7',                 short_name: 'BH7'          },
  { svg_element_id: 'bh8',                 short_name: 'BH8'          },
  { svg_element_id: 'bh9',                 short_name: 'BH9'          },
  { svg_element_id: 'bh10',                short_name: 'BH10'         },
  { svg_element_id: 'bh12',                short_name: 'BH12'         },
  { svg_element_id: 'cricket-court1',      short_name: 'CRICKET CRT'  },
  { svg_element_id: 'football-court1',     short_name: 'FOOTBALL 1'   },
  { svg_element_id: 'football-court2',     short_name: 'FOOTBALL 2'   },
  { svg_element_id: 'auditorium',          short_name: 'AUDITORIUM'   },
  { svg_element_id: 'center-of-datascience', short_name: 'DATA SCI'   },
  { svg_element_id: 'indoor-stadium',      short_name: 'STADIUM'      },
  { svg_element_id: 'academic-block',      short_name: 'ACAD BLOCK'   },
  { svg_element_id: 'studentsection',      short_name: 'STU SECTION'  },
  { svg_element_id: 'd-block',             short_name: 'D BLOCK'      },
  { svg_element_id: 'library',             short_name: 'LIBRARY'      },
  { svg_element_id: 'f-block',             short_name: 'F BLOCK'      },
  { svg_element_id: 'sc-block',            short_name: 'SC BLOCK'     },
  { svg_element_id: 'eblock',              short_name: 'E BLOCK'      },
  { svg_element_id: 'garden',              short_name: 'GARDEN'       },
  { svg_element_id: 'unknown1',            short_name: 'UTIL BLDG 1'  },
  { svg_element_id: 'food-court',          short_name: 'FOOD COURT'   },
  { svg_element_id: 'c-block',             short_name: 'C BLOCK'      },
  { svg_element_id: 'playground',          short_name: 'PLAYGROUND'   },
  { svg_element_id: 'gym',                 short_name: 'GYM'          },
  { svg_element_id: 'drive-ev',            short_name: 'EV STATION'   },
  { svg_element_id: 'unknown',             short_name: 'UTIL BLDG 2'  },
];

async function run() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const isUri = dbHost.startsWith('postgresql://') || dbHost.startsWith('postgres://');

  const clientConfig = {};
  if (isUri) {
    clientConfig.connectionString = dbHost;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else if (process.env.DATABASE_URL) {
    clientConfig.connectionString = process.env.DATABASE_URL;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else {
    clientConfig.user     = process.env.DB_USER     || 'postgres';
    clientConfig.password = process.env.DB_PASSWORD || 'postgres';
    clientConfig.host     = dbHost;
    clientConfig.port     = parseInt(process.env.DB_PORT || '5432', 10);
    clientConfig.database = process.env.DB_DATABASE || 'postgres';
    if (!dbHost.includes('localhost') && !dbHost.includes('127.0.0.1')) {
      clientConfig.ssl = { rejectUnauthorized: false };
    }
  }

  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('✓ Connected to database.');

    // 1. Add column (idempotent)
    await client.query(`ALTER TABLE buildings ADD COLUMN IF NOT EXISTS short_name TEXT;`);
    console.log('✓ short_name column ensured.');

    // 2. Backfill each row
    let updated = 0;
    let skipped = 0;
    for (const { svg_element_id, short_name } of SHORT_NAMES) {
      const result = await client.query(
        `UPDATE buildings SET short_name = $1 WHERE svg_element_id = $2`,
        [short_name, svg_element_id]
      );
      if (result.rowCount > 0) {
        updated++;
      } else {
        skipped++;
        console.warn(`  ⚠ No row found for svg_element_id="${svg_element_id}" (skipped)`);
      }
    }
    console.log(`✓ Backfill complete: ${updated} updated, ${skipped} skipped.`);

    // 3. Print the full resulting table for review
    const { rows } = await client.query(
      `SELECT svg_element_id, name, short_name FROM buildings ORDER BY name ASC`
    );
    console.log('\n── Full short_name assignment list (review these) ──────────────────');
    console.log('svg_element_id'.padEnd(28) + 'name'.padEnd(30) + 'short_name');
    console.log('─'.repeat(75));
    for (const r of rows) {
      console.log(
        r.svg_element_id.padEnd(28) +
        (r.name || '').padEnd(30) +
        (r.short_name || '(NULL)')
      );
    }
    console.log('─'.repeat(75));
    console.log('Review the above. To correct any short_name, run:');
    console.log("  UPDATE buildings SET short_name = 'NEW NAME' WHERE svg_element_id = 'id';");

  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
