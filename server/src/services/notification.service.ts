import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';

export interface UserTelegramPreferences {
  connected: boolean;
  chatId: string | null;
  enabled: boolean;
  dailyReportEnabled: boolean;
  interviewAlertsEnabled: boolean;
  applicationUpdatesEnabled: boolean;
  jobRecommendationsEnabled: boolean;
  language: 'ar' | 'en';
  lastTestMessageAt?: string | null;
  lastReportAt?: string | null;
  connectedAt?: string | null;
  updatedAt?: string;
}

export const DEFAULT_TELEGRAM_PREFERENCES: UserTelegramPreferences = {
  connected: false,
  chatId: null,
  enabled: true,
  dailyReportEnabled: true,
  interviewAlertsEnabled: true,
  applicationUpdatesEnabled: true,
  jobRecommendationsEnabled: true,
  language: 'ar',
  lastTestMessageAt: null,
  lastReportAt: null,
  connectedAt: null
};

export function maskChatId(chatId: string | null | undefined): string | null {
  if (!chatId || !chatId.trim()) return null;
  const clean = chatId.trim();
  if (clean.length <= 4) return '••••' + clean;
  return '•••••' + clean.slice(-3);
}

export class NotificationService {
  private get db() {
    return getFirestore();
  }

  private userTelegramDoc(uid: string) {
    return this.db.collection('users').doc(uid).collection('preferences').doc('telegram');
  }

  private userNotificationDoc(uid: string) {
    return this.db.collection('users').doc(uid).collection('preferences').doc('notifications');
  }

  public async getTelegramPreferences(uid: string): Promise<UserTelegramPreferences> {
    try {
      const doc = await this.userTelegramDoc(uid).get();
      if (!doc.exists) {
        // Fallback check on old notifications doc
        const oldDoc = await this.userNotificationDoc(uid).get();
        if (oldDoc.exists) {
          const oldData = oldDoc.data() as any;
          if (oldData.telegramChatId) {
            return {
              ...DEFAULT_TELEGRAM_PREFERENCES,
              connected: true,
              chatId: oldData.telegramChatId,
              enabled: oldData.telegramEnabled ?? true,
              dailyReportEnabled: oldData.dailyReportEnabled ?? true
            };
          }
        }
        return DEFAULT_TELEGRAM_PREFERENCES;
      }
      return { ...DEFAULT_TELEGRAM_PREFERENCES, ...doc.data() } as UserTelegramPreferences;
    } catch (error) {
      logger.error(`Error fetching Telegram preferences for user ${uid}`, { error });
      return DEFAULT_TELEGRAM_PREFERENCES;
    }
  }

  public async updateTelegramPreferences(
    uid: string,
    updates: Partial<UserTelegramPreferences>
  ): Promise<UserTelegramPreferences> {
    try {
      const docRef = this.userTelegramDoc(uid);
      const current = await this.getTelegramPreferences(uid);
      const updated: UserTelegramPreferences = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await docRef.set(updated, { merge: true });

      // Sync with old notifications doc for backward compatibility
      await this.userNotificationDoc(uid).set({
        telegramEnabled: updated.enabled && updated.connected,
        telegramChatId: updated.chatId,
        dailyReportEnabled: updated.dailyReportEnabled,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      logger.info(`Updated Telegram preferences for user ${uid}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating Telegram preferences for user ${uid}`, { error });
      throw new AppError('Unable to update Telegram notification preferences', 500, 'DATABASE_ERROR', error);
    }
  }

  public async connectTelegram(uid: string, chatId: string, language: 'ar' | 'en' = 'ar'): Promise<UserTelegramPreferences> {
    const cleanChatId = chatId.trim();
    const now = new Date().toISOString();
    return this.updateTelegramPreferences(uid, {
      connected: true,
      chatId: cleanChatId,
      enabled: true,
      language,
      connectedAt: now,
      lastTestMessageAt: now
    });
  }

  public async disconnectTelegram(uid: string): Promise<UserTelegramPreferences> {
    return this.updateTelegramPreferences(uid, {
      connected: false,
      chatId: null,
      enabled: false,
      lastTestMessageAt: null
    });
  }
}

export const notificationService = new NotificationService();
