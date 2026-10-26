import { Router } from 'express';
import { getHealth, getHealthLive, getHealthReady } from '../controllers/health.controller.js';

const router = Router();

router.get('/', getHealth);
router.get('/live', getHealthLive);
router.get('/ready', getHealthReady);

export default router;
