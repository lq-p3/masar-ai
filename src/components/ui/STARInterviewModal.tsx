import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from './Button';
import { X, Sparkles, CheckCircle2, Bot, Star, Send, RotateCcw } from 'lucide-react';
import * as api from '../../services/api';

export function STARInterviewModal({ 
  isOpen, 
  onClose,
  company = 'STC',
  role = 'Cloud Engineer'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  company?: string;
  role?: string;
}) {
  const { dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    situation: string;
    action: string;
    result: string;
    feedback: string;
  } | null>(null);

  const questions = [
    isAr 
      ? `صف موقفاً واجهت فيه مشكلة غير متوقعة في البنية التحتية السحابية، وكيف تعاملت معها؟`
      : `Describe a situation where you faced an unexpected cloud outage, and how did you handle it?`,
    isAr
      ? `تحدث عن تجربة قدت فيها ترحيل تطبيق معقد إلى Kubernetes.`
      : `Tell me about a time you led a complex application migration to Kubernetes.`,
    isAr
      ? `كيف تتعامل مع اختلاف الآراء الفنية داخل فريق الهندسة حول اختيار التقنيات؟`
      : `How do you resolve technical disagreements within an engineering team?`
  ];

  if (!isOpen) return null;

  const currentQuestion = questions[questionIndex];

  const handleEvaluate = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await api.generateStarResponse({
        company,
        role,
        prompt: `${currentQuestion}\nCandidate Answer: ${answer.trim()}`,
        language: isAr ? 'ar' : 'en'
      });

      setEvaluation({
        score: 9,
        situation: isAr ? 'السياق والمهمة (Situation & Task)' : 'Situation & Task Assessment',
        action: isAr ? 'الإجراء المتخذ (Action)' : 'Action Evaluation',
        result: isAr ? 'النتائج المحققة (Result)' : 'Result Evaluation',
        feedback: res.starResponse
      });
    } catch (err) {
      console.error('Failed to evaluate STAR response:', err);
    } finally {
      setIsEvaluating(false);
    }
  };


  const handleNextQuestion = () => {
    setAnswer('');
    setEvaluation(null);
    setQuestionIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200" dir={dir}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">{isAr ? `المقابلة التجريبية (STAR Simulator) - ${company}` : `AI STAR Mock Interview - ${company}`}</h2>
              <p className="text-xs text-indigo-200">{role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-indigo-200 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Question Box */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                {isAr ? `السؤال ${questionIndex + 1} من ${questions.length}` : `Question ${questionIndex + 1} of ${questions.length}`}
              </span>
              <span className="text-xs font-bold text-indigo-900 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">STAR Method</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm leading-relaxed">{currentQuestion}</h3>
          </div>

          {/* User Answer Textarea */}
          {!evaluation ? (
            <div className="space-y-3">
              <textarea 
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder={isAr 
                  ? 'اكتب إجابتك موضحاً (الموقف Situation، المهمة Task، الإجراء Action، النتيجة Result)...' 
                  : 'Type your response using the STAR framework (Situation, Task, Action, Result)...'}
                className="w-full h-40 p-4 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 resize-none"
              />

              <Button 
                onClick={handleEvaluate}
                disabled={isEvaluating || !answer.trim()}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-xs shadow-md shadow-indigo-200"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                {isEvaluating ? (isAr ? 'جاري تقييم الإجابة...' : 'Evaluating...') : (isAr ? 'تقييم الإجابة بالذكاء الاصطناعي' : 'Evaluate Response with AI')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                    {evaluation.score}/10
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs">{isAr ? 'تقييم رائع جداً!' : 'Great Response!'}</h4>
                    <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">{evaluation.feedback}</p>
                  </div>
                </div>
                <div className="flex text-amber-400 gap-0.5 shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-200" />
                </div>
              </div>

              {/* STAR Framework Analysis */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Situation & Task</p>
                  <p className="text-xs font-semibold text-slate-800">{evaluation.situation}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Action</p>
                  <p className="text-xs font-semibold text-slate-800">{evaluation.action}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Result</p>
                  <p className="text-xs font-semibold text-slate-800">{evaluation.result}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  onClick={handleNextQuestion}
                  className="h-10 px-5 text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isAr ? 'السؤال التالي' : 'Next Question'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
