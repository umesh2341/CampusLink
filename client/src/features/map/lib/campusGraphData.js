/**
 * campusGraphData.js
 *
 * Topological waypoint graph representation of ITER, SOA University campus.
 * Contains nodes (junctions, road turn points, building entrance anchors) and
 * bidirectional edges (walkable paths and campus roads) in SVG canvas coordinates (1580 x 2891).
 *
 * Edge access types:
 *   'BOTH' — Main campus road: usable by pedestrians, bikes, and vehicles
 *   'WALK' — Pedestrian-only concourse / narrow approach: not accessible by car
 */

// ── 1. WAYPOINT NODES ──────────────────────────────────────────────────────────
export const CAMPUS_NODES = {
  // ── NORTH ZONE (Y: 0 - 550) ────────────────────────────────────────────────
  N_GATE_NORTH:        { id: 'N_GATE_NORTH',        x: 676,  y: 48,   name: 'North Main Gate (LH-5)' },
  N_BH7_ENTRANCE:      { id: 'N_BH7_ENTRANCE',      x: 389,  y: 140,  name: 'BH-7 Entrance' },
  N_BH2_ENTRANCE:      { id: 'N_BH2_ENTRANCE',      x: 590,  y: 180,  name: 'BH-2 Entrance' },
  N_BH1_ENTRANCE:      { id: 'N_BH1_ENTRANCE',      x: 572,  y: 366,  name: 'BH-1 Entrance' },
  N_STUDENT_ENTRANCE:  { id: 'N_STUDENT_ENTRANCE',  x: 332,  y: 446,  name: 'Student Section Entrance' },
  N_ROAD_NORTH_1:      { id: 'N_ROAD_NORTH_1',      x: 630,  y: 120,  name: 'North Spine Junction 1' },
  N_ROAD_NORTH_2:      { id: 'N_ROAD_NORTH_2',      x: 630,  y: 260,  name: 'North Spine Junction 2' },
  N_ROAD_NORTH_3:      { id: 'N_ROAD_NORTH_3',      x: 630,  y: 400,  name: 'North Spine Junction 3' },
  N_ROAD_NW_1:         { id: 'N_ROAD_NW_1',         x: 390,  y: 260,  name: 'North-West Branch' },
  N_ROAD_NW_2:         { id: 'N_ROAD_NW_2',         x: 390,  y: 446,  name: 'Student Section Junction' },

  // ── NORTH-CENTRAL & CORE ACADEMIC (Y: 550 - 1050) ──────────────────────────
  N_ELEC_OFFICE:       { id: 'N_ELEC_OFFICE',       x: 719,  y: 605,  name: 'Electronics Office Entrance' },
  N_DATASCIENCE:       { id: 'N_DATASCIENCE',       x: 869,  y: 614,  name: 'Centre for Data Science Entrance' },
  N_ACADEMIC_MAIN:     { id: 'N_ACADEMIC_MAIN',     x: 437,  y: 650,  name: 'Academic Block Main Entrance' },
  N_ACADEMIC_EAST:     { id: 'N_ACADEMIC_EAST',     x: 535,  y: 650,  name: 'Academic Block East Promenade' },
  N_FOOTBALL1_ENTRY:   { id: 'N_FOOTBALL1_ENTRY',   x: 709,  y: 766,  name: 'Football Court 1 Entry' },
  N_AUDITORIUM_ENTRY:  { id: 'N_AUDITORIUM_ENTRY',  x: 941,  y: 794,  name: 'Auditorium Main Entry' },
  N_INDOOR_STADIUM:    { id: 'N_INDOOR_STADIUM',    x: 1105, y: 983,  name: 'Indoor Stadium Entrance' },
  N_CBLOCK_ENTRANCE:   { id: 'N_CBLOCK_ENTRANCE',   x: 716,  y: 961,  name: 'C-Block Entrance' },

  N_ROAD_CORE_1:       { id: 'N_ROAD_CORE_1',       x: 630,  y: 550,  name: 'Academic Spine Junction 1' },
  N_ROAD_CORE_2:       { id: 'N_ROAD_CORE_2',       x: 630,  y: 650,  name: 'Academic Block Junction' },
  N_ROAD_CORE_3:       { id: 'N_ROAD_CORE_3',       x: 780,  y: 650,  name: 'Data Science Crossroads' },
  N_ROAD_CORE_4:       { id: 'N_ROAD_CORE_4',       x: 630,  y: 800,  name: 'Futsal Crossroads' },
  N_ROAD_CORE_5:       { id: 'N_ROAD_CORE_5',       x: 840,  y: 800,  name: 'Auditorium Plaza Junction' },
  N_ROAD_CORE_6:       { id: 'N_ROAD_CORE_6',       x: 630,  y: 960,  name: 'C-Block Spine Junction' },
  N_ROAD_CORE_EAST_1:  { id: 'N_ROAD_CORE_EAST_1',  x: 1040, y: 880,  name: 'East Stadium Approach' },

  // ── MID CAMPUS: SCIENCE, LIBRARY & FOOD COURT (Y: 1050 - 1500) ─────────────
  N_SC_BLOCK:          { id: 'N_SC_BLOCK',          x: 764,  y: 1177, name: 'Science Complex (SC-Block)' },
  N_F_BLOCK:           { id: 'N_F_BLOCK',           x: 1053, y: 1213, name: 'F-Block Entrance' },
  N_DBLOCK_ENTRANCE:   { id: 'N_DBLOCK_ENTRANCE',   x: 321,  y: 1266, name: 'D-Block Entrance' },
  N_LIBRARY_ENTRANCE:  { id: 'N_LIBRARY_ENTRANCE',  x: 537,  y: 1266, name: 'Central Library Entrance' },
  N_GYM_ENTRANCE:      { id: 'N_GYM_ENTRANCE',      x: 52,   y: 1262, name: 'Gym Entrance' },
  N_FOOD_COURT:        { id: 'N_FOOD_COURT',        x: 1337, y: 1308, name: 'Food Court Plaza' },
  N_PLAYGROUND:        { id: 'N_PLAYGROUND',        x: 1251, y: 1184, name: 'Playground Pavilion' },
  N_DRIVE_EV:          { id: 'N_DRIVE_EV',          x: 1194, y: 1370, name: 'EV Charging Station' },
  N_EBLOCK_ENTRANCE:   { id: 'N_EBLOCK_ENTRANCE',   x: 871,  y: 1485, name: 'E-Block Main Entrance' },

  N_ROAD_MID_WEST_1:   { id: 'N_ROAD_MID_WEST_1',   x: 200,  y: 1266, name: 'Gym / West Walkway' },
  N_ROAD_MID_WEST_2:   { id: 'N_ROAD_MID_WEST_2',   x: 430,  y: 1266, name: 'D-Block / Library Concourse' },
  N_ROAD_MID_CENTRAL:  { id: 'N_ROAD_MID_CENTRAL',  x: 630,  y: 1180, name: 'Central Spine Science Junction' },
  N_ROAD_MID_CENTRAL_2:{ id: 'N_ROAD_MID_CENTRAL_2',x: 630,  y: 1340, name: 'Central Spine Library Exit' },
  N_ROAD_MID_EAST_1:   { id: 'N_ROAD_MID_EAST_1',   x: 930,  y: 1180, name: 'SC-F Block Inter-block Link' },
  N_ROAD_MID_EAST_2:   { id: 'N_ROAD_MID_EAST_2',   x: 1180, y: 1213, name: 'Food Court Access Avenue' },
  N_ROAD_MID_EAST_3:   { id: 'N_ROAD_MID_EAST_3',   x: 1180, y: 1370, name: 'EV Station Concourse' },
  N_ROAD_MID_EBLOCK:   { id: 'N_ROAD_MID_EBLOCK',   x: 750,  y: 1485, name: 'E-Block North Concourse' },

  // ── SOUTH-CENTRAL ZONE (Y: 1500 - 2000) ────────────────────────────────────
  N_CRICKET_COURT:     { id: 'N_CRICKET_COURT',     x: 394,  y: 1614, name: 'Cricket Ground Entry' },
  N_GARDEN_ENTRY:      { id: 'N_GARDEN_ENTRY',      x: 810,  y: 1614, name: 'Campus Garden Pavilion' },
  N_LH4_ENTRANCE:      { id: 'N_LH4_ENTRANCE',      x: 583,  y: 1836, name: 'LH-4 Entrance' },
  N_LH2_ENTRANCE:      { id: 'N_LH2_ENTRANCE',      x: 937,  y: 1893, name: 'LH-2 Entrance' },
  N_UTIL_1:            { id: 'N_UTIL_1',            x: 1251, y: 1918, name: 'Utility 1 Access' },
  N_UTIL_2:            { id: 'N_UTIL_2',            x: 687,  y: 1813, name: 'Utility 2 Access' },

  N_ROAD_SC_WEST_1:    { id: 'N_ROAD_SC_WEST_1',    x: 394,  y: 1500, name: 'West Sports Pathway' },
  N_ROAD_SC_WEST_2:    { id: 'N_ROAD_SC_WEST_2',    x: 394,  y: 1720, name: 'Cricket Field South Junction' },
  N_ROAD_SC_CENTRAL_1: { id: 'N_ROAD_SC_CENTRAL_1', x: 630,  y: 1614, name: 'Garden Crossing Junction' },
  N_ROAD_SC_CENTRAL_2: { id: 'N_ROAD_SC_CENTRAL_2', x: 630,  y: 1836, name: 'LH-4 Main Junction' },
  N_ROAD_SC_EAST_1:    { id: 'N_ROAD_SC_EAST_1',    x: 930,  y: 1614, name: 'East Garden Link' },
  N_ROAD_SC_EAST_2:    { id: 'N_ROAD_SC_EAST_2',    x: 930,  y: 1836, name: 'LH-2 West Promenade' },
  N_ROAD_SC_EAST_3:    { id: 'N_ROAD_SC_EAST_3',    x: 1180, y: 1836, name: 'South-East Spine Entry' },

  // ── SOUTH HOSTEL COMPLEX & GATES (Y: 2000 - 2891) ──────────────────────────
  N_LH1_ENTRANCE:      { id: 'N_LH1_ENTRANCE',      x: 1089, y: 2162, name: 'LH-1 Entrance' },
  N_LH3_ENTRANCE:      { id: 'N_LH3_ENTRANCE',      x: 847,  y: 2143, name: 'LH-3 Entrance' },
  N_BH6_ENTRANCE:      { id: 'N_BH6_ENTRANCE',      x: 1271, y: 2160, name: 'BH-6 Entrance' },
  N_BH8_ENTRANCE:      { id: 'N_BH8_ENTRANCE',      x: 1419, y: 2226, name: 'BH-8 Entrance' },
  N_BH5_ENTRANCE:      { id: 'N_BH5_ENTRANCE',      x: 1302, y: 2436, name: 'BH-5 Entrance' },
  N_BH12_ENTRANCE:     { id: 'N_BH12_ENTRANCE',     x: 982,  y: 2492, name: 'BH-12 Entrance' },
  N_BH10_ENTRANCE:     { id: 'N_BH10_ENTRANCE',     x: 1249, y: 2627, name: 'BH-10 Entrance' },
  N_BH9_ENTRANCE:      { id: 'N_BH9_ENTRANCE',      x: 1451, y: 2637, name: 'BH-9 Entrance' },
  N_FOOTBALL2_ENTRY:   { id: 'N_FOOTBALL2_ENTRY',   x: 1344, y: 2830, name: 'Football Court 2 (South Gate)' },

  N_ROAD_SOUTH_1:      { id: 'N_ROAD_SOUTH_1',      x: 750,  y: 2050, name: 'South Quad Upper Crossway' },
  N_ROAD_SOUTH_2:      { id: 'N_ROAD_SOUTH_2',      x: 950,  y: 2050, name: 'LH Complex North Junction' },
  N_ROAD_SOUTH_3:      { id: 'N_ROAD_SOUTH_3',      x: 1200, y: 2050, name: 'BH Complex North Junction' },
  N_ROAD_SOUTH_4:      { id: 'N_ROAD_SOUTH_4',      x: 847,  y: 2250, name: 'LH-3 South Pathway' },
  N_ROAD_SOUTH_5:      { id: 'N_ROAD_SOUTH_5',      x: 1180, y: 2250, name: 'BH-6 / BH-8 Concourse' },
  N_ROAD_SOUTH_6:      { id: 'N_ROAD_SOUTH_6',      x: 1380, y: 2250, name: 'BH-8 East Avenue' },
  N_ROAD_SOUTH_7:      { id: 'N_ROAD_SOUTH_7',      x: 982,  y: 2400, name: 'BH-12 North Approach' },
  N_ROAD_SOUTH_8:      { id: 'N_ROAD_SOUTH_8',      x: 1200, y: 2400, name: 'BH-5 North Crossway' },
  N_ROAD_SOUTH_9:      { id: 'N_ROAD_SOUTH_9',      x: 1200, y: 2550, name: 'BH-10 North Junction' },
  N_ROAD_SOUTH_10:     { id: 'N_ROAD_SOUTH_10',     x: 1400, y: 2550, name: 'BH-9 North Junction' },
  N_ROAD_SOUTH_11:     { id: 'N_ROAD_SOUTH_11',     x: 1280, y: 2750, name: 'South Gate Promenade' },
};

// ── 2. BIDIRECTIONAL EDGES WITH ACCESS TYPES ────────────────────────────────────
//
// access: 'BOTH' — Main campus road. Usable by pedestrians, bikes, and cars.
// access: 'WALK' — Pedestrian concourse or narrow building approach. Cars cannot use this edge.
//
// Design principle:
//   Junction-to-junction spine roads → 'BOTH'
//   Junction-to-building-entrance short links → 'WALK'
//   Sports/garden entries, narrow west walkway → 'WALK'
//
export const CAMPUS_EDGES = [
  // ── North Spine & Hostels ──────────────────────────────────────────────────
  { from: 'N_GATE_NORTH',       to: 'N_ROAD_NORTH_1',     access: 'BOTH' },
  { from: 'N_ROAD_NORTH_1',     to: 'N_BH2_ENTRANCE',     access: 'WALK' },
  { from: 'N_ROAD_NORTH_1',     to: 'N_ROAD_NORTH_2',     access: 'BOTH' },
  { from: 'N_ROAD_NORTH_2',     to: 'N_ROAD_NW_1',        access: 'BOTH' },
  { from: 'N_ROAD_NW_1',        to: 'N_BH7_ENTRANCE',     access: 'WALK' },
  { from: 'N_ROAD_NW_1',        to: 'N_ROAD_NW_2',        access: 'BOTH' },
  { from: 'N_ROAD_NW_2',        to: 'N_STUDENT_ENTRANCE',  access: 'WALK' },
  { from: 'N_ROAD_NORTH_2',     to: 'N_ROAD_NORTH_3',     access: 'BOTH' },
  { from: 'N_ROAD_NORTH_3',     to: 'N_BH1_ENTRANCE',     access: 'WALK' },
  { from: 'N_ROAD_NORTH_3',     to: 'N_ROAD_CORE_1',      access: 'BOTH' },
  { from: 'N_ROAD_NW_2',        to: 'N_ROAD_CORE_1',      access: 'BOTH' },

  // ── Academic Core & Offices ────────────────────────────────────────────────
  { from: 'N_ROAD_CORE_1',      to: 'N_ROAD_CORE_2',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_1',      to: 'N_ROAD_CORE_3',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_2',      to: 'N_ACADEMIC_MAIN',    access: 'WALK' },
  { from: 'N_ROAD_CORE_2',      to: 'N_ACADEMIC_EAST',    access: 'WALK' },
  { from: 'N_ROAD_CORE_2',      to: 'N_ROAD_CORE_4',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_3',      to: 'N_ELEC_OFFICE',      access: 'WALK' },
  { from: 'N_ROAD_CORE_3',      to: 'N_DATASCIENCE',      access: 'WALK' },
  { from: 'N_ROAD_CORE_3',      to: 'N_ROAD_CORE_5',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_4',      to: 'N_FOOTBALL1_ENTRY',  access: 'WALK' },
  { from: 'N_ROAD_CORE_4',      to: 'N_ROAD_CORE_5',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_4',      to: 'N_ROAD_CORE_6',      access: 'BOTH' },
  { from: 'N_ROAD_CORE_5',      to: 'N_AUDITORIUM_ENTRY', access: 'WALK' },
  { from: 'N_ROAD_CORE_5',      to: 'N_ROAD_CORE_EAST_1', access: 'BOTH' },
  { from: 'N_ROAD_CORE_EAST_1', to: 'N_INDOOR_STADIUM',   access: 'WALK' },
  { from: 'N_ROAD_CORE_6',      to: 'N_CBLOCK_ENTRANCE',  access: 'WALK' },
  { from: 'N_ROAD_CORE_6',      to: 'N_ROAD_MID_CENTRAL', access: 'BOTH' },

  // ── Mid Campus: Library, Science, Food Court, EV ──────────────────────────
  { from: 'N_ROAD_MID_CENTRAL',    to: 'N_SC_BLOCK',           access: 'WALK' },
  { from: 'N_ROAD_MID_CENTRAL',    to: 'N_ROAD_MID_WEST_2',    access: 'BOTH' },
  { from: 'N_ROAD_MID_CENTRAL',    to: 'N_ROAD_MID_EAST_1',    access: 'BOTH' },
  { from: 'N_ROAD_MID_CENTRAL',    to: 'N_ROAD_MID_CENTRAL_2', access: 'BOTH' },
  { from: 'N_ROAD_MID_WEST_2',     to: 'N_LIBRARY_ENTRANCE',   access: 'WALK' },
  { from: 'N_ROAD_MID_WEST_2',     to: 'N_DBLOCK_ENTRANCE',    access: 'WALK' },
  { from: 'N_ROAD_MID_WEST_2',     to: 'N_ROAD_MID_WEST_1',    access: 'WALK' },
  { from: 'N_ROAD_MID_WEST_1',     to: 'N_GYM_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_MID_EAST_1',     to: 'N_F_BLOCK',            access: 'WALK' },
  { from: 'N_ROAD_MID_EAST_1',     to: 'N_ROAD_MID_EAST_2',    access: 'BOTH' },
  { from: 'N_ROAD_CORE_EAST_1',    to: 'N_ROAD_MID_EAST_2',    access: 'BOTH' },
  { from: 'N_ROAD_MID_EAST_2',     to: 'N_FOOD_COURT',         access: 'WALK' },
  { from: 'N_ROAD_MID_EAST_2',     to: 'N_PLAYGROUND',         access: 'WALK' },
  { from: 'N_ROAD_MID_EAST_2',     to: 'N_ROAD_MID_EAST_3',    access: 'BOTH' },
  { from: 'N_ROAD_MID_EAST_3',     to: 'N_DRIVE_EV',           access: 'WALK' },
  { from: 'N_ROAD_MID_CENTRAL_2',  to: 'N_ROAD_MID_EBLOCK',    access: 'BOTH' },
  { from: 'N_ROAD_MID_EBLOCK',     to: 'N_EBLOCK_ENTRANCE',    access: 'WALK' },
  { from: 'N_ROAD_MID_EBLOCK',     to: 'N_ROAD_SC_CENTRAL_1',  access: 'BOTH' },
  { from: 'N_ROAD_MID_EAST_3',     to: 'N_ROAD_SC_EAST_1',     access: 'BOTH' },

  // ── South-Central: Garden, Sports & Hostels ───────────────────────────────
  { from: 'N_ROAD_MID_WEST_2',     to: 'N_ROAD_SC_WEST_1',     access: 'BOTH' },
  { from: 'N_ROAD_SC_WEST_1',      to: 'N_CRICKET_COURT',      access: 'WALK' },
  { from: 'N_ROAD_SC_WEST_1',      to: 'N_ROAD_SC_WEST_2',     access: 'BOTH' },
  { from: 'N_ROAD_SC_WEST_2',      to: 'N_LH4_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SC_CENTRAL_1',   to: 'N_GARDEN_ENTRY',       access: 'WALK' },
  { from: 'N_ROAD_SC_CENTRAL_1',   to: 'N_ROAD_SC_EAST_1',     access: 'BOTH' },
  { from: 'N_ROAD_SC_CENTRAL_1',   to: 'N_ROAD_SC_CENTRAL_2',  access: 'BOTH' },
  { from: 'N_ROAD_SC_CENTRAL_2',   to: 'N_LH4_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SC_CENTRAL_2',   to: 'N_UTIL_2',             access: 'WALK' },
  { from: 'N_ROAD_SC_CENTRAL_2',   to: 'N_ROAD_SOUTH_1',       access: 'BOTH' },
  { from: 'N_ROAD_SC_EAST_1',      to: 'N_ROAD_SC_EAST_2',     access: 'BOTH' },
  { from: 'N_ROAD_SC_EAST_2',      to: 'N_LH2_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SC_EAST_2',      to: 'N_ROAD_SC_EAST_3',     access: 'BOTH' },
  { from: 'N_ROAD_SC_EAST_3',      to: 'N_UTIL_1',             access: 'WALK' },
  { from: 'N_ROAD_SC_EAST_3',      to: 'N_ROAD_SOUTH_3',       access: 'BOTH' },
  { from: 'N_ROAD_SC_EAST_2',      to: 'N_ROAD_SOUTH_2',       access: 'BOTH' },

  // ── South Hostel Complex & South Gate ─────────────────────────────────────
  { from: 'N_ROAD_SOUTH_1',        to: 'N_ROAD_SOUTH_2',       access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_1',        to: 'N_LH3_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_2',        to: 'N_LH1_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_2',        to: 'N_ROAD_SOUTH_3',       access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_3',        to: 'N_BH6_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_3',        to: 'N_ROAD_SOUTH_5',       access: 'BOTH' },
  { from: 'N_LH3_ENTRANCE',        to: 'N_ROAD_SOUTH_4',       access: 'WALK' },
  { from: 'N_LH1_ENTRANCE',        to: 'N_ROAD_SOUTH_5',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_5',        to: 'N_ROAD_SOUTH_6',       access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_6',        to: 'N_BH8_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_4',        to: 'N_ROAD_SOUTH_7',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_5',        to: 'N_ROAD_SOUTH_8',       access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_7',        to: 'N_BH12_ENTRANCE',      access: 'WALK' },
  { from: 'N_ROAD_SOUTH_8',        to: 'N_BH5_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_8',        to: 'N_ROAD_SOUTH_9',       access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_6',        to: 'N_ROAD_SOUTH_10',      access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_9',        to: 'N_BH10_ENTRANCE',      access: 'WALK' },
  { from: 'N_ROAD_SOUTH_10',       to: 'N_BH9_ENTRANCE',       access: 'WALK' },
  { from: 'N_ROAD_SOUTH_9',        to: 'N_ROAD_SOUTH_11',      access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_10',       to: 'N_ROAD_SOUTH_11',      access: 'BOTH' },
  { from: 'N_ROAD_SOUTH_11',       to: 'N_FOOTBALL2_ENTRY',    access: 'WALK' },
];

// ── 3. BUILDING-TO-ENTRANCE ANCHOR MAP ─────────────────────────────────────────
// Associates each svg_element_id with its designated graph entrance node
export const BUILDING_ENTRANCE_MAP = {
  'electronic-office':     'N_ELEC_OFFICE',
  'lh1':                   'N_LH1_ENTRANCE',
  'lh2':                   'N_LH2_ENTRANCE',
  'lh3':                   'N_LH3_ENTRANCE',
  'lh4':                   'N_LH4_ENTRANCE',
  'lh5':                   'N_GATE_NORTH',
  'bh1':                   'N_BH1_ENTRANCE',
  'bh2':                   'N_BH2_ENTRANCE',
  'bh5':                   'N_BH5_ENTRANCE',
  'bh6':                   'N_BH6_ENTRANCE',
  'bh7':                   'N_BH7_ENTRANCE',
  'bh8':                   'N_BH8_ENTRANCE',
  'bh9':                   'N_BH9_ENTRANCE',
  'bh10':                  'N_BH10_ENTRANCE',
  'bh12':                  'N_BH12_ENTRANCE',
  'cricket-court1':        'N_CRICKET_COURT',
  'football-court1':       'N_FOOTBALL1_ENTRY',
  'football-court2':       'N_FOOTBALL2_ENTRY',
  'auditorium':            'N_AUDITORIUM_ENTRY',
  'center-of-datascience': 'N_DATASCIENCE',
  'indoor-stadium':        'N_INDOOR_STADIUM',
  'academic-block':        'N_ACADEMIC_MAIN',
  'studentsection':        'N_STUDENT_ENTRANCE',
  'd-block':               'N_DBLOCK_ENTRANCE',
  'library':               'N_LIBRARY_ENTRANCE',
  'f-block':               'N_F_BLOCK',
  'sc-block':              'N_SC_BLOCK',
  'eblock':                'N_EBLOCK_ENTRANCE',
  'garden':                'N_GARDEN_ENTRY',
  'unknown1':              'N_UTIL_1',
  'food-court':            'N_FOOD_COURT',
  'c-block':               'N_CBLOCK_ENTRANCE',
  'playground':            'N_PLAYGROUND',
  'gym':                   'N_GYM_ENTRANCE',
  'drive-ev':              'N_DRIVE_EV',
  'unknown':               'N_UTIL_2',
};

// ── 4. GRAPH ADJACENCY MATRIX BUILDER ──────────────────────────────────────────
/**
 * Calculates Euclidean distance in SVG pixel units
 */
export function calculateSvgDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

/**
 * Builds the graph adjacency list representation with calculated edge weights and access type.
 * Each neighbor entry: { node: string, weight: number, access: 'BOTH' | 'WALK' }
 */
export function buildCampusAdjacencyGraph() {
  const graph = {};

  // Initialize node buckets
  Object.keys(CAMPUS_NODES).forEach((nodeId) => {
    graph[nodeId] = [];
  });

  // Populate edges bidirectionally with Euclidean pixel weight and access type
  CAMPUS_EDGES.forEach(({ from, to, access }) => {
    const nodeA = CAMPUS_NODES[from];
    const nodeB = CAMPUS_NODES[to];

    if (!nodeA || !nodeB) {
      console.warn(`[CampusGraph] Missing node reference: ${from} <-> ${to}`);
      return;
    }

    const weight = calculateSvgDistance(nodeA, nodeB);

    graph[from].push({ node: to, weight, access });
    graph[to].push({ node: from, weight, access });

  });

  return graph;
}

export const campusAdjacencyGraph = buildCampusAdjacencyGraph();
