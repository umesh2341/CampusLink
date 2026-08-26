export const DEFAULT_CAMPUS_LANDMARKS = [
  { id: 'lh5_north_gate', name: 'North Main Gate (LH-5)', x: 676, y: 48, radius: 45, category: 'gate' },
  { id: 'bh7', name: 'BH-7 Hostel', x: 389, y: 140, radius: 40, category: 'hostel' },
  { id: 'bh2', name: 'BH-2 Hostel', x: 590, y: 180, radius: 40, category: 'hostel' },
  { id: 'bh1', name: 'BH-1 Hostel', x: 572, y: 366, radius: 40, category: 'hostel' },
  { id: 'student_section', name: 'Student Section & Admin', x: 332, y: 446, radius: 45, category: 'admin' },
  { id: 'elec_office', name: 'Electronics Office', x: 719, y: 605, radius: 35, category: 'academic' },
  { id: 'datascience', name: 'Centre for Data Science', x: 869, y: 614, radius: 45, category: 'academic' },
  { id: 'academic_block', name: 'Academic Block', x: 437, y: 650, radius: 60, category: 'academic' },
  { id: 'football_court1', name: 'Football Court 1', x: 709, y: 766, radius: 55, category: 'sports' },
  { id: 'auditorium', name: 'University Auditorium', x: 941, y: 794, radius: 60, category: 'auditorium' },
  { id: 'c_block', name: 'C-Block', x: 716, y: 961, radius: 50, category: 'academic' },
  { id: 'indoor_stadium', name: 'Indoor Stadium', x: 1105, y: 983, radius: 55, category: 'sports' },
  { id: 'sc_block', name: 'Science Complex (SC-Block)', x: 764, y: 1177, radius: 50, category: 'academic' },
  { id: 'f_block', name: 'F-Block', x: 1053, y: 1213, radius: 50, category: 'academic' },
  { id: 'd_block', name: 'D-Block', x: 321, y: 1266, radius: 50, category: 'academic' },
  { id: 'library', name: 'Central Library', x: 537, y: 1266, radius: 45, category: 'academic' },
  { id: 'gym', name: 'Campus Gymnasium', x: 52, y: 1262, radius: 40, category: 'sports' },
  { id: 'food_court', name: 'Food Court Plaza', x: 1337, y: 1308, radius: 65, category: 'cafeteria' },
  { id: 'e_block', name: 'E-Block', x: 871, y: 1485, radius: 50, category: 'academic' },
  { id: 'cricket_court', name: 'Cricket Ground', x: 394, y: 1614, radius: 70, category: 'sports' },
  { id: 'lh4', name: 'LH-4 Hostel', x: 583, y: 1836, radius: 45, category: 'hostel' },
  { id: 'lh3', name: 'LH-3 Hostel', x: 847, y: 2143, radius: 45, category: 'hostel' },
  { id: 'bh5_bh8', name: 'BH-5 / BH-8 Hostels', x: 1302, y: 2436, radius: 55, category: 'hostel' },
  { id: 'bh9_south_gate', name: 'South Gate (BH-9)', x: 1451, y: 2637, radius: 50, category: 'gate' },
  { id: 'football_court2', name: 'Football Court 2', x: 1344, y: 2830, radius: 60, category: 'sports' },
];

export function createSemanticLocationResolver(landmarks = DEFAULT_CAMPUS_LANDMARKS, pixelsPerMeter = 4.6) {
  const activeLandmarks = Array.isArray(landmarks) ? landmarks : DEFAULT_CAMPUS_LANDMARKS;

  function resolveLocation(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      return {
        description: 'Location unknown',
        nearestLandmark: null,
        distanceMeters: null,
        isInsideZone: false,
      };
    }

    let nearest = null;
    let minDistancePx = Infinity;

    for (const lm of activeLandmarks) {
      const dx = x - lm.x;
      const dy = y - lm.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      if (distPx < minDistancePx) {
        minDistancePx = distPx;
        nearest = lm;
      }
    }

    if (!nearest) {
      return {
        description: 'On Campus',
        nearestLandmark: null,
        distanceMeters: null,
        isInsideZone: false,
      };
    }

    const distanceMeters = Math.round(minDistancePx / pixelsPerMeter);
    const radiusPx = nearest.radius || 45;
    const isInsideZone = minDistancePx <= radiusPx;

    let description = '';
    if (isInsideZone) {
      description = `At ${nearest.name}`;
    } else if (distanceMeters < 12) {
      description = `Adjacent to ${nearest.name}`;
    } else if (distanceMeters < 100) {
      description = `${distanceMeters}m from ${nearest.name}`;
    } else {
      description = `Heading towards ${nearest.name} (~${distanceMeters}m)`;
    }

    return {
      description,
      nearestLandmark: nearest,
      distanceMeters,
      isInsideZone,
    };
  }

  return {
    resolveLocation,
    landmarks: activeLandmarks,
  };
}
