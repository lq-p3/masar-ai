import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApplications } from '../contexts/ApplicationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Sparkles, Search, Building2, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import * as api from '../services/api';

type ConnectionStatus = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR';

export default function InboxIntelligence() {
  const { addApplication } = useApplications();
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const [searchParams, setSearchParams] = useSearchParams();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('NOT_CONNECTED');
  const [connectedEmail, setConnectedEmail] = useState<string>('');
  const [syncedEmails, setSyncedEmails] = useState<any[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGmailStatus = async () => {
    try {
      const data = await api.getGmailStatus();
      if (data && data.connected) {
        setConnectionStatus('CONNECTED');
        setConnectedEmail(data.connectedEmail || '');
        setSyncedEmails(data.emails || []);
      } else {
        setConnectionStatus('NOT_CONNECTED');
        setSyncedEmails([]);
      }
    } catch (err) {
      console.warn('Error checking Gmail connection status:', err);
      setConnectionStatus('NOT_CONNECTED');
    }
  };

  useEffect(() => {
    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'success') {
      searchParams.delete('gmail');
      setSearchParams(searchParams);
      fetchGmailStatus().then(() => handleSyncGmail());
    } else if (gmailParam === 'error') {
      searchParams.delete('gmail');
      setSearchParams(searchParams);
      setConnectionStatus('ERROR');
      setErrorMessage(isAr ? 'فشل إكمال الاتصال مع Google Gmail OAuth.' : 'Google Gmail OAuth connection failed.');
    } else {
      fetchGmailStatus();
    }
  }, []);

  const handleConnectGmail = async () => {
    setErrorMessage(null);
    setConnectionStatus('CONNECTING');
    try {
      const url = await api.getGmailConnectUrl();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to obtain Google authorization URL');
      }
    } catch (err) {
      console.error('Failed to initiate Gmail OAuth:', err);
      setConnectionStatus('ERROR');
      const msg = err instanceof Error ? err.message : (isAr ? 'خطأ أثناء الاتصال بـ Gmail' : 'Error connecting to Gmail');
      setErrorMessage(msg);
    }
  };

  const handleSyncGmail = async () => {
    setErrorMessage(null);
    setConnectionStatus('SYNCING');
    try {
      await api.syncGmail();
      await fetchGmailStatus();
      setConnectionStatus('CONNECTED');
    } catch (err) {
      console.error('Failed to sync Gmail:', err);
      setConnectionStatus('CONNECTED');
      const msg = err instanceof Error ? err.message : (isAr ? 'فشلت عملية المزامنة' : 'Failed to sync Gmail messages');
      setErrorMessage(msg);
    }
  };

  const realEmails = connectionStatus === 'CONNECTED' ? syncedEmails : [];

  const filteredEmails = realEmails.filter(e => 
    (e.company || '').toLowerCase().includes(searchFilter.toLowerCase()) || 
    (e.jobTitle || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (e.summary || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedEmail = realEmails.find(e => e.id === selectedEmailId) || realEmails[0];

  const handleCreateAppFromEmail = () => {
    if (!selectedEmail) return;
    addApplication({
      company: selectedEmail.company,
      title: selectedEmail.jobTitle,
      location: 'Riyadh, SA',
      status: selectedEmail.category === 'Interview' ? 'Interview' : selectedEmail.category === 'Assessment' ? 'Assessment' : 'Under Review',
      source: 'Gmail Auto-Track'
    });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
              {isAr ? 'البريد الذكي ورسائل التوظيف' : 'Inbox Intelligence'}
            </h1>
            <span className={cn(
              "text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider",
              connectionStatus === 'CONNECTED' ? "bg-emerald-100 text-emerald-700" :
              connectionStatus === 'CONNECTING' || connectionStatus === 'SYNCING' ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-slate-600 border border-slate-200"
            )}>
              {connectionStatus === 'NOT_CONNECTED' ? (isAr ? 'غير متصل' : 'Not Connected') :
               connectionStatus === 'CONNECTING' ? (isAr ? 'جاري الاتصال...' : 'Connecting...') :
               connectionStatus === 'CONNECTED' ? (isAr ? 'متصل' : 'Connected') :
               connectionStatus === 'SYNCING' ? (isAr ? 'مزامنة...' : 'Syncing...') : (isAr ? 'خطأ في الربط' : 'Error')}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{isAr ? 'تتبع رسائل التوظيف الحقيقية واستخراج التحديثات تلقائياً بالذكاء الاصطناعي.' : 'AI-powered tracking of your real recruitment emails.'}</span>
            {connectedEmail && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-[200px] sm:max-w-none">
                {connectedEmail}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={connectionStatus === 'CONNECTED' ? handleSyncGmail : handleConnectGmail}
          disabled={connectionStatus === 'CONNECTING' || connectionStatus === 'SYNCING'}
          variant={connectionStatus === 'CONNECTED' ? "outline" : "default"} 
          className="w-full sm:w-auto gap-2 text-xs sm:text-sm h-10 font-bold shadow-sm justify-center shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", (connectionStatus === 'CONNECTING' || connectionStatus === 'SYNCING') ? "animate-spin text-indigo-600" : "")} />
          {connectionStatus === 'CONNECTED' 
            ? (isAr ? 'إعادة مزامنة Gmail' : 'Sync Gmail Now')
            : (isAr ? 'ربط حساب Gmail' : 'Connect Gmail')}
        </Button>
      </div>

      {errorMessage && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {connectionStatus !== 'CONNECTED' ? (
        <Card className="p-6 sm:p-12 text-center space-y-4 border-slate-200 shadow-sm">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
            <Mail className="w-6 sm:w-7 h-6 sm:h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isAr ? 'حساب Gmail غير متصل' : 'Gmail Account Not Connected'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr 
                ? 'قم بربط حساب Gmail الخاص بك لتتبع رسائل التوظيف، وتوليد تحديثات حالات الطلبات تلقائياً، واستخراج مواعيد المقابلات والاختبارات الفنية بالذكاء الاصطناعي.'
                : 'Connect your Gmail account to enable automatic recruitment email tracking, status updates, and interview extraction.'}
            </p>
          </div>
          <Button 
            onClick={handleConnectGmail}
            disabled={connectionStatus === 'CONNECTING'}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", connectionStatus === 'CONNECTING' ? "animate-spin" : "")} />
            <span>{connectionStatus === 'CONNECTING' ? (isAr ? 'جاري الاتصال...' : 'Connecting...') : (isAr ? 'ربط حساب Gmail' : 'Connect Gmail')}</span>
          </Button>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Email List Column */}
        <Card className="border-slate-200 shadow-sm flex flex-col lg:col-span-1 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={isAr ? 'ابحث في البريد...' : 'Search emails...'} 
                className="w-full h-9 ps-9 pe-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'لا توجد رسائل توظيف' : 'No Recruitment Emails Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {isAr 
                    ? 'لم يتم العثور على أي رسائل بريد إلكتروني خاصة بالتوظيف في حساب Gmail المتصل حالياً.' 
                    : 'No recruitment-related emails were found in your connected Gmail account.'}
                </p>
                <Button onClick={handleSyncGmail} size="sm" variant="outline" className="gap-2 text-xs font-bold mt-2 border-indigo-200 text-indigo-700">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة المزامنة الآن' : 'Re-sync Gmail'}</span>
                </Button>
              </div>
            ) : (
              filteredEmails.map((email) => (
              <div 
                key={email.id} 
                onClick={() => setSelectedEmailId(email.id)}
                className={cn(
                  "p-4 cursor-pointer transition-all space-y-2",
                  selectedEmailId === email.id ? "bg-indigo-50/50 border-s-4 border-s-indigo-600" : "hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-xs truncate me-2">{email.company}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{new Date(email.date).toLocaleDateString()}</span>
                </div>
                
                <p className="text-xs font-semibold text-slate-700 truncate">{email.jobTitle}</p>
                
                <div className="flex justify-between items-center pt-1">
                  <Badge 
                    variant={
                      email.category === 'Interview' ? 'ai' : 
                      email.category === 'Rejection' ? 'danger' : 
                      email.category === 'Assessment' ? 'warning' : 'default'
                    }
                    className="text-[10px] px-2 py-0.5"
                  >
                    {email.category}
                  </Badge>
                  {email.actionRequired && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
              </div>
            )))}
          </div>
        </Card>

        {/* Email Content & AI Extraction Column */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmail ? (
            <>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/40 rounded-t-3xl">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-slate-900">{selectedEmail.jobTitle}</h2>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Gmail Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">From: <span className="font-semibold text-slate-700">{selectedEmail.sender}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">{new Date(selectedEmail.date).toLocaleString()}</span>
                      {selectedEmail.gmailMessageId && (
                        <a 
                          href={`https://mail.google.com/mail/u/0/#inbox/${selectedEmail.gmailMessageId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isAr ? 'مشاهدة في Gmail' : 'View in Gmail'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-slate-50/20">
                  <div className="prose prose-slate prose-sm leading-relaxed text-xs text-slate-700 space-y-3">
                    <p className="font-semibold text-slate-900 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs leading-relaxed">
                      {selectedEmail.snippet || selectedEmail.summary}
                    </p>
                  </div>
                </CardContent>
              </Card>


              {/* AI Extraction Panel */}

              <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-slate-50 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-indigo-950 text-sm">{isAr ? 'البيانات المستخرجة بالذكاء الاصطناعي' : 'AI Extracted Information'}</h3>
                        <p className="text-[10px] text-indigo-600">{isAr ? 'تحليل تلقائي لرسالة البريد' : 'Automated Email Analysis'}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'دقة التحليل' : 'Confidence'}: {selectedEmail.confidenceScore}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{isAr ? 'الشركة' : 'Company'}</p>
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {selectedEmail.company}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{isAr ? 'المسمى الوظيفي' : 'Position'}</p>
                      <p className="font-bold text-slate-900 text-xs truncate">{selectedEmail.jobTitle}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{isAr ? 'حالة التحديث' : 'Status'}</p>
                      <p className="font-bold text-slate-900 text-xs">{selectedEmail.category}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{isAr ? 'الإجراء المطلوب' : 'Action Required'}</p>
                      <p className="font-bold text-red-600 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {selectedEmail.actionText || (isAr ? 'متابعة' : 'Follow up')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-indigo-200/80 rounded-2xl shadow-xs">
                      <div>
                        <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          {addedSuccess ? (isAr ? 'تمت إضافة الطلب بنجاح إلى متتبعك!' : 'Application Added to Tracker!') : (isAr ? 'تتبع هذا الإشعار' : 'Track Email Notification')}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{isAr ? 'تأكيد إضافة الطلب تلقائياً إلى متتبع الوظائف.' : 'Sync this update directly to your job application pipeline.'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          onClick={handleCreateAppFromEmail}
                          disabled={addedSuccess}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {addedSuccess ? (isAr ? 'تم الإضافة' : 'Added') : (isAr ? 'إضافة إلى الطلبات' : 'Create Application')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

      </div>
      )}
    </div>
  );
}
