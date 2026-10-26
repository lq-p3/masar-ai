import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApplications } from '../../contexts/ApplicationContext';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AIAssistantDrawer } from '../ui/AIAssistantDrawer';
import { AddApplicationModal } from '../ui/AddApplicationModal';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { dir, t } = useLanguage();
  const { setIsAIDrawerOpen } = useApplications();

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden font-sans" dir={dir}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 pb-20 sm:pb-8 custom-scrollbar w-full min-w-0">
          <Outlet />
        </main>

        {/* Floating AI Button */}
        <button 
          onClick={() => setIsAIDrawerOpen(true)}
          className={cn(
            "fixed bottom-3 sm:bottom-6 z-40 flex items-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-semibold border border-indigo-400/30 group",
            dir === 'ltr' ? "right-3 sm:right-6" : "left-3 sm:left-6"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-indigo-200 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">{dir === 'ltr' ? 'Ask Masar AI' : 'اسأل مسار'}</span>
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
        </button>

      </div>

      {/* Global Modals & Drawers */}
      <AIAssistantDrawer />
      <AddApplicationModal />
    </div>
  );
}
