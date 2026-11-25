import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listStoryChapters, markChapterRead } from '../services/firestoreService';
import type { StoryChapterItem } from '../types/hira';
import { pickText } from '../utils/i18n';

export const UnfinishedStoryPage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';

  const [chapters, setChapters] = useState<StoryChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    listStoryChapters(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setChapters(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const activeChapter = chapters[activeIndex] || null;
  const readCount = useMemo(
    () => chapters.filter((c) => c.isReadByHira).length,
    [chapters]
  );

  const openChapter = async (idx: number) => {
    setActiveIndex(idx);
    const ch = chapters[idx];
    if (ch && !ch.isReadByHira && role !== 'admin') {
      setChapters((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, isReadByHira: true } : item))
      );
      await markChapterRead(ch.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৯ · অসমাপ্ত গল্প' : '09 · UNFINISHED STORY'}
        title={isBn ? 'অসমাপ্ত গল্প' : 'Unfinished Story'}
        subtitle={
          isBn
            ? 'অধ্যায়ে অধ্যায়ে লেখা একটি ধারাবাহিক আখ্যান—ধীরে ধীরে, সময়ের সাথে এগিয়ে চলে।'
            : 'A chapter-by-chapter narrative archive, unfolding calmly as new pages are released.'
        }
        rightSlot={
          chapters.length > 0 ? (
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              {isBn
                ? `পঠিত: ${readCount} / ${chapters.length}`
                : `Progress: ${readCount} / ${chapters.length} chapters`}
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {isBn ? 'অধ্যায়গুলো সাজানো হচ্ছে…' : 'Opening the book…'}
        </div>
      ) : chapters.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
          <div className="md:col-span-5 aspect-[3/4] rounded-xl overflow-hidden border border-slate-800">
            <ResilientImage
              src="/src/assets/images/hira_story_cover_1795638127414.jpg"
              alt="Minimalist starry observatory book cover"
            />
          </div>
          <div className="md:col-span-7">
            <EmptyUniverseState
              title={isBn ? 'গল্পের প্রথম অধ্যায় এখনো অপেক্ষায়' : 'Chapter 1 is still being written'}
              subtitle={
                isBn
                  ? 'নির্মাতা যখন প্রথম অধ্যায় প্রকাশ করবেন, তখন এই আখ্যানের পাতা এখানে খুলবে।'
                  : 'When The Creator publishes the opening chapter, the story archive will begin here.'
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Book Cover & Chapter Directory */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="aspect-[3/4] max-w-[260px] mx-auto lg:max-w-none rounded-xl overflow-hidden border border-slate-800">
              <ResilientImage
                src={
                  activeChapter?.coverUrl ||
                  '/src/assets/images/hira_story_cover_1795638127414.jpg'
                }
                alt={activeChapter?.storyTitle || 'Unfinished Story Cover'}
              />
            </div>

            <div className="border border-slate-800 bg-[#0C1120]/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <BookOpen className="w-4 h-4 text-amber-300/80" aria-hidden="true" />
                <span>{isBn ? 'অধ্যায় তালিকা' : 'CHAPTER INDEX'}</span>
              </div>
              <div className="divide-y divide-slate-800/80">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => void openChapter(idx)}
                    className={`w-full text-left py-3 px-2 transition-colors flex items-center justify-between gap-3 ${
                      idx === activeIndex
                        ? 'text-amber-200'
                        : 'text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <span className="text-sm truncate">
                      <span className="font-mono text-xs text-slate-500 mr-2 tabular-nums">
                        {String(ch.chapterNumber).padStart(2, '0')}.
                      </span>
                      {pickText(language, ch.titleBn, ch.title)}
                    </span>
                    {ch.isReadByHira ? (
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {isBn ? 'পঠিত' : 'Read'}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Chapter Reader */}
          <div className="lg:col-span-8">
            {activeChapter ? (
              <article className="border border-slate-800 bg-[#0C1120]/90 rounded-xl p-7 sm:p-12 space-y-7">
                <div className="border-b border-slate-800 pb-6 space-y-2">
                  <p className="text-xs font-mono text-amber-200/85">
                    {activeChapter.storyTitle || (isBn ? 'অসমাপ্ত গল্প' : 'Unfinished Story')} ·{' '}
                    {isBn
                      ? `অধ্যায় ${activeChapter.chapterNumber}`
                      : `Chapter ${activeChapter.chapterNumber}`}
                  </p>
                  <h2 className="font-editorial text-3xl sm:text-5xl text-slate-50">
                    {pickText(language, activeChapter.titleBn, activeChapter.title)}
                  </h2>
                </div>

                {activeChapter.illustrationUrl ? (
                  <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-800">
                    <ResilientImage
                      src={activeChapter.illustrationUrl}
                      alt={pickText(language, activeChapter.titleBn, activeChapter.title)}
                    />
                  </div>
                ) : null}

                <div className="font-editorial text-xl sm:text-2xl text-slate-200 leading-relaxed whitespace-pre-line max-w-prose">
                  {pickText(language, activeChapter.contentBn, activeChapter.content)}
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => void openChapter(activeIndex - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>{isBn ? 'পূর্ববর্তী অধ্যায়' : 'Previous'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={activeIndex >= chapters.length - 1}
                    onClick={() => void openChapter(activeIndex + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300/40 text-xs text-amber-100 hover:bg-amber-300/15 disabled:opacity-40 transition-colors"
                  >
                    <span>{isBn ? 'পরবর্তী অধ্যায়' : 'Next Chapter'}</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
