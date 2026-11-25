import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UI_COPY } from '../utils/i18n';

interface SectionHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  kicker,
  title,
  subtitle,
  rightSlot,
}) => {
  const { language } = useAuth();
  const copy = UI_COPY[language];

  return (
    <div className="border-b border-slate-800/80 pb-8 mb-10">
      <div className="mb-5">
        <Link
          to="/universe"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{copy.backToUniverse}</span>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <p className="text-xs font-mono tracking-widest text-amber-300/85">
            {kicker}
          </p>
          <h1 className="font-editorial text-4xl md:text-5xl font-medium text-slate-50 leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm md:text-base text-slate-300/90 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  );
};
