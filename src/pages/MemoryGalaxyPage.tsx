import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Search, Star } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listMemories, toggleMemoryFavorite } from '../services/firestoreService';
import type { CelestialType, MemoryItem } from '../types/hira';
import { pickText } from '../utils/i18n';

export const MemoryGalaxyPage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | CelestialType>('all');
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const [selected, setSelected] = useState<MemoryItem | null>(null);

  useEffect(() => {
    let active = true;
    listMemories(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setMemories(rows);
        if (rows.length > 0) setSelected(rows[0]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (filterType === 'favorites' && !m.isFavoriteByHira) return false;
      if (
        filterType !== 'all' &&
        filterType !== 'favorites' &&
        m.celestialType !== filterType
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${m.title} ${m.titleBn || ''} ${m.story || ''} ${m.storyBn || ''} ${m.dateLabel || ''}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [memories, filterType, search]);

  const handleToggleFavorite = async (mem: MemoryItem) => {
    const next = !mem.isFavoriteByHira;
    setMemories((prev) =>
      prev.map((item) => (item.id === mem.id ? { ...item, isFavoriteByHira: next } : item))
    );
    if (selected?.id === mem.id) {
      setSelected({ ...mem, isFavoriteByHira: next });
    }
    await toggleMemoryFavorite(mem.id, next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০১ · স্মৃতির গ্যালাক্সি' : '01 · MEMORY GALAXY'}
        title={isBn ? 'স্মৃতির গ্যালাক্সি' : 'Memory Galaxy'}
        subtitle={
          isBn
            ? 'প্রতিটি নক্ষত্র একেকটি সংরক্ষিত মুহূর্ত। যেকোনো তারা বেছে নিয়ে তার পেছনের গল্প পড়ে দেখো।'
            : 'Each celestial body holds a preserved memory. Select any star to open its story.'
        }
        rightSlot={
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-amber-300/20 text-amber-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isBn ? 'নক্ষত্র মানচিত্র' : 'Star Map'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'timeline'
                  ? 'bg-amber-300/20 text-amber-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isBn ? 'তালিকা ও সময়রেখা' : 'Timeline List'}
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          {isBn ? 'গ্যালাক্সি লোড হচ্ছে…' : 'Loading celestial map…'}
        </div>
      ) : memories.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'গ্যালাক্সিতে এখনো কোনো তারা আঁকা হয়নি' : 'No stars charted yet'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন প্রকৃত কোনো স্মৃতি যোগ করবেন, তখন এখানে প্রতিটি তারা জ্বলে উঠবে।'
              : 'When The Creator adds authentic memories, each one will appear here as a quiet star.'
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'স্মৃতি খুঁজো…' : 'Search memories…'}
                aria-label={isBn ? 'স্মৃতি খুঁজো' : 'Search memories'}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0C1120] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800">
              {(
                [
                  ['all', isBn ? 'সব' : 'All'],
                  ['favorites', isBn ? 'সংরক্ষিত' : 'Favorites'],
                  ['star', isBn ? 'তারা' : 'Star'],
                  ['planet', isBn ? 'গ্রহ' : 'Planet'],
                  ['moon', isBn ? 'চাঁদ' : 'Moon'],
                  ['nebula', isBn ? 'নীহারিকা' : 'Nebula'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                    filterType === key
                      ? 'bg-amber-300/20 text-amber-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Map or Timeline List */}
            <div className="lg:col-span-7">
              {viewMode === 'map' ? (
                <div className="relative h-[440px] sm:h-[520px] rounded-xl border border-slate-800 bg-gradient-to-b from-[#090D1A] via-[#0C1120] to-[#070A14] overflow-hidden">
                  {/* Subtle coordinate lines */}
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full opacity-20"
                  >
                    {filtered.slice(0, -1).map((mem, i) => {
                      const next = filtered[i + 1];
                      return (
                        <line
                          key={`${mem.id}-${next.id}`}
                          x1={`${mem.starX ?? 20 + ((i * 19) % 65)}%`}
                          y1={`${mem.starY ?? 20 + ((i * 23) % 60)}%`}
                          x2={`${next.starX ?? 20 + (((i + 1) * 19) % 65)}%`}
                          y2={`${next.starY ?? 20 + (((i + 1) * 23) % 60)}%`}
                          stroke="#94A3B8"
                          strokeWidth="0.8"
                          strokeDasharray="3 4"
                        />
                      );
                    })}
                  </svg>

                  {filtered.map((mem, idx) => {
                    const x = mem.starX ?? 18 + ((idx * 19) % 68);
                    const y = mem.starY ?? 18 + ((idx * 23) % 64);
                    const isSelected = selected?.id === mem.id;
                    const title = pickText(language, mem.titleBn, mem.title);

                    return (
                      <button
                        key={mem.id}
                        type="button"
                        onClick={() => setSelected(mem)}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center gap-1.5 focus:outline-none"
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-transform ${
                            isSelected
                              ? 'scale-125 bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.7)]'
                              : 'bg-indigo-200/80 group-hover:scale-110 group-hover:bg-amber-200'
                          }`}
                        >
                          <Star className="w-2.5 h-2.5 text-slate-950" aria-hidden="true" />
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] max-w-[130px] truncate transition-colors ${
                            isSelected
                              ? 'bg-[#060810]/90 text-amber-100 border border-amber-300/40'
                              : 'bg-[#060810]/70 text-slate-300 group-hover:text-slate-100'
                          }`}
                        >
                          {title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((mem) => {
                    const title = pickText(language, mem.titleBn, mem.title);
                    const active = selected?.id === mem.id;
                    return (
                      <button
                        key={mem.id}
                        type="button"
                        onClick={() => setSelected(mem)}
                        className={`w-full text-left p-5 rounded-xl border transition-colors ${
                          active
                            ? 'border-amber-300/50 bg-[#11182E]'
                            : 'border-slate-800 bg-[#0C1120]/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-editorial text-xl text-slate-100">{title}</h3>
                          {mem.isFavoriteByHira ? (
                            <Heart className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                          <span>{mem.celestialType}</span>
                          {mem.dateLabel ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{mem.dateLabel}</span>
                            </>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right / Selected Memory Detail */}
            <div className="lg:col-span-5">
              {selected ? (
                <article className="border border-slate-800 bg-[#0C1120]/90 rounded-xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{selected.celestialType}</span>
                        {selected.dateLabel ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{selected.dateLabel}</span>
                          </>
                        ) : null}
                      </div>
                      <h2 className="font-editorial text-3xl text-slate-50">
                        {pickText(language, selected.titleBn, selected.title)}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleToggleFavorite(selected)}
                      aria-label={isBn ? 'প্রিয় হিসেবে সংরক্ষণ করো' : 'Save to favorites'}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        selected.isFavoriteByHira
                          ? 'border-amber-300/50 bg-amber-300/15 text-amber-200'
                          : 'border-slate-700 text-slate-400 hover:text-amber-200'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${selected.isFavoriteByHira ? 'fill-amber-300' : ''}`}
                      />
                    </button>
                  </div>

                  {selected.images && selected.images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {selected.images.map((imgUrl, i) => (
                        <div
                          key={`${selected.id}-img-${i}`}
                          className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800"
                        >
                          <ResilientImage
                            src={imgUrl}
                            alt={`${pickText(language, selected.titleBn, selected.title)} (${i + 1})`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed whitespace-pre-line">
                    {pickText(language, selected.storyBn, selected.story)}
                  </p>

                  {selected.notes ? (
                    <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                      {selected.notes}
                    </div>
                  ) : null}

                  {selected.audioUrl ? (
                    <div className="pt-2">
                      <audio controls preload="metadata" className="w-full" src={selected.audioUrl}>
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : null}

                  {selected.videoUrl ? (
                    <div className="pt-2">
                      <video
                        controls
                        preload="metadata"
                        className="w-full rounded-lg border border-slate-800"
                        src={selected.videoUrl}
                      />
                    </div>
                  ) : null}

                  {selected.relatedIds && selected.relatedIds.length > 0 ? (
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <p className="text-xs text-slate-400">
                        {isBn ? 'সম্পর্কিত স্মৃতি' : 'Related memories'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.relatedIds.map((rid) => {
                          const target = memories.find((m) => m.id === rid);
                          if (!target) return null;
                          return (
                            <button
                              key={rid}
                              type="button"
                              onClick={() => setSelected(target)}
                              className="text-xs text-amber-200 hover:underline underline-offset-4"
                            >
                              {pickText(language, target.titleBn, target.title)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              ) : (
                <EmptyUniverseState
                  title={isBn ? 'কোনো স্মৃতি পাওয়া যায়নি' : 'No matching stars'}
                  subtitle={
                    isBn
                      ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখো।'
                      : 'Try adjusting your search or celestial filter.'
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
