import { FieldValue, Timestamp } from '@google-cloud/firestore';
import { getFirestore } from '../config/firestore.js';
import { 
  JobApplicationDoc, 
  CreateApplicationDTO, 
  UpdateApplicationDTO,
  GetApplicationsQueryDTO 
} from '../types/application.types.js';
import { AppError } from '../types/api.types.js';
import { logger } from '../utils/logger.js';
import { taskService } from './task.service.js';

const COLLECTION_NAME = 'applications';

function formatDocument(doc: FirebaseFirestore.DocumentSnapshot): JobApplicationDoc {
  const data = doc.data();
  if (!data) {
    throw new AppError('Document data is empty', 500, 'DATA_ERROR');
  }

  const formatTimestamp = (val: unknown): string => {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) {
      return val.toDate().toISOString();
    }
    if (typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  };

  return {
    id: doc.id, // Firestore Document ID as API id
    userId: data.userId || '',
    company: data.company || '',
    position: data.position || data.title || '',
    location: data.location || undefined,
    status: data.status || 'Applied',
    source: data.source || undefined,
    matchScore: typeof data.matchScore === 'number' ? data.matchScore : undefined,
    notes: data.notes || undefined,
    jobUrl: data.jobUrl || undefined,
    salary: data.salary || undefined,
    deadline: data.deadline || undefined,
    resumeId: data.resumeId || undefined,
    createdAt: formatTimestamp(data.createdAt || data.dateApplied),
    updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined
  };
}

export class ApplicationService {
  private get collection() {
    return getFirestore().collection(COLLECTION_NAME);
  }

  async getApplications(uid: string, query: GetApplicationsQueryDTO = {}): Promise<JobApplicationDoc[]> {
    try {
      // Data Isolation: Filter strictly by userId == uid
      let firestoreQuery: FirebaseFirestore.Query = this.collection.where('userId', '==', uid);

      if (query.status) {
        firestoreQuery = firestoreQuery.where('status', '==', query.status.trim());
      }
      if (query.company) {
        firestoreQuery = firestoreQuery.where('company', '==', query.company.trim());
      }
      if (query.source) {
        firestoreQuery = firestoreQuery.where('source', '==', query.source.trim());
      }

      // Safe limit (max 100)
      const maxLimit = Math.min(Math.max(query.limit || 50, 1), 100);
      firestoreQuery = firestoreQuery.limit(maxLimit);

      const snapshot = await firestoreQuery.get();
      const applications: JobApplicationDoc[] = [];

      snapshot.forEach((doc) => {
        try {
          applications.push(formatDocument(doc));
        } catch (err) {
          logger.warn(`Failed to parse document ${doc.id}`, { err });
        }
      });

      // Sort newest first safely (createdAt DESC)
      return applications.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    } catch (error) {
      logger.error(`Error fetching applications for UID '${uid}' from Firestore`, error);
      throw new AppError('Unable to retrieve applications from Firestore', 500, 'DATABASE_ERROR', error);
    }
  }

  async getApplicationById(uid: string, id: string): Promise<JobApplicationDoc> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const formatted = formatDocument(doc);

      // Security & Privacy Isolation check: If document does not belong to user, return 404
      if (formatted.userId && formatted.userId !== uid) {
        logger.warn(`User '${uid}' attempted unauthorized access to document '${id}' owned by '${formatted.userId}'`);
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      return formatted;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error fetching application '${id}' for UID '${uid}' from Firestore`, error);
      throw new AppError(`Unable to retrieve application with ID '${id}'`, 500, 'DATABASE_ERROR', error);
    }
  }

  async createApplication(uid: string, dto: CreateApplicationDTO): Promise<JobApplicationDoc> {
    try {
      const newDocData = {
        userId: uid, // Enforce authenticated UID ownership server-side
        company: dto.company.trim(),
        position: dto.position.trim(),
        ...(dto.location ? { location: dto.location.trim() } : {}),
        status: dto.status ? dto.status.trim() : 'Applied',
        ...(dto.source ? { source: dto.source.trim() } : {}),
        ...(typeof dto.matchScore === 'number' ? { matchScore: dto.matchScore } : {}),
        ...(dto.jobUrl ? { jobUrl: dto.jobUrl.trim() } : {}),
        ...(dto.notes ? { notes: dto.notes.trim() } : {}),
        ...(dto.salary ? { salary: dto.salary.trim() } : {}),
        ...(dto.deadline ? { deadline: dto.deadline.trim() } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await this.collection.add(newDocData);
      logger.info(`Created new application in Firestore for user ${uid}`, { id: docRef.id, company: dto.company });

      const createdDoc = await docRef.get();
      return formatDocument(createdDoc);
    } catch (error) {
      logger.error('Error creating application in Firestore', error);
      throw new AppError('Unable to create application in Firestore', 500, 'DATABASE_ERROR', error);
    }
  }

  async updateApplication(uid: string, id: string, dto: UpdateApplicationDTO): Promise<JobApplicationDoc> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const formatted = formatDocument(doc);
      if (formatted.userId && formatted.userId !== uid) {
        logger.warn(`User '${uid}' attempted unauthorized update on document '${id}' owned by '${formatted.userId}'`);
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (dto.company !== undefined) updateData.company = dto.company.trim();
      if (dto.position !== undefined) updateData.position = dto.position.trim();
      if (dto.location !== undefined) updateData.location = dto.location.trim();
      if (dto.status !== undefined) updateData.status = dto.status.trim();
      if (dto.source !== undefined) updateData.source = dto.source.trim();
      if (dto.matchScore !== undefined) updateData.matchScore = dto.matchScore;
      if (dto.jobUrl !== undefined) updateData.jobUrl = dto.jobUrl.trim();
      if (dto.notes !== undefined) updateData.notes = dto.notes.trim();

      await docRef.update(updateData);
      logger.info(`Updated application in Firestore for user ${uid}`, { id, updateData });

      // Task Automation on Status Change
      if (dto.status) {
        const newStatus = dto.status.trim();
        const companyName = formatted.company || 'Company';
        if (newStatus === 'Interview') {
          await taskService.createTask(uid, {
            text: `Prepare for interview with ${companyName}`,
            company: companyName,
            applicationId: id
          });
        } else if (newStatus === 'Assessment') {
          await taskService.createTask(uid, {
            text: `Complete technical assessment for ${companyName}`,
            company: companyName,
            applicationId: id
          });
        } else if (newStatus === 'Offer') {
          await taskService.createTask(uid, {
            text: `Review job offer from ${companyName}`,
            company: companyName,
            applicationId: id
          });
        }
      }

      const updatedDoc = await docRef.get();
      return formatDocument(updatedDoc);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error updating application '${id}' in Firestore`, error);
      throw new AppError(`Unable to update application '${id}'`, 500, 'DATABASE_ERROR', error);
    }
  }

  async deleteApplication(uid: string, id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const formatted = formatDocument(doc);
      if (formatted.userId && formatted.userId !== uid) {
        logger.warn(`User '${uid}' attempted unauthorized delete on document '${id}' owned by '${formatted.userId}'`);
        throw new AppError(`Application with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      await docRef.delete();
      logger.info(`Deleted application from Firestore for user ${uid}`, { id });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error deleting application '${id}' from Firestore`, error);
      throw new AppError(`Unable to delete application '${id}'`, 500, 'DATABASE_ERROR', error);
    }
  }
}

export const applicationService = new ApplicationService();
