import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser.uid) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const data = await userService.getOrCreateUserProfile(authUser);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser.uid) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Safety: ensure client payload cannot inject uid, email, or createdAt
    const { uid, email, createdAt, ...allowedPayload } = req.body;

    const data = await userService.updateUserProfile(authUser.uid, allowedPayload);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
