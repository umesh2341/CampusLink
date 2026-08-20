import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  updateLocation,
  getMyLocation,
  stopSharingLocation,
  getActiveLocations,
} from '../controllers/locationController.js';

const router = express.Router();

// All location routes are protected by authentication
router.post('/', requireAuth, updateLocation);
router.get('/me', requireAuth, getMyLocation);
router.delete('/me', requireAuth, stopSharingLocation);
router.get('/active', requireAuth, getActiveLocations);

export default router;
