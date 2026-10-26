import { Request, Response, NextFunction } from 'express';
import { preferenceService } from '../services/preference.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function getJobSearchPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await preferenceService.getJobSearchPreferences(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateJobSearchPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await preferenceService.updateJobSearchPreferences(uid, req.body);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
