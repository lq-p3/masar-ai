import { logger } from '../utils/logger.js';
import { AppError } from '../types/api.types.js';

export interface SendTelegramMessageResult {
  success: boolean;
  telegramMessageId?: number;
  errorCode?: string;
  errorDetails?: string;
}

export class TelegramService {
  private get botToken(): string | null {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.trim() === '' || token.includes('Placeholder')) {
      return null;
    }
    return token.trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.botToken);
  }

  public async sendMessage(chatId: string, message: string): Promise<SendTelegramMessageResult> {
    if (!this.isConfigured()) {
      logger.info('Telegram sendMessage called but TELEGRAM_BOT_TOKEN is unconfigured');
      return {
        success: false,
        errorCode: 'TELEGRAM_NOT_CONFIGURED',
        errorDetails: 'خدمة بوت التلغرام غير مفعلة على الخادم حالياً (لم يتم ضبط TELEGRAM_BOT_TOKEN).'
      };
    }

    if (!chatId || !chatId.trim()) {
      throw new AppError('Telegram Chat ID is required', 400, 'VALIDATION_ERROR');
    }

    const token = this.botToken!;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: message,
          parse_mode: 'HTML'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json() as any;

      if (!response.ok || !data.ok) {
        logger.error(`Telegram API error for chatId ${chatId}: ${data?.description || 'Unknown error'}`);
        let errorCode = 'TELEGRAM_API_ERROR';
        let errorDetails = data?.description || 'تعذر تسليم الرسالة عبر Telegram API';

        if (data?.error_code === 401 || data?.description === 'Unauthorized') {
          errorCode = 'TELEGRAM_TOKEN_INVALID';
          errorDetails = 'رمز توكن بوت التليجرام (Telegram Bot Token) غير صحيح أو غير مفعّل على الخادم.';
        } else if (data?.error_code === 400 || (data?.description && data.description.includes('chat not found'))) {
          errorCode = 'TELEGRAM_CHAT_NOT_FOUND';
          errorDetails = 'لم يتم العثور على المحادثة. يرجى فتح Telegram والبحث عن البوت وإرسال /start أولاً.';
        } else if (data?.error_code === 403) {
          errorCode = 'TELEGRAM_BOT_BLOCKED';
          errorDetails = 'البوت محظور من قبل المستخدم في Telegram. يرجى إلغاء حظر البوت وإعادة المحاولة.';
        }

        return {
          success: false,
          errorCode,
          errorDetails
        };
      }

      logger.info(`Successfully delivered Telegram message to chatId ${chatId} (msgId: ${data.result?.message_id})`);
      return {
        success: true,
        telegramMessageId: data.result?.message_id
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      logger.error(`Exception sending Telegram message to chatId ${chatId}:`, err);
      return {
        success: false,
        errorCode: 'TELEGRAM_NETWORK_ERROR',
        errorDetails: err.message || 'Network error delivering Telegram message'
      };
    }
  }

  public async sendTestMessage(chatId: string, language: 'ar' | 'en' = 'ar'): Promise<SendTelegramMessageResult> {
    const text = language === 'ar'
      ? `مسار AI\n\nتم ربط حساب Telegram بنجاح.\n\nيمكنك الآن استلام تقارير رحلة التوظيف وتحديثات الطلبات والمقابلات والوظائف المقترحة من مسار AI.`
      : `Masar AI\n\nYour Telegram account has been connected successfully.\n\nYou can now receive career reports, application updates, interview reminders, and job recommendations from Masar AI.`;

    return this.sendMessage(chatId, text);
  }

  public async sendDailyReport(
    chatId: string,
    stats: {
      total: number;
      underReview: number;
      shortlisted: number;
      interview: number;
      offer: number;
    },
    topJobs: Array<{ title: string; company: string; matchScore: number }>,
    recommendation: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<SendTelegramMessageResult> {
    const todayStr = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const jobsListText = topJobs.length > 0
      ? topJobs.map((j, i) => `<b>${i + 1}. ${j.title}</b>\n🏢 الشركة: <b>${j.company}</b>\n📊 نسبة التطابق: <b>${j.matchScore}%</b>`).join('\n\n')
      : (language === 'ar' ? '✨ لا توجد وظائف مقترحة جديدة اليوم' : 'No new recommendations today');

    const text = language === 'ar'
      ? `📊 <b>تقرير مسار AI الشامل</b>\n🗓️ <i>${todayStr}</i>\n\n━━━━━━━━━━━━━━━━━━━━\n📌 <b>ملخص رحلة التوظيف:</b>\n• 📁 إجمالي الطلبات النشطة: <b>${stats.total}</b>\n• ⏳ قيد المراجعة: <b>${stats.underReview}</b>\n• ⭐ القائمة المختصرة: <b>${stats.shortlisted}</b>\n• 🎙️ مقابلات قادمة: <b>${stats.interview}</b>\n• 🎉 العروض الوظيفية: <b>${stats.offer}</b>\n\n━━━━━━━━━━━━━━━━━━━━\n🎯 <b>أبرز الوظائف المقترحة لك:</b>\n\n${jobsListText}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 <b>توجيهات وتوصيات مسار الذكية:</b>\n${recommendation}\n\n🌐 <b>رابط منصة مسار AI:</b>\nhttps://masar-ai-frontend-828667104263.us-west4.run.app`
      : `📊 <b>Masar AI Comprehensive Career Report</b>\n🗓️ <i>${todayStr}</i>\n\n━━━━━━━━━━━━━━━━━━━━\n📌 <b>Application Pipeline:</b>\n• 📁 Total Applications: <b>${stats.total}</b>\n• ⏳ Under Review: <b>${stats.underReview}</b>\n• ⭐ Shortlisted: <b>${stats.shortlisted}</b>\n• 🎙️ Interviews: <b>${stats.interview}</b>\n• 🎉 Job Offers: <b>${stats.offer}</b>\n\n━━━━━━━━━━━━━━━━━━━━\n🎯 <b>Top Matching Job Recommendations:</b>\n\n${jobsListText}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 <b>AI Recommendation:</b>\n${recommendation}\n\n🌐 <b>Access Masar AI:</b>\nhttps://masar-ai-frontend-828667104263.us-west4.run.app`;

    return this.sendMessage(chatId, text);
  }

  public async sendInterviewAlert(
    chatId: string,
    interview: {
      title: string;
      company: string;
      date: string;
      time: string;
    },
    language: 'ar' | 'en' = 'ar'
  ): Promise<SendTelegramMessageResult> {
    const text = language === 'ar'
      ? `تذكير بالمقابلة\n\nلديك مقابلة قادمة\n\nالوظيفة:\n${interview.title}\n\nالشركة:\n${interview.company}\n\nالتاريخ:\n${interview.date}\n\nالوقت:\n${interview.time}\n\nنتمنى لك التوفيق`
      : `Interview Reminder\n\nYou have an upcoming interview\n\nPosition:\n${interview.title}\n\nCompany:\n${interview.company}\n\nDate:\n${interview.date}\n\nTime:\n${interview.time}\n\nBest of luck`;

    return this.sendMessage(chatId, text);
  }

  public async sendApplicationUpdate(
    chatId: string,
    update: {
      company: string;
      title: string;
      newStatus: string;
    },
    language: 'ar' | 'en' = 'ar'
  ): Promise<SendTelegramMessageResult> {
    const text = language === 'ar'
      ? `تحديث طلب التوظيف\n\nالشركة:\n${update.company}\n\nالوظيفة:\n${update.title}\n\nالحالة الجديدة:\n${update.newStatus}\n\nيمكنك الاطلاع على تفاصيل الطلب داخل منصة مسار AI.`
      : `Application Update\n\nCompany:\n${update.company}\n\nPosition:\n${update.title}\n\nNew Status:\n${update.newStatus}\n\nView the application inside Masar AI for more details.`;

    return this.sendMessage(chatId, text);
  }
}

export const telegramService = new TelegramService();
