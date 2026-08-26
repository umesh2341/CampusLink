import { CAMPUS_NODES, campusAdjacencyGraph, calculateSvgDistance } from '../../client/src/features/map/lib/campusGraphData.js';

export function calculateRouteToCar(userLocation, carLocation, options = {}) {
  const {
    transportMode = 'WALK',
    pixelsPerMeter = 4.6,
    nodes = CAMPUS_NODES,
    adjacencyGraph = campusAdjacencyGraph,
  } = options;

  if (!userLocation || !carLocation) {
    return { status: 'INVALID_INPUT', route: null };
  }

  const startPt = { x: Number(userLocation.x), y: Number(userLocation.y) };
  const targetPt = { x: Number(carLocation.x), y: Number(carLocation.y) };

  if (!Number.isFinite(startPt.x) || !Number.isFinite(startPt.y) ||
      !Number.isFinite(targetPt.x) || !Number.isFinite(targetPt.y)) {
    return { status: 'INVALID_COORDINATES', route: null };
  }

  const startNode = findClosestGraphNode(startPt, nodes);
  const targetNode = findClosestGraphNode(targetPt, nodes);

  if (!startNode || !targetNode) {
    return { status: 'NO_NEARBY_NODES', route: null };
  }

  if (startNode.id === targetNode.id) {
    const directDistPx = calculateEuclideanDistance(startPt, targetPt);
    const directMeters = Math.max(5, Math.round(directDistPx / pixelsPerMeter));
    const etaMins = Math.max(1, Math.ceil(directMeters / 75));
    const coordinates = [startPt, targetPt];

    return {
      status: 'active',
      route: {
        start: startPt,
        destination: targetPt,
        coordinates: coordinates,
        svgPathD: formatSvgPath(coordinates),
        distanceMeters: directMeters,
        estimatedMinutes: etaMins,
        nodeIds: [startNode.id],
      },
    };
  }

  const pathNodeIds = executeAStar(startNode.id, targetNode.id, adjacencyGraph, nodes, transportMode);

  if (!pathNodeIds || pathNodeIds.length === 0) {
    return { status: 'NO_ROUTE_FOUND', route: null };
  }

  const coordinates = [];
  coordinates.push(startPt);

  for (const nodeId of pathNodeIds) {
    const node = nodes[nodeId];
    if (node) {
      coordinates.push({ x: node.x, y: node.y, id: nodeId, name: node.name });
    }
  }

  coordinates.push(targetPt);

  let totalPixelDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalPixelDistance += calculateEuclideanDistance(coordinates[i], coordinates[i + 1]);
  }

  const distanceMeters = Math.max(10, Math.round(totalPixelDistance / pixelsPerMeter));
  const walkingSpeedMps = 1.25;
  const estimatedMinutes = Math.max(1, Math.round(distanceMeters / (walkingSpeedMps * 60)));
  const svgPathD = formatSvgPath(coordinates);

  return {
    status: 'active',
    route: {
      start: startPt,
      destination: targetPt,
      coordinates: coordinates,
      svgPathD: svgPathD,
      distanceMeters: distanceMeters,
      totalPixelDistance: Math.round(totalPixelDistance),
      estimatedMinutes: estimatedMinutes,
      nodeIds: pathNodeIds,
      timestamp: Date.now(),
    },
  };
}

export function findClosestGraphNode(point, nodes) {
  let minDistance = Infinity;
  let closest = null;

  for (const key of Object.keys(nodes)) {
    const node = nodes[key];
    const dist = calculateEuclideanDistance(point, node);
    if (dist < minDistance) {
      minDistance = dist;
      closest = node;
    }
  }

  return closest;
}

export function calculateEuclideanDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function formatSvgPath(points) {
  if (!points || points.length === 0) return '';
  return points.reduce((path, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');
}

function executeAStar(startId, targetId, graph, nodes, mode = 'WALK') {
  const openSet = new Set([startId]);
  const cameFrom = new Map();

  const gScore = new Map();
  const fScore = new Map();

  for (const nodeId of Object.keys(nodes)) {
    gScore.set(nodeId, Infinity);
    fScore.set(nodeId, Infinity);
  }

  gScore.set(startId, 0);
  fScore.set(startId, calculateEuclideanDistance(nodes[startId], nodes[targetId]));

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      const f = fScore.get(nodeId);
      if (f < lowestF) {
        lowestF = f;
        current = nodeId;
      }
    }

    if (current === targetId) {
      const path = [current];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.unshift(current);
      }
      return path;
    }

    openSet.delete(current);
    const neighbors = graph[current] || [];

    for (const neighbor of neighbors) {
      if (mode === 'CAR' && neighbor.access === 'WALK') {
        continue;
      }

      const tentativeG = gScore.get(current) + neighbor.weight;
      const neighborG = gScore.get(neighbor.node);

      if (tentativeG < neighborG) {
        cameFrom.set(neighbor.node, current);
        gScore.set(neighbor.node, tentativeG);
        const h = calculateEuclideanDistance(nodes[neighbor.node], nodes[targetId]);
        fScore.set(neighbor.node, tentativeG + h);
        openSet.add(neighbor.node);
      }
    }
  }

  return null;
}
