import pool from './db/pool.js';

const clubDescriptions = [
  {
    id: '22907df2-3386-40ad-9229-04f363c3adcb',
    name: 'Coding Ninja',
    clubTitle: 'CODING NINJAS 10x ITER',
    description: 'A tech community committed to offering inclusive coding instruction. It provides tutorials, projects, and discussions for both beginners and experts to explore the world of programming and technology.'
  },
  {
    id: '7f9d1b73-43e6-4b3e-b2d8-a92c9aea2a95',
    name: 'Codex',
    clubTitle: 'CODEX ITER',
    description: 'The official programming club of ITER. It fosters a legacy of technical mastery through peer-to-peer learning, focusing on full-stack development, AI/ML, competitive programming, and UI/UX design.'
  },
  {
    id: '90734e84-2150-40ab-90bf-ce47ca1fdbf8',
    name: 'Google Developers Group',
    clubTitle: 'GOOGLE DEVELOPER GROUP (GDG) ITER',
    description: 'A student-led tech community backed by Google. It focuses on exploring cutting-edge technologies, skill development, and fostering a collaborative environment through workshops, hackathons, and technical events.'
  },
  {
    id: '1c723bb3-bafe-44df-93e2-d70a9597d548',
    name: 'GFG',
    clubTitle: 'GEEKS FOR GEEKS (GFG) ITER',
    description: 'A dedicated community for tech enthusiasts aiming to improve their coding skills, prepare for placements, and engage in competitive programming, tech contests, and collaborative projects.'
  },
  {
    id: '8a7ebd7b-b889-4f4d-8c05-6998e6be34b9',
    name: 'Virtual Show Reel ',
    clubTitle: 'VIRTUAL SHOWREEL',
    description: 'SOA University’s official event broadcasting and advertising crew. They specialize in capturing campus memories, covering college events, and creating engaging promotional videos, trailers, and aftermovies.'
  },
  {
    id: '496e8808-be13-4ab4-9b00-282793e7b6d1',
    name: 'SOA Photography Club',
    clubTitle: 'SOA PHOTOGRAPHY CLUB',
    description: 'A creative community for visual storytellers and photography enthusiasts. They capture campus life, organize photowalks, and provide a platform to showcase artistic talent through visual media.'
  },
  {
    id: 'f5d2abbc-514a-40e7-8ca5-925a426bfedb',
    name: 'Toneelstuck',
    clubTitle: 'TONEELSTUK',
    description: 'The official dramatics society of SOA. It provides a vibrant stage for students to showcase their acting skills through theatrical plays, stage dramas, and engaging street plays.'
  },
  {
    id: '36af6bf7-c332-4101-b2f7-60dda2ec950f',
    name: 'Srishti Club',
    clubTitle: 'SRISHTI',
    description: 'A dynamic creative and cultural club at SOA. It brings together students passionate about the arts, engaging them in artistic endeavors, creative projects, and vibrant cultural events.'
  },
  {
    id: '8b65e47e-d762-4206-a90c-584ea8dd40de',
    name: 'Literary Society',
    clubTitle: 'SOA LITERARY CLUB',
    description: 'A platform for students passionate about literature, writing, and poetry. The club encourages creative expression and intellectual discussions by organizing debates, open mics, and writing competitions.'
  },
  {
    id: '63ea4ba5-3b5e-4fc1-a0ba-69d038186216',
    name: 'Danza',
    clubTitle: 'DANZA',
    description: 'A dedicated dance society at SOA where students explore diverse dance styles. They actively participate in competitions, workshops, and cultural fests to celebrate movement and rhythm.'
  },
  {
    id: '8af50067-1833-4139-846e-6e26a161406a',
    name: 'ODanza',
    clubTitle: 'ODANZA',
    description: 'A prominent dance community at ITER that hosts events, workshops, and competitions. It brings together passionate dancers to perform at cultural fests and showcase their diverse choreography skills.'
  },
  {
    id: '2fe71eb0-3370-4fdb-aa08-08ef2714a048',
    name: 'Soa English Cafe',
    clubTitle: 'SOA ENGLISH CAFE',
    description: 'A literary and communication club focused on enhancing English proficiency, content strategy, and public speaking. They achieve this through interactive sessions, debates, and engaging linguistic activities.'
  },
  {
    id: '35245914-ad74-474e-89ea-0b0562d0f22b',
    name: 'IRC',
    clubTitle: 'ITER ROBOTICS CLUB',
    description: 'A hub for tech enthusiasts passionate about hardware and automation. Students design, build, and innovate with robotics and IoT, frequently competing in events like Robo Race and Robo Sumo.'
  },
  {
    id: '315d788c-2b3b-4358-a484-66b8b227f66f',
    name: 'SMC',
    clubTitle: 'SOA MUSIC CLUB',
    description: 'A vibrant community for vocalists and instrumentalists. They nurture musical talent across the university by hosting jam sessions and delivering captivating performances at major campus events.'
  }
];

async function updateDescriptions() {
  try {
    console.log('Updating club descriptions in the database...');

    for (const item of clubDescriptions) {
      const res = await pool.query(
        'UPDATE clubs SET description = $1 WHERE id = $2 RETURNING id, name, description',
        [item.description, item.id]
      );
      if (res.rowCount > 0) {
        console.log(`[UPDATED] ${item.clubTitle} (${res.rows[0].name}) -> ID: ${item.id}`);
      } else {
        console.warn(`[NOT FOUND] ID: ${item.id} (${item.clubTitle})`);
      }
    }

    console.log('\n--- VERIFICATION OF UPDATED DESCRIPTIONS ---');
    const verified = await pool.query(
      'SELECT id, name, description FROM clubs WHERE id = ANY($1::uuid[]) ORDER BY name ASC',
      [clubDescriptions.map(c => c.id)]
    );
    console.table(verified.rows);

    console.log('Successfully updated all club descriptions!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update club descriptions:', err);
    process.exit(1);
  }
}

updateDescriptions();
