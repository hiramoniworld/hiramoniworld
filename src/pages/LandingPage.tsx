import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ResilientImage } from '../components/ResilientMedia';
import { useAuth } from '../context/AuthContext';
import { UI_COPY } from '../utils/i18n';

export const LandingPage: React.FC = () => {
  const { user, isAuthorized, language, siteSettings, reducedMotion } = useAuth();
  const navigate = useNavigate();
  const copy = UI_COPY[language];

  const welcomeTitle =
    language === 'bn'
      ? siteSettings.welcomeTitleBn || copy.defaultWelcomeTitle
      : siteSettings.welcomeTitleEn || copy.defaultWelcomeTitle;

  const welcomeBody =
    language === 'bn'
      ? siteSettings.welcomeBodyBn || copy.defaultWelcomeBody
      : siteSettings.welcomeBodyEn || copy.defaultWelcomeBody;

  const tagline =
    language === 'bn'
      ? copy.tagline
      : siteSettings.tagline || copy.tagline;

  const secondaryPhrase =
    language === 'bn'
      ? copy.secondaryPhrase
      : siteSettings.secondaryPhrase || copy.secondaryPhrase;

  const handleEnter = () => {
    if (user && isAuthorized) {
      navigate('/universe');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative">
      {/* Cinematic Hero Section */}
      <section className="relative min-h-[84vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
        {/* Background Artwork with measured scrim */}
        <div className="absolute inset-0 z-0">
          <ResilientImage
            src="/src/assets/images/hira_cosmos_hero_1795638126660.jpg"
            alt="HIRA cosmic astrolabe and deep space nebula"
            className="w-full h-full object-cover opacity-45"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#060810]/70 via-[#060810]/55 to-[#060810]"
          />
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-8"
        >
          <p className="text-xs font-mono tracking-[0.28em] text-amber-200/80 uppercase">
            {secondaryPhrase}
          </p>

          <div className="space-y-4">
            <h1 className="font-editorial text-6xl sm:text-7xl md:text-8xl font-semibold tracking-[0.18em] text-slate-50 drop-shadow-sm">
              {siteSettings.siteTitle || 'HIRA'}
            </h1>
            <p className="font-editorial text-xl sm:text-2xl md:text-3xl text-indigo-100/90 italic">
              {tagline}
            </p>
          </div>

          <div className="max-w-xl mx-auto border-t border-b border-slate-800/80 py-7 px-4 space-y-3">
            <h2 className="font-editorial text-2xl sm:text-3xl text-amber-100/95">
              {welcomeTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed whitespace-pre-line">
              {welcomeBody}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleEnter}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-amber-300/95 text-slate-950 font-medium text-sm hover:bg-amber-200 transition-colors"
            >
              <span>{user && isAuthorized ? copy.enterUniverse : copy.beginExploring}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Quiet Editorial Overview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-xs font-mono text-amber-200/80">01</p>
            <h3 className="font-editorial text-2xl text-slate-100">
              {language === 'bn' ? 'ব্যক্তিগত ও নীরব' : 'Private & Unhurried'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {language === 'bn'
                ? 'এই পরিসরটি কেবল দুজন অনুমোদিত ব্যবহারকারীর জন্য সংরক্ষিত। কোনো উন্মুক্ত নিবন্ধন বা বাইরের প্রবেশাধিকার নেই।'
                : 'This space is strictly reserved for two authorized accounts. There is no public registration or directory.'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono text-amber-200/80">02</p>
            <h3 className="font-editorial text-2xl text-slate-100">
              {language === 'bn' ? 'স্বাভাবিক আবিষ্কার' : 'Gradual Discovery'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {language === 'bn'
                ? 'স্মৃতির গ্যালাক্সি, প্রতিদিনের নতুন ভাবনা, চিঠি আর অধ্যায়—সবকিছু সময় ও নিজের ইচ্ছামতো দেখার জন্য সাজানো।'
                : 'Memories, daily discoveries, letters, and chapters unfold gently—without pressure or obligation.'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono text-amber-200/80">03</p>
            <h3 className="font-editorial text-2xl text-slate-100">
              {language === 'bn' ? 'একান্ত ডায়েরি — আয়না' : 'The Mirror Journal'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {language === 'bn'
                ? 'তোমার ব্যক্তিগত ডায়েরি ব্রাউজারেই পাসফ্রেজ দিয়ে এনক্রিপ্ট হয়; নির্মাতা বা সার্ভার কেউ তা পড়তে পারে না।'
                : 'Your private journal is encrypted in the browser with your passphrase before saving; The Creator cannot read it.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
