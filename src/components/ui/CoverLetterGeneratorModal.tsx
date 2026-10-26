import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from './Button';
import { X, Sparkles, Copy, Check, FileText, Send, Building2 } from 'lucide-react';
import * as api from '../../services/api';

export function CoverLetterGeneratorModal({ 
  isOpen, 
  onClose,
  defaultCompany = 'STC',
  defaultTitle = 'Cloud Engineer'
}: { 
  isOpen: boolean; 
  onClose: () => void;
  defaultCompany?: string;
  defaultTitle?: string;
}) {
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [company, setCompany] = useState(defaultCompany);
  const [title, setTitle] = useState(defaultTitle);
  const [tone, setTone] = useState<'professional' | 'passionate' | 'technical'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!company.trim() || !title.trim()) return;
    setIsGenerating(true);
    try {
      const res = await api.generateCoverLetter({
        company: company.trim(),
        title: title.trim(),
        tone,
        language: isAr ? 'ar' : 'en'
      });
      setGeneratedLetter(res.coverLetter);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200" dir={dir}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">{isAr ? 'مولّد الخطاب التعريفي الذكي' : 'AI Cover Letter Generator'}</h2>
              <p className="text-xs text-indigo-200">{isAr ? 'إنشاء خطاب تغطية مخصص في ثوانٍ' : 'Tailor a cover letter for any role in seconds'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">{isAr ? 'اسم الشركة' : 'Company'}</label>
              <input 
                type="text" 
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {!generatedLetter && (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !company.trim()}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-xs shadow-md shadow-indigo-200"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              {isGenerating ? (isAr ? 'جاري الإنشاء...' : 'Generating...') : (isAr ? 'إنشاء الخطاب بالذكاء الاصطناعي' : 'Generate Cover Letter')}
            </Button>
          )}

          {generatedLetter && (
            <div className="space-y-3">
              <div className="relative">
                <textarea 
                  value={generatedLetter}
                  onChange={e => setGeneratedLetter(e.target.value)}
                  className="w-full h-56 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button 
                  onClick={handleGenerate}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 text-slate-600"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {isAr ? 'إعادة التوليد' : 'Regenerate'}
                </Button>

                <Button 
                  onClick={handleCopy}
                  size="sm"
                  className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الخطاب' : 'Copy Cover Letter')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
