import React, { useState } from 'react';
import { useApplications } from '../../contexts/ApplicationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from './Button';
import { X, Sparkles, Send, Bot, User, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as api from '../../services/api';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
};

function FormattedMessage({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-1" />;

        // Parse **bold text**
        const parts = line.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={lineIdx} className="text-xs sm:text-sm">
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong 
                    key={partIdx} 
                    className={cn(
                      "font-extrabold px-1 py-0.5 rounded",
                      isUser ? "bg-indigo-700/60 text-white" : "bg-indigo-50 text-indigo-950 border border-indigo-100"
                    )}
                  >
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function AIAssistantDrawer() {
  const { isAIDrawerOpen, setIsAIDrawerOpen, applications } = useApplications();
  const { t, dir } = useLanguage();
  const isAr = dir === 'rtl';

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: isAr 
        ? 'مرحباً! أنا **مساعد مسار الذكي**. كيف يمكنني مساعدتك في رحلة تقديمك اليوم؟ يمكنك السؤال عن مراجعة التقديمات، تحضير المقابلات المجهزة، أو تحسين السيرة الذاتية.'
        : 'Hello! I am your **Masar AI assistant**. How can I help you today? You can ask about reviewing applications, interview prep, or resume optimization.',
      time: 'Just now'
    }
  ]);

  if (!isAIDrawerOpen) return null;


  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const res = await api.chatWithAI({
        message: messageText,
        applicationsCount: applications.length,
        language: isAr ? 'ar' : 'en'
      });

      const replyText = typeof res === 'string' ? res : (res && res.reply) ? res.reply : (isAr ? 'تم استلام سؤالك وتجهيز توصيات مسار AI.' : 'Your query has been processed by Masar AI.');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: isAr 
          ? 'أهلاً بك! يمكنك مراجعة المتطلبات الأساسية للمقابلة وتجهيز إجاباتك باستخدام **منهجية STAR** (الموقف Situation، المهمة Task، الإجراء Action، النتيجة Result).' 
          : 'Welcome! Review the role requirements and structure your answers using the **STAR method** (Situation, Task, Action, Result).',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir={dir}>
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAIDrawerOpen(false)}
      />

      <aside className={cn(
        "fixed inset-y-0 z-50 w-full sm:max-w-md h-[100dvh] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
        isAr ? "left-0" : "right-0"
      )}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">{t('drawer.title')}</h2>
              <p className="text-xs text-indigo-200">{t('drawer.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAIDrawerOpen(false)}
            className="p-2 text-indigo-100 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="p-3 sm:p-4 bg-indigo-50/50 border-b border-indigo-100 space-y-1.5 sm:space-y-2 shrink-0">
          <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest">{isAr ? 'أسئلة مقترحة' : 'Suggested Prompts'}</p>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {[t('drawer.prompt1'), t('drawer.prompt2'), t('drawer.prompt3')].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-xs text-start p-2 sm:p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 text-indigo-900 transition-all font-medium flex items-center justify-between group shadow-sm hover:shadow gap-2"
              >
                <span className="truncate">{prompt}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 shrink-0", isAr ? "rotate-180" : "")} />
              </button>
            ))}
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-slate-50/30">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[88%]",
                msg.sender === 'user' ? (isAr ? "mr-auto flex-row-reverse" : "ml-auto flex-row-reverse") : ""
              )}
            >
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm",
                msg.sender === 'user' ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"
              )}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <div className="min-w-0">
                <div className={cn(
                  "p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm break-words",
                  msg.sender === 'user' 
                    ? "bg-indigo-600 text-white rounded-te-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-ts-none"
                )}>
                  <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block px-1">{msg.time}</span>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs rounded-ts-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>{isAr ? 'مسار AI يفكر في الإجابة...' : 'Masar AI is thinking...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('drawer.placeholder')}
              className="flex-1 min-w-0 h-10 sm:h-11 px-3 sm:px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
            <Button type="submit" className="h-10 sm:h-11 px-3 sm:px-4 gap-2 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
