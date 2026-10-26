import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';
import { AuthenticatedUser } from '../types/auth.types.js';

let firebaseAdminApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseAdminApp) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'masar-ai-504916';

    if (admin.apps.length > 0) {
      firebaseAdminApp = admin.apps[0]!;
    } else {
      logger.info('Initializing Firebase Admin SDK using Application Default Credentials', { projectId });
      firebaseAdminApp = admin.initializeApp({
        projectId
      });
    }
  }
  return firebaseAdminApp;
}

export async function verifyFirebaseIdToken(token: string): Promise<AuthenticatedUser> {
  const app = getFirebaseAdmin();
  try {
    const decodedToken = await app.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email?.split('@')[0],
      photoURL: decodedToken.picture
    };
  } catch (error) {
    logger.warn('Failed to verify Firebase ID token', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
