import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function getUserEmails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await emailService.getUserEmails(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function processIncomingEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { subject, body, sender } = req.body;
    if (!subject || !body || !sender) {
      throw new AppError('Subject, body, and sender are required', 400, 'VALIDATION_ERROR');
    }

    const data = await emailService.saveAndProcessEmail(uid, { subject, body, sender });
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}
