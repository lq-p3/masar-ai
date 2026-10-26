import { Router } from 'express';
import { getCurrentUser, updateCurrentUser } from '../controllers/user.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', requireAuthMiddleware, getCurrentUser);
router.patch('/me', requireAuthMiddleware, updateCurrentUser);

export default router;
