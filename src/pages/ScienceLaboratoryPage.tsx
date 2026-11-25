import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, FlaskConical } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listScienceArticles, markScienceArticleRead } from '../services/firestoreService';
import type { EpistemicLevel, ScienceArticleItem } from '../types/hira';
import { pickText } from '../utils/i18n';

const EPISTEMIC_LABELS: Record<EpistemicLevel, { bn: string; en: string; tone: string }> = {
  fact: {
    bn: 'প্রতিষ্ঠিত বৈজ্ঞানিক তথ্য',
    en: 'Established Scientific Fact',
    tone: 'text-emerald-300',
  },
  theory: {
    bn: 'বৈজ্ঞানিক তত্ত্ব',
    en: 'Scientific Theory',
    tone: 'text-sky-300',
  },
  hypothesis: {
    bn: 'অনুকল্প (Hypothesis)',
    en: 'Hypothesis',
    tone: 'text-amber-300',
  },
  speculation: {
    bn: 'অনুমানভিত্তিক ধারণা',
    en: 'Speculative Idea',
    tone: 'text-violet-300',
  },
  philosophy: {
    bn: 'দার্শনিক প্রশ্ন',
    en: 'Philosophical Question',
    tone: 'text-slate-300',
  },
};

export const ScienceLaboratoryPage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';

  const [articles, setArticles] = useState<ScienceArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('all');
  const [levelFilter, setLevelFilter] = useState<'all' | EpistemicLevel>('all');
  const [selected, setSelected] = useState<ScienceArticleItem | null>(null);

  useEffect(() => {
    let active = true;
    listScienceArticles(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setArticles(rows);
        if (rows[0]) setSelected(rows[0]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const topics = useMemo(() => {
    const set = new Set(articles.map((a) => a.topic).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (topic !== 'all' && a.topic !== topic) return false;
      if (levelFilter !== 'all' && a.epistemicLevel !== levelFilter) return false;
      return true;
    });
  }, [articles, topic, levelFilter]);

  const handleOpenArticle = async (article: ScienceArticleItem) => {
    setSelected(article);
    if (!article.isReadByHira && role !== 'admin') {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, isReadByHira: true } : a))
      );
      setSelected({ ...article, isReadByHira: true });
      await markScienceArticleRead(article.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '১০ · বিজ্ঞান গবেষণাগার' : '10 · SCIENCE LABORATORY'}
        title={isBn ? 'বিজ্ঞান গবেষণাগার' : 'Science Laboratory'}
        subtitle={
          isBn
            ? 'মহাবিশ্ব, সময়, চেতনা ও মানব-মন নিয়ে লেখা—যেখানে প্রতিষ্ঠিত সত্য, তত্ত্ব ও অনুমানকে পরিষ্কারভাবে আলাদা রাখা হয়।'
            : 'An intellectual archive exploring cosmology, neuroscience, time, and consciousness—explicitly separating established science from hypothesis and speculation.'
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {isBn ? 'গবেষণাগার খোলা হচ্ছে…' : 'Loading research archive…'}
        </div>
      ) : articles.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          <div className="md:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-slate-800">
            <ResilientImage
              src="/src/assets/images/hira_science_cosmos_1795638128012.jpg"
              alt="Gravitational lensing spacetime diagram"
            />
          </div>
          <div className="md:col-span-6">
            <EmptyUniverseState
              title={isBn ? 'গবেষণাগারে এখনো কোনো প্রবন্ধ যুক্ত হয়নি' : 'No research notes published yet'}
              subtitle={
                isBn
                  ? 'নির্মাতা যখন যাচাইকৃত সূত্রসহ বৈজ্ঞানিক আলোচনা যুক্ত করবেন, তখন তা এখানে দেখা যাবে।'
                  : 'When The Creator adds articles with verified citations and epistemic classifications, they will appear here.'
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Topic & Epistemic Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                    topic === t
                      ? 'bg-amber-300/20 text-amber-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? (isBn ? 'সব বিষয়' : 'All Topics') : t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800">
              <button
                type="button"
                onClick={() => setLevelFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  levelFilter === 'all'
                    ? 'bg-amber-300/20 text-amber-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isBn ? 'সব স্তর' : 'All Classifications'}
              </button>
              {(Object.keys(EPISTEMIC_LABELS) as EpistemicLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                    levelFilter === lvl
                      ? 'bg-amber-300/20 text-amber-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isBn ? EPISTEMIC_LABELS[lvl].bn : EPISTEMIC_LABELS[lvl].en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Article List */}
            <div className="lg:col-span-5 space-y-3">
              {filtered.map((art) => {
                const lvlMeta = EPISTEMIC_LABELS[art.epistemicLevel] || EPISTEMIC_LABELS.theory;
                const isSelected = selected?.id === art.id;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => void handleOpenArticle(art)}
                    className={`w-full text-left p-5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-amber-300/50 bg-[#11182E]'
                        : 'border-slate-800 bg-[#0C1120]/75 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono mb-2">
                      <span className={lvlMeta.tone}>
                        {isBn ? lvlMeta.bn : lvlMeta.en}
                      </span>
                      {art.isReadByHira ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      ) : null}
                    </div>
                    <h3 className="font-editorial text-2xl text-slate-100">
                      {pickText(language, art.titleBn, art.title)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{art.topic}</p>
                  </button>
                );
              })}
            </div>

            {/* Article Detail */}
            <div className="lg:col-span-7">
              {selected ? (
                <article className="border border-slate-800 bg-[#0C1120]/90 rounded-xl overflow-hidden">
                  <div className="aspect-[16/9] border-b border-slate-800">
                    <ResilientImage
                      src={
                        selected.diagramUrl ||
                        '/src/assets/images/hira_science_cosmos_1795638128012.jpg'
                      }
                      alt={pickText(language, selected.titleBn, selected.title)}
                    />
                  </div>

                  <div className="p-6 sm:p-10 space-y-6">
                    <div className="space-y-2 border-b border-slate-800 pb-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <FlaskConical className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                        <span
                          className={
                            (EPISTEMIC_LABELS[selected.epistemicLevel] || EPISTEMIC_LABELS.theory)
                              .tone
                          }
                        >
                          {isBn
                            ? (EPISTEMIC_LABELS[selected.epistemicLevel] || EPISTEMIC_LABELS.theory).bn
                            : (EPISTEMIC_LABELS[selected.epistemicLevel] || EPISTEMIC_LABELS.theory).en}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400">{selected.topic}</span>
                      </div>

                      <h2 className="font-editorial text-3xl sm:text-4xl text-slate-50">
                        {pickText(language, selected.titleBn, selected.title)}
                      </h2>

                      {pickText(language, selected.summaryBn, selected.summary) ? (
                        <p className="text-sm text-indigo-200/85 leading-relaxed">
                          {pickText(language, selected.summaryBn, selected.summary)}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-base text-slate-200/95 leading-relaxed whitespace-pre-line max-w-prose">
                      {pickText(language, selected.bodyBn, selected.body)}
                    </div>

                    {selected.authorNotes ? (
                      <div className="border border-slate-800 bg-[#060810]/70 rounded-lg p-4 space-y-1">
                        <p className="text-xs font-mono text-amber-200/80">
                          {isBn ? 'লেখকের টীকা' : 'Author Note'}
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {selected.authorNotes}
                        </p>
                      </div>
                    ) : null}

                    {selected.sources && selected.sources.length > 0 ? (
                      <div className="pt-4 border-t border-slate-800 space-y-2">
                        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                          {isBn ? 'তথ্যসূত্র ও রেফারেন্স' : 'References & Sources'}
                        </h3>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {selected.sources.map((src, idx) => {
                            const isUrl = /^https?:\/\//i.test(src);
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="font-mono text-slate-500 tabular-nums">
                                  [{idx + 1}]
                                </span>
                                {isUrl ? (
                                  <a
                                    href={src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-amber-200 hover:underline break-all"
                                  >
                                    <span>{src}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                                  </a>
                                ) : (
                                  <span>{src}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
