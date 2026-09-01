import express from 'express';
<<<<<<< HEAD
import { requireAuth } from '../middleware/auth.js';
import { getEventById, createEvent, approveEvent } from '../controllers/eventController.js';
=======
import { getEventById, createEvent } from '../controllers/eventController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
>>>>>>> origin/main

const router = express.Router();

router.get('/:id', getEventById);
<<<<<<< HEAD
router.post('/', requireAuth, createEvent);
router.patch('/:id/approve', requireAuth, approveEvent);
=======
router.post('/', requireAuth, requireRole(['organizer', 'admin']), createEvent);
>>>>>>> origin/main

export default router;
