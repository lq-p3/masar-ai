import { Firestore } from '@google-cloud/firestore';
import { logger } from '../utils/logger.js';

let firestoreDb: Firestore | null = null;

export function getFirestore(): Firestore {
  if (!firestoreDb) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'masar-ai-504916';

    logger.info('Initializing Google Cloud Firestore connection', {
      projectId,
      databaseId: '(default)'
    });

    firestoreDb = new Firestore({
      projectId,
      databaseId: '(default)'
    });
  }
  return firestoreDb;
}

export async function checkFirestoreReadiness(): Promise<{ isReady: boolean; details: string }> {
  return new Promise((resolve) => {
    try {
      const db = getFirestore();
      db.listCollections()
        .then((collections) => {
          resolve({
            isReady: true,
            details: `Connected to Google Cloud Firestore (Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'masar-ai-504916'}, Collections: ${collections.length})`
          });
        })
        .catch((error: unknown) => {
          const msg = error instanceof Error ? error.message : String(error);
          const safeMsg = msg.includes('Could not load the default credentials')
            ? 'Google Cloud Application Default Credentials (ADC) not configured locally. Run: gcloud auth application-default login'
            : msg;
          logger.warn('Firestore readiness check failed', { error: safeMsg });
          resolve({ isReady: false, details: safeMsg });
        });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      resolve({ isReady: false, details: msg });
    }
  });
}
