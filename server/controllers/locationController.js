import pool from '../db/pool.js';

/**
 * Location Controller for CampusLink Live Location Tracking
 *
 * Implements strict coordinate validation, identity verification from req.user,
 * atomic upserts into PostgreSQL, and active location querying.
 */

// Helper to validate geographic coordinates
const validateCoordinates = (latitude, longitude, accuracy) => {
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return 'Invalid latitude. Must be a finite number between -90 and +90.';
  }
  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return 'Invalid longitude. Must be a finite number between -180 and +180.';
  }
  if (accuracy !== undefined && accuracy !== null) {
    if (typeof accuracy !== 'number' || isNaN(accuracy) || accuracy < 0) {
      return 'Invalid accuracy. Must be a non-negative number in meters.';
    }
  }
  return null;
};

// POST /api/location
// Update authenticated user's latest location
export const updateLocation = async (req, res) => {
  const userId = req.user.id;
  const { latitude, longitude, accuracy, altitude, heading, speed } = req.body;

  // Validate incoming coordinates
  const validationError = validateCoordinates(
    Number(latitude),
    Number(longitude),
    accuracy !== undefined && accuracy !== null ? Number(accuracy) : undefined
  );

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const query = `
      INSERT INTO user_locations (
        user_id, latitude, longitude, accuracy, altitude, heading, speed, is_active, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        altitude = EXCLUDED.altitude,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      userId,
      Number(latitude),
      Number(longitude),
      accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
      altitude !== undefined && altitude !== null ? Number(altitude) : null,
      heading !== undefined && heading !== null ? Number(heading) : null,
      speed !== undefined && speed !== null ? Number(speed) : null,
    ];

    const { rows } = await pool.query(query, values);
    const updated = rows[0];

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        id: updated.id,
        user_id: updated.user_id,
        latitude: parseFloat(updated.latitude),
        longitude: parseFloat(updated.longitude),
        accuracy: updated.accuracy ? parseFloat(updated.accuracy) : null,
        altitude: updated.altitude ? parseFloat(updated.altitude) : null,
        heading: updated.heading ? parseFloat(updated.heading) : null,
        speed: updated.speed ? parseFloat(updated.speed) : null,
        is_active: updated.is_active,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating user location in DB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update location in database',
    });
  }
};

// GET /api/location/me
// Retrieve authenticated user's current location & sharing state
export const getMyLocation = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT ul.*, p.name AS user_name, p.email AS user_email, p.role AS user_role
      FROM user_locations ul
      JOIN profiles p ON ul.user_id = p.id
      WHERE ul.user_id = $1;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No location recorded for this user yet',
        data: null,
      });
    }

    const loc = rows[0];
    const isStale = (Date.now() - new Date(loc.updated_at).getTime()) > 120_000; // 2 minutes

    res.json({
      success: true,
      data: {
        id: loc.id,
        user_id: loc.user_id,
        user_name: loc.user_name,
        user_role: loc.user_role,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        accuracy: loc.accuracy ? parseFloat(loc.accuracy) : null,
        altitude: loc.altitude ? parseFloat(loc.altitude) : null,
        heading: loc.heading ? parseFloat(loc.heading) : null,
        speed: loc.speed ? parseFloat(loc.speed) : null,
        is_active: loc.is_active,
        status: !loc.is_active ? 'OFFLINE' : (isStale ? 'STALE' : 'LIVE'),
        updated_at: loc.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user location:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve location from database',
    });
  }
};

// DELETE /api/location/me
// Disable location sharing (opt-out)
export const stopSharingLocation = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      `UPDATE user_locations
       SET is_active = FALSE, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Location sharing stopped successfully',
    });
  } catch (error) {
    console.error('Error stopping location sharing:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update location sharing state',
    });
  }
};

// GET /api/location/active
// Retrieve all active and live users sharing location within campus
export const getActiveLocations = async (req, res) => {
  try {
    // Only return locations updated within the last 2 minutes and with is_active = TRUE
    const query = `
      SELECT 
        ul.id,
        ul.user_id,
        ul.latitude,
        ul.longitude,
        ul.accuracy,
        ul.heading,
        ul.speed,
        ul.updated_at,
        p.name AS user_name,
        p.role AS user_role
      FROM user_locations ul
      JOIN profiles p ON ul.user_id = p.id
      WHERE ul.is_active = TRUE
        AND ul.updated_at >= NOW() - INTERVAL '2 minutes'
      ORDER BY ul.updated_at DESC
      LIMIT 100;
    `;

    const { rows } = await pool.query(query);

    const activeList = rows.map((r) => ({
      user_id: r.user_id,
      user_name: r.user_name,
      user_role: r.user_role,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      accuracy: r.accuracy ? parseFloat(r.accuracy) : null,
      heading: r.heading ? parseFloat(r.heading) : null,
      speed: r.speed ? parseFloat(r.speed) : null,
      updated_at: r.updated_at,
      status: 'LIVE',
    }));

    res.json({
      success: true,
      count: activeList.length,
      data: activeList,
    });
  } catch (error) {
    console.error('Error fetching active locations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active campus locations',
    });
  }
};
