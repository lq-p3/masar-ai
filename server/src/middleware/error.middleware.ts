import { Request, Response, NextFunction } from 'express';
import { AppError, ApiErrorResponse } from '../types/api.types.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}] ${err.statusCode}: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode
    });

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(!isProd && err.details ? { details: err.details } : {})
      }
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle generic error / unhandled exception
  logger.error(`Unhandled Backend Error on ${req.method} ${req.path}: ${err.message}`, err, {
    path: req.path,
    method: req.method
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your request. Please try again later.'
    }
  };

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route '${req.method} ${req.path}' not found`
    }
  });
}
