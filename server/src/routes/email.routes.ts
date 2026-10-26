import { Router } from 'express';
import { getUserEmails, processIncomingEmail } from '../controllers/email.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuthMiddleware);

router.get('/', getUserEmails);
router.post('/process', processIncomingEmail);

export default router;
