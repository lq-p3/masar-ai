import { Router } from 'express';
import { 
  getTelegramStatus, 
  connectTelegram,
  updateTelegramPreferences, 
  sendTestTelegramMessage,
  sendFullReportNow,
  disconnectTelegram,
  triggerCronDailyReports
} from '../controllers/notification.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public/Scheduler endpoint protected by secret header
router.post('/telegram/cron/daily-reports', triggerCronDailyReports);

// User endpoints requiring Firebase Authentication
router.use(requireAuthMiddleware);

router.get('/telegram/status', getTelegramStatus);
router.post('/telegram/connect', connectTelegram);
router.patch('/telegram/preferences', updateTelegramPreferences);
router.post('/telegram/test', sendTestTelegramMessage);
router.post('/telegram/send-full-report', sendFullReportNow);
router.post('/telegram/disconnect', disconnectTelegram);

export default router;
