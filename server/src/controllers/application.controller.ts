import { Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/application.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { status, company, source, limit } = req.query;

    const data = await applicationService.getApplications(uid, {
      status: typeof status === 'string' ? status : undefined,
      company: typeof company === 'string' ? company : undefined,
      source: typeof source === 'string' ? source : undefined,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined
    });

    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    const data = await applicationService.getApplicationById(uid, id);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await applicationService.createApplication(uid, req.body);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    const data = await applicationService.updateApplication(uid, id, req.body);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    await applicationService.deleteApplication(uid, id);
    const response: ApiSuccessResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: { id, deleted: true }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
