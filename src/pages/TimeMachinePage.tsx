import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listTimelineEntries } from '../services/firestoreService';
import type { TimelineEntryItem, TimelineEra } from '../types/hira';
import { pickText } from '../utils/i18n';

export const TimeMachinePage: React.FC = () => {
  const { role, language, siteSettings } = useAuth();
  const isBn = language === 'bn';

  const [entries, setEntries] = useState<TimelineEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [era, setEra] = useState<'all' | TimelineEra>('all');

  useEffect(() => {
    let active = true;
    listTimelineEntries(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setEntries([...rows].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const birthdayLabel = useMemo(() => {
    const mmdd = siteSettings.birthdayMonthDay || '10-13';
    if (mmdd === '10-13') {
      return isBn ? '১৩ অক্টোবর' : 'October 13';
    }
    return mmdd;
  }, [siteSettings.birthdayMonthDay, isBn]);

  const filtered = useMemo(() => {
    if (era === 'all') return entries;
    return entries.filter((e) => e.era === era);
  }, [entries, era]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৫ · সময়যান' : '05 · TIME MACHINE'}
        title={isBn ? 'সময়যান' : 'Time Machine'}
        subtitle={
          isBn
            ? 'অতীত, বর্তমান এবং ভবিষ্যতের রেখায় সংরক্ষিত দিন, মাইলফলক এবং সময়ের বার্তা।'
            : 'Moments, milestones, and time capsules arranged across Past, Present, and Future.'
        }
      />

      {/* Recurring Birthday Calendar Marker (no invented year) */}
      <div className="mb-10 border border-amber-300/30 bg-amber-300/5 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg border border-amber-300/30 bg-[#0C1120] text-amber-200 shrink-0">
            <CalendarDays className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono text-amber-200/85">
              {isBn ? 'বার্ষিক ক্যালেন্ডার চিহ্ন' : 'RECURRING CALENDAR MARKER'}
            </p>
            <h2 className="font-editorial text-2xl text-slate-50">
              {isBn ? `হীরার জন্মদিন · ${birthdayLabel}` : `Hira's Birthday · ${birthdayLabel}`}
            </h2>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'এই ক্যালেন্ডার চিহ্নটি প্রতি বছর ফিরে আসে এবং নির্মাতার সেটিংস থেকে সম্পাদনাযোগ্য।'
                : 'A recurring annual marker on the universe calendar, editable from Admin Settings.'}
            </p>
          </div>
        </div>
        <span className="font-mono text-lg text-amber-200 tabular-nums shrink-0">
          {birthdayLabel}
        </span>
      </div>

      {/* Era Filter */}
      <div className="mb-8 flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800 w-fit">
        {(
          [
            ['all', isBn ? 'সকল সময়' : 'All Eras'],
            ['past', isBn ? 'অতীত' : 'Past'],
            ['present', isBn ? 'বর্তমান' : 'Present'],
            ['future', isBn ? 'ভবিষ্যৎ' : 'Future'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setEra(key)}
            className={`px-3.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
              era === key
                ? 'bg-amber-300/20 text-amber-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {isBn ? 'সময়ের রেখা সাজানো হচ্ছে…' : 'Loading timeline…'}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'এই অধ্যায়ে এখনো কোনো তারিখ যোগ করা হয়নি' : 'No timeline milestones here yet'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন কোনো মাইলফলক বা টাইম ক্যাপসুল যোগ করবেন, তা এখানে সময়ের ক্রমে দেখা যাবে।'
              : 'When The Creator adds milestones or time capsules, they will appear along this arc.'
          }
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="relative border border-slate-800 bg-[#0C1120]/80 rounded-xl p-6 sm:p-8 space-y-3"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[25px] sm:-left-[33px] top-8 w-2.5 h-2.5 rounded-full bg-amber-300 ring-4 ring-[#060810]"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <span className="text-amber-200">{entry.era.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{entry.dateLabel}</span>
                {entry.entryType ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{entry.entryType}</span>
                  </>
                ) : null}
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-slate-50">
                {pickText(language, entry.titleBn, entry.title)}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line max-w-prose">
                {pickText(language, entry.descriptionBn, entry.description)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
