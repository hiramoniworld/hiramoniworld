import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { DEFAULT_SITE_SETTINGS, subscribeSiteSettings } from '../services/firestoreService';
import type { Language, SiteSettings, UserRole } from '../types/hira';

const BOOTSTRAP_ADMIN_EMAIL = 'hiramoniamar@gmail.com';
const HIRA_ALLOWED_EMAIL = 'hiramoniworld@gmail.com';

export function isAuthorizedUniverseUser(firebaseUser: User | null): boolean {
  if (!firebaseUser) return false;
  if (firebaseUser.emailVerified) return true;
  const email = (firebaseUser.email || '').toLowerCase();
  const hasPasswordProvider = firebaseUser.providerData.some((p) => p.providerId === 'password');
  return email === HIRA_ALLOWED_EMAIL && hasPasswordProvider;
}

interface AuthContextValue {
  user: User | null;
  isAuthorized: boolean;
  role: UserRole | null;
  loading: boolean;
  authError: string | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  siteSettings: SiteSettings;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resendVerification: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>('en');
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeSettings: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError(null);

      if (unsubscribeSettings) {
        unsubscribeSettings();
        unsubscribeSettings = undefined;
      }

      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      const authorized = isAuthorizedUniverseUser(firebaseUser);

      try {
        const token = await firebaseUser.getIdToken();
        let resolvedRole: UserRole | null = null;

        try {
          const resp = await fetch('/api/verify-session', {
            method: 'POST',
            headers: {
              'X-Firebase-Token': token,
              'Content-Type': 'application/json',
            },
          });
          if (resp.ok) {
            const payload = (await resp.json()) as { role?: UserRole };
            if (payload.role === 'admin' || payload.role === 'hira') {
              resolvedRole = payload.role;
            }
          } else if (resp.status === 403) {
            const errJson = (await resp.json().catch(() => ({}))) as { error?: string };
            if (errJson.error && !authorized) {
              setAuthError(errJson.error);
            }
          }
        } catch {
          // Fallback to client check when running without Node /api
        }

        if (!resolvedRole && authorized) {
          const email = (firebaseUser.email || '').toLowerCase();
          if (email === BOOTSTRAP_ADMIN_EMAIL && firebaseUser.emailVerified) {
            resolvedRole = 'admin';
          } else {
            const adminSnap = firebaseUser.emailVerified
              ? await getDoc(doc(db, 'admins', firebaseUser.uid)).catch(() => null)
              : null;
            resolvedRole = adminSnap?.exists() ? 'admin' : 'hira';
          }
        }

        setRole(resolvedRole);

        if (authorized && resolvedRole) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef).catch(() => null);
          if (userSnap && !userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (resolvedRole === 'admin' ? 'The Creator' : 'Hira'),
              role: resolvedRole,
              preferredLanguage: 'en',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }

          unsubscribeSettings = subscribeSiteSettings((nextSettings) => {
            setSiteSettings(nextSettings);
          });
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, []);

  const signInEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Sign-in failed.';
      const msg = raw.includes('auth/operation-not-allowed')
        ? 'Email/Password login is not enabled in Firebase Console yet. Enable Email/Password under Authentication -> Sign-in method, and add your users under Authentication -> Users.'
        : raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')
        ? 'Incorrect email or password. Please check and try again.'
        : raw;
      setAuthError(msg);
      throw err;
    }
  };

  const signInGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Google sign-in failed.';
      const msg =
        raw.includes('auth/popup-closed-by-user') || raw.includes('auth/popup-blocked')
          ? 'The Google sign-in popup was closed or blocked inside the embedded preview. Open the Preview URL in a new browser tab and try again.'
          : raw;
      setAuthError(msg);
      throw err;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRole(null);
  };

  const isAuthorized = useMemo(() => isAuthorizedUniverseUser(user), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthorized,
      role,
      loading,
      authError,
      language,
      setLanguage: setLanguageState,
      reducedMotion,
      setReducedMotion: setReducedMotionState,
      siteSettings,
      signInEmail,
      signInGoogle,
      resendVerification,
      signOut,
      clearAuthError: () => setAuthError(null),
    }),
    [user, isAuthorized, role, loading, authError, language, reducedMotion, siteSettings]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
