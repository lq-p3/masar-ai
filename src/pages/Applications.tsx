import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApplications } from '../contexts/ApplicationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApplicationStatus, JobApplication } from '../types';
import { 
  Search, Plus, List, Trello, Filter, MoreHorizontal, MapPin, 
  Building, Sparkles, Trash2, Eye, ExternalLink, Calendar, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

const stages: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected'
];

export default function Applications() {
  const { applications, updateApplicationStatus, deleteApplication, setIsAddModalOpen, apiError, isLoadingData } = useApplications();
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';
  const navigate = useNavigate();

  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStageFilter === 'all' || app.status === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const getApplicationsByStage = (stage: ApplicationStatus) => {
    return filteredApps.filter(app => app.status === stage);
  };

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 w-full min-w-0" dir={dir}>
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{apiError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('apps.title')}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">{t('apps.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", 
                view === 'kanban' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Trello className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('apps.kanban')}</span>
            </button>
            <button 
              onClick={() => setView('table')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", 
                view === 'table' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('apps.table')}</span>
            </button>
          </div>

          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-200 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('dash.add_app')}</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:max-w-sm min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('apps.search')} 
            className="w-full h-9 ps-9 pe-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors truncate"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <select 
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="h-9 px-2.5 sm:px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-semibold w-full sm:w-auto"
            >
              <option value="all">{t('apps.filter_all')}</option>
              {stages.map(stg => (
                <option key={stg} value={stg}>{stg}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-medium px-2 bg-slate-100 py-1 rounded-lg shrink-0">
            {filteredApps.length} {t('dash.jobs')}
          </span>
        </div>
      </div>

      {/* Kanban Board View */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar w-full min-w-0">
          <div className="flex gap-3 sm:gap-4 h-full min-w-max">
            {stages.map(stage => {
              const apps = getApplicationsByStage(stage);
              return (
                <div key={stage} className="w-[270px] sm:w-[310px] flex flex-col flex-shrink-0 bg-slate-100/60 rounded-2xl p-3 sm:p-4 border border-slate-200/50">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm">{stage}</h3>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {apps.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {apps.map(app => (
                      <Card 
                        key={app.id} 
                        className="hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group bg-white border-slate-200"
                        onClick={() => navigate(`/app/applications/${app.id}`)}
                      >
                        <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <Badge status={app.status}>{app.status}</Badge>
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-bold border border-emerald-100 shrink-0">
                              <Sparkles className="w-3 h-3 text-emerald-500" />
                              {app.matchScore}%
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs sm:text-sm mb-1 line-clamp-2">{app.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-slate-700 truncate">
                                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {app.company}
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {app.location}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
                            <span className="truncate">{app.source}</span>
                            <span className="shrink-0">{app.lastUpdate}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {apps.length === 0 && (
                      <div className="h-24 sm:h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 rounded-2xl bg-white/40 text-slate-400 text-xs gap-1">
                        <span>{isAr ? 'لا يوجد طلبات في هذه المرحلة' : 'No applications here'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Data Table View */}
      {view === 'table' && (
        <Card className="flex-1 border-slate-200 overflow-hidden shadow-sm flex flex-col w-full min-w-0">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-start text-xs sm:text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 sm:p-4 text-start">{t('table.company')}</th>
                  <th className="p-3 sm:p-4 text-start">{t('table.role')}</th>
                  <th className="p-3 sm:p-4 text-start">{t('table.status')}</th>
                  <th className="p-3 sm:p-4 text-start">{t('table.location')}</th>
                  <th className="p-3 sm:p-4 text-start">{t('table.applied_date')}</th>
                  <th className="p-3 sm:p-4 text-start">{t('table.match')}</th>
                  <th className="p-3 sm:p-4 text-end">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {app.company.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{app.company}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{app.source}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-800 font-semibold">{app.title}</td>
                    
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4 text-slate-600 text-xs">{app.location}</td>

                    <td className="p-4 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${app.matchScore}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{app.matchScore}%</span>
                      </div>
                    </td>

                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/app/applications/${app.id}`}>
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => deleteApplication(app.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                      {t('table.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
