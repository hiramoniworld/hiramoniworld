import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listLetters, markLetterRead } from '../services/firestoreService';
import type { LetterItem } from '../types/hira';
import { pickText } from '../utils/i18n';

export const LetterArchivePage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<LetterItem | null>(null);

  useEffect(() => {
    let active = true;
    listLetters(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setLetters(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const categories = useMemo(() => {
    const set = new Set(letters.map((l) => l.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [letters]);

  const filtered = useMemo(() => {
    return letters.filter((l) => (category === 'all' ? true : l.category === category));
  }, [letters, category]);

  const handleOpenLetter = async (letter: LetterItem) => {
    setSelected(letter);
    if (!letter.isReadByHira && role !== 'admin') {
      setLetters((prev) =>
        prev.map((item) => (item.id === letter.id ? { ...item, isReadByHira: true } : item))
      );
      setSelected({ ...letter, isReadByHira: true });
      await markLetterRead(letter.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৪ · চিঠির আর্কাইভ' : '04 · LETTER ARCHIVE'}
        title={isBn ? 'চিঠির আর্কাইভ' : 'Letter Archive'}
        subtitle={
          isBn
            ? 'বিভিন্ন মুহূর্ত ও অনুভূতির জন্য নির্মাতার রেখে যাওয়া চিঠি। নির্ধারিত সময়েই প্রতিটি খাম খুলবে।'
            : 'Digital letters sealed for specific moments and quiet evenings. Each letter opens only when its time arrives.'
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          {isBn ? 'চিঠির খামগুলো খোঁজা হচ্ছে…' : 'Opening the archive…'}
        </div>
      ) : letters.length === 0 ? (
        <div className="space-y-8">
          <div className="max-w-xl mx-auto aspect-[4/3] rounded-xl overflow-hidden border border-slate-800/80">
            <ResilientImage
              src="/src/assets/images/hira_letter_seal_1795638127910.jpg"
              alt="Midnight archival letter paper with brass celestial seal"
            />
          </div>
          <EmptyUniverseState
            title={isBn ? 'এখনো কোনো চিঠি প্রকাশিত হয়নি' : 'No letters available yet'}
            subtitle={
              isBn
                ? 'নির্মাতা যখন কোনো চিঠি প্রকাশ বা নির্ধারণ করবেন, তখন খামটি এখানে অপেক্ষা করবে।'
                : 'When The Creator writes and releases a letter, its sealed envelope will rest here.'
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800 w-fit">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-amber-300/20 text-amber-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? (isBn ? 'সব চিঠি' : 'All Letters') : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Envelope List */}
            <div className="lg:col-span-5 space-y-3">
              {filtered.map((letter) => {
                const isSelected = selected?.id === letter.id;
                return (
                  <button
                    key={letter.id}
                    type="button"
                    onClick={() => void handleOpenLetter(letter)}
                    className={`w-full text-left p-5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-amber-300/50 bg-[#11182E]'
                        : 'border-slate-800 bg-[#0C1120]/75 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-2">
                      <span>{letter.category}</span>
                      <span className="inline-flex items-center gap-1.5">
                        {letter.isReadByHira ? (
                          <>
                            <MailOpen className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                            <span>{isBn ? 'পড়া হয়েছে' : 'Read'}</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                            <span className="text-amber-200">
                              {isBn ? 'অপঠিত' : 'Unopened'}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="font-editorial text-2xl text-slate-100">
                      {pickText(language, letter.titleBn, letter.title)}
                    </h3>
                    {letter.writtenDate ? (
                      <p className="mt-1 text-xs font-mono text-slate-500 tabular-nums">
                        {letter.writtenDate}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Opened Letter Paper */}
            <div className="lg:col-span-7">
              {selected ? (
                <article className="border border-amber-200/20 bg-gradient-to-b from-[#0E1324] to-[#090D18] rounded-xl p-8 sm:p-12 space-y-6">
                  <div className="border-b border-slate-800 pb-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-200/80">
                      <span>{selected.category}</span>
                      {selected.writtenDate ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{selected.writtenDate}</span>
                        </>
                      ) : null}
                    </div>
                    <h2 className="font-editorial text-3xl sm:text-4xl text-slate-50">
                      {pickText(language, selected.titleBn, selected.title)}
                    </h2>
                  </div>

                  {selected.imageUrl ? (
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800">
                      <ResilientImage
                        src={selected.imageUrl}
                        alt={pickText(language, selected.titleBn, selected.title)}
                      />
                    </div>
                  ) : null}

                  <div className="font-editorial text-xl sm:text-2xl text-slate-200 leading-relaxed whitespace-pre-line max-w-prose">
                    {pickText(language, selected.contentBn, selected.content)}
                  </div>

                  {selected.audioUrl ? (
                    <div className="pt-4 border-t border-slate-800">
                      <audio controls preload="metadata" className="w-full" src={selected.audioUrl}>
                        Audio playback is not supported.
                      </audio>
                    </div>
                  ) : null}
                </article>
              ) : (
                <div className="border border-slate-800 bg-[#0C1120]/70 rounded-xl overflow-hidden">
                  <div className="aspect-[16/9]">
                    <ResilientImage
                      src="/src/assets/images/hira_letter_seal_1795638127910.jpg"
                      alt="Archival letter envelope with celestial wax seal"
                    />
                  </div>
                  <div className="p-6 text-center text-sm text-slate-400">
                    {isBn
                      ? 'বাম দিক থেকে যেকোনো একটি চিঠি নির্বাচন করে খুলে পড়ো।'
                      : 'Select any letter from the archive to open and read it.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
