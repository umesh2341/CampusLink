import express from 'express';
import { getClubs } from '../controllers/clubController.js';

const router = express.Router();

router.get('/', getClubs);

export default router;
