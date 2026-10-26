import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApplications } from '../contexts/ApplicationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Briefcase, Building2, Calendar, FileText, Target, ChevronRight, 
  Sparkles, RefreshCw, Plus, CheckCircle2, TrendingUp, BarChart3, Mail, 
  Clock, AlertCircle, Trash2, ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateApplicationStats } from '../lib/statusHelper';

import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell
} from 'recharts';

import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

export default function Dashboard() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    applications, emails, tasks, toggleTask, addTask, deleteTask,
    setIsAddModalOpen, setIsAIDrawerOpen, isLoadingData, apiError, seedSampleData 
  } = useApplications();
  const isAr = dir === 'rtl';
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : '');

  const [newTaskText, setNewTaskText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Time based greeting
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'dash.greeting_morning' : hour < 18 ? 'dash.greeting_afternoon' : 'dash.greeting_evening';

  // Canonical statistics calculation
  const stats = calculateApplicationStats(applications);
  const totalAppsCount = stats.total;
  const interviewsCount = stats.interview;
  const offersCount = stats.offer;
  const avgMatchScore = stats.avgMatchScore;

  // Pipeline stage aggregation for Bar Chart
  const stageCounts = [
    { stage: t('status.applied'), count: stats.applied, fill: '#6366f1' },
    { stage: t('status.under_review'), count: stats.underReview + stats.shortlisted, fill: '#f59e0b' },
    { stage: t('status.assessment'), count: stats.assessment, fill: '#8b5cf6' },
    { stage: t('status.interview'), count: stats.interview, fill: '#06b6d4' },
    { stage: t('status.offer'), count: stats.offer, fill: '#10b981' },
    { stage: t('status.rejected'), count: stats.rejected, fill: '#ef4444' },
  ];


  // Dynamic monthly trend derived from applications
  const months = isAr 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  
  const currentMonthIdx = new Date().getMonth();
  const trendData = months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1).map((mName) => ({
    month: mName,
    apps: totalAppsCount,
    interviews: interviewsCount
  }));

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      await api.syncGmail();
      window.location.reload();
    } catch (err) {
      console.warn('Gmail sync on dashboard redirected to inbox:', err);
      navigate('/app/inbox');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      await addTask(newTaskText, undefined, 'TODAY', false);
      setNewTaskText('');
    } catch {
      // Error handled in ApplicationContext
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-1 sm:mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? 'منصة إدارة المسار بالذكاء الاصطناعي' : 'AI Career Command Center'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t(greetingKey)}{userName ? `، ${userName}` : ''}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">{t('dash.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 relative z-10 shrink-0 w-full sm:w-auto">
          <Button 
            onClick={handleSyncGmail}
            variant="outline"
            className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2 h-10 sm:h-11 backdrop-blur-md justify-center text-xs sm:text-sm font-semibold"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing ? "animate-spin text-indigo-300" : "")} />
            <span>{isSyncing ? t('dash.syncing') : t('dash.sync_gmail')}</span>
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 gap-2 h-10 sm:h-11 font-semibold justify-center text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dash.add_app')}</span>
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
          {apiError}
        </div>
      )}

      {totalAppsCount === 0 && !isLoadingData && (
        <div className="p-5 sm:p-6 bg-slate-100 border border-slate-200 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isAr ? 'لا توجد طلبات وظيفية محفوظة بعد' : 'No job applications saved yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isAr 
                ? 'أضف أول طلب وظيفي لك للتخزين بأمان في حسابك وتتبع مراحل التوظيف.'
                : 'Add your first job application to securely store in your account and track recruitment milestones.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="w-full sm:w-auto text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 justify-center">
              <Plus className="w-3.5 h-3.5" />
              {t('dash.add_app')}
            </Button>
          </div>
        </div>
      )}


      {/* Dynamic Key Stats Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 sm:p-6 border-slate-200 shadow-sm animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-1/3 mt-4"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Total Applications */}
          <Card className="p-4 sm:p-6 justify-center border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('dash.total_apps')}</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{totalAppsCount}</h3>
              {totalAppsCount > 0 ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">+{totalAppsCount} {isAr ? 'نشط' : 'active'}</span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">0 {isAr ? 'نشط' : 'active'}</span>
              )}
            </div>
          </Card>

          {/* Interviews */}
          <Card className="p-4 sm:p-6 justify-center border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('dash.interviews')}</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{interviewsCount}</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                {interviewsCount > 0 ? `${interviewsCount} ${t('dash.pending')}` : t('dash.stable')}
              </span>
            </div>
          </Card>

          {/* Offers Received */}
          <Card className="p-4 sm:p-6 justify-center border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('dash.offers')}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{offersCount}</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">{t('dash.stable')}</span>
            </div>
          </Card>

          {/* Match Score */}
          <Card className="p-4 sm:p-6 justify-center border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('dash.avg_match')}</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900" dir="ltr">{avgMatchScore}%</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">{isAr ? 'تطابق' : 'Match'}</span>
            </div>
          </Card>
        </div>
      )}


      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Stage Pipeline Funnel (BarChart) */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
                {t('dash.pipeline')}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t('dash.pipeline_desc')}</p>
            </div>
            <Link to="/app/applications">
              <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs">
                {t('dash.view_all')} <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stageCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Activity Area Chart */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              {t('dash.monthly_trend')}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{t('dash.monthly_desc')}</p>
          </CardHeader>
          <CardContent className="pt-4 p-3 sm:p-6">
            <div className="h-56 sm:h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Area type="monotone" dataKey="apps" name={t('nav.applications')} stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
                  <Area type="monotone" dataKey="interviews" name={t('nav.interviews')} stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInterviews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Activity & AI Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Recent Gmail Activity */}
        <Card className="flex flex-col border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">{t('dash.recent')}</h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full uppercase border border-emerald-200/50 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('dash.syncing')}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 space-y-2 flex-1 overflow-y-auto max-h-[380px] custom-scrollbar">
            {emails.map((email) => (
              <div 
                key={email.id} 
                className="flex items-start gap-3 p-3 sm:p-3.5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100/80 cursor-pointer group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm group-hover:scale-105 transition-transform">
                  {email.company.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{email.company}</p>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                      {new Date(email.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 truncate font-medium">{email.summary}</p>
                  
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge 
                      variant={
                        email.category === 'Interview' ? 'ai' : 
                        email.category === 'Rejection' ? 'danger' : 
                        email.category === 'Assessment' ? 'warning' : 'default'
                      }
                      className="text-[10px] px-2 py-0.5 font-bold"
                    >
                      {email.category}
                    </Badge>

                    {email.actionRequired && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1 truncate">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {email.actionText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link to="/app/inbox" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
              {t('dash.live')} <ChevronRight className={cn("w-3.5 h-3.5", isAr ? "rotate-180" : "")} />
            </Link>
          </div>
        </Card>

        {/* AI Insights & Interactive Action Tasks */}
        <div className="space-y-6 flex flex-col">
          {/* AI Insight Box */}
          <Card className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border-indigo-800 shadow-md relative overflow-hidden">
            <div className="p-5 sm:p-6 relative z-10 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-indigo-200 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{t('dash.market')}</h4>
                  <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-semibold">{t('dash.insights')}</span>
                </div>
              </div>

              <p className="text-xs text-indigo-100 leading-relaxed">
                {t('dash.market_text')}
              </p>

              <div className="pt-1 sm:pt-2">
                <Button 
                  onClick={() => setIsAIDrawerOpen(true)}
                  size="sm"
                  className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 font-bold gap-2 text-xs h-9 px-4 shadow-sm justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {isAr ? 'ناقش هذا مع مسار AI' : 'Discuss with Masar AI'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Action Tasks Card */}
          <Card className="flex-1 flex flex-col border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dash.next_actions')}</h4>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                {tasks.filter(t => t.completed).length} / {tasks.length} {isAr ? 'مكتمل' : 'Completed'}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
              {/* Task Add Input Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  placeholder={t('dash.task_placeholder')}
                  className="flex-1 min-w-0 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
                <Button type="submit" size="sm" className="h-9 px-3 text-xs gap-1 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('dash.add_task')}</span>
                </Button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2.5 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all group gap-2",
                      task.completed ? "bg-slate-50/70 border-slate-100 opacity-60" : "bg-white border-slate-100 hover:border-indigo-200 shadow-xs"
                    )}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0" 
                      />
                      <span className={cn(
                        "text-xs font-medium truncate cursor-pointer",
                        task.completed ? "line-through text-slate-400" : "text-slate-700"
                      )} onClick={() => toggleTask(task.id)}>
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        task.urgent ? "text-red-600 bg-red-50" : "text-slate-400 bg-slate-100"
                      )}>
                        {task.dueDate}
                      </span>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
