import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../types/api.types.js';

const VALID_STATUSES = [
  'Applied',
  'Under Review',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
] as const;

export const createApplicationSchema = z.object({
  company: z.string({ required_error: 'company is required' }).trim().min(1, 'company cannot be empty'),
  position: z.string({ required_error: 'position is required' }).trim().min(1, 'position cannot be empty'),
  location: z.string().trim().optional(),
  status: z.string().trim().optional(),
  source: z.string().trim().optional(),
  matchScore: z.number().min(0, 'matchScore must be >= 0').max(100, 'matchScore must be <= 100').optional(),
  notes: z.string().trim().optional(),
  jobUrl: z.string().trim().url('jobUrl must be a valid URL').optional().or(z.literal(''))
});

export const updateApplicationSchema = createApplicationSchema.partial();

export function validateCreateApplication(req: Request, res: Response, next: NextFunction): void {
  // Allow fallback 'title' to map to 'position'
  if (!req.body.position && req.body.title) {
    req.body.position = req.body.title;
  }

  const result = createApplicationSchema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const message = `${issue.path.join('.') || 'field'}: ${issue.message}`;
    return next(new AppError(message, 400, 'VALIDATION_ERROR', result.error.format()));
  }

  req.body = result.data;
  next();
}

export function validateUpdateApplication(req: Request, res: Response, next: NextFunction): void {
  if (!req.body.position && req.body.title) {
    req.body.position = req.body.title;
  }

  const result = updateApplicationSchema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const message = `${issue.path.join('.') || 'field'}: ${issue.message}`;
    return next(new AppError(message, 400, 'VALIDATION_ERROR', result.error.format()));
  }

  req.body = result.data;
  next();
}
