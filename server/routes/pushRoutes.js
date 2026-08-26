import express from 'express';
import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  getPreferences,
  updatePreferences,
  notifyAdminsRoleRequest,
} from '../controllers/pushController.js';

const router = express.Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.post('/notify-admins-role-request', notifyAdminsRoleRequest);

export default router;
