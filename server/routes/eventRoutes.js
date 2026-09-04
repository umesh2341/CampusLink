import express from 'express';
import { getEventById, createEvent, getManageableEvents, hideEvent } from '../controllers/eventController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireRole(['organizer', 'admin']), createEvent);
router.get('/manage', requireAuth, requireRole(['organizer', 'admin']), getManageableEvents);
router.get('/:id', getEventById);
router.patch('/:id/hide', requireAuth, requireRole(['organizer', 'admin']), hideEvent);

export default router;
