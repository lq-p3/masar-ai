import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Inbox, 
  Sparkles, 
  UserRoundCheck, 
  FileText, 
  BarChart3, 
  Settings as SettingsIcon,
  Bot,
  ChevronRight,
  X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApplications } from '../../contexts/ApplicationContext';
import { cn } from '../../lib/utils';

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const { t, dir } = useLanguage();
  const { applications, setIsAIDrawerOpen } = useApplications();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/app' },
    { icon: Briefcase, label: 'nav.applications', path: '/app/applications', count: applications.length },
    { icon: Sparkles, label: 'nav.jobs', path: '/app/jobs' },
    { icon: Inbox, label: 'nav.inbox', path: '/app/inbox', badge: 'sidebar.new' },
    { icon: UserRoundCheck, label: 'nav.interviews', path: '/app/interviews' },
    { icon: FileText, label: 'nav.resumes', path: '/app/resumes' },
    { icon: BarChart3, label: 'nav.analytics', path: '/app/analytics' },
    { icon: SettingsIcon, label: 'nav.settings', path: '/app/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside 
        className={cn(
          "fixed top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white border-e border-slate-200 transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 flex flex-col justify-between shadow-2xl lg:shadow-xs",
          dir === 'rtl' 
            ? (isOpen ? "translate-x-0 right-0" : "translate-x-full right-0 lg:translate-x-0")
            : (isOpen ? "translate-x-0 left-0" : "-translate-x-full left-0 lg:translate-x-0")
        )}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Logo Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  {dir === 'rtl' ? 'مسار AI' : 'Masar AI'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                  {dir === 'rtl' ? 'إدارة التوظيف' : 'Career Copilot'}
                </span>
              </div>
            </Link>

            {/* Mobile Drawer Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-4 py-5 space-y-1.5 custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all group",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="flex-1">{t(item.label)}</span>
                  
                  {item.count !== undefined && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {item.count}
                    </span>
                  )}

                  {item.badge && (
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                      {t(item.badge)}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer AI Promotion Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 text-white space-y-3 relative overflow-hidden shadow-md">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-bold">{t('sidebar.ai_assistant')}</span>
            </div>
            <p className="text-[11px] text-indigo-200 leading-relaxed">
              {t('sidebar.ai_msg')}
            </p>
            <button 
              onClick={() => { setIsOpen(false); setIsAIDrawerOpen(true); }}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{t('sidebar.ai_btn')}</span>
              <ChevronRight className={cn("w-3.5 h-3.5", dir === 'rtl' ? "rotate-180" : "")} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
