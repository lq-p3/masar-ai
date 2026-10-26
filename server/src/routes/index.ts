import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes.js';
import applicationRoutes from './application.routes.js';
import userRoutes from './user.routes.js';
import taskRoutes from './task.routes.js';
import aiRoutes from './ai.routes.js';
import scheduledRoutes from './scheduled.routes.js';
import jobRoutes from './job.routes.js';
import reportRoutes from './report.routes.js';
import preferenceRoutes from './preference.routes.js';
import emailRoutes from './email.routes.js';
import resumeRoutes from './resume.routes.js';
import gmailRoutes from './gmail.routes.js';
import notificationRoutes from './notification.routes.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';
import openApiSpec from '../docs/openapi.json' with { type: 'json' };

const router = Router();

// Public Probes & Specs
router.use('/health', healthRoutes);
router.get('/api/docs', (req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
});

// Scheduled Service-to-Service Routes
router.use('/api/scheduled', scheduledRoutes);

// Protected Profile & Multi-Tenant User Data Routes
router.use('/api', userRoutes);
router.use('/api/applications', requireAuthMiddleware, applicationRoutes);
router.use('/api/tasks', requireAuthMiddleware, taskRoutes);
router.use('/api/ai', requireAuthMiddleware, aiRoutes);
router.use('/api/jobs', requireAuthMiddleware, jobRoutes);
router.use('/api/reports', requireAuthMiddleware, reportRoutes);
router.use('/api/preferences', requireAuthMiddleware, preferenceRoutes);
router.use('/api/emails', requireAuthMiddleware, emailRoutes);
router.use('/api/resumes', requireAuthMiddleware, resumeRoutes);
router.use('/api/gmail', gmailRoutes);
router.use('/api/notifications', notificationRoutes);

export default router;

