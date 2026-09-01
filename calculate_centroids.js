const fs = require('fs');

const svg = fs.readFileSync('c:/Users/ASUS/OneDrive/Desktop/fallback2/CampusLink/client/src/assets/campus-map.svg', 'utf8');

const buildings = [
  'lh5', 'bh7', 'bh2', 'bh1', 'academic-block', 'center-of-datascience',
  'football-court1', 'auditorium', 'c-block', 'sc-block', 'f-block',
  'food-court', 'eblock', 'cricket-court1', 'lh4', 'lh3', 'bh5', 'bh8',
  'bh9', 'football-court2', 'G-block', 'park-lh2', 'open-gym', 'mech-workshop', 'b-block'
];

function getCoordinates(d) {
  const coords = [];
  // Match pairs of numbers (x, y)
  const regex = /(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    coords.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
  }
  return coords;
}

function calculateCentroid(points) {
  let area = 0;
  let cx = 0;
  let cy = 0;

  // Ensure polygon is closed for the formula
  if (points.length > 0 && (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y)) {
    points = [...points, points[0]];
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const crossProduct = (p1.x * p2.y) - (p2.x * p1.y);
    area += crossProduct;
    cx += (p1.x + p2.x) * crossProduct;
    cy += (p1.y + p2.y) * crossProduct;
  }

  area = area / 2;
  if (area === 0) return { x: 0, y: 0 };

  cx = cx / (6 * area);
  cy = cy / (6 * area);

  return { x: Math.round(cx), y: Math.round(cy) };
}

const results = [];

for (const id of buildings) {
  // Regex to find the <g> with the specific id, and extract its first <path d="...">
  const groupRegex = new RegExp(`<g[^>]*id="${id}"[^>]*>[\\s\\S]*?<path[^>]*d="([^"]+)"`, 'i');
  let match = svg.match(groupRegex);
  
  if (!match) {
      // Try finding path directly with id
      const pathRegex = new RegExp(`<path[^>]*id="${id}"[^>]*d="([^"]+)"`, 'i');
      match = svg.match(pathRegex);
  }

  if (match) {
    const d = match[1];
    const points = getCoordinates(d);
    const centroid = calculateCentroid(points);
    results.push({
      id,
      centroid
    });
  } else {
    results.push({
      id,
      centroid: { x: null, y: null }
    });
  }
}

console.log(JSON.stringify(results, null, 2));
