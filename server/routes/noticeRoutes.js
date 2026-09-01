import express from 'express';
import { getNotices, createNotice } from '../controllers/noticeController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getNotices);
router.post('/', requireAuth, requireRole(['authority', 'admin']), createNotice);

export default router;
