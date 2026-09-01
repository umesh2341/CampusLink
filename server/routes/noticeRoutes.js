import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getNotices, createNotice } from '../controllers/noticeController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getNotices);
<<<<<<< HEAD
router.post('/', requireAuth, createNotice);
=======
router.post('/', requireAuth, requireRole(['authority', 'admin']), createNotice);
>>>>>>> origin/main

export default router;
