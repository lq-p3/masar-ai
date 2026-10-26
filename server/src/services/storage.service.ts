import { Storage } from '@google-cloud/storage';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';

let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!storageClient) {
    storageClient = new Storage();
  }
  return storageClient;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export class StorageService {
  private get bucketName(): string {
    const bucket = process.env.GCS_BUCKET_NAME || 'masar-ai-resumes-504916';
    if (!bucket) {
      throw new AppError('GCS_BUCKET_NAME is not configured in environment', 503, 'STORAGE_NOT_CONFIGURED');
    }
    return bucket;
  }

  public async uploadResume(uid: string, fileBuffer: Buffer, originalName: string, mimeType: string): Promise<{
    gcsBucket: string;
    gcsObjectName: string;
    gcsPath: string;
  }> {
    const bucket = this.bucketName;
    const sanitizedName = sanitizeFileName(originalName);
    const objectName = `users/${uid}/resumes/${Date.now()}_${sanitizedName}`;

    try {
      const storage = getStorageClient();
      const fileRef = storage.bucket(bucket).file(objectName);

      await fileRef.save(fileBuffer, {
        contentType: mimeType,
        resumable: false,
        metadata: {
          metadata: {
            ownerUid: uid,
            originalFileName: originalName,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      const gcsPath = `gs://${bucket}/${objectName}`;
      logger.info(`Uploaded resume file to Cloud Storage: bucket=${bucket}, object=${objectName}, uid=${uid}`);

      return {
        gcsBucket: bucket,
        gcsObjectName: objectName,
        gcsPath
      };
    } catch (error) {
      logger.error(`Error uploading resume to GCS for user ${uid}:`, error);
      throw new AppError(`Failed to save resume file in Google Cloud Storage: ${(error as Error).message}`, 500, 'STORAGE_UPLOAD_ERROR', error);
    }
  }

  public async deleteResume(bucketName?: string, objectName?: string): Promise<void> {
    if (!objectName) return;
    const targetBucket = bucketName || this.bucketName;

    try {
      const storage = getStorageClient();
      const fileRef = storage.bucket(targetBucket).file(objectName);
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
        logger.info(`Deleted resume file from Cloud Storage: bucket=${targetBucket}, object=${objectName}`);
      } else {
        logger.warn(`Resume file to delete not found in GCS: bucket=${targetBucket}, object=${objectName}`);
      }
    } catch (error) {
      logger.error(`Failed to delete resume file from GCS (bucket=${targetBucket}, object=${objectName}):`, error);
      // Non-blocking catch to ensure database document cleanup completes safely
    }
  }
}

export const storageService = new StorageService();
