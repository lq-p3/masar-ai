import { Router, Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';
import { getFirestore } from 'firebase-admin/firestore';
import { reportService } from '../services/report.service.js';

const router = Router();
const oidcClient = new OAuth2Client();

const EXPECTED_AUDIENCE = process.env.SCHEDULER_OIDC_AUDIENCE || 
  'https://masar-ai-backend-828667104263.us-west4.run.app/api/scheduled/daily-report';

const EXPECTED_SERVICE_ACCOUNT = process.env.SCHEDULER_SERVICE_ACCOUNT || 
  'masar-ai-scheduler-sa@masar-ai-504916.iam.gserviceaccount.com';

async function verifySchedulerOIDCAuth(req: Request, res: Response, next: NextFunction) {
  // Allow dev bypass ONLY when explicitly running in local development mode with NODE_ENV === 'development' AND SCHEDULER_DEV_BYPASS === 'true'
  if (process.env.NODE_ENV === 'development' && process.env.SCHEDULER_DEV_BYPASS === 'true') {
    logger.info('[DEV] Skipping OIDC token verification for local development test');
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Scheduled endpoint access rejected: Missing or malformed Bearer authorization token header');
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing Bearer OIDC ID token.'
      }
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    // Verify Google-signed OIDC ID Token server-side via Google OAuth2 Client
    const ticket = await oidcClient.verifyIdToken({
      idToken,
      audience: [
        EXPECTED_AUDIENCE,
        'https://masar-ai-backend-828667104263.us-west4.run.app'
      ]
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Empty OIDC token payload');
    }

    // Verify caller identity / Service Account email if configured
    const email = payload.email || payload.sub;
    if (process.env.NODE_ENV === 'production' && EXPECTED_SERVICE_ACCOUNT) {
      if (email !== EXPECTED_SERVICE_ACCOUNT) {
        logger.warn(`Scheduled endpoint rejected unauthorized caller identity: ${email}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Forbidden. Caller ${email} is not authorized to trigger scheduled reports.`
          }
        });
      }
    }

    logger.info(`Successfully authenticated Cloud Scheduler OIDC invocation for service account: ${email}`);
    next();
  } catch (error: any) {
    logger.warn('Scheduled endpoint OIDC verification failed', { error: error.message });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: `OIDC verification failed: ${error.message}`
      }
    });
  }
}

// Endpoint called by Cloud Scheduler at 7:00 PM Asia/Riyadh
router.post('/daily-report', verifySchedulerOIDCAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Executing scheduled Daily Intelligence Report job...');
    const db = getFirestore();
    const usersSnapshot = await db.collection('users').get();
    
    let processedCount = 0;
    const dateStr = new Date().toISOString().split('T')[0];

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        const prefs = await reportService.getReportPreferences(uid);
        if (prefs.enabled) {
          await reportService.generateDailyReport(uid, dateStr);
          processedCount++;
        }
      } catch (err) {
        logger.error(`Error processing scheduled report for user ${uid}`, err);
      }
    }

    logger.info(`Completed scheduled daily report job for ${processedCount} users.`);

    res.status(200).json({
      success: true,
      data: {
        job: 'daily-report',
        processedUsers: processedCount,
        reportDate: dateStr,
        executedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
