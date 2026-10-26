import { getFirestore } from '../config/firestore.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';
import { storageService } from './storage.service.js';

export interface ResumeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  gcsBucket: string;
  gcsObjectName: string;
  gcsPath?: string;
  resumeText: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
}

export class ResumeService {
  private get db() {
    return getFirestore();
  }

  private userResumesCollection(uid: string) {
    return this.db.collection('users').doc(uid).collection('resumes');
  }

  public async getUserResumes(uid: string): Promise<ResumeDocument[]> {
    try {
      const snapshot = await this.userResumesCollection(uid).get();
      const resumes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || uid,
          fileName: data.fileName || '',
          fileSize: typeof data.fileSize === 'number' ? data.fileSize : 0,
          mimeType: data.mimeType || 'application/pdf',
          gcsBucket: data.gcsBucket || process.env.GCS_BUCKET_NAME || 'masar-ai-resumes-504916',
          gcsObjectName: data.gcsObjectName || '',
          gcsPath: data.gcsPath || '',
          resumeText: data.resumeText || '',
          isPrimary: Boolean(data.isPrimary),
          createdAt: data.createdAt || data.uploadedAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.uploadedAt || new Date().toISOString(),
          uploadedAt: data.uploadedAt || data.createdAt
        } as ResumeDocument;
      });

      // Sort newest first
      return resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error(`Error fetching resumes for user ${uid}`, error);
      throw new AppError('Unable to fetch resumes', 500, 'DATABASE_ERROR', error);
    }
  }

  public async createResumeRecord(uid: string, data: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    gcsBucket: string;
    gcsObjectName: string;
    gcsPath?: string;
    resumeText: string;
    isPrimary?: boolean;
  }): Promise<ResumeDocument> {
    try {
      const existingResumes = await this.getUserResumes(uid);
      const isFirst = existingResumes.length === 0;
      const makePrimary = data.isPrimary !== undefined ? data.isPrimary : isFirst;

      if (makePrimary && existingResumes.length > 0) {
        const batch = this.db.batch();
        existingResumes.forEach(doc => {
          if (doc.isPrimary) {
            batch.update(this.userResumesCollection(uid).doc(doc.id), {
              isPrimary: false,
              updatedAt: new Date().toISOString()
            });
          }
        });
        await batch.commit();
      }

      const now = new Date().toISOString();
      const resumeData: Omit<ResumeDocument, 'id'> = {
        userId: uid,
        fileName: data.fileName.trim(),
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        gcsBucket: data.gcsBucket,
        gcsObjectName: data.gcsObjectName,
        gcsPath: data.gcsPath || `gs://${data.gcsBucket}/${data.gcsObjectName}`,
        resumeText: data.resumeText,
        isPrimary: makePrimary,
        createdAt: now,
        updatedAt: now,
        uploadedAt: now
      };

      const docRef = await this.userResumesCollection(uid).add(resumeData);
      logger.info(`Created resume record ${docRef.id} in Firestore for user ${uid} (fileName=${data.fileName}, chars=${data.resumeText.length})`);

      return {
        id: docRef.id,
        ...resumeData
      };
    } catch (error) {
      logger.error(`Error creating resume record for user ${uid}`, error);
      throw new AppError('Unable to save resume metadata in database', 500, 'DATABASE_ERROR', error);
    }
  }

  public async setPrimaryResume(uid: string, resumeId: string): Promise<ResumeDocument> {
    try {
      const snapshot = await this.userResumesCollection(uid).get();
      const targetDoc = snapshot.docs.find(d => d.id === resumeId);
      if (!targetDoc) {
        throw new AppError(`Resume with ID '${resumeId}' not found`, 404, 'NOT_FOUND');
      }

      const batch = this.db.batch();
      const now = new Date().toISOString();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isPrimary: doc.id === resumeId,
          updatedAt: now
        });
      });

      await batch.commit();
      logger.info(`Set primary resume ${resumeId} for user ${uid}`);

      const updated = await this.userResumesCollection(uid).doc(resumeId).get();
      const data = updated.data() || {};

      return {
        id: updated.id,
        userId: data.userId || uid,
        fileName: data.fileName || '',
        fileSize: data.fileSize || 0,
        mimeType: data.mimeType || '',
        gcsBucket: data.gcsBucket || '',
        gcsObjectName: data.gcsObjectName || '',
        gcsPath: data.gcsPath || '',
        resumeText: data.resumeText || '',
        isPrimary: true,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error setting primary resume ${resumeId} for user ${uid}`, error);
      throw new AppError('Unable to update primary resume', 500, 'DATABASE_ERROR', error);
    }
  }

  public async deleteResume(uid: string, resumeId: string): Promise<void> {
    try {
      const docRef = this.userResumesCollection(uid).doc(resumeId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Resume with ID '${resumeId}' not found`, 404, 'NOT_FOUND');
      }

      const data = doc.data() || {};
      const wasPrimary = Boolean(data.isPrimary);

      // Remove binary object from Cloud Storage
      if (data.gcsBucket && data.gcsObjectName) {
        await storageService.deleteResume(data.gcsBucket, data.gcsObjectName);
      }

      // Remove metadata record from Firestore
      await docRef.delete();
      logger.info(`Deleted resume document ${resumeId} for user ${uid}`);

      // If deleted resume was primary, set fallback primary resume if any remain
      if (wasPrimary) {
        const remaining = await this.getUserResumes(uid);
        if (remaining.length > 0) {
          await this.setPrimaryResume(uid, remaining[0].id);
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error deleting resume ${resumeId} for user ${uid}`, error);
      throw new AppError('Unable to delete resume record', 500, 'DATABASE_ERROR', error);
    }
  }

  public async getPrimaryOrLatestResume(uid: string): Promise<ResumeDocument | null> {
    const resumes = await this.getUserResumes(uid);
    if (resumes.length === 0) return null;

    const primary = resumes.find(r => r.isPrimary);
    if (primary) return primary;

    // Deterministic fallback: pick first (latest) and designate as primary
    const fallback = resumes[0];
    await this.setPrimaryResume(uid, fallback.id);
    return { ...fallback, isPrimary: true };
  }
}

export const resumeService = new ResumeService();
