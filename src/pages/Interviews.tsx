import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Video, Clock, Sparkles, Building, ChevronRight, CheckCircle2, UserRoundCheck, Bot } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApplications } from '../contexts/ApplicationContext';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { STARInterviewModal } from '../components/ui/STARInterviewModal';

import { normalizeStatus } from '../lib/statusHelper';

export default function Interviews() {
  const { dir } = useLanguage();
  const { applications, setIsAIDrawerOpen } = useApplications();
  const isAr = dir === 'rtl';

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedInterview, setSelectedInterview] = useState<string | number | null>(null);
  const [isStarModalOpen, setIsStarModalOpen] = useState(false);

  // Derive interviews dynamically from user's real applications matching Interview or Assessment status
  const interviewApplications = applications.filter(a => {
    const s = normalizeStatus(a.status);
    return s === 'Interview' || s === 'Assessment';
  });

  
  const interviews = interviewApplications.map((app) => ({
    id: app.id,
    company: app.company,
    role: app.title,
    type: app.status === 'Assessment' ? 'Technical Assessment' : 'Interview',
    date: new Date(app.dateApplied).toLocaleDateString(),
    time: '10:00 AM',
    location: app.location || 'Online',
    status: 'upcoming' as const
  }));

  const currentSelectedId = selectedInterview || interviews[0]?.id;
  const filteredInterviews = interviews.filter(i => i.status === activeTab);
  const activeInterviewData = interviews.find(i => i.id === currentSelectedId);


  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserRoundCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            {isAr ? 'المقابلات والتحضير' : 'Interviews & Prep'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {isAr ? 'إدارة المقابلات القادمة والتدريب التفاعلي مع مدرب مسار الذكي.' : 'Manage upcoming interviews and practice with AI.'}
          </p>
        </div>

        <Button 
          onClick={() => setIsStarModalOpen(true)}
          className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs sm:text-sm h-10 sm:h-11 shadow-md shadow-indigo-200 justify-center shrink-0"
        >
          <Bot className="w-4 h-4 text-indigo-200" />
          <span>{isAr ? 'بدء محاكي المقابلات (STAR)' : 'Start AI Mock Interview'}</span>
        </Button>
      </div>

      {interviews.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center space-y-4 border-slate-200 shadow-sm">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
            <UserRoundCheck className="w-6 sm:w-7 h-6 sm:h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isAr ? 'لا توجد مقابلات مجدولة حالياً' : 'No Scheduled Interviews'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr 
                ? 'عند تحديث حالة أحد طلباتك الجارية إلى "مقابلة" أو "اختبار"، ستظهر تلقائياً هنا مع أدوات التحضير التفاعلية والأسئلة المتوقعة والتدريب بأسلوب STAR.'
                : 'When an application status changes to Interview or Assessment, it will automatically appear here with AI preparation tools.'}
            </p>
          </div>
          <Button 
            onClick={() => setIsStarModalOpen(true)}
            className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-sm justify-center"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>{isAr ? 'تجربة محاكي المقابلات (STAR)' : 'Try STAR Interview Simulator'}</span>
          </Button>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Interview List */}
        <Card className="border-slate-200 shadow-sm flex flex-col lg:col-span-1">
          <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
            <button 
              className={cn("text-xs font-bold pb-2 border-b-2 transition-colors", activeTab === 'upcoming' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('upcoming')}
            >
              {isAr ? 'المقابلات القادمة' : 'Upcoming'}
            </button>
            <button 
              className={cn("text-xs font-bold pb-2 border-b-2 transition-colors", activeTab === 'past' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('past')}
            >
              {isAr ? 'المقابلات السابقة' : 'Past'}
            </button>
          </div>

          <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar">
            {filteredInterviews.map((interview) => (
              <div 
                key={interview.id} 
                onClick={() => setSelectedInterview(interview.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all space-y-2",
                  selectedInterview === interview.id 
                    ? "border-indigo-600 bg-indigo-50/40 shadow-xs" 
                    : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 text-sm">{interview.company}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{interview.type}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700">{interview.role}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {interview.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {interview.time}</span>
                </div>
              </div>
            ))}
            {filteredInterviews.length === 0 && (
              <div className="text-center py-12 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                  <UserRoundCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'لا توجد مقابلات حقيقية مضافة' : 'No Active Interviews'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {isAr ? 'عند تحديث حالة أحد طلباتك الحقيقية إلى "مقابلة" أو "اختبار"، ستظهر تلقائياً هنا مع ميزّات التحضير الإستراتيجي.' : 'When your application status changes to Interview or Assessment, it will appear here.'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: AI Preparation */}
        <Card className="border-slate-200 shadow-sm flex flex-col lg:col-span-2 space-y-6">
          {activeInterviewData ? (
            <>
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 rounded-t-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">{activeInterviewData.type}</span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {activeInterviewData.location}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeInterviewData.company}</h2>
                  <p className="text-xs text-slate-600 font-semibold">{activeInterviewData.role}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Link to="/app/applications/1">
                    <Button variant="outline" size="sm" className="text-xs h-9">{isAr ? 'عرض الطلب' : 'View Application'}</Button>
                  </Link>
                  <Button 
                    onClick={() => setIsStarModalOpen(true)}
                    size="sm" 
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs h-9 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    {isAr ? 'بدء مقابلة تجريبية' : 'Start Mock Interview'}
                  </Button>
                </div>
              </div>
              
              <div className="p-6 pt-0 space-y-6">
                <div className="flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base">{isAr ? 'تحضير الذكاء الاصطناعي للمقابلة' : 'AI Interview Preparation'}</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                      <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">{isAr ? 'أهم المهارات للمراجعة' : 'Top Skills to Review'}</h4>
                      <ul className="space-y-2">
                        {['Kubernetes Architecture', 'CI/CD Pipelines (Jenkins, GitLab CI)', 'AWS/GCP Networking', 'Terraform & IaC'].map((skill, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-semibold text-indigo-800">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">{isAr ? 'أسئلة تقنية متوقعة' : 'Likely Technical Questions'}</h4>
                      <div className="space-y-2">
                        {[
                          isAr ? 'كيف تقوم بتأمين عناقيد Kubernetes في بيئة إنتاجية؟' : 'Explain how you would secure a Kubernetes cluster.',
                          isAr ? 'كيف تدير حالات البنية التحتية باستخدام Terraform؟' : 'How do you handle state in Terraform?',
                          isAr ? 'اذكر موقفاً حللت فيه مشكلة معقدة في أتمتة الـ CI/CD.' : 'Describe a time you resolved a complex CI/CD failure.'
                        ].map((q, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 leading-relaxed">
                            <span className="font-bold text-indigo-600 me-2">Q{i+1}:</span>
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">{isAr ? 'خبرات سابقة من سيرتك الذاتية' : 'Relevant Resume Experience'}</h4>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex gap-3 items-start">
                          <Building className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800 text-xs">DevOps Engineer @ TechCorp</p>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {isAr 
                                ? 'تحليل مسار: خبرتك في ترحيل التطبيقات نحو GKE متوافقة جداً مع خطط التحول السحابي لشركة STC.'
                                : 'AI highlights: Your experience migrating monolithic apps to GKE is highly relevant for STC goals.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">{isAr ? 'أسئلة لتطرحها على المقابلين' : 'Questions to Ask Them'}</h4>
                      <ul className="space-y-2 text-xs text-slate-600 font-medium">
                        <li className="flex items-center gap-2">
                          <ChevronRight className={cn("w-3.5 h-3.5 text-indigo-600", isAr ? "rotate-180" : "")} />
                          {isAr ? 'ما هو الحجم الحالي للبنية التحتية السحابية لديكم؟' : 'What is the current scale of your cloud infrastructure?'}
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight className={cn("w-3.5 h-3.5 text-indigo-600", isAr ? "rotate-180" : "")} />
                          {isAr ? 'كيف يتم تنظيم مناوبات الدعم الفني (On-call rotations)؟' : 'How does the team handle on-call rotations?'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 text-xs">
              {isAr ? 'اختر مقابلة لعرض تفاصيل التحضير.' : 'Select an interview to view preparation details.'}
            </div>
          )}
        </Card>
      </div>
      )}

      {/* STAR Interview Modal */}
      <STARInterviewModal 
        isOpen={isStarModalOpen}
        onClose={() => setIsStarModalOpen(false)}
        company={activeInterviewData?.company || 'STC'}
        role={activeInterviewData?.role || 'Cloud Engineer'}
      />
    </div>
  );
}
