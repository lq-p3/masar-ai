import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';

let genAIInstance: GoogleGenAI | null = null;

export function getAIProviderClient(): GoogleGenAI {
  if (genAIInstance) return genAIInstance;

  const project = process.env.GOOGLE_CLOUD_PROJECT || 'masar-ai-504916';
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  const apiKey = process.env.GEMINI_API_KEY;
  const forceVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true';
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.GAE_SERVICE);

  if (apiKey) {
    try {
      genAIInstance = new GoogleGenAI({ apiKey });
      logger.info('Initialized Google Gemini AI Provider using GEMINI_API_KEY');
      return genAIInstance;
    } catch (err) {
      logger.error('Failed to initialize Gemini API client with API Key:', err);
    }
  }

  if (forceVertex || isCloudRun || project) {
    try {
      genAIInstance = new GoogleGenAI({
        vertexai: true,
        project,
        location: location
      });
      logger.info(`Initialized Google Cloud Vertex AI Native Provider (Project: ${project}, Location: ${location})`);
      return genAIInstance;
    } catch (err) {
      logger.error('Failed to initialize Google Cloud Vertex AI client:', err);
    }
  }


  throw new AppError(
    'Google Cloud AI Provider is not configured. Requires GOOGLE CLOUD VERTEX AI or GEMINI API KEY.',
    503,
    'AI_PROVIDER_NOT_CONFIGURED'
  );
}

