import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ALL_SECTIONS } from '../types/hira';
import { SECTION_DIRECTORY } from '../utils/i18n';

export const UniverseHubPage: React.FC = () => {
  const { language, role, siteSettings } = useAuth();

  const visibleSet = new Set(siteSettings.visibleSections || ALL_SECTIONS);
  const visibleItems = SECTION_DIRECTORY.filter((s) => visibleSet.has(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="border-b border-slate-800/80 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-mono tracking-widest text-amber-300/85">
            {language === 'bn' ? 'হীরার মহাবিশ্ব · অধ্যায়সমূহ' : 'HIRA UNIVERSE · CHAMBERS'}
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-slate-50">
            {language === 'bn'
              ? role === 'admin'
                ? 'স্বাগতম, নির্মাতা।'
                : 'আবারও স্বাগতম, হীরা।'
              : role === 'admin'
              ? 'Welcome back, Creator.'
              : 'Welcome back, Hira.'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {language === 'bn'
              ? 'তোমার জন্য সাজানো প্রতিটি অধ্যায় নিচে রয়েছে। যেকোনো নক্ষত্রকক্ষে প্রবেশ করে নিজের মতো সময় কাটাতে পারো।'
              : 'Every chamber in this universe awaits below. Enter whichever quiet corner calls to you today.'}
          </p>
        </div>

        {role === 'admin' ? (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 text-sm hover:bg-amber-300/20 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{language === 'bn' ? 'অ্যাডমিন পোর্টালে যাও' : 'Open Admin Portal'}</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((sec, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          return (
            <Link
              key={sec.id}
              to={sec.path}
              className="group border border-slate-800/90 bg-[#0C1120]/75 hover:bg-[#11182E]/90 hover:border-amber-300/40 rounded-xl p-6 flex flex-col justify-between gap-6 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>{num}</span>
                  <ArrowUpRight
                    className="w-4 h-4 text-slate-500 group-hover:text-amber-200 transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="font-editorial text-2xl text-slate-100 group-hover:text-amber-100 transition-colors">
                  {language === 'bn' ? sec.labelBn : sec.labelEn}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {language === 'bn' ? sec.subtitleBn : sec.subtitleEn}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 group-hover:text-amber-200/90 transition-colors">
                {language === 'bn' ? 'প্রবেশ করো' : 'Enter chamber'}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
