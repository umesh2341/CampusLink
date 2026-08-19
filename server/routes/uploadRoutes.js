import express from 'express';
import { getUploadSignature } from '../controllers/uploadController.js';

const router = express.Router();

router.get('/signature', getUploadSignature);

export default router;
