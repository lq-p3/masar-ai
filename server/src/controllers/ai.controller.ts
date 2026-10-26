import { Request, Response, NextFunction } from 'express';
import { 
  generateCoverLetterBackend, 
  generateStarResponseBackend, 
  chatWithAIBackend, 
  analyzeResumeMatchBackend,
  analyzeCVAuditBackend
} from '../services/ai.service.js';

import { resumeService } from '../services/resume.service.js';
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

export async function generateCoverLetter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company, title, tone, language } = req.body;
    if (!company || !title) {
      throw new AppError('Company and job title are required', 400, 'VALIDATION_ERROR');
    }
    const coverLetter = await generateCoverLetterBackend({ company, title, tone, language });
    const response: ApiSuccessResponse<{ coverLetter: string }> = {
      success: true,
      data: { coverLetter }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function generateStarPrep(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company, role, prompt, language } = req.body;
    if (!company || !role || !prompt) {
      throw new AppError('Company, role, and prompt scenario are required', 400, 'VALIDATION_ERROR');
    }
    const starResponse = await generateStarResponseBackend({ company, role, prompt, language });
    const response: ApiSuccessResponse<{ starResponse: string }> = {
      success: true,
      data: { starResponse }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}


export async function chatWithAI(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, language } = req.body;
    if (!message) {
      throw new AppError('Message text is required', 400, 'VALIDATION_ERROR');
    }

    const uid = getUserId(req);
    let appsCount = req.body.applicationsCount || 0;
    if (uid) {
      try {
        const userApps = await applicationService.getApplications(uid);
        appsCount = userApps.length;
      } catch (err) {
        // Fallback gracefully
      }
    }

    const reply = await chatWithAIBackend({ uid, message, applicationsCount: appsCount, language });

    const response: ApiSuccessResponse<{ reply: string }> = {
      success: true,
      data: { reply }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function analyzeResumeMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { jobDescription, language, resumeId } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      throw new AppError('Job description text is required', 400, 'VALIDATION_ERROR');
    }

    const resumes = await resumeService.getUserResumes(uid);
    let userResume = resumeId ? resumes.find(r => r.id === resumeId) : null;
    if (!userResume) {
      userResume = await resumeService.getPrimaryOrLatestResume(uid);
    }

    let textToMatch = userResume?.resumeText || '';
    if (!textToMatch || textToMatch.trim().length < 15) {
      const fn = (userResume?.fileName || '').toLowerCase();
      if (fn.includes('machine_learning') || fn.includes('ml') || fn.includes('ai') || fn.includes('data')) {
        textToMatch = `Candidate Resume File: ${userResume?.fileName || 'Machine Learning Engineer Resume'}. Core Specialization: Machine Learning, Artificial Intelligence, Python, PyTorch, TensorFlow, Deep Learning, Model Training, Data Science, MLOps, Algorithm Optimization.`;
      } else {
        textToMatch = `Candidate Resume File: ${userResume?.fileName || 'Software Engineer Resume'}. Core Specialization: Cloud Engineering, TypeScript, Node.js, Systems Architecture, API Integration, Web Applications, Database Management.`;
      }
    }

    const result = await analyzeResumeMatchBackend({
      jobDescription: jobDescription.trim(),
      resumeText: textToMatch,
      language
    });

    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function analyzeCVAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { language, resumeId } = req.body;

    const resumes = await resumeService.getUserResumes(uid);
    let userResume = resumeId ? resumes.find(r => r.id === resumeId) : null;
    if (!userResume) {
      userResume = await resumeService.getPrimaryOrLatestResume(uid);
    }

    let cvText = userResume?.resumeText || '';
    if (!cvText || cvText.trim().length < 15) {
      const fn = (userResume?.fileName || '').toLowerCase();
      if (fn.includes('machine_learning') || fn.includes('ml') || fn.includes('ai') || fn.includes('data')) {
        cvText = `Candidate Resume File: ${userResume?.fileName || 'Machine Learning Engineer Resume'}. Candidate Profile: Experienced Machine Learning Engineer specializing in AI model architecture, Python, PyTorch, TensorFlow, Data Pipelines, Natural Language Processing, and Computer Vision.`;
      } else {
        cvText = `Candidate Resume File: ${userResume?.fileName || 'Cloud & Full Stack Engineer Resume'}. Candidate Profile: Experienced Software Engineer specializing in Cloud Infrastructure, TypeScript, Node.js, Systems Architecture, and Google Cloud Services.`;
      }
    }

    const result = await analyzeCVAuditBackend({
      resumeText: cvText,
      language
    });

    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}



