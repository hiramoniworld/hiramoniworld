import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading, authError, signInEmail, signInGoogle, resendVerification, signOut, clearAuthError } =
    useAuth();

  const [email, setEmail] = useState('hiramoniamar@gmail.com');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const verifyOnServer = async () => {
      if (!user || !user.emailVerified) {
        if (active) setServerVerified(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        if (resp.ok) {
          setServerVerified(true);
          setServerError(null);
        } else {
          setServerVerified(false);
          const data = (await resp.json().catch(() => ({}))) as { error?: string };
          setServerError(data.error || 'Admin authorization denied.');
        }
      } catch {
        // Fallback when running purely client-side without Node /api
        if (active) setServerVerified(role === 'admin');
      }
    };
    void verifyOnServer();
    return () => {
      active = false;
    };
  }, [user, role]);

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

  if (loading || (user && serverVerified === null)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">
        Verifying administrator authorization…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="border border-slate-800 bg-[#0C1120]/95 rounded-xl p-6 sm:p-7 space-y-5">
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <h1 className="font-editorial text-3xl text-slate-50">Admin Portal</h1>
            <p className="text-xs text-slate-400">
              Restricted to The Creator. Server-verified authorization required.
            </p>
          </div>

          {authError ? (
            <div role="alert" className="border border-rose-500/40 bg-rose-500/10 rounded-lg p-3 text-xs text-rose-200">
              {authError}
            </div>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="admin-email" className="block text-xs text-slate-300">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 focus:border-amber-300 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-password" className="block text-xs text-slate-300">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 focus:border-amber-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-amber-300 text-slate-950 font-medium text-sm hover:bg-amber-200 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Verifying…' : 'Sign In as Admin'}
            </button>
          </form>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void signInGoogle()}
            className="w-full py-2.5 rounded-lg border border-slate-700 bg-[#060810] text-sm text-slate-200 hover:border-amber-300/40 transition-colors"
          >
            Sign In with Authorized Google Account
          </button>
        </div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="border border-amber-400/30 bg-[#0C1120] rounded-xl p-8 space-y-4 text-center">
          <ShieldCheck className="w-8 h-8 text-amber-300 mx-auto" aria-hidden="true" />
          <h1 className="font-editorial text-3xl text-slate-100">Email Verification Required</h1>
          <p className="text-sm text-slate-300">
            Please verify your email address ({user.email}) and refresh this page to access the Admin Portal.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await resendVerification();
                setVerificationSent(true);
              }}
              className="px-4 py-2 text-xs rounded-lg bg-amber-300 text-slate-950 font-medium hover:bg-amber-200"
            >
              {verificationSent ? 'Verification Email Sent' : 'Send Verification Email'}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'admin' || !serverVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="border border-rose-500/30 bg-[#0C1120] rounded-xl p-8 space-y-4 text-center">
          <ShieldCheck className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
          <h1 className="font-editorial text-3xl text-slate-100">Unauthorized Access</h1>
          <p className="text-sm text-slate-400">
            {serverError || 'This account does not have administrator privileges for HIRA.'}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
