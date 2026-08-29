import express from 'express';
import { getEventById, createEvent, approveEvent } from '../controllers/eventController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', getEventById);
router.post('/', requireAuth, requireRole(['organizer', 'admin']), createEvent);
router.patch('/:id/approve', requireAuth, requireRole(['admin']), approveEvent);

export default router;
