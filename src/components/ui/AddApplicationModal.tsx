import React, { useState } from 'react';
import { useApplications } from '../../contexts/ApplicationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ApplicationStatus } from '../../types';
import { Button } from './Button';
import { X, Briefcase, Building2, MapPin, Sparkles, Loader2, LogIn } from 'lucide-react';

const statuses: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected'
];

export function AddApplicationModal() {
  const { isAddModalOpen, setIsAddModalOpen, addApplication } = useApplications();
  const { user } = useAuth();
  const { t, dir } = useLanguage();

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Riyadh, SA');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [source, setSource] = useState('LinkedIn');
  const [matchScore, setMatchScore] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isAddModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;

    if (!user) {
      setSubmitError(dir === 'rtl' ? 'يرجى تسجيل الدخول أولاً لربط وحفظ الطلبات بحسابك في مسار AI.' : 'Please sign in first to attach and save job applications.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const parsedScore = matchScore.trim() !== '' ? Number(matchScore) : undefined;

    try {
      await addApplication({
        company: company.trim(),
        title: title.trim(),
        location: location.trim(),
        status,
        source: source.trim(),
        ...(parsedScore !== undefined && !isNaN(parsedScore) ? { matchScore: parsedScore } : {})
      });

      // Reset and close modal ONLY after backend confirms successful creation
      setCompany('');
      setTitle('');
      setLocation('Riyadh, SA');
      setStatus('Applied');
      setSource('LinkedIn');
      setMatchScore('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating application on server:', err);
      const msg = (err as Error)?.message || 'فشل في حفظ طلب الوظيفة. يرجى المحاولة مرة أخرى.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200" dir={dir}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('modal.add_title')}</h2>
              <p className="text-xs text-slate-500">{t('dash.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {!user && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs space-y-2">
              <p className="font-semibold">
                {dir === 'rtl' ? '⚠️ أنت تتصفح كزائر. لتخزين الوظائف بشكل دائم في Firestore وضمان عدم اختفائها عند التحديث، يرجى تسجيل الدخول أولاً.' : '⚠️ You are browsing as a guest. Please sign in to save job applications permanently to Firestore.'}
              </p>
              <a 
                href="/auth" 
                className="inline-flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-amber-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{dir === 'rtl' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
              </a>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('modal.company')} *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. STC, Elm, Aramco"
                className="w-full h-11 ps-9 pe-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('modal.job_title')} *
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Cloud Engineer"
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('modal.location')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 sm:h-11 ps-9 pe-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('modal.status')}
              </label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-10 sm:h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('modal.source')}
              </label>
              <input 
                type="text" 
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g. LinkedIn, Bayt, Direct"
                className="w-full h-10 sm:h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('modal.match_score')}
              </label>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={matchScore}
                onChange={e => setMatchScore(e.target.value)}
                placeholder="e.g. 85 (Optional)"
                className="w-full h-10 sm:h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
              {submitError}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              {t('modal.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t('modal.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
