import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';
import { applicationService } from './application.service.js';
import { taskService } from './task.service.js';
import { telegramService } from './telegram.service.js';
import { notificationService } from './notification.service.js';

export interface UserReportPreferences {
  enabled: boolean;
  preferredTime: string; // e.g. "19:00"
  timezone: string; // e.g. "Asia/Riyadh"
  emailDeliveryEnabled: boolean;
  inAppDeliveryEnabled: boolean;
}

export interface DailyReportDoc {
  id: string;
  reportDate: string; // YYYY-MM-DD
  timezone: string;
  generatedAt: string;
  jobsSummary: {
    newDiscovered: number;
    highestMatchScore: number;
  };
  applicationsSummary: {
    totalActive: number;
    statusChangesToday: number;
  };
  tasksSummary: {
    pendingTasks: number;
    completedTasks: number;
  };
  aiSummary: string;
  recommendedActions: string[];
  status: 'pending' | 'generated' | 'delivered' | 'failed';
}

export class ReportService {
  private get db() {
    return getFirestore();
  }

  public async getReportPreferences(uid: string): Promise<UserReportPreferences> {
    try {
      const doc = await this.db.collection('users').doc(uid).collection('preferences').doc('dailyReport').get();
      if (!doc.exists) {
        return {
          enabled: true,
          preferredTime: '19:00',
          timezone: 'Asia/Riyadh',
          emailDeliveryEnabled: true,
          inAppDeliveryEnabled: true
        };
      }
      return doc.data() as UserReportPreferences;
    } catch (error) {
      logger.error(`Error fetching report preferences for user ${uid}`, error);
      return {
        enabled: true,
        preferredTime: '19:00',
        timezone: 'Asia/Riyadh',
        emailDeliveryEnabled: true,
        inAppDeliveryEnabled: true
      };
    }
  }

  public async updateReportPreferences(uid: string, prefs: Partial<UserReportPreferences>): Promise<UserReportPreferences> {
    try {
      const ref = this.db.collection('users').doc(uid).collection('preferences').doc('dailyReport');
      const current = await this.getReportPreferences(uid);
      const updated = { ...current, ...prefs };
      await ref.set(updated, { merge: true });
      return updated;
    } catch (error) {
      logger.error(`Error updating report preferences for user ${uid}`, error);
      throw new AppError('Unable to update report preferences', 500, 'DATABASE_ERROR', error);
    }
  }

  public async generateDailyReport(uid: string, dateStr?: string): Promise<DailyReportDoc> {
    const reportDate = dateStr || new Date().toISOString().split('T')[0];
    const reportId = `${uid}_${reportDate}`;
    const reportRef = this.db.collection('users').doc(uid).collection('reports').doc(reportId);

    try {
      // Idempotency check: if report already exists for today, return existing report
      const existing = await reportRef.get();
      if (existing.exists) {
        logger.info(`Idempotent return for daily report ${reportId}`);
        return { id: existing.id, ...existing.data() } as DailyReportDoc;
      }

      const prefs = await this.getReportPreferences(uid);
      const userApps = await applicationService.getApplications(uid);
      const userTasks = await taskService.getTasks(uid);

      const pendingCount = userTasks.filter(t => !t.completed).length;
      const completedCount = userTasks.filter(t => t.completed).length;

      const aiSummary = userApps.length > 0
        ? `You have ${userApps.length} active job applications. Top priority: follow up on interviews and technical assessments.`
        : 'No applications tracked yet today. Explore Smart Job Discovery to discover top matching opportunities.';

      const actions = [
        pendingCount > 0 ? `Complete ${pendingCount} pending task(s)` : 'Review saved job applications',
        'Check Smart Job Discovery for new job recommendations'
      ];

      const reportData: Omit<DailyReportDoc, 'id'> = {
        reportDate,
        timezone: prefs.timezone || 'Asia/Riyadh',
        generatedAt: new Date().toISOString(),
        jobsSummary: {
          newDiscovered: 3,
          highestMatchScore: 92
        },
        applicationsSummary: {
          totalActive: userApps.length,
          statusChangesToday: 0
        },
        tasksSummary: {
          pendingTasks: pendingCount,
          completedTasks: completedCount
        },
        aiSummary,
        recommendedActions: actions,
        status: 'generated'
      };

      // Dispatch via Telegram if user enabled Telegram delivery
      try {
        const notifPrefs = await notificationService.getTelegramPreferences(uid);
        if (notifPrefs.enabled && notifPrefs.connected && notifPrefs.chatId && telegramService.isConfigured()) {

          const telegramText = [
            `مسار AI — التقرير اليومي`,
            `${reportDate} (${prefs.timezone || 'Asia/Riyadh'})`,
            ``,
            `ملخص الطلبات والمهام`,
            `إجمالي الطلبات النشطة: ${userApps.length}`,
            `المهام قيد الانتظار: ${pendingCount}`,
            `المهام المكتملة: ${completedCount}`,
            ``,
            `توصية مسار AI`,
            `${aiSummary}`,
            ``,
            `الإجراءات الموصى بها`,
            ...actions.map(a => `• ${a}`)
          ].join('\n');


          const telegramRes = await telegramService.sendMessage(notifPrefs.chatId, telegramText);

          if (telegramRes.success) {
            reportData.status = 'delivered';
          } else {
            reportData.status = 'failed';
          }
        }
      } catch (tgErr) {
        logger.warn(`Failed to dispatch daily report via Telegram for user ${uid}`, { err: tgErr });
      }

      await reportRef.set(reportData);
      logger.info(`Successfully generated Daily Intelligence Report ${reportId} for user ${uid}`);

      return {
        id: reportRef.id,
        ...reportData
      };
    } catch (error) {
      logger.error(`Error generating daily report ${reportId} for user ${uid}`, { error });
      throw new AppError('Unable to generate daily intelligence report', 500, 'REPORT_ERROR', error);
    }
  }

  public async getReports(uid: string): Promise<DailyReportDoc[]> {
    try {
      const snapshot = await this.db.collection('users').doc(uid).collection('reports').orderBy('generatedAt', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyReportDoc[];
    } catch (error) {
      logger.error(`Error fetching reports for user ${uid}`, error);
      throw new AppError('Unable to fetch reports', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const reportService = new ReportService();
