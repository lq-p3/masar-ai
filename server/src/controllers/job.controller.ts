import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service.js';
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

export async function getJobRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await jobService.getDiscoveredJobs(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function saveJobRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await jobService.saveDiscoveredJob(uid, req.body);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function applyToJobRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { company, title, location, salary, matchScore } = req.body;
    const createdApp = await applicationService.createApplication(uid, {
      company: company || 'Discovered Job',
      position: title || 'Software Engineer',
      location: location || 'Riyadh, SA',
      status: 'Applied',
      source: 'Smart Job Discovery',
      ...(typeof matchScore === 'number' ? { matchScore } : {}),
      salary: salary
    });
    const response: ApiSuccessResponse<typeof createdApp> = {
      success: true,
      data: createdApp
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function discoverJobsFromCV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await jobService.discoverLinkedInJobsFromCV(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}


