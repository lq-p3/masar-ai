import { Router } from 'express';
import { 
  connectGmail, 
  handleGmailCallback, 
  getGmailStatus, 
  syncGmail, 
  disconnectGmail 
} from '../controllers/gmail.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public OAuth Callback Redirect
router.get('/callback', handleGmailCallback);

// Protected Gmail User Actions
router.use(requireAuthMiddleware);
router.get('/connect', connectGmail);
router.get('/status', getGmailStatus);
router.post('/sync', syncGmail);
router.delete('/disconnect', disconnectGmail);

export default router;
