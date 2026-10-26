import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { Upload, CheckCircle2, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import * as api from '../services/api';

const tracksAr = [
  'هندسة السحاب (Cloud)', 'هندسة البرمجيات', 'Full Stack', 
  'الذكاء الاصطناعي', 'الأمن السيبراني', 'تحليل البيانات', 'DevOps', 'الدعم الفني'
];

const tracksEn = [
  'Cloud Engineering', 'Software Engineering', 'Full Stack', 
  'AI / Machine Learning', 'Cybersecurity', 'Data', 'DevOps', 'IT Support'
];

export default function Onboarding() {
  const { dir } = useLanguage();
  const isAr = dir === 'rtl';
  const tracks = isAr ? tracksAr : tracksEn;

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResume(true);
    setResumeError(null);
    try {
      await api.uploadResume(file);
      setUploadedResumeName(file.name);
    } catch (err) {
      console.error('Failed to upload resume during onboarding:', err);
      setResumeError(isAr ? 'فشل رفع السيرة الذاتية. يرجى التأكد من الحجم والصيغة.' : 'Failed to upload resume. Please check file format and size.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const url = await api.getGmailConnectUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Failed to initiate Gmail OAuth in onboarding:', err);
    }
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSaving(true);
      try {
        await api.updateCurrentUserProfile({
          displayName: fullName || undefined,
          currentJobTitle: jobTitle || undefined,
          location: location || undefined,
          careerTracks: selectedTracks,
          onboardingCompleted: true
        });
      } catch (err) {
        console.warn('Failed to save profile during onboarding:', err);
      } finally {
        setIsSaving(false);
        navigate('/app');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-3.5 sm:p-6 py-8" dir={dir}>
      
      {/* Stepper Header in LTR for visual consistency */}
      <div className="w-full max-w-2xl mb-6 sm:mb-8 flex justify-between items-center relative px-2" dir="ltr">
        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-2 h-0.5 bg-indigo-600 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${step >= i ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-400'}`}>
            {step > i ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : i}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-2xl shadow-xl shadow-slate-200/50 border-slate-200 overflow-hidden">
        <CardContent className="p-4 sm:p-8 md:p-10">
          
          {step === 1 && (
            <div className="space-y-5 sm:space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                  {isAr ? 'أهلاً بك في مسار AI' : 'Welcome to Masar AI'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {isAr ? 'دعنا نُعد ملفك المهني للبدء بتتبع الوظائف.' : "Let's set up your career profile."}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm" 
                    placeholder={isAr ? 'محمد الدوسري' : 'Mohammed Al-Dosari'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isAr ? 'المسمى الوظيفي الحالي' : 'Current Job Title'}
                  </label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm" 
                    placeholder={isAr ? 'مهندس برمجيات' : 'Software Engineer'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isAr ? 'المدينة / الموقع' : 'Location'}
                  </label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm" 
                    placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {isAr ? 'المسارات المهنية' : 'Career Tracks'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isAr ? 'اختر المجالات والمسارات المهنية المستهدفة.' : 'Select the areas you are interested in applying for.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {tracks.map(track => (
                  <button
                    key={track}
                    onClick={() => {
                      if (selectedTracks.includes(track)) setSelectedTracks(selectedTracks.filter(t => t !== track));
                      else setSelectedTracks([...selectedTracks, track]);
                    }}
                    className={`p-4 rounded-xl border text-sm font-semibold transition-all ${selectedTracks.includes(track) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {isAr ? 'رفع السيرة الذاتية' : 'Upload Resume'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isAr ? 'سنستخدم سيرتك الذاتية لمطابقة الوظائف والتحضير للمقابلات بالذكاء الاصطناعي.' : "We'll use this to match you with jobs and prepare for interviews."}
                </p>
              </div>
              
              <label className="border-2 border-dashed border-slate-200 rounded-3xl p-10 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer flex flex-col items-center justify-center block relative">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeFileChange}
                  className="hidden" 
                  disabled={isUploadingResume}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  {isUploadingResume ? <Loader2 className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                  {uploadedResumeName ? uploadedResumeName : (isAr ? 'اضغط لرفع السيرة الذاتية أو اسحب الملف هنا' : 'Click to upload or drag and drop')}
                </h3>
                <p className="text-xs text-slate-500 mb-4">PDF or DOCX (Max 5MB)</p>
                <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                  {isAr ? 'تصفح الملفات' : 'Browse Files'}
                </Button>
              </label>

              {resumeError && (
                <p className="text-xs text-red-600 font-medium">{resumeError}</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {isAr ? 'ربط حساب Gmail' : 'Connect Gmail'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isAr ? 'دع مسار AI يتتبع رسائل التوظيف وتحديثات الطلبات تلقائياً.' : 'Let Masar AI automatically detect and track recruitment emails.'}
                </p>
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 mb-8">
                <Mail className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="font-semibold text-indigo-900 mb-2 text-sm">
                  {isAr ? 'آمن ومشفّر وخاص' : 'Secure & Private'}
                </h3>
                <p className="text-xs text-indigo-700 mb-6 leading-relaxed">
                  {isAr 
                    ? 'يحلل مسار AI رسائل البريد المتعلقة بالتوظيف لمساعدتك في تتبع الطلبات وتحديث الحالات. بياناتك مشفّرة ولا يتم مشاركتها.'
                    : 'Masar AI analyzes recruitment-related emails to help track your applications. Your data is encrypted and never shared.'}
                </p>
                <Button onClick={handleConnectGmail} className="w-full gap-2 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 text-xs font-bold h-11">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                  </svg>
                  {isAr ? 'الربط بحساب Google' : 'Connect with Google'}
                </Button>
              </div>
              <button onClick={handleNext} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                {isAr ? 'تخطي الآن' : 'Skip for now'}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={step === 1 ? 'invisible text-xs font-bold' : 'text-xs font-bold'}
            >
              {isAr ? 'السابق' : 'Back'}
            </Button>
            <Button onClick={handleNext} disabled={isSaving} className="gap-2 px-8 text-xs font-bold h-10">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 4 ? (isAr ? 'الانتقال للوحة التحكم' : 'Go to Dashboard') : (isAr ? 'الخطوة التالية' : 'Next Step')} 
              {step !== 4 && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

