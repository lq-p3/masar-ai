import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.applications': 'Applications',
    'nav.jobs': 'Job Discovery',
    'nav.inbox': 'Inbox Intelligence',
    'nav.matches': 'Job Matches',
    'nav.interviews': 'Interview Prep',
    'nav.tasks': 'Tasks',
    'nav.resumes': 'Resumes',
    'nav.analytics': 'Analytics',
    'nav.skills': 'Skill Gap',
    'nav.assistant': 'AI Career Assistant',
    'nav.settings': 'Settings',
    
    'sidebar.ai_assistant': 'AI Assistant',
    'sidebar.ai_msg': 'Cloud Engineer interview in 2 days. Ready to practice?',
    'sidebar.ai_btn': 'Start Mock Interview',
    'sidebar.new': 'NEW',

    'topbar.search': 'Search applications, companies, or tasks...',

    'dash.welcome': 'Welcome back',
    'dash.greeting_morning': 'Good morning ☀️',
    'dash.greeting_afternoon': 'Good afternoon 🌤️',
    'dash.greeting_evening': 'Good evening 🌙',
    'dash.subtitle': "Here is what's happening with your job search today.",
    'dash.total_apps': 'Total Applications',
    'dash.interviews': 'Interviews',
    'dash.offers': 'Offers Received',
    'dash.match': 'Match Quality',
    'dash.avg_match': 'Avg Match Score',
    'dash.conversion_rate': 'Interview Conversion Rate',
    'dash.pending': 'Pending',
    'dash.stable': 'Stable',
    'dash.add_app': 'Add Application',
    'dash.sync_gmail': 'Sync Gmail',
    
    'dash.pipeline': 'Application Pipeline',
    'dash.pipeline_desc': 'Real-time breakdown across application stages',
    'dash.monthly_trend': 'Monthly Volume & Interviews',
    'dash.monthly_desc': 'Applications submitted vs interviews landed',
    'dash.live': '(Live from Inbox)',
    'dash.view_all': 'View All Applications',
    'dash.jobs': 'Jobs',
    
    'dash.recent': 'Recent Intelligence',
    'dash.syncing': 'Syncing Gmail...',
    'dash.invite': 'Interview Invite',
    'dash.status_update': 'Status Update',
    'dash.rejection': 'Rejection',
    
    'dash.insights': 'AI Career Insights',
    'dash.market': 'Market Alignment Analysis',
    'dash.market_text': 'Your Cloud Engineering applications have a 31% interview rate, which is 18% higher than your Full Stack roles. Focus on Cloud for maximum ROI.',
    
    'dash.next_actions': 'Next Action Checklist',
    'dash.today': 'TODAY',
    'dash.add_task': 'Add Task',
    'dash.task_placeholder': 'Enter new task...',

    'apps.title': 'Applications Tracker',
    'apps.subtitle': 'Track and manage your job search pipeline across all stages.',
    'apps.kanban': 'Kanban Board',
    'apps.table': 'Table View',
    'apps.search': 'Filter applications...',
    'apps.filter_all': 'All Stages',
    
    'table.company': 'Company',
    'table.role': 'Position',
    'table.status': 'Status',
    'table.location': 'Location',
    'table.applied_date': 'Applied',
    'table.match': 'Match Score',
    'table.source': 'Source',
    'table.actions': 'Actions',
    'table.empty': 'No job applications found matching filter.',

    'modal.add_title': 'Add New Job Application',
    'modal.company': 'Company Name',
    'modal.job_title': 'Job Title',
    'modal.location': 'Location',
    'modal.status': 'Application Status',
    'modal.source': 'Application Source',
    'modal.match_score': 'Estimated Match Score (%)',
    'modal.cancel': 'Cancel',
    'modal.save': 'Save Application',

    'drawer.title': 'Masar AI Assistant',
    'drawer.subtitle': 'Your AI career coach & interview copilot',
    'drawer.placeholder': 'Ask Masar AI anything about your applications...',
    'drawer.send': 'Send',
    'drawer.prompt1': 'How can I prepare for my upcoming STC interview?',
    'drawer.prompt2': 'Analyze my resume ATS score for Cloud Engineer',
    'drawer.prompt3': 'How should I follow up on Elm application?',
    
    'landing.login': 'Log In',
    'landing.get_started': 'Get Started',
    'landing.preview_placeholder': 'Dashboard Visual Preview',
    
    'feat.email': 'Automatic Email Tracking',
    'feat.email_desc': 'Connect Gmail and let AI extract application updates automatically.',
    'feat.match': 'AI Job Matching',
    'feat.match_desc': 'See exactly how well your skills match job descriptions.',
    'feat.track': 'Application Tracking',
    'feat.track_desc': 'Manage your entire pipeline from applied to offer.',
    'feat.prep': 'Interview Preparation',
    'feat.prep_desc': 'Practice with an AI coach tailored to the specific role and company.',
    'feat.analytics': 'Career Analytics',
    'feat.analytics_desc': 'Understand your application success rates and skill gaps.',
    'feat.notify': 'Smart Notifications',
    'feat.notify_desc': 'Never miss an assessment deadline or interview.',
    
    'step.1': 'Connect Email',
    'step.2': 'Detect Jobs',
    'step.3': 'Analyze AI',
    'step.4': 'Update Status',
    'step.5': 'Prepare Interview',
    
    'privacy.title': 'Secure & Private',
    'privacy.desc': 'We use secure Google OAuth with limited read-only permissions. Masar AI only scans and analyzes emails related to recruitment and job applications. Your data is encrypted and never shared.',

    'status.saved': 'Saved',
    'status.applied': 'Applied',
    'status.under_review': 'Under Review',
    'status.shortlisted': 'Shortlisted',
    'status.assessment': 'Assessment',
    'status.interviewing': 'Interviewing',
    'status.interview': 'Interview',
    'status.offer': 'Offers',
    'status.rejected': 'Rejected',
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.applications': 'الطلبات',
    'nav.jobs': 'الوظائف المقترحة',
    'nav.inbox': 'البريد الذكي',
    'nav.matches': 'الوظائف المطابقة',
    'nav.interviews': 'المقابلات',
    'nav.tasks': 'المهام',
    'nav.resumes': 'السير الذاتية',
    'nav.analytics': 'التحليلات',
    'nav.skills': 'فجوة المهارات',
    'nav.assistant': 'المساعد المهني',
    'nav.settings': 'الإعدادات',
    
    'sidebar.ai_assistant': 'المساعد الذكي',
    'sidebar.ai_msg': 'مقابلة مهندس سحابي خلال يومين. هل أنت مستعد للتدريب؟',
    'sidebar.ai_btn': 'ابدأ المقابلة التجريبية',
    'sidebar.new': 'جديد',

    'topbar.search': 'ابحث عن الطلبات، الشركات، أو المهام...',

    'dash.welcome': 'مرحباً بعودتك',
    'dash.greeting_morning': 'صباح الخير ☀️',
    'dash.greeting_afternoon': 'مساء الخير 🌤️',
    'dash.greeting_evening': 'مساء الخير 🌙',
    'dash.subtitle': 'إليك تحديثات رحلة بحثك عن عمل اليوم.',
    'dash.total_apps': 'إجمالي الطلبات',
    'dash.interviews': 'المقابلات',
    'dash.offers': 'العروض الوظيفية',
    'dash.match': 'جودة المطابقة',
    'dash.avg_match': 'متوسط نسبة المطابقة',
    'dash.conversion_rate': 'معدل التحويل للمقابلات',
    'dash.pending': 'قيد الانتظار',
    'dash.stable': 'مستقر',
    'dash.add_app': 'إضافة طلب وظيفة',
    'dash.sync_gmail': 'مزامنة البريد',
    
    'dash.pipeline': 'مسار الطلبات',
    'dash.pipeline_desc': 'توزيع تفصيلي حي لحالات التقديم',
    'dash.monthly_trend': 'الحجم الشهري والمقابلات',
    'dash.monthly_desc': 'مقارنة الطلبات المقدمة بالمقابلات المستلمة',
    'dash.live': '(مباشر من البريد)',
    'dash.view_all': 'عرض كل الطلبات',
    'dash.jobs': 'وظائف',
    
    'dash.recent': 'أحدث التحديثات',
    'dash.syncing': 'مزامنة البريد...',
    'dash.invite': 'دعوة مقابلة',
    'dash.status_update': 'تحديث حالة',
    'dash.rejection': 'مرفوض',
    
    'dash.insights': 'رؤى مهنية ذكية',
    'dash.market': 'تحليل مواءمة السوق',
    'dash.market_text': 'معدل المقابلات لطلباتك في الهندسة السحابية هو 31٪، وهو أعلى بـ 18٪ من أدوار Full Stack. ركز على السحابة للحصول على أفضل النتائج.',
    
    'dash.next_actions': 'قائمة الخطوات القادمة',
    'dash.today': 'اليوم',
    'dash.add_task': 'إضافة مهمة',
    'dash.task_placeholder': 'أدخل المهمة الجديدة...',

    'apps.title': 'متتبع طلبات الوظائف',
    'apps.subtitle': 'تتبع وإدارة مراحل تقديمك للوظائف عبر مختلف المراحل.',
    'apps.kanban': 'لوحة كانبان',
    'apps.table': 'عرض الجدول',
    'apps.search': 'تصفية الطلبات...',
    'apps.filter_all': 'جميع المراحل',

    'table.company': 'الشركة',
    'table.role': 'الوظيفة',
    'table.status': 'الحالة',
    'table.location': 'الموقع',
    'table.applied_date': 'تاريخ التقديم',
    'table.match': 'نسبة التوافق',
    'table.source': 'المصدر',
    'table.actions': 'الإجراءات',
    'table.empty': 'لم يتم العثور على طلبات وظائف مطابقة للتصفية.',

    'modal.add_title': 'إضافة طلب وظيفة جديد',
    'modal.company': 'اسم الشركة',
    'modal.job_title': 'المسمى الوظيفي',
    'modal.location': 'الموقع الجغرافي',
    'modal.status': 'حالة الطلب',
    'modal.source': 'مصدر التقديم',
    'modal.match_score': 'نسبة المطابقة المتوقعة (%)',
    'modal.cancel': 'إلغاء',
    'modal.save': 'حفظ الطلب',

    'drawer.title': 'مساعد مسار الذكي',
    'drawer.subtitle': 'مدربك المهني المساعد في المقابلات',
    'drawer.placeholder': 'اسأل مسار أي شيء بخصوص طلباتك...',
    'drawer.send': 'إرسال',
    'drawer.prompt1': 'كيف أستعد لمقابلتي القادمة في شركة STC؟',
    'drawer.prompt2': 'حلل نسبة ملاءمة سري الذاتية لوظيفة Cloud Engineer',
    'drawer.prompt3': 'كيف أتابع حالة طلبي في شركة علم؟',

    'landing.login': 'تسجيل الدخول',
    'landing.get_started': 'ابدأ الآن',
    'landing.preview_placeholder': 'معاينة مرئية للوحة التحكم',
    
    'feat.email': 'تتبع البريد التلقائي',
    'feat.email_desc': 'اربط حساب Gmail ودع الذكاء الاصطناعي يستخرج تحديثات الطلبات تلقائيًا.',
    'feat.match': 'مطابقة الوظائف بالذكاء الاصطناعي',
    'feat.match_desc': 'شاهد مدى توافق مهاراتك مع متطلبات الوظيفة بدقة.',
    'feat.track': 'تتبع الطلبات',
    'feat.track_desc': 'أدر مسار طلباتك بالكامل من التقديم حتى العرض الوظيفي.',
    'feat.prep': 'التحضير للمقابلات',
    'feat.prep_desc': 'تدرب مع مدرب ذكاء اصطناعي مخصص لدورك والشركة.',
    'feat.analytics': 'تحليلات مهنية',
    'feat.analytics_desc': 'افهم معدلات نجاح طلباتك واكتشف فجوات المهارات لديك.',
    'feat.notify': 'إشعارات ذكية',
    'feat.notify_desc': 'لا تفوت أي موعد نهائي لتقييم أو مقابلة.',
    
    'step.1': 'ربط البريد',
    'step.2': 'اكتشاف الوظائف',
    'step.3': 'تحليل ذكي',
    'step.4': 'تحديث الحالة',
    'step.5': 'تحضير للمقابلة',
    
    'privacy.title': 'آمن وخاص',
    'privacy.desc': 'نستخدم مصادقة Google الآمنة بصلاحيات قراءة محدودة فقط. يقوم مسار بالبحث وتحليل رسائل البريد المتعلقة بالتوظيف فقط. بياناتك مشفرة ولا يتم مشاركتها أبداً.',

    'status.saved': 'محفوظ',
    'status.applied': 'مُقدم',
    'status.under_review': 'قيد المراجعة',
    'status.shortlisted': 'القائمة المختصرة',
    'status.assessment': 'تقييم',
    'status.interviewing': 'مقابلات',
    'status.interview': 'مقابلة',
    'status.offer': 'عروض',
    'status.rejected': 'مرفوض',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('masar_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('masar_language', language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
