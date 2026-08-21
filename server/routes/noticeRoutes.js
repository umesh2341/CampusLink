import express from 'express';
import { getNotices, createNotice } from '../controllers/noticeController.js';

const router = express.Router();

router.get('/', getNotices);
router.post('/', createNotice);

export default router;
