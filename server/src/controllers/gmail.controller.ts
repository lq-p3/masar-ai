import { Request, Response, NextFunction } from 'express';
import { gmailService } from '../services/gmail.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function connectGmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const authUrl = gmailService.getAuthUrl(uid);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const response: ApiSuccessResponse<{ url: string }> = {
      success: true,
      data: { url: authUrl }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function handleGmailCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  const frontendOrigin = process.env.FRONTEND_ORIGINS?.split(',')[0] || 'https://masar-ai-frontend-828667104263.us-west4.run.app';
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
      throw new AppError('Missing OAuth code or state parameter', 400, 'VALIDATION_ERROR');
    }

    await gmailService.saveOAuthTokens(state, code);

    res.redirect(`${frontendOrigin}/app/inbox?gmail=success`);
  } catch (error) {
    logger.error('Error handling Gmail OAuth callback:', error);
    res.redirect(`${frontendOrigin}/app/inbox?gmail=error`);
  }
}

export async function getGmailStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const status = await gmailService.getStatus(uid);
    const emails = await gmailService.getSyncedEmails(uid);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const response: ApiSuccessResponse<typeof status & { emails: typeof emails }> = {
      success: true,
      data: {
        ...status,
        emails
      }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function syncGmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const result = await gmailService.syncGmail(uid);
    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function disconnectGmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    await gmailService.disconnect(uid);
    const response: ApiSuccessResponse<{ disconnected: boolean }> = {
      success: true,
      data: { disconnected: true }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

