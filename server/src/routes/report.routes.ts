import { Router } from 'express';
import { 
  getUserReports, 
  generateUserReport, 
  getReportPreferences, 
  updateReportPreferences 
} from '../controllers/report.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.get('/', getUserReports);
router.post('/generate', generateUserReport);
router.get('/preferences', getReportPreferences);
router.patch('/preferences', updateReportPreferences);

export default router;
