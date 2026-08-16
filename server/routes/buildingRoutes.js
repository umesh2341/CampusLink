import express from 'express';
import { getBuildings, getBuildingEvents } from '../controllers/buildingController.js';

const router = express.Router();

router.get('/', getBuildings);
router.get('/:id/events', getBuildingEvents);

export default router;
