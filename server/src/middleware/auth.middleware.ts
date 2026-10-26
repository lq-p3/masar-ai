import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/api.types.js';
import { verifyFirebaseIdToken } from '../config/firebase-admin.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

export async function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing or malformed Bearer token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    return next(new AppError('Authentication required. Empty Bearer token.', 401, 'UNAUTHORIZED'));
  }

  try {
    const authenticatedUser = await verifyFirebaseIdToken(token);
    (req as AuthenticatedRequest).user = authenticatedUser;
    
    logger.info(`Authenticated request by user ${authenticatedUser.uid}`, {
      uid: authenticatedUser.uid,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.warn('Token verification failed in auth middleware', { path: req.path });
    return next(new AppError('Invalid or expired authentication token', 401, 'UNAUTHORIZED'));
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    return next();
  }

  try {
    const authenticatedUser = await verifyFirebaseIdToken(token);
    (req as AuthenticatedRequest).user = authenticatedUser;
  } catch {
    // Optional auth silently proceeds if token invalid
  }

  next();
}
