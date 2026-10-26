import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, User, Settings, LogOut, Shield, Link as LinkIcon, Globe, Sparkles, Building2, Briefcase } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApplications } from '../../contexts/ApplicationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { language, setLanguage, dir, t } = useLanguage();
  const { applications, searchQuery, setSearchQuery, setIsAIDrawerOpen } = useApplications();
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Authenticated User';
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
    }
    return name.slice(0, 2);
  };
  const initials = getInitials(displayName);

  const filteredApps = searchQuery.trim() 
    ? applications.filter(app => 
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between z-30 relative shrink-0 w-full min-w-0 gap-2">
      <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0 max-w-lg">
        <button 
          onClick={onMenuClick}
          className="p-2 -ms-1 sm:-ms-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden shrink-0 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar with Live Results Dropdown */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 flex items-center text-slate-400 start-0 ps-2.5 sm:ps-3 pointer-events-none">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder={t('topbar.search')} 
            className="block w-full py-1.5 sm:py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ps-8 sm:ps-9 pe-2.5 sm:pe-3 transition-colors truncate"
          />

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in duration-150 w-[calc(100vw-2rem)] sm:w-full max-w-sm sm:max-w-none start-0">
              <div className="px-4 py-1.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('nav.applications')} ({filteredApps.length})</span>
                <span className="text-[10px] text-indigo-600 font-semibold">{dir === 'rtl' ? 'نتائج فورية' : 'Live Results'}</span>
              </div>

              {filteredApps.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {filteredApps.map(app => (
                    <div 
                      key={app.id}
                      onClick={() => {
                        navigate(`/app/applications/${app.id}`);
                        setSearchQuery('');
                      }}
                      className="px-4 py-2.5 hover:bg-indigo-50/50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {app.company.charAt(0)}
                        </div>
                        <div className="min-w-0 me-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{app.title}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" /> {app.company}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">{app.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  {t('table.empty')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Language Switcher */}
        <div 
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-full border border-slate-200 select-none"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className={language === 'en' ? 'text-indigo-600 font-bold' : 'text-slate-400'}>EN</span>
          <span className="text-slate-300">|</span>
          <span className={language === 'ar' ? 'text-indigo-600 font-bold' : 'text-slate-400'}>{language === 'ar' ? 'عربي' : 'AR'}</span>
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md cursor-pointer hover:ring-4 hover:ring-indigo-100 transition-all overflow-hidden shrink-0"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          
          {isProfileMenuOpen && (
            <div className={`absolute top-full mt-2 w-56 sm:w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 max-w-[calc(100vw-1.5rem)] ${dir === 'ltr' ? 'right-0' : 'left-0'}`}>
              <div className="px-4 py-3 border-b border-slate-100 mb-1 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>

              <button 
                onClick={() => { setIsProfileMenuOpen(false); setIsAIDrawerOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" /> {dir === 'rtl' ? 'مساعد مسار' : 'Ask Masar AI'}
              </button>

              <button 
                onClick={() => { setIsProfileMenuOpen(false); navigate('/app/resumes'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
              >
                <User className="w-4 h-4" /> {dir === 'rtl' ? 'السيرة الذاتية' : 'Profile & Resume'}
              </button>
              
              <button 
                onClick={() => { setIsProfileMenuOpen(false); navigate('/app/analytics'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Settings className="w-4 h-4" /> {dir === 'rtl' ? 'الإعدادات والتحليلات' : 'Settings & Analytics'}
              </button>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> {dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

