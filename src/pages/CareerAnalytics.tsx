import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Sparkles, TrendingUp, BarChart as BarChartIcon, Target, Send, ArrowRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useApplications } from '../contexts/ApplicationContext';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { calculateApplicationStats } from '../lib/statusHelper';

const COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#94a3b8'];

export default function CareerAnalytics() {
  const { dir } = useLanguage();
  const { applications, setIsAIDrawerOpen } = useApplications();
  const isAr = dir === 'rtl';

  // Canonical calculations from authenticated user applications
  const stats = calculateApplicationStats(applications);
  const totalAppsCount = stats.total;
  const interviewsCount = stats.interview;
  const offersCount = stats.offer;
  const rejectionsCount = stats.rejected;

  const appToInterviewRate = stats.appToInterviewRate;
  const interviewToOfferRate = stats.interviewToOfferRate;
  const rejectionRate = stats.rejectionRate;

  // Track distribution dynamically derived from real user applications
  const sourceCounts: Record<string, number> = {};
  applications.forEach(a => {
    const key = a.source || 'Direct Apply';
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  });

  const trackData = Object.keys(sourceCounts).length > 0
    ? Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))
    : [
        { name: isAr ? 'تقديم مباشر' : 'Direct Apply', value: totalAppsCount > 0 ? totalAppsCount : 1 }
      ];

  // Dynamic monthly activity calculated strictly from real user applications
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts: Record<string, { apps: number; interviews: number }> = {};
  
  applications.forEach(app => {
    const d = new Date(app.dateApplied);
    const monthKey = monthNames[d.getMonth()] || 'Aug';
    if (!monthlyCounts[monthKey]) {
      monthlyCounts[monthKey] = { apps: 0, interviews: 0 };
    }
    monthlyCounts[monthKey].apps++;
    if (app.status === 'Interview') {
      monthlyCounts[monthKey].interviews++;
    }
  });

  const chartData = Object.keys(monthlyCounts).length > 0
    ? Object.entries(monthlyCounts).map(([name, data]) => ({ name, apps: data.apps, interviews: data.interviews }))
    : [
        { name: isAr ? 'الشهر الحالي' : 'Current Month', apps: totalAppsCount, interviews: interviewsCount }
      ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl border border-indigo-900/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{isAr ? 'التحليلات ومسار رحلة التوظيف' : 'Analytics & Career Pipeline'}</h1>
          <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 sm:mt-1">{isAr ? 'تحليلات بصرية دقيقة لمعدلات تحويل طلبات التوظيف ونتائج المقابلات في مسار AI.' : 'Deep visual insights into your job application conversions & interview metrics.'}</p>
        </div>

        <Button 
          onClick={() => setIsAIDrawerOpen(true)}
          className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 sm:h-11 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 shrink-0 justify-center text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{isAr ? 'طلب استشارة من مسار AI' : 'Consult Masar AI'}</span>
        </Button>
      </div>


      {/* Top Conversion Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: isAr ? 'التقديم ← مقابلة' : 'App → Interview', value: `${appToInterviewRate}%`, desc: 'Conversion rate' },
          { label: isAr ? 'المقابلة ← عرض' : 'Interview → Offer', value: `${interviewToOfferRate}%`, desc: 'Conversion rate' },
          { label: isAr ? 'معدل الرفض' : 'Rejection Rate', value: `${rejectionRate}%`, desc: 'Overall' },
          { label: isAr ? 'إجمالي الطلبات' : 'Total Applications', value: `${totalAppsCount}`, desc: 'Tracked in Firestore' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 sm:p-5 border-slate-200 shadow-sm">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">{stat.desc}</p>
          </Card>
        ))}
      </div>

      {/* Interactive Recruitment Pipeline Flowchart Diagram */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 sm:pb-4 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
            <Target className="w-5 h-5 text-indigo-600 shrink-0" />
            {isAr ? 'مخطط سير التقديمات والمسار الوظيفي (Recruitment Pipeline Flowchart)' : 'Recruitment Pipeline Flowchart'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 relative">
            {[
              {
                stage: isAr ? '1. تقديم طلب' : '1. Applied',
                count: stats.applied,
                color: 'from-blue-600 to-indigo-600',
                badge: totalAppsCount > 0 ? `${Math.round((stats.applied / totalAppsCount) * 100)}%` : '0%',
                icon: '📝'
              },
              {
                stage: isAr ? '2. قيد المراجعة' : '2. Under Review',
                count: stats.underReview + stats.shortlisted,
                color: 'from-indigo-600 to-violet-600',
                badge: totalAppsCount > 0 ? `${Math.round(((stats.underReview + stats.shortlisted) / totalAppsCount) * 100)}%` : '0%',
                icon: '👀'
              },
              {
                stage: isAr ? '3. اختبار فني' : '3. Assessment',
                count: stats.assessment,
                color: 'from-amber-500 to-orange-600',
                badge: totalAppsCount > 0 ? `${Math.round((stats.assessment / totalAppsCount) * 100)}%` : '0%',
                icon: '⚡'
              },
              {
                stage: isAr ? '4. مقابلة شفهية' : '4. Interview',
                count: stats.interview,
                color: 'from-purple-600 to-pink-600',
                badge: `${appToInterviewRate}%`,
                icon: '🎙️'
              },
              {
                stage: isAr ? '5. عرض وظيفي' : '5. Job Offer',
                count: stats.offer,
                color: 'from-emerald-500 to-teal-600',
                badge: `${interviewToOfferRate}%`,
                icon: '🎉'
              }
            ].map((step, idx) => (

              <div key={idx} className="relative group">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{step.icon}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {step.badge}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{step.stage}</h4>
                    <p className="text-lg font-black text-indigo-600 mt-0.5">{step.count} <span className="text-[10px] font-medium text-slate-400">{isAr ? 'طلب' : 'roles'}</span></p>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full bg-gradient-to-r", step.color)} 
                      style={{ width: step.badge.includes('%') ? step.badge : '50%' }}
                    />
                  </div>
                </div>
                
                {idx < 4 && (
                  <div className="hidden lg:flex absolute -end-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-400">
                    <ArrowRight className={cn("w-3 h-3", isAr ? "rotate-180" : "")} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* AI Insight */}
      <Card className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white border-indigo-800 shadow-md">
        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">{isAr ? 'تحليل الأداء بالذكاء الاصطناعي' : 'AI Performance Analysis'}</h3>
              <p className="text-indigo-200 text-xs leading-relaxed">
                {totalAppsCount > 0 ? (
                  isAr 
                    ? `لديك ${totalAppsCount} طلب وظيفي مسجل حالياً بنسبة قبول للمقابلة بلغت ${appToInterviewRate}%. استمر بالتركيز على الأدوار ذات التطابق العالي.`
                    : `You have ${totalAppsCount} applications tracked with a ${appToInterviewRate}% interview conversion rate. Keep focusing on high match score roles.`
                ) : (
                  isAr 
                    ? 'قم بإضافة طلباتك الوظيفية للبدء في توليد تحليلات دقيقة لأدائك بالذكاء الاصطناعي.'
                    : 'Start adding job applications to generate real AI-powered analytics and performance insights.'
                )}
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center">
            <Button 
              onClick={() => setIsAIDrawerOpen(true)}
              className="bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs h-10 px-5 gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'اسأل مسار عن تحليلاتك' : 'Ask Masar AI'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Applications over time */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              {isAr ? 'حجم الطلبات والمقابلات الشهري' : 'Application Volume & Interviews'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Line type="monotone" dataKey="apps" name={isAr ? 'الطلبات' : 'Applications'} stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, fill: '#94a3b8' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="interviews" name={isAr ? 'المقابلات' : 'Interviews'} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Track Performance */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BarChartIcon className="w-5 h-5 text-emerald-600" />
              {isAr ? 'توزيع الطلبات حسب المصدر' : 'Applications by Source'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trackData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-900">{totalAppsCount}</span>
                <span className="text-xs text-slate-500 font-semibold">{isAr ? 'إجمالي الطلبات' : 'Total Apps'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

