import React from 'react';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UI_COPY } from '../utils/i18n';

interface EmptyUniverseStateProps {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyUniverseState: React.FC<EmptyUniverseStateProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { language } = useAuth();
  const copy = UI_COPY[language];

  return (
    <div className="border border-slate-800/80 bg-[#0C1120]/70 rounded-xl p-10 md:p-14 text-center max-w-2xl mx-auto my-8">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-amber-300/25 bg-amber-300/5 text-amber-200 mb-5">
        <Compass className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="font-editorial text-2xl md:text-3xl text-slate-100 font-medium mb-3">
        {title || copy.emptyTitle}
      </h3>
      <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
        {subtitle || copy.emptySubtitle}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-amber-300/40 text-amber-200 hover:bg-amber-300/10 transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
};
