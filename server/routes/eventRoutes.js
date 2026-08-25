import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getEventById, createEvent, approveEvent } from '../controllers/eventController.js';

const router = express.Router();

router.get('/:id', getEventById);
router.post('/', requireAuth, createEvent);
router.patch('/:id/approve', requireAuth, approveEvent);

export default router;
