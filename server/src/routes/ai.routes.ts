import { Router } from 'express';
import { 
  generateCoverLetter, 
  generateStarPrep, 
  chatWithAI, 
  analyzeResumeMatch,
  analyzeCVAudit
} from '../controllers/ai.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.post('/cover-letter', generateCoverLetter);
router.post('/star-prep', generateStarPrep);
router.post('/chat', chatWithAI);
router.post('/resume-match', analyzeResumeMatch);
router.post('/cv-audit', analyzeCVAudit);

export default router;


