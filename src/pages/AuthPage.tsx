import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function mapAuthError(error: unknown, isAr: boolean = false): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/popup-blocked':
      return isAr 
        ? 'تم حجب النافذة المنبثقة بواسطة المتصفح. تم تحويلك لصفحة تسجيل الدخول المباشرة.'
        : 'Popup was blocked by your browser. Redirecting to Google Sign-In page...';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return isAr 
        ? 'تم إغلاق نافذة تسجيل الدخول بـ Google قبل الإكمال. يرجى المحاولة مرة أخرى.'
        : 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/unauthorized-domain':
      return isAr
        ? 'نطاق التطبيق غير معتمد في إعدادات Firebase Auth.'
        : 'This app domain is not authorized in Firebase Auth settings.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return isAr 
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.'
        : 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return isAr 
        ? 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل. جرب تسجيل الدخول بدلاً من ذلك.'
        : 'An account with this email address already exists. Try signing in instead.';
    case 'auth/weak-password':
      return isAr 
        ? 'كلمة المرور ضعيفة جداً. يرجى استخدام 6 أحرف على الأقل.'
        : 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return isAr 
        ? 'يرجى إدخال بريد إلكتروني صحيح.'
        : 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return isAr 
        ? 'محاولات تسجيل دخول فاشلة كثيرة. يرجى الانتظار لحظات وإعادة المحاولة.'
        : 'Too many failed login attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return isAr 
        ? 'تم تعطيل هذا الحساب.'
        : 'This user account has been disabled.';
    default:
      return isAr
        ? 'تعذر إتمام عملية تسجيل الدخول باستخدام Google. يرجى المحاولة مرة أخرى.'
        : 'Unable to complete sign-in with Google. Please try again.';
  }
}


export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      navigate('/app');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setErrorMsg('Please enter your full name (الاسم الكامل).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName.trim());
      }
      navigate('/app');
    } catch (err) {
      console.error('Email authentication error:', err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-3.5 sm:p-6 py-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>

      <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8 relative z-10">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-slate-900 bg-clip-text text-transparent">
          Masar AI
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl shadow-slate-200/50 relative z-10 border-slate-200 overflow-hidden">
        <CardContent className="p-5 sm:p-8">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 sm:mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              {mode === 'signin' ? 'Welcome Back' : 'Get Started with Masar AI'}
            </h1>
            <p className="text-slate-500 text-xs">
              {mode === 'signin' 
                ? 'Sign in to access your secure job application tracker' 
                : 'Create your account to start managing your career path'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full h-12 gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm text-sm font-semibold"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                </svg>
              )}
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">الاسم الكامل / Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm font-medium" 
                  placeholder="مثال: محمد القحطاني" 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm" 
                placeholder="you@example.com" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm" 
                placeholder="••••••••" 
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-11 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

