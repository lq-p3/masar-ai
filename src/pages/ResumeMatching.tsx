import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Upload, CheckCircle2, XCircle, Trash2, Sparkles, RefreshCw, FileEdit, Star, AlertCircle, Award, Target, TrendingUp, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CoverLetterGeneratorModal } from '../components/ui/CoverLetterGeneratorModal';
import * as api from '../services/api';
import { cn } from '../lib/utils';


function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ResumeMatching() {
  const { dir } = useLanguage();
  const isAr = dir === 'rtl';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<api.ResumeDocument[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'JOB_MATCH'>('AUDIT');
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);

  const [cvAudit, setCvAudit] = useState<{
    score: number;
    executiveSummary: string;
    targetTitles: string[];
    coreSkills: string[];
    strengths: string[];
    improvements: string[];
  } | null>(null);

  const [matchResult, setMatchResult] = useState<{
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    recommendation: string;
  } | null>(null);

  const runCVAudit = async (targetResumeId?: string) => {
    const targetId = targetResumeId || selectedResumeId || (resumes.length > 0 ? resumes[0].id : undefined);
    
    if (!targetId && resumes.length === 0) {
      setErrorMessage(isAr ? 'يرجى رفع سيرة ذاتية أولاً لإجراء التحليل والتدقيق' : 'Please upload a resume first to run AI audit');
      fileInputRef.current?.click();
      return;
    }

    setErrorMessage(null);
    setIsAuditing(true);
    try {
      const res = await api.analyzeCVAudit({ 
        resumeId: targetId, 
        language: isAr ? 'ar' : 'en' 
      });
      if (res) {
        setCvAudit(res);
        setActiveTab('AUDIT');
      }
    } catch (err) {
      console.error('Failed to run CV Audit:', err);
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل تحليل السيرة الذاتية بالذكاء الاصطناعي' : 'Failed to audit CV via AI');
      setErrorMessage(msg);
    } finally {
      setIsAuditing(false);
    }
  };

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const data = await api.getUserResumes();
      setResumes(data || []);
      if (data && data.length > 0) {
        const primary = data.find(r => r.isPrimary) || data[0];
        setSelectedResumeId(primary.id);
        runCVAudit(primary.id);
      }
    } catch (err) {
      console.error('Failed to load user resumes:', err);
      const msg = err instanceof Error ? err.message : (isAr ? 'تعذر جلب السير الذاتية الخاصة بك' : 'Failed to load user resumes');
      setErrorMessage(msg);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleSelectResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    runCVAudit(resumeId);
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsUploading(true);
    try {
      const newDoc = await api.uploadResume(file);
      await loadResumes();
      if (newDoc?.id) {
        setSelectedResumeId(newDoc.id);
        await runCVAudit(newDoc.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل رفع السيرة الذاتية' : 'Failed to upload resume');
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (id: string) => {
    setErrorMessage(null);
    setActionId(id);
    try {
      await api.setPrimaryResume(id);
      setSelectedResumeId(id);
      await loadResumes();
      await runCVAudit(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل تعيين السيرة الأساسية' : 'Failed to set primary resume');
      setErrorMessage(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    setActionId(id);
    try {
      await api.deleteResume(id);
      await loadResumes();
      setCvAudit(null);
      setMatchResult(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل حذف السيرة الذاتية' : 'Failed to delete resume');
      setErrorMessage(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;

    if (resumes.length === 0) {
      setErrorMessage(isAr ? 'يرجى رفع سيرة ذاتية أولاً قبل إجراء التحليل' : 'Please upload a resume first before running AI match analysis');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setMatchResult(null);

    try {
      const res = await api.analyzeResumeMatch({
        jobDescription: jobDescription.trim(),
        resumeId: selectedResumeId || undefined,
        language: isAr ? 'ar' : 'en'
      });
      setMatchResult({
        score: res.score,
        matchingSkills: res.matchingSkills || [],
        missingSkills: res.missingSkills || [],
        recommendation: res.recommendation || ''
      });
      setActiveTab('JOB_MATCH');
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل تحليل التوافق بالذكاء الاصطناعي' : 'Failed to analyze resume match');
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 min-w-0" dir={dir}>
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".pdf,.docx,.doc" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            {isAr ? 'السيرة الذاتية والتحليل الذكي' : 'Resume & AI Analysis'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {isAr ? 'إدارة سيرتك الذاتية وتفكيك المهارات وفحص الجاهزية واختبار التوافق بالذكاء الاصطناعي.' : 'Manage resumes, extract skills, audit ATS score, and test job compatibility.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          {resumes.length > 0 && (
            <Button 
              onClick={() => runCVAudit()} 
              disabled={isAuditing}
              variant="outline"
              className="w-full sm:w-auto gap-2 bg-white text-xs h-10 sm:h-11 border-indigo-200 text-indigo-700 font-bold justify-center"
            >
              <Sparkles className={cn("w-4 h-4 text-indigo-600", isAuditing && "animate-spin")} />
              <span>{isAr ? 'تحليل السيرة الذاتية' : 'Audit CV'}</span>
            </Button>
          )}

          <Button 
            onClick={() => setIsCoverLetterOpen(true)}
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs sm:text-sm h-10 sm:h-11 shadow-md shadow-indigo-200 justify-center"
          >
            <FileEdit className="w-4 h-4" />
            <span>{isAr ? 'إنشاء خطاب تغطية' : 'Cover Letter'}</span>
          </Button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        
        {/* Column 1: Resumes & Job Match Input */}
        <div className="space-y-6">
          {/* My Resumes Card */}
          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-base">{isAr ? 'سيري الذاتية' : 'My Resumes'}</h2>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2 bg-white text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="w-4 h-4 text-indigo-600" />
                )}
                {isUploading 
                  ? (isAr ? 'جاري الرفع...' : 'Uploading...') 
                  : (isAr ? 'رفع جديد' : 'Upload New')}
              </Button>
            </div>

            <div className="p-5 space-y-3">
              {loadingResumes ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>{isAr ? 'جاري تحميل السير الذاتية...' : 'Loading resumes...'}</span>
                </div>
              ) : resumes.length > 0 ? (
                <div className="space-y-3">
                  {resumes.map((resume) => {
                    const isSelected = resume.id === selectedResumeId;
                    return (
                      <div 
                        key={resume.id} 
                        onClick={() => handleSelectResume(resume.id)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                          isSelected 
                            ? "bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20" 
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{resume.fileName}</h4>
                              {resume.isPrimary ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white flex-shrink-0">
                                  <Star className="w-3 h-3 fill-current" />
                                  {isAr ? 'الأساسية' : 'Primary'}
                                </span>
                              ) : isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0">
                                  {isAr ? 'محددة للتحليل' : 'Selected'}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatFileSize(resume.fileSize)} • {new Date(resume.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!resume.isPrimary && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSetPrimary(resume.id)}
                              disabled={actionId === resume.id}
                              className="text-[11px] h-8 px-2.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                            >
                              {actionId === resume.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                isAr ? 'تعيين كأساسية' : 'Make Primary'
                              )}
                            </Button>
                          )}

                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(resume.id)}
                            disabled={actionId === resume.id}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 border-transparent"
                          >
                            {actionId === resume.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (

                <div className="p-8 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isAr ? 'لا توجد سير ذاتية مرفوعة' : 'No Resumes Uploaded'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {isAr ? 'قم برفع سيرتك الذاتية (PDF/DOCX) لتحليل التوافق واستخراج المهارات عبر الذكاء الاصطناعي.' : 'Upload your resume (PDF/DOCX) to perform real ATS analysis and job matching.'}
                  </p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2 bg-indigo-600 text-white text-xs font-bold"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isAr ? 'اختر ملف السيرة الذاتية' : 'Choose Resume File'}</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Test Job Match Input */}
          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-base">{isAr ? 'اختبار التوافق مع وظيفة' : 'Test Job Description Match'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{isAr ? 'ضع الوصف الوظيفي هنا لمقارنة التوافق مع سيرتك الأساسية.' : 'Paste a job description to test ATS compatibility.'}</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={isAr ? 'ألصق الوصف الوظيفي للوظيفة المستهدفة هنا...' : 'Paste target job description here...'}
                className="w-full h-36 p-4 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-slate-50/50 focus:bg-white transition-colors"
              />
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim() || resumes.length === 0}
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold h-11 shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>{isAr ? 'جاري التحليل...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'تحليل التوافق بالذكاء الاصطناعي' : 'Analyze Job Match'}</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Column 2: Results (Tabs: CV Audit vs Job Match) */}
        <Card className="border-slate-200 shadow-sm space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('AUDIT')}
                className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-xl transition-all",
                  activeTab === 'AUDIT' ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {isAr ? 'تحليل وفحص السيرة الذاتية' : 'CV AI Audit'}
              </button>
              <button
                onClick={() => setActiveTab('JOB_MATCH')}
                className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-xl transition-all",
                  activeTab === 'JOB_MATCH' ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {isAr ? 'مطابقة الوصف الوظيفي' : 'Job Match'}
              </button>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Masar AI Intelligence
            </span>
          </div>

          {/* TAB 1: CV AUDIT */}
          {activeTab === 'AUDIT' && (
            isAuditing ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500">{isAr ? 'جاري قراءة السيرة الذاتية وتفكيك المهارات ونسبة الجاهزية...' : 'Auditing resume text and extracting skills...'}</p>
              </div>
            ) : cvAudit ? (
              <div className="space-y-6">
                {/* Score */}
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md">
                  <div className="space-y-1 min-w-0 me-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30">
                      {isAr ? 'درجة الجاهزية للتطابق (ATS Score)' : 'ATS Readiness Score'}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug mt-1">{cvAudit.executiveSummary}</h3>
                  </div>
                  <div className="flex flex-col items-center shrink-0 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-2xl font-extrabold text-indigo-300">{cvAudit.score}%</span>
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{isAr ? 'التقييم' : 'Score'}</span>
                  </div>
                </div>

                {/* Target Titles */}
                {cvAudit.targetTitles && cvAudit.targetTitles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      {isAr ? 'المسميات الوظيفية المناسبة لخبرتك' : 'Target Job Roles'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cvAudit.targetTitles.map((t, idx) => (
                        <span key={idx} className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Skills */}
                {cvAudit.coreSkills && cvAudit.coreSkills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      {isAr ? 'المهارات التقنية والخبيرة المستخرجة' : 'Extracted Technical Skills'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cvAudit.coreSkills.map((s, idx) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {isAr ? 'نقاط القوة التنافسية' : 'Competitive Strengths'}
                    </h4>
                    <ul className="space-y-1 text-xs text-emerald-800">
                      {cvAudit.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      {isAr ? 'مقترحات التحسين' : 'Optimization Tips'}
                    </h4>
                    <ul className="space-y-1 text-xs text-amber-800">
                      {cvAudit.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'اضغط على تحليل السيرة الذاتية' : 'Click Audit CV to analyze'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {isAr ? 'قم برفع سيرتك الذاتية واضغط زر "تحليل السيرة الذاتية" لفحص المهارات والتقييم الحقيقي.' : 'Upload your CV and click Audit CV to analyze skills and ATS readiness score.'}
                </p>
                {resumes.length > 0 && (
                  <Button onClick={runCVAudit} className="gap-2 bg-indigo-600 text-white text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'بدء التحليل الفوري للسيرة الذاتية' : 'Start Instant CV Audit'}</span>
                  </Button>
                )}
              </div>
            )
          )}

          {/* TAB 2: JOB MATCH */}
          {activeTab === 'JOB_MATCH' && (
            matchResult ? (
              <>
                {/* Score Indicator */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50/50 to-slate-50 rounded-2xl border border-indigo-100">
                  <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-indigo-100 bg-white shadow-inner">
                    <div className="text-center z-10">
                      <span className="text-4xl font-extrabold text-slate-900">{matchResult.score}%</span>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Match</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-4 text-center max-w-xs leading-relaxed">
                    {matchResult.score >= 80 
                      ? (isAr ? 'توافق ممتاز جداً! خبرتك تتناسب بشكل رائع مع الوظيفة.' : 'Excellent match for this position.')
                      : matchResult.score >= 60 
                      ? (isAr ? 'توافق جيد! هناك بعض المهارات التي يفضل إبرازها بشكل أكبر.' : 'Good match for this position.')
                      : (isAr ? 'توافق متوسط. يوصى بتحديث السيرة لتغطي المهارات المفقودة.' : 'Moderate match. Review missing skills to improve alignment.')}
                  </p>
                </div>

                {/* Skills Lists Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Matching Skills */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'المهارات المتوافقة' : 'Matching Skills'}
                    </h4>
                    <div className="space-y-1.5">
                      {matchResult.matchingSkills.length > 0 ? (
                        matchResult.matchingSkills.map((skill, i) => (
                          <div key={i} className="text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between">
                            <span>{skill}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic p-2">{isAr ? 'لا توجد مهارات متطابقة ملموسة' : 'No direct skill matches found'}</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      {isAr ? 'المهارات المفقودة' : 'Missing Skills'}
                    </h4>
                    <div className="space-y-1.5">
                      {matchResult.missingSkills.length > 0 ? (
                        matchResult.missingSkills.map((skill, i) => (
                          <div key={i} className="text-xs font-semibold text-red-900 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center justify-between">
                            <span>{skill}</span>
                            <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-emerald-600 font-medium p-2">{isAr ? 'لا توجد مهارات مفقودة رئيسية!' : 'No major missing skills!'}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AI Recommendation */}
                <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <h4 className="text-xs font-bold">{isAr ? 'توصية الذكاء الاصطناعي' : 'AI Recommendation'}</h4>
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                    {matchResult.recommendation}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'لا توجد نتيجة مطابقة للوظيفة حالياً' : 'No Job Match Analysis Yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {isAr 
                    ? 'ضع الوصف الوظيفي في النموذج على اليمين ثم اضغط على "تحليل التوافق بالذكاء الاصطناعي".'
                    : 'Paste a target job description on the right and click Analyze Job Match.'}
                </p>
              </div>
            )
          )}
        </Card>

      </div>

      {/* Cover Letter Modal */}
      <CoverLetterGeneratorModal 
        isOpen={isCoverLetterOpen} 
        onClose={() => setIsCoverLetterOpen(false)} 
      />
    </div>
  );
}

