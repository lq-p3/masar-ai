import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';

export interface JobSearchPreferences {
  country: string;
  cities: string[];
  jobTitles: string[];
  skills: string[];
  experienceLevel: string;
  workplaceType: ('Remote' | 'Hybrid' | 'Onsite')[];
  preferredCompanies?: string[];
  updatedAt?: string;
}

export const DEFAULT_JOB_PREFERENCES: JobSearchPreferences = {
  country: 'Saudi Arabia',
  cities: ['Riyadh', 'Jeddah', 'Dammam'],
  jobTitles: ['Cloud Engineer', 'Software Engineer', 'Backend Developer'],
  skills: ['Google Cloud', 'Docker', 'TypeScript', 'Node.js', 'React'],
  experienceLevel: 'Mid-Senior',
  workplaceType: ['Hybrid', 'Remote'],
  preferredCompanies: ['STC', 'Elm', 'Aramco']
};

export class PreferenceService {
  private get db() {
    return getFirestore();
  }

  public async getJobSearchPreferences(uid: string): Promise<JobSearchPreferences> {
    try {
      const doc = await this.db.collection('users').doc(uid).collection('preferences').doc('jobSearch').get();
      if (!doc.exists) {
        return DEFAULT_JOB_PREFERENCES;
      }
      return { ...DEFAULT_JOB_PREFERENCES, ...doc.data() } as JobSearchPreferences;
    } catch (error) {
      logger.error(`Error fetching job search preferences for user ${uid}`, error);
      return DEFAULT_JOB_PREFERENCES;
    }
  }

  public async updateJobSearchPreferences(uid: string, prefs: Partial<JobSearchPreferences>): Promise<JobSearchPreferences> {
    try {
      const ref = this.db.collection('users').doc(uid).collection('preferences').doc('jobSearch');
      const current = await this.getJobSearchPreferences(uid);
      const updated: JobSearchPreferences = {
        ...current,
        ...prefs,
        updatedAt: new Date().toISOString()
      };
      await ref.set(updated, { merge: true });
      logger.info(`Successfully updated job search preferences for user ${uid}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating job search preferences for user ${uid}`, error);
      throw new AppError('Unable to update job search preferences', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const preferenceService = new PreferenceService();
