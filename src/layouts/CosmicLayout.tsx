import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTION_DIRECTORY, UI_COPY } from '../utils/i18n';
import { StarfieldCanvas } from '../components/StarfieldCanvas';

export const CosmicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    language,
    setLanguage,
    signOut,
    siteSettings,
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const copy = UI_COPY[language];

  const handlePrimaryAction = async () => {
    if (user) {
      await signOut();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const navLinks = [
    { to: '/galaxy', label: copy.navGalaxy },
    { to: '/discovery', label: copy.navDiscovery },
    { to: '/letters', label: copy.navLetters },
    { to: '/mirror', label: copy.navMirror },
    { to: '/universe', label: copy.navAllSections },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip bg-[#060810] text-slate-100">
      <StarfieldCanvas />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-14 md:h-16 border-b border-slate-800/80 bg-[#060810]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single text element Brand Wordmark */}
          <Link
            to="/"
            className="font-editorial text-xl sm:text-2xl font-semibold tracking-[0.2em] text-amber-200 whitespace-nowrap shrink-0 hover:text-amber-100 transition-colors"
          >
            {siteSettings.siteTitle || 'HIRA'}
          </Link>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-4 lg:gap-7 text-xs lg:text-sm text-slate-300 min-w-0"
          >
            {navLinks.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
                    active
                      ? 'border-amber-300 text-amber-100'
                      : 'border-transparent hover:text-slate-100 hover:border-slate-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action + mobile drawer trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void handlePrimaryAction()}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 transition-colors whitespace-nowrap shrink-0"
            >
              {user ? copy.signOut : copy.signIn}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen ? (
          <div className="md:hidden border-b border-slate-800 bg-[#0C1120] px-4 py-4 space-y-2">
            {SECTION_DIRECTORY.map((sec) => (
              <Link
                key={sec.id}
                to={sec.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
              >
                {language === 'bn' ? sec.labelBn : sec.labelEn}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-200"
              >
                {copy.languageLabel}
              </button>
              <Link
                to="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-amber-200"
              >
                {copy.privacyNoteLink}
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-slate-900/90 bg-[#060810]/90 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="font-editorial text-sm tracking-wider text-slate-400">
            HIRA · {language === 'bn' ? 'শুধু তোমার জন্য গড়া একটি মহাবিশ্ব' : 'A Universe Made Just for You'}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              {copy.privacyNoteLink}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/universe" className="hover:text-slate-300 transition-colors">
              {copy.navAllSections}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
