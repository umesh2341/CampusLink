import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getNotices, createNotice } from '../controllers/noticeController.js';

const router = express.Router();

router.get('/', getNotices);
router.post('/', requireAuth, createNotice);

export default router;
