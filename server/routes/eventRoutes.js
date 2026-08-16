import express from 'express';
import { getEventById, createEvent } from '../controllers/eventController.js';

const router = express.Router();

router.get('/:id', getEventById);
router.post('/', createEvent);

export default router;
