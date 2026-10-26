import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';
import { applicationService } from './application.service.js';

export type EmailCategory = 
  | 'Application Received' 
  | 'Under Review' 
  | 'Shortlisted' 
  | 'Assessment' 
  | 'Interview' 
  | 'Offer' 
  | 'Rejection' 
  | 'General Recruiting Email';

export interface ProcessedRecruitmentEmail {
  id: string;
  sender: string;
  company: string;
  jobTitle: string;
  category: EmailCategory;
  summary: string;
  receivedDate: string;
  confidenceScore: number;
  actionRequired: boolean;
  actionText?: string;
  matchedApplicationId?: string;
  autoUpdatedStatus?: string;
}

export class EmailService {
  private get db() {
    return getFirestore();
  }

  private userEmailsCollection(uid: string) {
    return this.db.collection('users').doc(uid).collection('emails');
  }

  public classifyEmailText(subject: string, body: string, sender: string): {
    category: EmailCategory;
    company: string;
    jobTitle: string;
    summary: string;
    confidenceScore: number;
    actionRequired: boolean;
    actionText?: string;
  } {
    const text = `${subject} ${body}`.toLowerCase();

    let category: EmailCategory = 'General Recruiting Email';
    let confidenceScore = 80;
    let actionRequired = false;
    let actionText: string | undefined = undefined;

    if (text.includes('interview') || text.includes('schedule time') || text.includes('meeting')) {
      category = 'Interview';
      confidenceScore = 95;
      actionRequired = true;
      actionText = 'Confirm Interview Time';
    } else if (text.includes('offer') || text.includes('congratulations') || text.includes('employment contract')) {
      category = 'Offer';
      confidenceScore = 98;
      actionRequired = true;
      actionText = 'Review Offer Letter';
    } else if (text.includes('assessment') || text.includes('coding challenge') || text.includes('test')) {
      category = 'Assessment';
      confidenceScore = 92;
      actionRequired = true;
      actionText = 'Complete Assessment';
    } else if (text.includes('unfortunately') || text.includes('not moving forward') || text.includes('other candidates')) {
      category = 'Rejection';
      confidenceScore = 96;
    } else if (text.includes('received') || text.includes('thank you for applying')) {
      category = 'Application Received';
      confidenceScore = 90;
    } else if (text.includes('reviewing') || text.includes('under review')) {
      category = 'Under Review';
      confidenceScore = 88;
    }

    // Extract company name from domain or text if possible
    let company = 'Recruitment Update';
    if (sender.includes('@')) {
      const domain = sender.split('@')[1].split('.')[0];
      if (domain && !['gmail', 'yahoo', 'outlook', 'hotmail'].includes(domain.toLowerCase())) {
        company = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }

    const jobTitle = subject.replace(/re:|fwd:/i, '').trim() || 'Role Application';
    const summary = body.slice(0, 150) + (body.length > 150 ? '...' : '');

    return {
      category,
      company,
      jobTitle,
      summary,
      confidenceScore,
      actionRequired,
      actionText
    };
  }

  public async saveAndProcessEmail(uid: string, rawEmail: { subject: string; body: string; sender: string; emailId?: string }): Promise<ProcessedRecruitmentEmail> {
    try {
      const emailId = rawEmail.emailId || `email_${Date.now()}`;
      const classification = this.classifyEmailText(rawEmail.subject, rawEmail.body, rawEmail.sender);

      let matchedApplicationId: string | undefined = undefined;
      let autoUpdatedStatus: string | undefined = undefined;

      // Safe Auto-Update: Match against existing user applications
      const userApps = await applicationService.getApplications(uid);
      const matchingApp = userApps.find(app => 
        app.company.toLowerCase().includes(classification.company.toLowerCase()) ||
        classification.company.toLowerCase().includes(app.company.toLowerCase())
      );

      if (matchingApp) {
        matchedApplicationId = matchingApp.id;
        // Map email category to application status update if applicable
        if (classification.category === 'Interview' && matchingApp.status !== 'Interview') {
          await applicationService.updateApplication(uid, matchingApp.id, { status: 'Interview' });
          autoUpdatedStatus = 'Interview';
        } else if (classification.category === 'Offer' && matchingApp.status !== 'Offer') {
          await applicationService.updateApplication(uid, matchingApp.id, { status: 'Offer' });
          autoUpdatedStatus = 'Offer';
        } else if (classification.category === 'Rejection' && matchingApp.status !== 'Rejected') {
          await applicationService.updateApplication(uid, matchingApp.id, { status: 'Rejected' });
          autoUpdatedStatus = 'Rejected';
        }
      }

      const emailData: Omit<ProcessedRecruitmentEmail, 'id'> = {
        sender: rawEmail.sender,
        company: classification.company,
        jobTitle: classification.jobTitle,
        category: classification.category,
        summary: classification.summary,
        receivedDate: new Date().toISOString(),
        confidenceScore: classification.confidenceScore,
        actionRequired: classification.actionRequired,
        actionText: classification.actionText,
        matchedApplicationId,
        autoUpdatedStatus
      };

      const docRef = this.userEmailsCollection(uid).doc(emailId);
      await docRef.set(emailData, { merge: true });
      logger.info(`Saved and classified email ${emailId} for user ${uid}`);

      return {
        id: docRef.id,
        ...emailData
      };
    } catch (error) {
      logger.error(`Error processing email for user ${uid}`, error);
      throw new AppError('Unable to process recruitment email', 500, 'DATABASE_ERROR', error);
    }
  }

  public async getUserEmails(uid: string): Promise<ProcessedRecruitmentEmail[]> {
    try {
      const snapshot = await this.userEmailsCollection(uid).orderBy('receivedDate', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProcessedRecruitmentEmail[];
    } catch (error) {
      logger.error(`Error fetching emails for user ${uid}`, error);
      throw new AppError('Unable to fetch recruitment emails', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const emailService = new EmailService();
