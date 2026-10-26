import { Router } from 'express';
import { getJobRecommendations, saveJobRecommendation, applyToJobRecommendation, discoverJobsFromCV } from '../controllers/job.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.get('/recommendations', getJobRecommendations);
router.post('/recommendations', saveJobRecommendation);
router.post('/recommendations/apply', applyToJobRecommendation);
router.post('/discover', discoverJobsFromCV);

export default router;

