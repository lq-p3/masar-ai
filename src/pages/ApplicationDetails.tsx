import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApplications } from '../contexts/ApplicationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, Building2, MapPin, Calendar, ExternalLink, Mail, Sparkles, CheckCircle2, AlertTriangle, XCircle, FileEdit, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ApplicationDetails() {
  const { id } = useParams();
  const { applications, setIsAIDrawerOpen, updateApplicationStatus } = useApplications();
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const app = applications.find(a => a.id === id);
  const [note, setNote] = useState(app?.notes || '');
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false);

  if (!app) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12" dir={dir}>
        <Link to="/app/applications" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isAr ? 'العودة إلى متتبع الطلبات' : 'Back to Applications'}</span>
        </Link>
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-800">{isAr ? 'الطلب غير موجود' : 'Application Not Found'}</h2>
          <p className="text-xs text-slate-500">{isAr ? 'لم يتم العثور على هذا الطلب في حسابك.' : 'This job application could not be found.'}</p>
        </div>
      </div>
    );
  }

  const timeline = [
    { stage: t('status.applied'), date: new Date(app.dateApplied).toLocaleDateString(), completed: true },
    { stage: t('status.under_review'), date: app.lastUpdate, completed: app.status !== 'Applied' },
    { stage: t('status.assessment'), date: '-', completed: app.status === 'Assessment' || app.status === 'Interview' || app.status === 'Offer' },
    { stage: t('status.interview'), date: '-', completed: app.status === 'Offer', current: app.status === 'Interview' },
    { stage: t('status.offer'), date: '-', completed: app.status === 'Offer' },
  ];

  const handleSaveNote = () => {
    setSavedNoteSuccess(true);
    setTimeout(() => setSavedNoteSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Top bar back button */}
      <Link to="/app/applications" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{isAr ? 'العودة إلى متتبع الطلبات' : 'Back to Applications'}</span>
      </Link>

      {/* Header Profile Banner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6 bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 end-0 w-64 h-64 bg-indigo-50/70 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md flex items-center justify-center shrink-0 font-bold text-xl sm:text-3xl">
            {app.company.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">{app.title}</h1>
              <Badge status={app.status}>{app.status}</Badge>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mb-3 sm:mb-4">{app.company}</p>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" /> {app.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" /> {isAr ? 'تم التقديم' : 'Applied'} {new Date(app.dateApplied).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" /> {app.source}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 relative z-10 shrink-0 w-full md:w-auto">
          <Button 
            onClick={() => setIsAIDrawerOpen(true)}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs h-10 shadow-md shadow-indigo-200 justify-center"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            {isAr ? 'تحضير للمقابلة مع مسار' : 'Prepare with Masar AI'}
          </Button>
        </div>
      </div>

      {/* Timeline Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-8 overflow-x-auto custom-scrollbar">
          <div className="relative min-w-[480px] sm:min-w-0 py-2">
            <div className="absolute top-5 start-8 end-8 h-0.5 bg-slate-100 -z-10" />
            <div className="absolute top-5 start-8 h-0.5 bg-indigo-500 -z-10 transition-all duration-500" style={{ width: '65%' }} />
            
            <div className="flex justify-between">
              {timeline.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 relative z-10 w-20 sm:w-24">
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors text-xs font-bold",
                    step.completed ? "bg-indigo-600 text-white" : 
                    step.current ? "bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50" : 
                    "bg-slate-100 text-slate-400"
                  )}>
                    {step.completed ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <div className={cn("w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full", step.current ? "bg-indigo-600" : "bg-slate-300")} />}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xs font-bold", step.current ? "text-indigo-950" : step.completed ? "text-slate-700" : "text-slate-400")}>{step.stage}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* AI Match Analysis Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 p-4 sm:p-6 gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                {isAr ? 'تحليل المطابقة الذكي' : 'AI Job Match Analysis'}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                {isAr ? 'نسبة المطابقة' : 'Overall Match'}: {app.matchScore}%
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'المهارات المطلوبة للوظيفة' : 'Skill Matching'}</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Python</Badge>
                  <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Google Cloud</Badge>
                  <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Docker</Badge>
                  <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> REST APIs</Badge>
                  <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Kubernetes</Badge>
                  <Badge variant="danger" className="gap-1.5 py-1 px-3 text-xs"><XCircle className="w-3.5 h-3.5" /> Terraform</Badge>
                </div>
              </div>

              <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-5 space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-950">{isAr ? 'توصية الذكاء الاصطناعي' : 'AI Recommendation'}</h4>
                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                  {isAr 
                    ? 'نسبة ملاءمة عالية جداً. ننصحك بالتركيز على مراجعة مفاهيم الشبكات في Kubernetes قبل التوجه للمقابلة التقنية القادمة.'
                    : 'Strong match. Focus on reviewing Kubernetes networking concepts before your technical interview.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Emails */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Mail className="w-5 h-5 text-indigo-600" />
                {isAr ? 'الرسائل المتعلقة بالطلب' : 'Related Emails'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-200 hover:bg-slate-50 transition-colors cursor-pointer space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{isAr ? 'دعوة مقابلة تقنية' : 'Technical Interview Invitation'}</h4>
                    <p className="text-[11px] text-slate-400">From: careers@{app.company.toLowerCase()}.com</p>
                  </div>
                  <span className="text-[10px] text-slate-400">Aug 7, 08:30 AM</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {isAr 
                    ? `يسرنا دعوتك لحضور المقابلة التقنية لوظيفة ${app.title} في شركة ${app.company}. يرجى تزويدنا بالأوقات المناسبة...`
                    : `We would like to invite you to a technical interview for the ${app.title} position at ${app.company}. Please let us know your availability...`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">{isAr ? 'الملاحظات' : 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                placeholder={isAr ? 'أضف ملاحظاتك حول الوظيفة والمقابلين...' : 'Add notes about this application...'}
              />
              <Button 
                onClick={handleSaveNote}
                className="w-full font-bold text-xs h-9 bg-indigo-600 hover:bg-indigo-700"
              >
                {savedNoteSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ الملاحظة' : 'Save Note')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">{isAr ? 'السيرة الذاتية المستخدمة' : 'Resume Used'}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cloud_Engineer_CV.pdf</h4>
                  <p className="text-[10px] text-slate-400">Uploaded Jul 28</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><ExternalLink className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
