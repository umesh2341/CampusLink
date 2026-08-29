import express from 'express';
import { getUploadSignature } from '../controllers/uploadController.js';

import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/signature', requireAuth, requireRole(['organizer', 'authority', 'admin']), getUploadSignature);

export default router;
