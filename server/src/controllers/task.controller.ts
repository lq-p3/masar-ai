import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service.js';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await taskService.getTasks(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { text, dueDate, urgent, company } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new AppError('Task text is required', 400, 'VALIDATION_ERROR');
    }

    const data = await taskService.createTask(uid, { text, dueDate, urgent, company });
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    const data = await taskService.updateTask(uid, id, req.body);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    await taskService.deleteTask(uid, id);
    const response: ApiSuccessResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: { id, deleted: true }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
