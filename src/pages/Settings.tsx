import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, MapPin, Briefcase, Mail, Save, CheckCircle2, Shield, Loader2, Sparkles, Send, Check, Power, FileText } from 'lucide-react';

import * as api from '../services/api';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { cn } from '../lib/utils';

export default function Settings() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const isAr = dir === 'rtl';

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('الرياض، المملكة العربية السعودية');
  const [currentJobTitle, setCurrentJobTitle] = useState('مهندس سحابي / Full Stack Engineer');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const profile = (await api.getCurrentUserProfile()) as any;
      if (profile) {
        if (profile.displayName) setDisplayName(profile.displayName);
        if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
        if (profile.location) setLocation(profile.location);
        if (profile.currentJobTitle) setCurrentJobTitle(profile.currentJobTitle);
      }
    } catch (err) {
      console.warn('Could not load user profile from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      // 1. Update in Firestore via backend /api/me
      await api.updateCurrentUserProfile({
        displayName,
        phoneNumber,
        location,
        currentJobTitle
      });

      // 2. Update Firebase Auth displayName if available
      if (auth.currentUser && displayName.trim()) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: displayName.trim()
          });
        } catch (authErr) {
          console.warn('Could not sync displayName to Firebase Auth object:', authErr);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || (isAr ? 'فشل حفظ البيانات في Firestore' : 'Failed to save profile to Firestore'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{isAr ? 'الإعدادات ومركز الخدمات المربوطة' : 'Settings & Services Hub'}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">{isAr ? 'إدارة بياناتك الشخصية وحسابات الخدمات المربوطة وإعدادات الإشعارات في مسار AI.' : 'Manage profile information, linked services, and notification preferences.'}</p>
      </div>

      {/* Integrations Status Hub Card */}
      <Card className="border-slate-200 shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'حالة الخدمات المربوطة بـ مسار AI' : 'Linked Services Integration Hub'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Firebase Auth */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{isAr ? 'حساب Firebase' : 'Firebase Auth'}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{user?.email || 'Authenticated'}</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          </div>

          {/* Gmail */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{isAr ? 'صندوق Gmail' : 'Gmail Sync'}</p>
                <p className="text-[10px] text-slate-500 truncate">{isAr ? 'مزامنة الرسائل' : 'Smart Inbox'}</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          </div>

          {/* Telegram */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{isAr ? 'بوت Telegram' : 'Telegram Bot'}</p>
                <p className="text-[10px] text-slate-500 truncate">{isAr ? 'تقارير يومية' : 'Daily Reports'}</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          </div>
        </div>
      </Card>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            {isAr ? 'إعدادات الحساب والمعلومات الشخصية' : 'Profile & Account Settings'}
          </h1>
          <p className="text-slate-500 mt-0.5 sm:mt-1 text-xs sm:text-sm">
            {isAr ? 'إدارة وتعديل بياناتك الشخصية المخزنة بأمان في قاعدة بيانات Firestore.' : 'Manage your personal account profile stored securely in Firestore.'}
          </p>
        </div>
      </div>

      {/* Success / Error Notification */}
      {saveSuccess && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{isAr ? 'تم حفظ وتحديث بيانات حسابك في Firestore بنجاح!' : 'Your profile data has been updated in Firestore successfully!'}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold">
          {errorMessage}
        </div>
      )}

      {/* Profile Edit Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                {isAr ? 'البيانات الأساسية' : 'Basic Profile Information'}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'هذه البيانات تُستخدم في التنسيق وتخصيص خدمات الذكاء الاصطناعي.' : 'This information customizes your AI recommendations and resume matches.'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500">{isAr ? 'جاري تحميل بيانات الحساب من Firestore...' : 'Loading profile from Firestore...'}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'الاسم الكامل' : 'Full Name'}</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'علي ال مستور' : 'Ali Al Mastoor'}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'رقم الجوال' : 'Phone Number'}</span>
                  </label>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={isAr ? '+966 50 123 4567' : '+966 50 123 4567'}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    dir="ltr"
                  />
                </div>

                {/* Current Job Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'المسمى الوظيفي الحالي' : 'Current Job Title'}</span>
                  </label>
                  <input 
                    type="text"
                    value={currentJobTitle}
                    onChange={(e) => setCurrentJobTitle(e.target.value)}
                    placeholder={isAr ? 'مهندس سحابي / Full Stack Engineer' : 'Cloud / Software Engineer'}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'المدينة والمنطقة' : 'City & Location'}</span>
                  </label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address (Readonly) */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'البريد الإلكتروني الموثق' : 'Authenticated Email'}</p>
                    <p className="text-xs font-bold text-slate-800">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {isAr ? 'موثق بـ Firebase' : 'Firebase Authenticated'}
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-6 shadow-md shadow-indigo-600/20"
                >
                  <Save className={cn("w-4 h-4", isSaving ? "animate-spin" : "")} />
                  <span>{isSaving ? (isAr ? 'جاري الحفظ في Firestore...' : 'Saving to Firestore...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Telegram Reports Configuration Card */}
      <TelegramSettingsCard isAr={isAr} />
    </div>
  );
}

function TelegramSettingsCard({ isAr }: { isAr: boolean }) {
  const [configured, setConfigured] = useState(true);
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [maskedChatId, setMaskedChatId] = useState<string | null>(null);
  const [chatIdInput, setChatIdInput] = useState('');
  const [dailyReportEnabled, setDailyReportEnabled] = useState(true);
  const [interviewAlertsEnabled, setInterviewAlertsEnabled] = useState(true);
  const [applicationUpdatesEnabled, setApplicationUpdatesEnabled] = useState(true);
  const [jobRecommendationsEnabled, setJobRecommendationsEnabled] = useState(true);
  const [status, setStatus] = useState<'NOT_CONFIGURED' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTelegramStatus();
  }, []);

  const loadTelegramStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTelegramStatus();
      if (res) {
        setConfigured(Boolean(res.configured));
        setConnected(Boolean(res.connected));
        setEnabled(Boolean(res.enabled));
        setMaskedChatId(res.maskedChatId || null);
        setDailyReportEnabled(Boolean(res.dailyReportEnabled));
        setInterviewAlertsEnabled(Boolean(res.interviewAlertsEnabled));
        setApplicationUpdatesEnabled(Boolean(res.applicationUpdatesEnabled));
        setJobRecommendationsEnabled(Boolean(res.jobRecommendationsEnabled));
        if (res.status) setStatus(res.status);
      }
    } catch (err) {
      console.warn('Could not load Telegram status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!chatIdInput.trim()) {
      setMsg({
        type: 'error',
        text: isAr ? 'يرجى إدخال معرف المحادثة (Telegram Chat ID) للربط' : 'Please enter Telegram Chat ID to connect'
      });
      return;
    }

    setIsSaving(true);
    setMsg(null);
    try {
      await api.connectTelegram(chatIdInput.trim(), isAr ? 'ar' : 'en');
      setMsg({
        type: 'success',
        text: isAr ? 'تم ربط حساب Telegram بنجاح' : 'Telegram account connected successfully'
      });
      setChatIdInput('');
      await loadTelegramStatus();
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'تعذر ربط Telegram. تحقق من Chat ID والبدء مع البوت' : 'Failed to connect Telegram Chat ID')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTelegram = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      await api.updateTelegramPreferences({
        enabled,
        dailyReportEnabled,
        interviewAlertsEnabled,
        applicationUpdatesEnabled,
        jobRecommendationsEnabled,
        ...(chatIdInput.trim() ? { chatId: chatIdInput.trim() } : {}),
        language: isAr ? 'ar' : 'en'
      });
      setMsg({
        type: 'success',
        text: isAr ? 'تم حفظ إعدادات الإشعارات بنجاح' : 'Notification preferences saved successfully'
      });
      setChatIdInput('');
      await loadTelegramStatus();
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'فشل حفظ إعدادات التلغرام' : 'Failed to save Telegram preferences')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setMsg(null);
    try {
      await api.sendTestTelegramMessage(chatIdInput.trim() || undefined, isAr ? 'ar' : 'en');
      setMsg({
        type: 'success',
        text: isAr ? 'تم إرسال الرسالة التجريبية' : 'Test message delivered'
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'تعذر إرسال الرسالة التجريبية' : 'Failed to send test message')
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendFullReport = async () => {
    setIsSendingReport(true);
    setMsg(null);
    try {
      await api.sendFullTelegramReport();
      setMsg({
        type: 'success',
        text: isAr ? 'تم إرسال التقرير اليومي الشامل إلى حسابك على Telegram بنجاح! 📊' : 'Comprehensive career report sent to your Telegram successfully! 📊'
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'تعذر إرسال التقرير الشامل' : 'Failed to send full report')
      });
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setMsg(null);
    try {
      await api.disconnectTelegram();
      setMsg({
        type: 'success',
        text: isAr ? 'تم فصل Telegram' : 'Telegram disconnected'
      });
      await loadTelegramStatus();
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'فشل فصل حساب Telegram' : 'Failed to disconnect Telegram')
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                {isAr ? 'تقارير وإشعارات التلغرام (Telegram Reports)' : 'Telegram Reports & Intelligence'}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'استلم تقارير مسار AI وتحديثات رحلة التوظيف مباشرة على Telegram' : 'Receive your Masar AI career reports and job updates on Telegram'}
              </p>
            </div>
          </div>

          <span className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto shrink-0",
            status === 'CONNECTED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            status === 'NOT_CONFIGURED' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"
          )}>
            {status === 'CONNECTED' ? (isAr ? 'متصل' : 'Connected') :
             status === 'NOT_CONFIGURED' ? (isAr ? 'السيرفر غير مهيأ' : 'Bot Unconfigured') : (isAr ? 'غير مرتبط' : 'Not Connected')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {msg && (
          <div className={cn("p-3.5 rounded-2xl text-xs font-semibold", msg.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200")}>
            {msg.text}
          </div>
        )}

        {/* Info Helper Note */}
        <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl text-xs text-sky-900 leading-relaxed space-y-1.5">
          <p className="font-bold">{isAr ? 'تعليمات الربط بالمحادثة' : 'Telegram Linking Instructions'}</p>
          <p>
            {isAr 
              ? <>1. افتح بوت مسار AI على تلغرام عبر الرابط: <a href="https://t.me/masar_ai_app_bot" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 underline hover:text-sky-700">@masar_ai_app_bot</a> واضغط على <strong>Start</strong> (/start).<br />2. استخدم معرف المحادثة (Chat ID) الخاص بك من <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 underline hover:text-sky-700">@userinfobot</a> ثم اضغط &quot;ربط Telegram&quot;.</> 
              : <>1. Open Masar AI Bot via <a href="https://t.me/masar_ai_app_bot" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 underline hover:text-sky-700">@masar_ai_app_bot</a> and tap <strong>Start</strong> (/start).<br />2. Enter your Chat ID (obtained from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 underline hover:text-sky-700">@userinfobot</a>) and click &quot;Connect Telegram&quot;.</>}
          </p>
        </div>

        {/* Connection Form / Status Display */}
        <div className="space-y-4">
          {connected && maskedChatId ? (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">{isAr ? 'Telegram متصل' : 'Telegram Connected'}</p>
                  <p className="text-[11px] text-emerald-700 font-mono">Chat ID: {maskedChatId}</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="outline"
                className="text-xs font-bold h-9 text-red-600 border-red-200 hover:bg-red-50 gap-1.5 shrink-0"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isDisconnecting ? (isAr ? 'جاري الفصل...' : 'Disconnecting...') : (isAr ? 'فصل Telegram' : 'Disconnect Telegram')}</span>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'معرف المحادثة (Telegram Chat ID)' : 'Telegram Chat ID'}
                </label>
                <input 
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder={isAr ? 'مثال: 123456789' : 'e.g. 123456789'}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  dir="ltr"
                />
              </div>

              <Button 
                type="button"
                onClick={handleConnect}
                disabled={isSaving || !chatIdInput.trim()}
                className="h-10 text-xs font-bold gap-2 bg-sky-600 hover:bg-sky-700 text-white w-full"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                <span>{isAr ? 'ربط Telegram' : 'Connect Telegram'}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Notification Category Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{isAr ? 'إعدادات الإشعارات' : 'Notification Preferences'}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <span className="text-xs font-bold text-slate-800">{isAr ? 'تفعيل إشعارات Telegram (الشامل)' : 'Master Telegram Notifications'}</span>
              <input 
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <span className="text-xs font-bold text-slate-800">{isAr ? 'التقرير اليومي' : 'Daily Career Report'}</span>
              <input 
                type="checkbox"
                checked={dailyReportEnabled}
                onChange={(e) => setDailyReportEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <span className="text-xs font-bold text-slate-800">{isAr ? 'تحديثات طلبات التوظيف' : 'Application Updates'}</span>
              <input 
                type="checkbox"
                checked={applicationUpdatesEnabled}
                onChange={(e) => setApplicationUpdatesEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <span className="text-xs font-bold text-slate-800">{isAr ? 'تنبيهات المقابلات' : 'Interview Reminders'}</span>
              <input 
                type="checkbox"
                checked={interviewAlertsEnabled}
                onChange={(e) => setInterviewAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors sm:col-span-2">
              <span className="text-xs font-bold text-slate-800">{isAr ? 'الوظائف المقترحة' : 'Job Recommendations'}</span>
              <input 
                type="checkbox"
                checked={jobRecommendationsEnabled}
                onChange={(e) => setJobRecommendationsEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              type="button"
              onClick={handleSendFullReport}
              disabled={isSendingReport || !connected}
              className="w-full sm:w-auto text-xs font-bold h-10 gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sm"
            >
              <FileText className={cn("w-3.5 h-3.5", isSendingReport ? "animate-spin" : "")} />
              <span>{isSendingReport ? (isAr ? 'جاري إرسال التقرير الشامل...' : 'Sending Full Report...') : (isAr ? 'إرسال التقرير الشامل الآن' : 'Send Full Report Now')}</span>
            </Button>

            <Button 
              type="button"
              onClick={handleSendTest}
              disabled={isTesting || (!connected && !chatIdInput.trim())}
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold h-10 gap-2 border-slate-200 hover:bg-slate-50"
            >
              <Send className={cn("w-3.5 h-3.5 text-sky-600", isTesting ? "animate-spin" : "")} />
              <span>{isTesting ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'رسالة تجريبية' : 'Test Message')}</span>
            </Button>
          </div>

          <Button 
            type="button"
            onClick={handleSaveTelegram}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs font-bold h-10 gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Save className={cn("w-3.5 h-3.5", isSaving ? "animate-spin" : "")} />
            <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الإعدادات' : 'Save Settings')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

