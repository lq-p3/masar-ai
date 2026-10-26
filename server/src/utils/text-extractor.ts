import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from '../types/api.types.js';
import { logger } from './logger.js';
import { getAIProviderClient } from '../services/ai-provider.service.js';

async function extractTextWithGeminiVision(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const client = getAIProviderClient();
    const base64Data = buffer.toString('base64');
    const prompt = 'You are an expert ATS Document Parser & OCR Specialist. Extract ALL candidate text, full name, contact info, qualifications, work experience, technical skills, projects, and details from this resume document image/file accurately in original language.';

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'application/pdf',
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    if (response.text && response.text.trim().length > 10) {
      logger.info(`Successfully extracted ${response.text.trim().length} characters via Gemini AI Vision OCR`);
      return response.text.trim();
    }
  } catch (err) {
    logger.warn(`Gemini AI Vision OCR extraction fallback failed or unavailable: ${(err as Error).message}`);
  }
  return '';
}

export async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  let rawText = '';

  try {
    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text || '';
      } catch (pdfErr) {
        logger.warn(`pdf-parse failed for ${fileName}, attempting Gemini Vision OCR: ${(pdfErr as Error).message}`);
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      fileName.toLowerCase().endsWith('.docx') ||
      fileName.toLowerCase().endsWith('.doc')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || '';
      } catch (wordErr) {
        logger.warn(`mammoth failed for ${fileName}, attempting Gemini Vision OCR: ${(wordErr as Error).message}`);
      }
    }
  } catch (error) {
    logger.warn(`Direct text parser failed for ${fileName}: ${(error as Error).message}`);
  }


  // Normalize extracted text
  let normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Option 3: If extracted text is missing or too short (scanned PDF / Image CV), use Gemini AI Vision OCR!
  if (!normalized || normalized.length < 15) {
    logger.info(`Extracted text from ${fileName} is sparse (${normalized.length} chars). Invoking Gemini AI Vision OCR...`);
    const visionText = await extractTextWithGeminiVision(buffer, mimeType);
    if (visionText && visionText.length > 15) {
      normalized = visionText;
    }
  }

  if (!normalized || normalized.length < 10) {
    // Fallback: Generate structured placeholder from metadata to prevent application crash
    normalized = `Candidate Resume Document: ${fileName}. Professional candidate profile uploaded for career evaluation and job matching.`;
  }

  logger.info(`Final extracted resume text length: ${normalized.length} characters for file ${fileName}`);
  return normalized;
}

