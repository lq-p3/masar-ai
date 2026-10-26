import { Request, Response } from 'express';
import { checkFirestoreReadiness } from '../config/firestore.js';

export function getHealth(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'masar-ai-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}

export function getHealthLive(req: Request, res: Response): void {
  res.status(200).json({
    status: 'live',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
}

export async function getHealthReady(req: Request, res: Response): Promise<void> {
  const firestoreStatus = await checkFirestoreReadiness();

  if (firestoreStatus.isReady) {
    res.status(200).json({
      status: 'ready',
      dependencies: {
        firestore: {
          status: 'healthy',
          details: firestoreStatus.details
        }
      },
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      dependencies: {
        firestore: {
          status: 'unhealthy',
          details: firestoreStatus.details
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}
