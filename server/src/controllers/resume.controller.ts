import { Request, Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service.js';
import { storageService } from '../services/storage.service.js';
import { extractTextFromBuffer } from '../utils/text-extractor.js';
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

export async function getUserResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const data = await resumeService.getUserResumes(uid);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function uploadResumeFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const file = req.file;

    if (!file) {
      throw new AppError('No resume file provided or invalid file format', 400, 'VALIDATION_ERROR');
    }

    const gcsBucket = process.env.GCS_BUCKET_NAME || 'masar-ai-resumes-504916';
    if (!gcsBucket) {
      throw new AppError('Google Cloud Storage bucket is not configured', 503, 'STORAGE_NOT_CONFIGURED');
    }

    // Step 1: Extract real resume text from file buffer
    const resumeText = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);

    // Step 2: Save binary PDF/DOCX to Google Cloud Storage
    const storageResult = await storageService.uploadResume(
      uid,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Step 3: Save metadata and extracted text in Firestore
    const data = await resumeService.createResumeRecord(uid, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      gcsBucket: storageResult.gcsBucket,
      gcsObjectName: storageResult.gcsObjectName,
      gcsPath: storageResult.gcsPath,
      resumeText
    });

    logger.info(`Resume uploaded and extracted: fileName=${file.originalname}, fileSize=${file.size}, gcsObject=${storageResult.gcsObjectName}, extractedChars=${resumeText.length}, uid=${uid}`);

    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createResumeRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { fileName, fileSize, mimeType, gcsBucket, gcsObjectName, resumeText, isPrimary } = req.body;
    if (!fileName || typeof fileSize !== 'number' || !resumeText) {
      throw new AppError('fileName, valid fileSize, and resumeText are required', 400, 'VALIDATION_ERROR');
    }

    const data = await resumeService.createResumeRecord(uid, {
      fileName,
      fileSize,
      mimeType: mimeType || 'application/pdf',
      gcsBucket: gcsBucket || process.env.GCS_BUCKET_NAME || 'masar-ai-resumes-504916',
      gcsObjectName: gcsObjectName || `users/${uid}/resumes/${Date.now()}_${fileName}`,
      resumeText,
      isPrimary
    });

    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function setPrimaryResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    const data = await resumeService.setPrimaryResume(uid, id);
    const response: ApiSuccessResponse<typeof data> = {
      success: true,
      data
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteResumeRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    await resumeService.deleteResume(uid, id);
    const response: ApiSuccessResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: { id, deleted: true }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
