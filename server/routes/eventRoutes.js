import express from 'express';
import { getEventById, createEvent, approveEvent } from '../controllers/eventController.js';

const router = express.Router();

router.get('/:id', getEventById);
router.post('/', createEvent);
router.patch('/:id/approve', approveEvent);

export default router;
