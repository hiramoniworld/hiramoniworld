import React, { useEffect, useState } from 'react';
import { Lock, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const {
    user,
    isAuthorized,
    language,
    authError,
    signInEmail,
    resendVerification,
    clearAuthError,
  } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('hiramoniworld@gmail.com');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (user && isAuthorized) {
      navigate('/universe', { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSubmitting(true);
    try {
      await signInEmail(email, password);
    } catch {
      // Handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    await resendVerification();
    setVerificationSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="border border-slate-800 bg-[#0C1120]/90 rounded-xl p-6 sm:p-7 space-y-5">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200 mb-1">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
          <h1 className="font-editorial text-3xl text-slate-50">
            {language === 'bn' ? 'HIRA-তে প্রবেশ' : 'Enter HIRA'}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'bn'
              ? 'এই ব্যক্তিগত মহাবিশ্বটি কেবল অনুমোদিত অ্যাকাউন্টের জন্য। কোনো নতুন অ্যাকাউন্ট খোলা যায় না।'
              : 'This private universe is restricted to authorized accounts. Public registration is disabled.'}
          </p>
        </div>

        {user && !isAuthorized ? (
          <div className="border border-amber-400/30 bg-amber-400/10 rounded-lg p-4 space-y-3 text-sm text-amber-100">
            <div className="flex items-start gap-2.5">
              <MailCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <p className="leading-relaxed">
                {language === 'bn'
                  ? 'নিরাপত্তার জন্য তোমার ইমেইল যাচাই করা প্রয়োজন। যাচাই সম্পন্ন হলে পৃষ্ঠাটি রিফ্রেশ করো।'
                  : 'Please verify your email address before entering. Once verified, refresh this page.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleResend()}
              className="w-full py-2 text-xs font-medium rounded-lg border border-amber-300/40 text-amber-200 hover:bg-amber-300/15 transition-colors"
            >
              {verificationSent
                ? language === 'bn'
                  ? 'যাচাই লিংক পাঠানো হয়েছে'
                  : 'Verification email sent'
                : language === 'bn'
                ? 'পুনরায় যাচাই ইমেইল পাঠাও'
                : 'Resend verification email'}
            </button>
          </div>
        ) : null}

        {authError ? (
          <div
            role="alert"
            className="border border-rose-500/40 bg-rose-500/10 rounded-lg p-3 text-xs text-rose-200"
          >
            {authError}
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs text-slate-300">
              {language === 'bn' ? 'ইমেইল' : 'Email'}
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs text-slate-300">
              {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-amber-300 text-slate-950 font-medium text-sm hover:bg-amber-200 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? language === 'bn'
                ? 'যাচাই হচ্ছে…'
                : 'Entering…'
              : 'Enter'}
          </button>
        </form>

        <p className="text-center font-mono text-xs tracking-wider text-slate-400 pt-1">
          only allowed hira
        </p>
      </div>
    </div>
  );
};
