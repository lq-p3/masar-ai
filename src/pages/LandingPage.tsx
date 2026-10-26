import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Target, Briefcase, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const { language, setLanguage, dir, t } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100" dir={dir}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">{isAr ? 'مسار' : 'Masar AI'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <span className={language === 'en' ? '' : 'font-normal text-slate-400'}>EN</span>
              <span className="text-slate-300">|</span>
              <span className={language === 'ar' ? '' : 'font-normal text-slate-400'}>العربية</span>
            </button>
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">{t('landing.login')}</Button>
            </Link>
            <Link to="/onboarding">
              <Button>{t('landing.get_started')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4" />
            {isAr ? "مستقبل إدارة المسار المهني" : "The Future of Career Management"}
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6">
            {isAr ? "مسارك المهني في مكان واحد" : "Your AI-Powered Career Command Center"}
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? "يقوم مسار AI بتتبع طلبات التوظيف تلقائيًا، وتحليل رسائل البريد الإلكتروني، وتصنيف حالات الطلبات، وإعدادك للمقابلات الشخصية، وتوفير تحليلات مهنية دقيقة باستخدام الذكاء الاصطناعي."
              : "Masar AI automatically tracks job applications, analyzes recruitment emails, classifies application statuses, prepares you for interviews, and provides career analytics using AI."}
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link to="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 justify-center">
                {isAr ? "ابدأ الآن" : "Get Started"} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 bg-white/50 backdrop-blur-sm justify-center">
              {isAr ? "شاهد كيف يعمل" : "See How It Works"}
            </Button>
          </div>
        </div>

        {/* Dashboard Preview Image/Mockup */}
        <div className="mt-12 sm:mt-20 max-w-6xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="rounded-2xl md:rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden p-1.5 sm:p-2">
            <div className="rounded-xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 overflow-hidden h-[240px] sm:h-[400px] flex items-center justify-center text-slate-400 font-medium text-xs sm:text-base text-center p-4">
              {t('landing.preview_placeholder')}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              {isAr ? "كل ما تحتاجه للنجاح" : "Everything you need to succeed"}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {[
              { icon: Mail, title: t('feat.email'), desc: t('feat.email_desc') },
              { icon: Target, title: t('feat.match'), desc: t('feat.match_desc') },
              { icon: Briefcase, title: t('feat.track'), desc: t('feat.track_desc') },
              { icon: Sparkles, title: t('feat.prep'), desc: t('feat.prep_desc') },
              { icon: BarChart3, title: t('feat.analytics'), desc: t('feat.analytics_desc') },
              { icon: ShieldCheck, title: t('feat.notify'), desc: t('feat.notify_desc') },
            ].map((feature, i) => (
              <div key={i} className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 sm:mb-6">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 sm:mb-16">{isAr ? 'كيف يعمل مسار؟' : 'How Masar Works'}</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
            {[t('step.1'), t('step.2'), t('step.3'), t('step.4'), t('step.5')].map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl mb-4 border border-slate-700">
                    {i + 1}
                  </div>
                  <span className="font-medium text-slate-300">{step}</span>
                </div>
                {i < 4 && <ArrowRight className={cn("hidden md:block w-6 h-6 text-slate-700", dir === 'rtl' ? "rotate-180" : "")} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
      
      {/* Privacy Section */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-slate-900">{t('privacy.title')}</h2>
          <p className="text-slate-600 text-lg">
            {t('privacy.desc')}
          </p>
        </div>
      </section>
    </div>
  );
}
