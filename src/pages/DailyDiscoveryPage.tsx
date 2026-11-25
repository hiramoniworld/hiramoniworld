import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listDailyDiscoveries } from '../services/firestoreService';
import type { DailyDiscoveryItem } from '../types/hira';
import { getTodayDhakaKey } from '../utils/dhakaTime';
import { pickText } from '../utils/i18n';

export const DailyDiscoveryPage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';
  const [items, setItems] = useState<DailyDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const todayKey = useMemo(() => getTodayDhakaKey(), []);

  useEffect(() => {
    let active = true;
    listDailyDiscoveries(role === 'admin')
      .then((rows) => {
        if (!active) return;
        const sorted = [...rows].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        setItems(sorted);
        const todayItem = sorted.find((d) => d.dateKey === todayKey && !d.isHidden);
        if (todayItem) {
          setSelectedId(todayItem.id);
        } else if (sorted[0]) {
          setSelectedId(sorted[0].id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role, todayKey]);

  const visibleItems = useMemo(() => {
    return items.filter((d) => (showHidden ? true : !d.isHidden));
  }, [items, showHidden]);

  const todayDiscovery = useMemo(
    () => visibleItems.find((d) => d.dateKey === todayKey) || null,
    [visibleItems, todayKey]
  );

  const activeItem = useMemo(
    () => visibleItems.find((d) => d.id === selectedId) || todayDiscovery || visibleItems[0] || null,
    [visibleItems, selectedId, todayDiscovery]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={
          isBn
            ? `০২ · আজকের আবিষ্কার · বাংলাদেশ সময় (${todayKey})`
            : `02 · DAILY DISCOVERY · ASIA/DHAKA (${todayKey})`
        }
        title={isBn ? 'প্রতিদিনের আবিষ্কার' : 'Daily Discovery'}
        subtitle={
          isBn
            ? 'প্রতিদিন বাংলাদেশ সময় অনুযায়ী নির্মাতার পাঠানো একটি ভাবনা, বিজ্ঞান তথ্য, গল্পের অংশ বা ছোট্ট বিস্ময়।'
            : 'Each day brings a thoughtfully curated thought, scientific note, story excerpt, or quiet mystery in Bangladesh Standard Time.'
        }
        rightSlot={
          items.some((d) => d.isHidden) ? (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:border-amber-300/40 hover:text-amber-100 transition-colors"
            >
              {showHidden
                ? isBn
                  ? 'গোপন আবিষ্কার লুকাও'
                  : 'Hide secret entries'
                : isBn
                ? 'লুকানো আবিষ্কার দেখো'
                : 'Reveal hidden entries'}
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          {isBn ? 'আজকের পাতা খোলা হচ্ছে…' : 'Loading discoveries…'}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'আজকের জন্য কোনো আবিষ্কার নির্ধারিত নেই' : 'No discovery scheduled for today'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন কোনো দিনের জন্য নতুন কিছু প্রকাশ বা নির্ধারণ করবেন, তখন তা এখানে দেখা যাবে।'
              : 'When The Creator schedules or publishes a daily discovery, it will appear here cleanly.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active Discovery Card */}
          <div className="lg:col-span-8">
            {activeItem ? (
              <article className="border border-slate-800 bg-[#0C1120]/90 rounded-xl overflow-hidden">
                {activeItem.imageUrl ? (
                  <div className="aspect-[16/9] border-b border-slate-800">
                    <ResilientImage
                      src={activeItem.imageUrl}
                      alt={pickText(language, activeItem.titleBn, activeItem.title)}
                    />
                  </div>
                ) : null}

                <div className="p-6 sm:p-10 space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-amber-200 tabular-nums">{activeItem.dateKey}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeItem.type.replace('_', ' ')}</span>
                    {activeItem.dateKey === todayKey ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">
                          {isBn ? 'আজকের আবিষ্কার' : 'Today'}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="font-editorial text-3xl sm:text-4xl text-slate-50">
                    {pickText(language, activeItem.titleBn, activeItem.title)}
                  </h2>

                  <p className="text-base text-slate-200/90 leading-relaxed whitespace-pre-line max-w-prose">
                    {pickText(language, activeItem.contentBn, activeItem.content)}
                  </p>

                  {activeItem.audioUrl ? (
                    <div className="pt-4">
                      <audio controls preload="metadata" className="w-full" src={activeItem.audioUrl}>
                        Audio playback is not supported.
                      </audio>
                    </div>
                  ) : null}
                </div>
              </article>
            ) : null}
          </div>

          {/* Discovery History / Calendar List */}
          <aside className="lg:col-span-4 border border-slate-800 bg-[#0C1120]/70 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Calendar className="w-4 h-4 text-amber-300/80" aria-hidden="true" />
              <span>{isBn ? 'আবিষ্কারের আর্কাইভ' : 'DISCOVERY ARCHIVE'}</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {visibleItems.map((item) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left py-3.5 px-2 transition-colors ${
                      isSelected ? 'text-amber-100' : 'text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-500">
                      <span className="tabular-nums">{item.dateKey}</span>
                      <span>{item.type.replace('_', ' ')}</span>
                    </div>
                    <p className="mt-1 font-medium text-sm truncate">
                      {pickText(language, item.titleBn, item.title)}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
