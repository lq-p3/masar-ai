import { Router } from 'express';
import { getJobSearchPreferences, updateJobSearchPreferences } from '../controllers/preference.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.get('/job-search', getJobSearchPreferences);
router.patch('/job-search', updateJobSearchPreferences);

export default router;
