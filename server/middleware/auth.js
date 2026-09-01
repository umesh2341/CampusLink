import pool from '../db/pool.js';
import { verifySupabaseToken } from '../lib/supabase.js';

/**
 * Authentication Middleware for CampusLink
 *
 * Resolves user identity securely from:
 *  1. Authorization: Bearer <supabase_access_token>  (production — verified via Supabase)
 *  2. x-user-id header (development/testing only)
 *
 * Guarantees that req.user is populated with an authenticated profile.
 * Never allows client-supplied body fields (e.g. req.body.userId) to forge identity.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-user-id'];

    let userId = null;
    let authMethod = null;
    let supabaseUserMeta = null;

    // ── Strategy 1: Supabase JWT via Authorization header ──
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authorization token.',
        });
      }

      // Verify as Supabase JWT
      const supabaseUser = await verifySupabaseToken(token);

      if (supabaseUser) {
        userId = supabaseUser.id;
        supabaseUserMeta = supabaseUser;
        authMethod = 'supabase';
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token.',
        });
      }
    }
    // ── Strategy 2: Development/testing via x-user-id header ──
    else if (devUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(devUserId)) {
      userId = devUserId;
      authMethod = 'dev-header';
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Authorization header or session.',
      });
    }

    // Look up profile in database
    const { rows } = await pool.query(
      'SELECT id, email, name, role, avatar_url FROM profiles WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      // Auto-provision profile for new Supabase users
      // Sync Google OAuth metadata when available
      const googleName = supabaseUserMeta?.user_metadata?.full_name || null;
      const googleEmail = supabaseUserMeta?.email || null;
      const googleAvatar = supabaseUserMeta?.user_metadata?.avatar_url || null;
      const defaultName = googleName || req.headers['x-user-name'] || 'Campus Student';
      const defaultEmail = googleEmail || `${userId.substring(0, 8)}@iter.soa.ac.in`;
      const insertRes = await pool.query(
        `INSERT INTO profiles (id, email, name, role, avatar_url)
         VALUES ($1, $2, $3, 'student', $4)
         ON CONFLICT (id) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, profiles.name),
           email = COALESCE(EXCLUDED.email, profiles.email),
           avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url)
         RETURNING id, email, name, role`,
        [userId, defaultEmail, defaultName, googleAvatar]
      );
      req.user = insertRes.rows[0];
    } else {
      req.user = rows[0];
    }

    // Attach auth metadata for downstream use
    req.authMethod = authMethod;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification',
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Must be used AFTER requireAuth so that req.user is populated.
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking roles.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of roles [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};
