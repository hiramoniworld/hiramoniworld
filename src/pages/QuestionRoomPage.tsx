import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Lock, Share2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import {
  deleteDocumentById,
  listMyQuestionResponses,
  listQuestions,
  savePrivateQuestionResponse,
} from '../services/firestoreService';
import type { PrivateQuestionResponse, QuestionItem } from '../types/hira';
import { pickText } from '../utils/i18n';

export const QuestionRoomPage: React.FC = () => {
  const { user, role, language } = useAuth();
  const isBn = language === 'bn';

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [responses, setResponses] = useState<Record<string, PrivateQuestionResponse>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [onlySaved, setOnlySaved] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [draftText, setDraftText] = useState('');
  const [shareWithCreator, setShareWithCreator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [qs, myResps] = await Promise.all([
        listQuestions(role === 'admin'),
        listMyQuestionResponses(user.uid),
      ]);
      setQuestions(qs);
      const map: Record<string, PrivateQuestionResponse> = {};
      for (const r of myResps) {
        map[r.questionId] = r;
      }
      setResponses(map);
      if (qs.length > 0 && !activeQuestion) {
        const daily = qs.find((q) => q.isDaily) || qs[0];
        setActiveQuestion(daily);
        const existing = map[daily.id];
        setDraftText(existing?.responseText || '');
        setShareWithCreator(Boolean(existing?.isSharedWithAdmin));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user, role]);

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (category !== 'all' && q.category !== category) return false;
      if (onlySaved && !responses[q.id]?.isSaved) return false;
      return true;
    });
  }, [questions, category, onlySaved, responses]);

  const selectQuestion = (q: QuestionItem) => {
    setActiveQuestion(q);
    const existing = responses[q.id];
    setDraftText(existing?.responseText || '');
    setShareWithCreator(Boolean(existing?.isSharedWithAdmin));
    setFeedback(null);
  };

  const handleSaveResponse = async (toggleSaveOnly?: boolean) => {
    if (!user || !activeQuestion) return;
    setSaving(true);
    setFeedback(null);
    try {
      const existing = responses[activeQuestion.id];
      const nextSaved = toggleSaveOnly ? !existing?.isSaved : Boolean(existing?.isSaved);
      const id = await savePrivateQuestionResponse(
        existing?.id || null,
        user.uid,
        activeQuestion.id,
        draftText,
        nextSaved,
        shareWithCreator
      );
      const myResps = await listMyQuestionResponses(user.uid);
      const map: Record<string, PrivateQuestionResponse> = {};
      for (const r of myResps) map[r.questionId] = r;
      setResponses(map);
      if (id && !toggleSaveOnly) {
        setFeedback(isBn ? 'তোমার উত্তর সংরক্ষিত হয়েছে।' : 'Your response has been saved.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!deleteTargetId) return;
    await deleteDocumentById('privateQuestionResponses', deleteTargetId);
    setDeleteTargetId(null);
    setDraftText('');
    setShareWithCreator(false);
    await loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৩ · প্রশ্নের ঘর' : '03 · QUESTION ROOM'}
        title={isBn ? 'প্রশ্নের ঘর' : 'Question Room'}
        subtitle={
          isBn
            ? 'ভাবনার কিছু প্রশ্ন। তুমি চাইলে উত্তর লিখতে পারো—তা সম্পূর্ণ তোমার একান্ত থাকবে, যতক্ষণ না তুমি নিজে শেয়ার করতে চাও।'
            : 'Quiet questions for reflection. Your answers stay strictly private unless you explicitly choose to share a response.'
        }
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          {isBn ? 'প্রশ্নগুলো সাজানো হচ্ছে…' : 'Loading questions…'}
        </div>
      ) : questions.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'প্রশ্নের ঘর এখনো খালি' : 'No questions added yet'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন চিন্তার কোনো প্রশ্ন যোগ করবেন, তখন তা এখানে দেখা যাবে।'
              : 'When The Creator curates reflective questions, they will appear here.'
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0C1120] border border-slate-800">
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
                  {cat === 'all' ? (isBn ? 'সব বিষয়' : 'All Topics') : cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOnlySaved((v) => !v)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg border transition-colors ${
                onlySaved
                  ? 'border-amber-300/50 bg-amber-300/15 text-amber-100'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isBn ? 'সংরক্ষিত প্রশ্ন' : 'Saved for Later'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Question List */}
            <div className="lg:col-span-5 space-y-3">
              {filtered.map((q) => {
                const isSelected = activeQuestion?.id === q.id;
                const resp = responses[q.id];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => selectQuestion(q)}
                    className={`w-full text-left p-5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-amber-300/50 bg-[#11182E]'
                        : 'border-slate-800 bg-[#0C1120]/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                      <span>{q.category}</span>
                      <div className="flex items-center gap-2">
                        {q.isDaily ? (
                          <span className="text-amber-300">
                            {isBn ? 'আজকের প্রশ্ন' : 'Daily'}
                          </span>
                        ) : null}
                        {resp?.isSaved ? (
                          <Bookmark className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        ) : null}
                      </div>
                    </div>
                    <p className="font-editorial text-xl text-slate-100 leading-snug">
                      {pickText(language, q.questionBn, q.questionEn)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Question & Private Answer Editor */}
            <div className="lg:col-span-7">
              {activeQuestion ? (
                <div className="border border-slate-800 bg-[#0C1120]/90 rounded-xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-amber-200/80">
                        {activeQuestion.category}
                      </p>
                      <h2 className="font-editorial text-3xl text-slate-50 leading-snug">
                        {pickText(language, activeQuestion.questionBn, activeQuestion.questionEn)}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveResponse(true)}
                      aria-label={isBn ? 'পরে পড়ার জন্য সংরক্ষণ করো' : 'Save question for later'}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        responses[activeQuestion.id]?.isSaved
                          ? 'border-amber-300/50 bg-amber-300/15 text-amber-200'
                          : 'border-slate-700 text-slate-400 hover:text-amber-200'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          responses[activeQuestion.id]?.isSaved ? 'fill-amber-300' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {activeQuestion.contextNote ? (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {activeQuestion.contextNote}
                    </p>
                  ) : null}

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label htmlFor="private-answer" className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-300/80" aria-hidden="true" />
                        <span>
                          {isBn ? 'তোমার ব্যক্তিগত উত্তর (ঐচ্ছিক)' : 'Your private reflection (optional)'}
                        </span>
                      </label>
                      {responses[activeQuestion.id]?.id ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(responses[activeQuestion.id].id)}
                          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isBn ? 'মুছে ফেলো' : 'Delete'}</span>
                        </button>
                      ) : null}
                    </div>

                    <textarea
                      id="private-answer"
                      rows={6}
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder={
                        isBn
                          ? 'এখানে তোমার মনে আসা যেকোনো কথা লিখতে পারো…'
                          : 'Write whatever comes to mind—or simply sit with the question…'
                      }
                      className="w-full p-4 rounded-lg bg-[#060810] border border-slate-800 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none leading-relaxed"
                    />

                    <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={shareWithCreator}
                        onChange={(e) => setShareWithCreator(e.target.checked)}
                        className="mt-0.5 accent-amber-300"
                      />
                      <span className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        {isBn
                          ? 'শুধুমাত্র আমি চাইলে এই উত্তরটি নির্মাতার সাথে শেয়ার করো (ডিফল্টভাবে এটি একান্ত থাকে)'
                          : 'Explicitly share this specific answer with The Creator (private by default)'}
                      </span>
                    </label>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <span className="text-xs text-amber-200">{feedback || ''}</span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSaveResponse(false)}
                        className="px-5 py-2.5 rounded-lg bg-amber-300 text-slate-950 font-medium text-sm hover:bg-amber-200 disabled:opacity-50 transition-colors"
                      >
                        {saving
                          ? isBn
                            ? 'সংরক্ষণ হচ্ছে…'
                            : 'Saving…'
                          : isBn
                          ? 'উত্তর সংরক্ষণ করো'
                          : 'Save Response'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={isBn ? 'উত্তর মুছে ফেলতে চাও?' : 'Delete your response?'}
        description={
          isBn
            ? 'এই ব্যক্তিগত উত্তরটি স্থায়ীভাবে মুছে ফেলা হবে।'
            : 'This private reflection will be permanently removed.'
        }
        confirmLabel={isBn ? 'মুছে ফেলো' : 'Delete'}
        cancelLabel={isBn ? 'বাতিল' : 'Cancel'}
        onConfirm={() => void handleDeleteResponse()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
