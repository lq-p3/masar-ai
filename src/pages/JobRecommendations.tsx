import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useApplications } from '../contexts/ApplicationContext';
import { Briefcase, Sparkles, Building2, MapPin, CheckCircle2, XCircle, ExternalLink, Check, Loader2, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { cn } from '../lib/utils';

export interface DiscoveredJob {
  id: string;
  source: string;
  sourceJobId?: string;
  sourceUrl?: string;
  company: string;
  title: string;
  description: string;
  location: string;
  workplaceType: 'Onsite' | 'Hybrid' | 'Remote';
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  requiredSkills: string[];
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  publishedAt: string;
}

function getCompanyInitials(name: string): string {

  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getMatchScoreStyle(score: number) {
  if (score >= 90) {
    return {
      bg: 'bg-emerald-50/90 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-600 text-white'
    };
  }
  if (score >= 80) {
    return {
      bg: 'bg-indigo-50/90 text-indigo-700 border-indigo-200',
      badge: 'bg-indigo-600 text-white'
    };
  }
  if (score >= 70) {
    return {
      bg: 'bg-sky-50/90 text-sky-700 border-sky-200',
      badge: 'bg-sky-600 text-white'
    };
  }
  return {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: 'bg-slate-600 text-white'
  };
}

export default function JobRecommendations() {
  const { t, dir } = useLanguage();
  const { addApplication } = useApplications();
  const isAr = dir === 'rtl';

  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState<string>('ALL');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJobRecommendations();
      const jobList = Array.isArray(data) ? data : (data && typeof data === 'object' && Array.isArray((data as any).data)) ? (data as any).data : [];
      if (jobList.length > 0) {
        setJobs(jobList as DiscoveredJob[]);
        setIsLoading(false);
      } else {
        await handleDiscoverLinkedInJobs();
      }
    } catch (err) {
      console.warn('Backend job API response, auto-discovering:', err);
      await handleDiscoverLinkedInJobs();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscoverLinkedInJobs = async () => {
    setIsDiscovering(true);
    try {
      const data = await api.discoverJobsFromCV();
      const jobList = Array.isArray(data) ? data : (data && typeof data === 'object' && Array.isArray((data as any).data)) ? (data as any).data : [];
      if (jobList.length > 0) {
        setJobs(jobList as DiscoveredJob[]);
      }
    } catch (err) {
      console.error('Failed to discover jobs from CV:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleApply = async (job: DiscoveredJob) => {
    try {
      await api.applyToJobRecommendation({
        company: job.company,
        title: job.title,
        location: job.location
      });
      setAppliedJobIds(prev => new Set(prev).add(job.id));
      addApplication({
        company: job.company,
        title: job.title,
        location: job.location,
        status: 'Applied',
        source: job.source || 'LinkedIn Jobs',
        matchScore: job.matchScore
      });
    } catch (err) {
      console.error('Failed to apply to job:', err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesQuery = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWorkplace = workplaceFilter === 'ALL' || job.workplaceType === workplaceFilter;
    const matchesScore = (job.matchScore ?? 85) >= minMatchScore;

    return matchesQuery && matchesWorkplace && matchesScore;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            {isAr ? 'الوظائف المقترحة بالذكاء الاصطناعي' : 'AI Job Discovery & Recommendations'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {isAr ? 'استكشاف الفرص المتاحة ومطابقتها تلقائياً مع سيرتك الذاتية.' : 'Discover live job opportunities tailored to your CV profile.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          <Button 
            onClick={handleDiscoverLinkedInJobs}
            disabled={isLoading || isDiscovering}
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm h-10 sm:h-11 shadow-md shadow-indigo-200 justify-center"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isAr ? 'جاري اكتشاف الوظائف...' : 'Discovering Jobs...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>{isAr ? 'اكتشاف وظائف LinkedIn' : 'Discover LinkedIn Jobs'}</span>
              </>
            )}
          </Button>

          <Button 
            onClick={fetchRecommendations} 
            variant="outline" 
            disabled={isLoading || isDiscovering}
            className="w-full sm:w-auto gap-2 bg-white text-xs h-10 border-slate-200 justify-center"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-600", isLoading && "animate-spin")} />
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* CV AI Status Banner */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md border-0 rounded-2xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{isAr ? 'محرك الاكتشاف من السيرة الذاتية' : 'CV AI Discovery Engine'}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">{isAr ? 'نشط' : 'Active'}</span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 leading-relaxed">
                {isAr ? 'يتم استخراج مهاراتك ومسماك الوظيفي من السيرة الذاتية ومطابقتها مباشرة مع الوظائف الشاغرة على LinkedIn.' : 'Extracting your core skills & profile from CV to match live LinkedIn job openings.'}
              </p>
            </div>
          </div>

          <Link to="/app/resumes" className="shrink-0 w-full md:w-auto">
            <Button size="sm" variant="outline" className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-8 gap-1.5 justify-center">
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? 'إدارة السيرة الذاتية' : 'Manage CV'}</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filters Bar */}
      <Card className="p-3.5 sm:p-4 border-slate-200 shadow-sm sticky top-2 sm:top-4 z-20 bg-white/95 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{isAr ? 'البحث' : 'Search'}</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث بالمسمى، الشركة، أو المدينة...' : 'Search title, company, location...'}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{isAr ? 'نمط العمل' : 'Workplace'}</label>
            <select 
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value)}
              className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">{isAr ? 'جميع الأنماط' : 'All Workplace Types'}</option>
              <option value="Remote">{isAr ? 'عن بعد (Remote)' : 'Remote'}</option>
              <option value="Hybrid">{isAr ? 'هجين (Hybrid)' : 'Hybrid'}</option>
              <option value="Onsite">{isAr ? 'حضوري (Onsite)' : 'Onsite'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isAr ? `حد أدنى للمطابقة (${minMatchScore}%)` : `Min Match Score (${minMatchScore}%)`}
            </label>
            <input 
              type="range" 
              min="0" 
              max="95" 
              step="5"
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Jobs Grid */}
      {isLoading || isDiscovering ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 sm:p-6 border-slate-200 shadow-sm space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1 me-4">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded-md w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center space-y-4 border-slate-200 shadow-sm">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
            <Briefcase className="w-6 sm:w-7 h-6 sm:w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isAr ? 'استكشاف أحدث الوظائف المطابقة لسيرتك الذاتية' : 'Discover Jobs Tailored to Your CV'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr 
                ? 'اضغط على زر اكتشاف الوظائف ليقوم الذكاء الاصطناعي بتحليل سيرتك الذاتية والبحث عن الفرص المطابقة لك على LinkedIn.'
                : 'Click below to let AI analyze your resume text and discover matching LinkedIn job opportunities.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button 
              onClick={handleDiscoverLinkedInJobs}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isAr ? 'بدء تحليل السيرة الذاتية واكتشاف الوظائف' : 'Start CV Analysis & Discover Jobs'}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            const score = job.matchScore ?? 85;
            const scoreStyle = getMatchScoreStyle(score);
            const initials = getCompanyInitials(job.company);

            return (
              <Card key={job.id} className="border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 hover:border-indigo-200 transition-all flex flex-col justify-between overflow-hidden">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2.5 sm:gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Initials Avatar */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shrink-0 border border-slate-700/50">
                        {initials}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {job.source || 'LinkedIn Jobs'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">{job.workplaceType}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{job.title}</h3>
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {job.company}
                        </p>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className={cn("px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border flex flex-col items-center shrink-0", scoreStyle.bg)}>
                      <span className="text-sm sm:text-base font-extrabold" dir="ltr">{score}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">{isAr ? 'مطابقة' : 'Match'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 border-y border-slate-100 py-2.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {job.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{job.employmentType}</span>
                  </div>

                  {/* Skills Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'عوامل التوافق' : 'Match Reasons'}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(job.requiredSkills || []).map((skill, idx) => (
                        <span key={idx} className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          {skill}
                        </span>
                      ))}
                      {(job.missingSkills || []).map((skill, idx) => (
                        <span key={idx} className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 bg-red-50 text-red-800 border border-red-100 rounded-lg flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Actions Footer */}
                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-100">
                  {job.sourceUrl ? (
                    <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center sm:justify-start gap-1 bg-blue-50/60 hover:bg-blue-100/60 px-3 py-1.5 rounded-lg transition-colors">
                      <span>{isAr ? 'معاينة على LinkedIn' : 'View on LinkedIn'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : <span />}

                  <Button 
                    onClick={() => handleApply(job)}
                    disabled={isApplied}
                    size="sm"
                    className={cn(
                      "gap-1.5 font-bold text-xs h-9 shadow-xs justify-center w-full sm:w-auto",
                      isApplied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    {isApplied ? (isAr ? 'تمت الإضافة للطلبات' : 'Added to Apps') : (isAr ? 'تقديم وإضافة للطلبات' : 'Apply & Track')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


