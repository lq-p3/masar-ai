import { Request, Response, NextFunction } from 'express';
import { notificationService, maskChatId } from '../services/notification.service.js';
import { telegramService } from '../services/telegram.service.js';
import { applicationService } from '../services/application.service.js';
import { jobService } from '../services/job.service.js';
import { getFirestore } from 'firebase-admin/firestore';
import { ApiSuccessResponse, AppError } from '../types/api.types.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

function getUserId(req: Request): string {
  const uid = (req as AuthenticatedRequest).user?.uid;
  if (!uid) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return uid;
}

export async function getTelegramStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const prefs = await notificationService.getTelegramPreferences(uid);
    const isBotConfigured = telegramService.isConfigured();

    const response: ApiSuccessResponse<{
      configured: boolean;
      connected: boolean;
      enabled: boolean;
      maskedChatId: string | null;
      dailyReportEnabled: boolean;
      interviewAlertsEnabled: boolean;
      applicationUpdatesEnabled: boolean;
      jobRecommendationsEnabled: boolean;
      lastReportAt: string | null;
      status: 'NOT_CONFIGURED' | 'CONNECTED' | 'DISCONNECTED';
    }> = {
      success: true,
      data: {
        configured: isBotConfigured,
        connected: prefs.connected,
        enabled: prefs.enabled,
        maskedChatId: maskChatId(prefs.chatId),
        dailyReportEnabled: prefs.dailyReportEnabled,
        interviewAlertsEnabled: prefs.interviewAlertsEnabled,
        applicationUpdatesEnabled: prefs.applicationUpdatesEnabled,
        jobRecommendationsEnabled: prefs.jobRecommendationsEnabled,
        lastReportAt: prefs.lastReportAt || null,
        status: !isBotConfigured 
          ? 'NOT_CONFIGURED' 
          : (prefs.connected && prefs.chatId ? 'CONNECTED' : 'DISCONNECTED')
      }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function connectTelegram(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { chatId, language = 'ar' } = req.body;

    if (!chatId || !String(chatId).trim()) {
      throw new AppError('Telegram Chat ID is required to connect', 400, 'VALIDATION_ERROR');
    }

    const cleanChatId = String(chatId).trim();

    // Verify Chat ID via real Telegram Bot API message dispatch
    const testRes = await telegramService.sendTestMessage(cleanChatId, language === 'ar' ? 'ar' : 'en');
    if (!testRes.success) {
      if (testRes.errorCode === 'TELEGRAM_NOT_CONFIGURED') {
        throw new AppError('خدمة بوت التلغرام غير مفعلة على الخادم حالياً. (يرجى إعداد TELEGRAM_BOT_TOKEN في الخادم).', 503, 'TELEGRAM_NOT_CONFIGURED');
      }
      if (testRes.errorCode === 'TELEGRAM_TOKEN_INVALID') {
        throw new AppError('توكن بوت Telegram المسجل في الخادم غير صحيح (Unauthorized). يرجى التأكد من توكن البوت.', 400, 'TELEGRAM_TOKEN_INVALID');
      }
      throw new AppError(
        testRes.errorDetails || 'تعذر التحقق من معرف المحادثة (Chat ID). يرجى إرسال /start للبوت في تطبيق Telegram.',
        400,
        testRes.errorCode || 'TELEGRAM_VERIFICATION_FAILED'
      );
    }

    const updated = await notificationService.connectTelegram(uid, cleanChatId, language === 'ar' ? 'ar' : 'en');
    const response: ApiSuccessResponse<{
      connected: boolean;
      maskedChatId: string | null;
      preferences: typeof updated;
    }> = {
      success: true,
      data: {
        connected: true,
        maskedChatId: maskChatId(cleanChatId),
        preferences: updated
      }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateTelegramPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { 
      enabled, 
      dailyReportEnabled, 
      interviewAlertsEnabled, 
      applicationUpdatesEnabled, 
      jobRecommendationsEnabled,
      chatId,
      language 
    } = req.body;

    const updates: any = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof dailyReportEnabled === 'boolean') updates.dailyReportEnabled = dailyReportEnabled;
    if (typeof interviewAlertsEnabled === 'boolean') updates.interviewAlertsEnabled = interviewAlertsEnabled;
    if (typeof applicationUpdatesEnabled === 'boolean') updates.applicationUpdatesEnabled = applicationUpdatesEnabled;
    if (typeof jobRecommendationsEnabled === 'boolean') updates.jobRecommendationsEnabled = jobRecommendationsEnabled;
    if (language === 'ar' || language === 'en') updates.language = language;
    if (chatId !== undefined) {
      updates.chatId = chatId ? String(chatId).trim() : null;
      updates.connected = Boolean(updates.chatId);
    }

    const updated = await notificationService.updateTelegramPreferences(uid, updates);

    const response: ApiSuccessResponse<typeof updated> = {
      success: true,
      data: updated
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function sendTestTelegramMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const { chatId, language = 'ar' } = req.body;

    let targetChatId = chatId ? String(chatId).trim() : null;
    if (!targetChatId) {
      const prefs = await notificationService.getTelegramPreferences(uid);
      targetChatId = prefs.chatId;
    }

    if (!targetChatId) {
      throw new AppError('No Telegram Chat ID provided or connected for this account', 400, 'VALIDATION_ERROR');
    }

    const result = await telegramService.sendTestMessage(targetChatId, language === 'ar' ? 'ar' : 'en');
    if (!result.success) {
      if (result.errorCode === 'TELEGRAM_NOT_CONFIGURED') {
        throw new AppError('خدمة بوت التلغرام غير مفعلة على الخادم حالياً. (TELEGRAM_BOT_TOKEN غير مضاف).', 503, 'TELEGRAM_NOT_CONFIGURED');
      }
      if (result.errorCode === 'TELEGRAM_TOKEN_INVALID') {
        throw new AppError('توكن بوت Telegram المسجل في الخادم غير صحيح (Unauthorized).', 400, 'TELEGRAM_TOKEN_INVALID');
      }
      throw new AppError(
        result.errorDetails || 'تعذر إرسال الرسالة التجريبية عبر Telegram',
        400,
        result.errorCode || 'TELEGRAM_ERROR'
      );
    }

    await notificationService.updateTelegramPreferences(uid, {
      lastTestMessageAt: new Date().toISOString()
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

export async function sendFullReportNow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const prefs = await notificationService.getTelegramPreferences(uid);

    if (!prefs.connected || !prefs.chatId) {
      throw new AppError('يرجى ربط حساب Telegram أولاً لاستلام التقرير', 400, 'TELEGRAM_NOT_CONNECTED');
    }

    const apps = await applicationService.getApplications(uid);
    const discovered = await jobService.getDiscoveredJobs(uid);

    const stats = {
      total: apps.length,
      underReview: apps.filter(a => a.status === 'Under Review' || a.status === 'Shortlisted').length,
      shortlisted: apps.filter(a => a.status === 'Shortlisted').length,
      interview: apps.filter(a => a.status === 'Interview').length,
      offer: apps.filter(a => a.status === 'Offer').length
    };

    const topJobs = discovered.slice(0, 3).map(j => ({
      title: j.title,
      company: j.company,
      matchScore: j.matchScore || 85
    }));

    const rec = apps.length > 0
      ? `لديك ${stats.total} طلب توظيف نشط. استمر في متابعة المقابلات وتحديث حالات التقديم للحصول على أفضل النتائج.`
      : 'استكشف الوظائف المقترحة الذكية وأضف طلباتك لتتبع سير رحلتك المهنية.';

    const result = await telegramService.sendDailyReport(
      prefs.chatId,
      stats,
      topJobs,
      rec,
      prefs.language || 'ar'
    );

    if (!result.success) {
      throw new AppError(result.errorDetails || 'تعذر إرسال التقرير اليومي', 400, result.errorCode || 'TELEGRAM_ERROR');
    }

    await notificationService.updateTelegramPreferences(uid, {
      lastReportAt: new Date().toISOString()
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

export async function disconnectTelegram(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = getUserId(req);
    const updated = await notificationService.disconnectTelegram(uid);
    const response: ApiSuccessResponse<{ connected: boolean }> = {
      success: true,
      data: { connected: false }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function triggerCronDailyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET || 'masar-ai-cron-secret-504916';
    if (cronSecret !== expectedSecret) {
      throw new AppError('Unauthorized cron invocation secret', 401, 'UNAUTHORIZED');
    }

    logger.info('Starting Cloud Scheduler daily Telegram reports dispatch...');
    const db = getFirestore();
    const usersSnapshot = await db.collection('users').get();
    
    let processed = 0;
    let delivered = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        const prefs = await notificationService.getTelegramPreferences(uid);
        if (!prefs.connected || !prefs.enabled || !prefs.dailyReportEnabled || !prefs.chatId) {
          continue;
        }

        processed++;
        const apps = await applicationService.getApplications(uid);
        const discovered = await jobService.getDiscoveredJobs(uid);

        const stats = {
          total: apps.length,
          underReview: apps.filter(a => a.status === 'Under Review' || a.status === 'Shortlisted').length,
          shortlisted: apps.filter(a => a.status === 'Shortlisted').length,
          interview: apps.filter(a => a.status === 'Interview').length,
          offer: apps.filter(a => a.status === 'Offer').length
        };

        const topJobs = discovered.slice(0, 2).map(j => ({
          title: j.title,
          company: j.company,
          matchScore: j.matchScore || 85
        }));

        const rec = apps.length > 0
          ? 'ركز اليوم على الطلبات التي تحتاج إلى متابعة وتحضير المقابلات القادمة.'
          : 'استكشف الوظائف المقترحة الجديدة وأضف طلباتك لتتبع سير التقديمات.';

        const sendRes = await telegramService.sendDailyReport(
          prefs.chatId,
          stats,
          topJobs,
          rec,
          prefs.language || 'ar'
        );

        if (sendRes.success) {
          delivered++;
          await notificationService.updateTelegramPreferences(uid, {
            lastReportAt: new Date().toISOString()
          });
        }
      } catch (uErr: any) {
        logger.warn(`Error generating daily report for user ${uid}: ${uErr?.message || uErr}`);
      }

    }

    const response: ApiSuccessResponse<{ processed: number; delivered: number }> = {
      success: true,
      data: { processed, delivered }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
