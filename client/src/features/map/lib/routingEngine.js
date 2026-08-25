/**
 * routingEngine.js
 *
 * Professional Shortest Path (A*) Campus Routing Engine for CampusLink.
 *
 * Features:
 *  - A* (A-Star) search algorithm with admissible Euclidean heuristic
 *  - Nearest-node & orthogonal edge projection snapping for live user location
 *  - Calibrated pixel-to-meter conversion (~4.6 SVG pixels/meter)
 *  - Transport mode filtering: WALK / BIKE / CAR with mode-appropriate ETA
 *  - Clean SVG path ('d' attribute) generator for smooth directional rendering
 */

import {
  CAMPUS_NODES,
  CAMPUS_EDGES,
  BUILDING_ENTRANCE_MAP,
  campusAdjacencyGraph,
  calculateSvgDistance,
} from './campusGraphData.js';

// ── CALIBRATION CONSTANTS ──────────────────────────────────────────────────────
// The ITER campus SVG is 1580 x 2891 px, representing ~628 meters N-S (~4.6 px/meter).
export const SVG_PIXELS_PER_METER = 4.6;

/**
 * Mode-specific travel speeds in meters/minute.
 * WALK  ~4.5 km/h | BIKE ~15 km/h | CAR ~36 km/h
 */
export const TRANSPORT_SPEEDS = {
  WALK: 75,
  BIKE: 250,
  CAR:  600,
};

/**
 * Returns true if a graph neighbor edge is accessible for the given transport mode.
 *
 * Access matrix:
 *   WALK — can use BOTH and WALK edges (all pedestrian paths + roads)
 *   BIKE — can use BOTH and WALK edges (campus bikes use same paths as pedestrians)
 *   CAR  — can only use BOTH edges (main roads; cannot enter pedestrian concourses)
 *
 * @param {{ access: 'BOTH' | 'WALK' }} neighbor - Adjacency list neighbor entry
 * @param {'WALK' | 'BIKE' | 'CAR'} mode
 * @returns {boolean}
 */
export function isEdgeAllowed(neighbor, mode) {
  if (mode === 'CAR') {
    return neighbor.access === 'BOTH';
  }
  // WALK and BIKE: all edges allowed
  return true;
}

/**
 * Finds the nearest graph node to a given (x, y) coordinate.
 */
export function findNearestNode(point, nodes = CAMPUS_NODES) {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null;
  }

  let minDistance = Infinity;
  let nearestNode = null;

  Object.values(nodes).forEach((node) => {
    const dist = calculateSvgDistance(point, node);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  });

  return nearestNode;
}

/**
 * Projects a point onto a line segment (P1 -> P2).
 * Returns the closest point on the segment and the distance.
 */
function projectPointOnSegment(p, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return { point: { x: p1.x, y: p1.y }, distance: calculateSvgDistance(p, p1) };
  }

  // Parameter t of projection onto line: clamped between 0 and 1 for segment
  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lengthSq));
  const projX = Math.round(p1.x + t * dx);
  const projY = Math.round(p1.y + t * dy);
  const projPoint = { x: projX, y: projY };

  return {
    point: projPoint,
    distance: calculateSvgDistance(p, projPoint),
    t,
  };
}

/**
 * Snaps arbitrary live location coordinate to the nearest walkable edge or node on campus.
 */
export function snapToWalkwayNetwork(point, nodes = CAMPUS_NODES, edges = CAMPUS_EDGES, maxDistance = 600) {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null;
  }

  let bestSnap = null;
  let minDistance = Infinity;

  // 1. Check all edge segments
  edges.forEach((edge) => {
    const nodeA = nodes[edge.from];
    const nodeB = nodes[edge.to];
    if (!nodeA || !nodeB) return;

    const projection = projectPointOnSegment(point, nodeA, nodeB);
    if (projection.distance < minDistance) {
      minDistance = projection.distance;
      bestSnap = {
        snappedPoint: projection.point,
        distance: projection.distance,
        nearestNodeA: nodeA,
        nearestNodeB: nodeB,
        closestNode: projection.t < 0.5 ? nodeA : nodeB,
      };
    }
  });

  // 2. Fallback to direct nearest node if no edges matched
  if (!bestSnap) {
    const directNode = findNearestNode(point, nodes);
    if (directNode) {
      const dist = calculateSvgDistance(point, directNode);
      bestSnap = {
        snappedPoint: { x: directNode.x, y: directNode.y },
        distance: dist,
        closestNode: directNode,
        nearestNodeA: directNode,
        nearestNodeB: directNode,
      };
      minDistance = dist;
    }
  }

  // Reject points that are unreasonably far from campus walkways (> maxDistance)
  if (minDistance > maxDistance) {
    return null;
  }

  return bestSnap;
}

/**
 * Core A* Shortest Path Algorithm on Campus Graph with transport mode filtering.
 *
 * @param {string} startNodeId - Start node identifier
 * @param {string} goalNodeId  - Destination node identifier
 * @param {Object} graph       - Adjacency list (from campusAdjacencyGraph)
 * @param {Object} nodes       - Map of all nodes with (x, y)
 * @param {'WALK'|'BIKE'|'CAR'} transportMode - Controls which edges are traversable
 * @returns {Array<string>|null} Ordered list of node IDs from start to goal, or null if unreachable
 */
export function aStarSearch(
  startNodeId,
  goalNodeId,
  graph = campusAdjacencyGraph,
  nodes = CAMPUS_NODES,
  transportMode = 'WALK',
) {
  if (!startNodeId || !goalNodeId || !nodes[startNodeId] || !nodes[goalNodeId]) {
    return null;
  }

  if (startNodeId === goalNodeId) {
    return [startNodeId];
  }

  const goalNode = nodes[goalNodeId];

  // Priority queue / open set
  const openSet = new Set([startNodeId]);
  const cameFrom = new Map();

  // Cost from start along best known path
  const gScore = new Map();
  Object.keys(nodes).forEach((id) => gScore.set(id, Infinity));
  gScore.set(startNodeId, 0);

  // Estimated total cost from start to goal through node
  const fScore = new Map();
  Object.keys(nodes).forEach((id) => fScore.set(id, Infinity));
  fScore.set(startNodeId, calculateSvgDistance(nodes[startNodeId], goalNode));

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current = null;
    let lowestF = Infinity;

    openSet.forEach((nodeId) => {
      const score = fScore.get(nodeId) ?? Infinity;
      if (score < lowestF) {
        lowestF = score;
        current = nodeId;
      }
    });

    if (!current) break;

    // Goal reached! Reconstruct ordered path
    if (current === goalNodeId) {
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
      // Skip edges not accessible to the current transport mode
      if (!isEdgeAllowed(neighbor, transportMode)) continue;

      const neighborId = neighbor.node;
      const tentativeG = gScore.get(current) + neighbor.weight;

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);

        const heuristic = calculateSvgDistance(nodes[neighborId], goalNode);
        fScore.set(neighborId, tentativeG + heuristic);

        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  // No path found in graph
  return null;
}

/**
 * For CAR mode, building entrances are reachable only via pedestrian WALK edges.
 * This helper finds the nearest graph node (within 2 hops) that is road-accessible —
 * i.e., has at least one BOTH-access edge. This is the closest point a car can reach
 * before the user walks the final short stretch to the entrance.
 *
 * @param {string} targetNodeId
 * @param {Object} graph  - adjacency list from campusAdjacencyGraph
 * @returns {string} road-accessible drop-off node ID
 */
export function resolveCarDropOffNode(targetNodeId, graph = campusAdjacencyGraph) {
  // BFS up to 2 hops from the entrance to find the nearest road-accessible node
  const visited = new Set([targetNodeId]);
  const queue = [{ id: targetNodeId, hops: 0, weight: 0 }];

  let bestRoadNode = null;
  let bestWeight = Infinity;

  while (queue.length > 0) {
    const { id, hops, weight } = queue.shift();

    // Check if this node has at least one BOTH-type outgoing edge (car-reachable junction)
    const edges = graph[id] || [];
    const hasRoadAccess = id !== targetNodeId && edges.some((e) => e.access === 'BOTH');

    if (hasRoadAccess && weight < bestWeight) {
      bestWeight = weight;
      bestRoadNode = id;
    }

    // BFS up to 2 hops
    if (hops < 2) {
      for (const neighbor of edges) {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node);
          queue.push({ id: neighbor.node, hops: hops + 1, weight: weight + neighbor.weight });
        }
      }
    }
  }

  // Safety fallback: return self if no road-accessible node found within 2 hops
  return bestRoadNode ?? targetNodeId;
}

/**
 * Checks if a given node is directly on a vehicle-accessible road (has at least one 'BOTH' edge).
 *
 * @param {string} nodeId
 * @param {Object} graph - Adjacency list from campusAdjacencyGraph
 * @returns {boolean}
 */
export function isNodeOnRoad(nodeId, graph = campusAdjacencyGraph) {
  if (!nodeId || !graph[nodeId]) return false;
  return graph[nodeId].some((edge) => edge.access === 'BOTH');
}

/**
 * Builds an SVG path `d` string from an array of coordinate objects [{x, y}].
 */
export function buildSvgPathString(coordinates) {
  if (!coordinates || coordinates.length < 2) return '';
  return coordinates.reduce((acc, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');
}

/**
 * Main CampusLink Route Solver:
 * Calculates full navigation route from Live User Location to Selected Destination Building.
 * Distinguishes between 3 destination states:
 *  1. FULL_ROUTE: Fully reachable by the selected transport mode.
 *  2. VEHICLE_PLUS_WALK: For CAR mode, destination is a pedestrian entrance adjacent to a road.
 *     Car drives to the nearest verified road junction drop-off point, user walks the final portion.
 *  3. NO_ROUTE: Destination cannot be reached by the selected transport mode.
 *
 * @param {Object} params
 * @param {Object} params.startLocation       - User live coordinate { x, y } (from existing tracker)
 * @param {Object} params.destinationBuilding - Selected building object { id, svg_element_id, name, ... }
 * @param {Object} params.buildingCoordsMap   - Map of building SVG coordinates (buildingCoords.js)
 * @param {'WALK'|'BIKE'|'CAR'} params.transportMode - Travel mode (default: 'WALK')
 * @returns {Object} Structured navigation route object with routeType: 'FULL_ROUTE' | 'VEHICLE_PLUS_WALK' | 'NO_ROUTE'
 */
export function calculateCampusRoute({
  startLocation,
  destinationBuilding,
  buildingCoordsMap = {},
  transportMode = 'WALK',
}) {
  // 1. Validation checks
  if (!startLocation || typeof startLocation.x !== 'number' || typeof startLocation.y !== 'number' || isNaN(startLocation.x) || isNaN(startLocation.y)) {
    return {
      status: 'error',
      routeType: 'NO_ROUTE',
      error: 'Current location unavailable',
      route: null,
    };
  }

  if (!destinationBuilding) {
    return {
      status: 'error',
      routeType: 'NO_ROUTE',
      error: 'No destination selected',
      route: null,
    };
  }

  const svgId = destinationBuilding.svg_element_id || destinationBuilding.building_svg_element_id;
  const directBuildingCoord = (svgId && buildingCoordsMap[svgId]) || null;

  // 2. Identify destination entrance node
  let targetNodeId = svgId ? BUILDING_ENTRANCE_MAP[svgId] : null;

  if (!targetNodeId && directBuildingCoord) {
    const nearest = findNearestNode(directBuildingCoord);
    targetNodeId = nearest ? nearest.id : null;
  }

  if (!targetNodeId || !CAMPUS_NODES[targetNodeId]) {
    return {
      status: 'error',
      routeType: 'NO_ROUTE',
      error: 'Destination entrance not found on campus map',
      route: null,
    };
  }

  const targetEntranceNode = CAMPUS_NODES[targetNodeId];
  const finalDestinationPoint = directBuildingCoord || { x: targetEntranceNode.x, y: targetEntranceNode.y };

  // 3. Snap start location to nearest walkway / node
  const startSnap = snapToWalkwayNetwork(startLocation);
  if (!startSnap || !startSnap.closestNode) {
    return {
      status: 'error',
      routeType: 'NO_ROUTE',
      error: 'Unable to locate nearest campus walkway',
      route: null,
    };
  }

  const startNodeId = startSnap.closestNode.id;

  // ── 4. CAR TRANSPORT ROUTING (CASE 1, CASE 2, CASE 3) ─────────────────────────
  if (transportMode === 'CAR') {
    const destinationHasDirectRoadAccess = isNodeOnRoad(targetNodeId, campusAdjacencyGraph);

    // CASE 1: Destination is directly on a vehicle road (e.g. North Gate / LH-5)
    if (destinationHasDirectRoadAccess) {
      const carStartNodeId = isNodeOnRoad(startNodeId) ? startNodeId : resolveCarDropOffNode(startNodeId);
      const directCarPath = aStarSearch(carStartNodeId, targetNodeId, campusAdjacencyGraph, CAMPUS_NODES, 'CAR');

      if (directCarPath && directCarPath.length > 0) {
        const coordinates = [{ x: startLocation.x, y: startLocation.y }];
        directCarPath.forEach((nodeId) => {
          const node = CAMPUS_NODES[nodeId];
          if (node) coordinates.push({ x: node.x, y: node.y, name: node.name, id: nodeId });
        });
        if (calculateSvgDistance(coordinates[coordinates.length - 1], finalDestinationPoint) > 8) {
          coordinates.push({ x: finalDestinationPoint.x, y: finalDestinationPoint.y });
        }

        let totalPx = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
          totalPx += calculateSvgDistance(coordinates[i], coordinates[i + 1]);
        }
        const distanceMeters = Math.max(15, Math.round(totalPx / SVG_PIXELS_PER_METER));
        const estimatedMinutes = Math.max(1, Math.round(distanceMeters / TRANSPORT_SPEEDS.CAR));

        return {
          status: 'active',
          routeType: 'FULL_ROUTE',
          error: null,
          route: {
            start: { x: startLocation.x, y: startLocation.y },
            destination: {
              id: destinationBuilding.id,
              svg_element_id: svgId,
              name: destinationBuilding.name,
              x: finalDestinationPoint.x,
              y: finalDestinationPoint.y,
            },
            routeType: 'FULL_ROUTE',
            transportMode: 'CAR',
            nodeIds: directCarPath,
            coordinates,
            svgPathD: buildSvgPathString(coordinates),
            distanceMeters,
            totalPixelDistance: Math.round(totalPx),
            estimatedMinutes,
            timestamp: Date.now(),
          },
        };
      }
    }

    // CASE 2: Destination is in a pedestrian concourse adjacent to a road -> Multimodal (Drive + Walk)
    const dropOffNodeId = resolveCarDropOffNode(targetNodeId, campusAdjacencyGraph);
    const dropOffNode = CAMPUS_NODES[dropOffNodeId];

    if (dropOffNode && isNodeOnRoad(dropOffNodeId, campusAdjacencyGraph)) {
      const carStartNodeId = isNodeOnRoad(startNodeId) ? startNodeId : resolveCarDropOffNode(startNodeId);
      
      // Calculate Drive portion: Start -> Drop-Off Junction (Road edges only)
      const drivePathIds = aStarSearch(carStartNodeId, dropOffNodeId, campusAdjacencyGraph, CAMPUS_NODES, 'CAR');
      
      // Calculate Walk portion: Drop-Off Junction -> Building Entrance (Walk edges)
      const walkPathIds = aStarSearch(dropOffNodeId, targetNodeId, campusAdjacencyGraph, CAMPUS_NODES, 'WALK');

      if (drivePathIds && drivePathIds.length > 0 && walkPathIds && walkPathIds.length > 0) {
        // Assemble Drive coordinates
        const driveCoordinates = [{ x: startLocation.x, y: startLocation.y }];
        drivePathIds.forEach((nodeId) => {
          const node = CAMPUS_NODES[nodeId];
          if (node) driveCoordinates.push({ x: node.x, y: node.y, name: node.name, id: nodeId });
        });

        // Assemble Walk coordinates (starting from drop-off)
        const walkCoordinates = [];
        walkPathIds.forEach((nodeId) => {
          const node = CAMPUS_NODES[nodeId];
          if (node) walkCoordinates.push({ x: node.x, y: node.y, name: node.name, id: nodeId });
        });
        if (calculateSvgDistance(walkCoordinates[walkCoordinates.length - 1], finalDestinationPoint) > 8) {
          walkCoordinates.push({ x: finalDestinationPoint.x, y: finalDestinationPoint.y });
        }

        // Combined full coordinate chain
        const combinedCoordinates = [...driveCoordinates, ...walkCoordinates.slice(1)];

        // Calculate drive distance & ETA
        let drivePx = 0;
        for (let i = 0; i < driveCoordinates.length - 1; i++) {
          drivePx += calculateSvgDistance(driveCoordinates[i], driveCoordinates[i + 1]);
        }
        const driveDistanceMeters = Math.max(10, Math.round(drivePx / SVG_PIXELS_PER_METER));
        const driveEtaMinutes = Math.max(1, Math.round(driveDistanceMeters / TRANSPORT_SPEEDS.CAR));

        // Calculate walk distance & ETA
        let walkPx = 0;
        for (let i = 0; i < walkCoordinates.length - 1; i++) {
          walkPx += calculateSvgDistance(walkCoordinates[i], walkCoordinates[i + 1]);
        }
        const walkDistanceMeters = Math.max(10, Math.round(walkPx / SVG_PIXELS_PER_METER));
        const walkEtaMinutes = Math.max(1, Math.round(walkDistanceMeters / TRANSPORT_SPEEDS.WALK));

        const totalDistanceMeters = driveDistanceMeters + walkDistanceMeters;
        const totalEtaMinutes = driveEtaMinutes + walkEtaMinutes;

        return {
          status: 'active',
          routeType: 'VEHICLE_PLUS_WALK',
          error: null,
          route: {
            start: { x: startLocation.x, y: startLocation.y },
            destination: {
              id: destinationBuilding.id,
              svg_element_id: svgId,
              name: destinationBuilding.name,
              x: finalDestinationPoint.x,
              y: finalDestinationPoint.y,
            },
            routeType: 'VEHICLE_PLUS_WALK',
            transportMode: 'CAR',
            transferPoint: {
              id: dropOffNode.id,
              name: dropOffNode.name,
              x: dropOffNode.x,
              y: dropOffNode.y,
            },
            driveDistanceMeters,
            walkDistanceMeters,
            distanceMeters: totalDistanceMeters,
            drivePixelDistance: Math.round(drivePx),
            walkPixelDistance: Math.round(walkPx),
            totalPixelDistance: Math.round(drivePx + walkPx),
            driveEtaMinutes,
            walkEtaMinutes,
            estimatedMinutes: totalEtaMinutes,
            driveSvgPathD: buildSvgPathString(driveCoordinates),
            walkSvgPathD: buildSvgPathString(walkCoordinates),
            svgPathD: buildSvgPathString(combinedCoordinates),
            coordinates: combinedCoordinates,
            driveCoordinates,
            walkCoordinates,
            nodeIds: [...drivePathIds, ...walkPathIds.slice(1)],
            timestamp: Date.now(),
          },
        };
      }
    }

    // CASE 3: Completely unreachable by vehicle
    return {
      status: 'no_route',
      routeType: 'NO_ROUTE',
      error: 'This destination cannot be reached by car from your current location.',
      transportMode: 'CAR',
      route: null,
    };
  }

  // ── 5. PEDESTRIAN / BICYCLE ROUTING (WALK | BIKE) ──────────────────────────────
  const nodePathIds = aStarSearch(startNodeId, targetNodeId, campusAdjacencyGraph, CAMPUS_NODES, transportMode);

  if (!nodePathIds || nodePathIds.length === 0) {
    return {
      status: 'no_route',
      routeType: 'NO_ROUTE',
      error: 'No route available between your location and this destination.',
      transportMode,
      route: null,
    };
  }

  // Assemble ordered coordinate chain:
  // [Exact Live Location] -> [Snapped Walkway Point] -> [Graph Node 1...N] -> [Building Destination]
  const coordinates = [];
  coordinates.push({ x: startLocation.x, y: startLocation.y });

  if (startSnap.snappedPoint &&
      calculateSvgDistance(startLocation, startSnap.snappedPoint) > 8 &&
      calculateSvgDistance(startSnap.snappedPoint, CAMPUS_NODES[nodePathIds[0]]) > 8) {
    coordinates.push({ x: startSnap.snappedPoint.x, y: startSnap.snappedPoint.y });
  }

  nodePathIds.forEach((nodeId) => {
    const node = CAMPUS_NODES[nodeId];
    if (node) {
      coordinates.push({ x: node.x, y: node.y, name: node.name, id: nodeId });
    }
  });

  if (calculateSvgDistance(coordinates[coordinates.length - 1], finalDestinationPoint) > 8) {
    coordinates.push({ x: finalDestinationPoint.x, y: finalDestinationPoint.y });
  }

  let totalPixelDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalPixelDistance += calculateSvgDistance(coordinates[i], coordinates[i + 1]);
  }

  const distanceMeters = Math.max(15, Math.round(totalPixelDistance / SVG_PIXELS_PER_METER));
  const speedMetersPerMin = TRANSPORT_SPEEDS[transportMode] ?? TRANSPORT_SPEEDS.WALK;
  const estimatedMinutes = Math.max(1, Math.round(distanceMeters / speedMetersPerMin));
  const svgPathD = buildSvgPathString(coordinates);

  return {
    status: 'active',
    routeType: 'FULL_ROUTE',
    error: null,
    route: {
      start: { x: startLocation.x, y: startLocation.y },
      destination: {
        id: destinationBuilding.id,
        svg_element_id: svgId,
        name: destinationBuilding.name,
        x: finalDestinationPoint.x,
        y: finalDestinationPoint.y,
      },
      routeType: 'FULL_ROUTE',
      nodeIds: nodePathIds,
      coordinates,
      svgPathD,
      distanceMeters,
      totalPixelDistance: Math.round(totalPixelDistance),
      estimatedMinutes,
      transportMode,
      timestamp: Date.now(),
    },
  };
}
