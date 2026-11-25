import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  deleteDocumentById,
  listAudioItems,
  listDailyDiscoveries,
  listHiddenDiscoveries,
  listLetters,
  listMemories,
  listQuestions,
  listScienceArticles,
  listSharedQuestionResponsesForAdmin,
  listStoryChapters,
  listTimelineEntries,
  saveAudioItem,
  saveDailyDiscovery,
  saveHiddenDiscovery,
  saveLetter,
  saveMemory,
  saveQuestion,
  saveScienceArticle,
  saveStoryChapter,
  saveTimelineEntry,
  updateContentStatus,
} from '../../services/firestoreService';
import type {
  AudioItem,
  CelestialType,
  ContentStatus,
  DailyDiscoveryItem,
  DiscoveryType,
  EpistemicLevel,
  HiddenDiscoveryItem,
  LetterItem,
  MemoryItem,
  PrivateQuestionResponse,
  QuestionItem,
  ScienceArticleItem,
  StoryChapterItem,
  TimelineEntryItem,
  TimelineEra,
} from '../../types/hira';
import {
  dhakaInputToTimestamp,
  formatDhakaDateTime,
  getTodayDhakaKey,
  timestampToDhakaInputs,
} from '../../utils/dhakaTime';
import { sha256Hex } from '../../utils/journalCrypto';

export type ContentModule =
  | 'memories'
  | 'dailyDiscoveries'
  | 'questions'
  | 'letters'
  | 'timelineEntries'
  | 'hiddenDiscoveries'
  | 'audioItems'
  | 'storyChapters'
  | 'scienceArticles';

interface Props {
  module: ContentModule;
  onDataChanged?: () => void;
}

export const AdminContentManager: React.FC<Props> = ({ module, onDataChanged }) => {
  const [items, setItems] = useState<Array<Record<string, unknown> & { id: string; status: ContentStatus }>>([]);
  const [sharedResponses, setSharedResponses] = useState<PrivateQuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'title'>('newest');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewItem, setPreviewItem] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Shared Form Fields
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [body, setBody] = useState('');
  const [bodyBn, setBodyBn] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryBn, setSummaryBn] = useState('');
  const [category, setCategory] = useState('General');
  const [dateLabel, setDateLabel] = useState('');
  const [dateKey, setDateKey] = useState(getTodayDhakaKey());
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [schedDate, setSchedDate] = useState(getTodayDhakaKey());
  const [schedTime, setSchedTime] = useState('09:00');

  // Module-specific fields
  const [celestialType, setCelestialType] = useState<CelestialType>('star');
  const [starX, setStarX] = useState(50);
  const [starY, setStarY] = useState(50);
  const [discoveryType, setDiscoveryType] = useState<DiscoveryType>('thought');
  const [isHiddenDiscovery, setIsHiddenDiscovery] = useState(false);
  const [isDailyQuestion, setIsDailyQuestion] = useState(false);
  const [era, setEra] = useState<TimelineEra>('present');
  const [timelineSort, setTimelineSort] = useState(1);
  const [passcodePlain, setPasscodePlain] = useState('');
  const [existingPasscodeHash, setExistingPasscodeHash] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [storyTitle, setStoryTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [epistemicLevel, setEpistemicLevel] = useState<EpistemicLevel>('theory');
  const [authorNotes, setAuthorNotes] = useState('');
  const [sourcesText, setSourcesText] = useState('');

  const loadModule = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let rows: unknown[] = [];
      if (module === 'memories') rows = await listMemories(true);
      if (module === 'dailyDiscoveries') rows = await listDailyDiscoveries(true);
      if (module === 'questions') {
        rows = await listQuestions(true);
        const shared = await listSharedQuestionResponsesForAdmin().catch(() => []);
        setSharedResponses(shared);
      }
      if (module === 'letters') rows = await listLetters(true);
      if (module === 'timelineEntries') rows = await listTimelineEntries(true);
      if (module === 'hiddenDiscoveries') rows = await listHiddenDiscoveries(true);
      if (module === 'audioItems') rows = await listAudioItems(true);
      if (module === 'storyChapters') rows = await listStoryChapters(true);
      if (module === 'scienceArticles') rows = await listScienceArticles(true);

      setItems(rows as Array<Record<string, unknown> & { id: string; status: ContentStatus }>);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowForm(false);
    setEditingId(null);
    setPreviewItem(null);
    setNotice(null);
    void loadModule();
  }, [module]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setTitleBn('');
    setBody('');
    setBodyBn('');
    setSummary('');
    setSummaryBn('');
    setCategory('General');
    setDateLabel('');
    setDateKey(getTodayDhakaKey());
    setImageUrl('');
    setAudioUrl('');
    setVideoUrl('');
    setStatus('draft');
    setSchedDate(getTodayDhakaKey());
    setSchedTime('09:00');
    setCelestialType('star');
    setStarX(50);
    setStarY(50);
    setDiscoveryType('thought');
    setIsHiddenDiscovery(false);
    setIsDailyQuestion(false);
    setEra('present');
    setTimelineSort(1);
    setPasscodePlain('');
    setExistingPasscodeHash('');
    setDurationSeconds(0);
    setStoryTitle('');
    setChapterNumber(1);
    setEpistemicLevel('theory');
    setAuthorNotes('');
    setSourcesText('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (raw: Record<string, unknown> & { id: string; status: ContentStatus }) => {
    resetForm();
    setEditingId(raw.id);
    setStatus(raw.status || 'draft');
    const sched = timestampToDhakaInputs(raw.scheduledAt as never);
    setSchedDate(sched.date);
    setSchedTime(sched.time);

    if (module === 'memories') {
      const m = raw as unknown as MemoryItem;
      setTitle(m.title);
      setTitleBn(m.titleBn || '');
      setDateLabel(m.dateLabel || '');
      setBody(m.story || '');
      setBodyBn(m.storyBn || '');
      setSummary(m.notes || '');
      setCelestialType(m.celestialType);
      setStarX(m.starX ?? 50);
      setStarY(m.starY ?? 50);
      setImageUrl((m.images || []).join('\n'));
      setAudioUrl(m.audioUrl || '');
      setVideoUrl(m.videoUrl || '');
    } else if (module === 'dailyDiscoveries') {
      const d = raw as unknown as DailyDiscoveryItem;
      setDateKey(d.dateKey);
      setDiscoveryType(d.type);
      setTitle(d.title);
      setTitleBn(d.titleBn || '');
      setBody(d.content || '');
      setBodyBn(d.contentBn || '');
      setImageUrl(d.imageUrl || '');
      setAudioUrl(d.audioUrl || '');
      setIsHiddenDiscovery(Boolean(d.isHidden));
    } else if (module === 'questions') {
      const q = raw as unknown as QuestionItem;
      setCategory(q.category);
      setTitle(q.questionEn);
      setTitleBn(q.questionBn || '');
      setSummary(q.contextNote || '');
      setIsDailyQuestion(Boolean(q.isDaily));
    } else if (module === 'letters') {
      const l = raw as unknown as LetterItem;
      setCategory(l.category);
      setTitle(l.title);
      setTitleBn(l.titleBn || '');
      setBody(l.content || '');
      setBodyBn(l.contentBn || '');
      setDateLabel(l.writtenDate || '');
      setImageUrl(l.imageUrl || '');
      setAudioUrl(l.audioUrl || '');
    } else if (module === 'timelineEntries') {
      const t = raw as unknown as TimelineEntryItem;
      setEra(t.era);
      setDateLabel(t.dateLabel);
      setTimelineSort(t.sortOrder ?? 1);
      setTitle(t.title);
      setTitleBn(t.titleBn || '');
      setBody(t.description || '');
      setBodyBn(t.descriptionBn || '');
      setCategory(t.entryType || 'milestone');
    } else if (module === 'hiddenDiscoveries') {
      const h = raw as unknown as HiddenDiscoveryItem;
      setTitle(h.title);
      setTitleBn(h.titleBn || '');
      setSummary(h.clue || '');
      setSummaryBn(h.clueBn || '');
      setBody(h.content || '');
      setBodyBn(h.contentBn || '');
      setImageUrl(h.imageUrl || '');
      setExistingPasscodeHash(h.passcodeSha256 || '');
    } else if (module === 'audioItems') {
      const a = raw as unknown as AudioItem;
      setTitle(a.title);
      setTitleBn(a.titleBn || '');
      setBody(a.description || '');
      setBodyBn(a.descriptionBn || '');
      setCategory(a.category || 'voice');
      setAudioUrl(a.audioUrl);
      setDurationSeconds(a.durationSeconds || 0);
    } else if (module === 'storyChapters') {
      const s = raw as unknown as StoryChapterItem;
      setStoryTitle(s.storyTitle || '');
      setChapterNumber(s.chapterNumber);
      setTitle(s.title);
      setTitleBn(s.titleBn || '');
      setBody(s.content || '');
      setBodyBn(s.contentBn || '');
      setImageUrl(s.coverUrl || '');
      setVideoUrl(s.illustrationUrl || '');
    } else if (module === 'scienceArticles') {
      const sc = raw as unknown as ScienceArticleItem;
      setCategory(sc.topic);
      setEpistemicLevel(sc.epistemicLevel);
      setTitle(sc.title);
      setTitleBn(sc.titleBn || '');
      setSummary(sc.summary || '');
      setSummaryBn(sc.summaryBn || '');
      setBody(sc.body || '');
      setBodyBn(sc.bodyBn || '');
      setImageUrl(sc.diagramUrl || '');
      setAuthorNotes(sc.authorNotes || '');
      setSourcesText((sc.sources || []).join('\n'));
    }

    setShowForm(true);
  };

  const handleSave = async (targetStatus: ContentStatus) => {
    setSaving(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const scheduledAt =
        targetStatus === 'scheduled' ? dhakaInputToTimestamp(schedDate, schedTime) : null;
      if (targetStatus === 'scheduled' && !scheduledAt) {
        throw new Error('Please choose a valid Asia/Dhaka date and time.');
      }

      if (module === 'memories') {
        await saveMemory(editingId, {
          title,
          titleBn,
          dateLabel,
          story: body,
          storyBn: bodyBn,
          notes: summary,
          celestialType,
          starX,
          starY,
          images: imageUrl
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          audioUrl,
          videoUrl,
          relatedIds: [],
          isFavoriteByHira: false,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'dailyDiscoveries') {
        await saveDailyDiscovery(editingId, {
          dateKey,
          type: discoveryType,
          title,
          titleBn,
          content: body,
          contentBn: bodyBn,
          imageUrl,
          audioUrl,
          isHidden: isHiddenDiscovery,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'questions') {
        await saveQuestion(editingId, {
          category,
          questionEn: title,
          questionBn: titleBn,
          contextNote: summary,
          isDaily: isDailyQuestion,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'letters') {
        await saveLetter(editingId, {
          category,
          title,
          titleBn,
          content: body,
          contentBn: bodyBn,
          writtenDate: dateLabel,
          imageUrl,
          audioUrl,
          isReadByHira: false,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'timelineEntries') {
        await saveTimelineEntry(editingId, {
          era,
          dateLabel,
          sortOrder: timelineSort,
          title,
          titleBn,
          description: body,
          descriptionBn: bodyBn,
          entryType: category,
          isRecurringBirthday: false,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'hiddenDiscoveries') {
        const passcodeSha256 = passcodePlain.trim()
          ? await sha256Hex(passcodePlain.trim())
          : existingPasscodeHash;
        await saveHiddenDiscovery(editingId, {
          title,
          titleBn,
          clue: summary,
          clueBn: summaryBn,
          content: body,
          contentBn: bodyBn,
          imageUrl,
          passcodeSha256,
          isUnlockedByHira: false,
          status: targetStatus,
        });
      } else if (module === 'audioItems') {
        await saveAudioItem(editingId, {
          title,
          titleBn,
          description: body,
          descriptionBn: bodyBn,
          category,
          audioUrl,
          durationSeconds,
          relatedMemoryId: '',
          status: targetStatus,
        });
      } else if (module === 'storyChapters') {
        await saveStoryChapter(editingId, {
          storyTitle,
          chapterNumber,
          title,
          titleBn,
          content: body,
          contentBn: bodyBn,
          coverUrl: imageUrl,
          illustrationUrl: videoUrl,
          isReadByHira: false,
          status: targetStatus,
          scheduledAt,
        });
      } else if (module === 'scienceArticles') {
        await saveScienceArticle(editingId, {
          topic: category,
          epistemicLevel,
          title,
          titleBn,
          summary,
          summaryBn,
          body,
          bodyBn,
          diagramUrl: imageUrl,
          authorNotes,
          sources: sourcesText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          isReadByHira: false,
          status: targetStatus,
        });
      }

      setShowForm(false);
      resetForm();
      setNotice(`Saved successfully (${targetStatus}).`);
      await loadModule();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (id: string, nextStatus: ContentStatus) => {
    await updateContentStatus(module, id, nextStatus, null);
    setNotice(`Status updated to ${nextStatus}.`);
    await loadModule();
    if (onDataChanged) onDataChanged();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    await deleteDocumentById(module, deleteId);
    setDeleteId(null);
    setNotice('Entry deleted.');
    await loadModule();
    if (onDataChanged) onDataChanged();
  };

  const filtered = useMemo(() => {
    const base = items.filter((it) => {
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (search.trim()) {
        const text = JSON.stringify(it).toLowerCase();
        return text.includes(search.toLowerCase());
      }
      return true;
    });
    if (sortOrder === 'title') {
      return [...base].sort((a, b) =>
        String(a.title || a.questionEn || '').localeCompare(
          String(b.title || b.questionEn || '')
        )
      );
    }
    return base;
  }, [items, statusFilter, search, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-9 pr-3 py-2 rounded-lg bg-[#0C1120] border border-slate-800 text-xs text-slate-100 outline-none focus:border-amber-300"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ContentStatus)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg bg-[#0C1120] border border-slate-800 text-xs text-slate-200 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="unpublished">Unpublished</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'title')}
            aria-label="Sort items"
            className="px-3 py-2 rounded-lg bg-[#0C1120] border border-slate-800 text-xs text-slate-200 outline-none"
          >
            <option value="newest">Default Order</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200 transition-colors self-start"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Create Entry</span>
        </button>
      </div>

      {notice ? (
        <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg px-4 py-2.5 text-xs text-emerald-200">
          {notice}
        </div>
      ) : null}

      {errorMsg ? (
        <div role="alert" className="border border-rose-500/40 bg-rose-500/10 rounded-lg px-4 py-2.5 text-xs text-rose-200">
          {errorMsg}
        </div>
      ) : null}

      {/* Create / Edit Form */}
      {showForm ? (
        <div className="border border-amber-300/30 bg-[#0C1120] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-editorial text-2xl text-slate-100">
              {editingId ? 'Edit Entry' : 'New Entry'} · {module}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                {module === 'questions' ? 'Question (English) *' : 'Title (English) *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                {module === 'questions' ? 'Question (Bengali)' : 'Title (Bengali)'}
              </label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
              />
            </div>
          </div>

          {/* Module-specific metadata row */}
          {module === 'memories' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Celestial Type</label>
                <select
                  value={celestialType}
                  onChange={(e) => setCelestialType(e.target.value as CelestialType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                >
                  <option value="star">Star</option>
                  <option value="planet">Planet</option>
                  <option value="moon">Moon</option>
                  <option value="nebula">Nebula</option>
                  <option value="comet">Comet</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Date Label</label>
                <input
                  type="text"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  placeholder="e.g. October 2025"
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Star X (5-95%)</label>
                <input
                  type="number"
                  min={5}
                  max={95}
                  value={starX}
                  onChange={(e) => setStarX(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Star Y (5-95%)</label>
                <input
                  type="number"
                  min={5}
                  max={95}
                  value={starY}
                  onChange={(e) => setStarY(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'dailyDiscoveries' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Dhaka Date Key (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Discovery Type</label>
                <select
                  value={discoveryType}
                  onChange={(e) => setDiscoveryType(e.target.value as DiscoveryType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                >
                  <option value="thought">Philosophical Thought</option>
                  <option value="question">Thoughtful Question</option>
                  <option value="science_fact">Scientific Fact</option>
                  <option value="message">Personal Message</option>
                  <option value="image">Interesting Image</option>
                  <option value="audio">Audio Recording</option>
                  <option value="clue">Clue</option>
                  <option value="story_excerpt">Story Excerpt</option>
                  <option value="mystery">Small Mystery</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-6">
                <input
                  type="checkbox"
                  checked={isHiddenDiscovery}
                  onChange={(e) => setIsHiddenDiscovery(e.target.checked)}
                />
                <span>Mark as optional hidden discovery</span>
              </label>
            </div>
          ) : null}

          {module === 'questions' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Life, Consciousness, Space, Philosophy…"
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-6">
                <input
                  type="checkbox"
                  checked={isDailyQuestion}
                  onChange={(e) => setIsDailyQuestion(e.target.checked)}
                />
                <span>Highlight as Daily Question</span>
              </label>
            </div>
          ) : null}

          {module === 'letters' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Letter Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Before sleep, Birthday, For the future…"
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Actual Written Date</label>
                <input
                  type="text"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  placeholder="e.g. 2026-11-25"
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'timelineEntries' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Era</label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value as TimelineEra)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                >
                  <option value="past">Past</option>
                  <option value="present">Present</option>
                  <option value="future">Future</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Date Label *</label>
                <input
                  type="text"
                  required
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Type</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="milestone, capsule…"
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Sort Order</label>
                <input
                  type="number"
                  value={timelineSort}
                  onChange={(e) => setTimelineSort(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'hiddenDiscoveries' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Clue (English)</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Clue (Bengali)</label>
                <input
                  type="text"
                  value={summaryBn}
                  onChange={(e) => setSummaryBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Optional Passcode (hashed locally)</label>
                <input
                  type="password"
                  value={passcodePlain}
                  onChange={(e) => setPasscodePlain(e.target.value)}
                  placeholder={existingPasscodeHash ? 'Leave blank to keep existing' : 'Optional'}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'audioItems' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Audio URL *</label>
                <input
                  type="url"
                  required
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Duration (seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'storyChapters' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Story Title</label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Chapter Number *</label>
                <input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {module === 'scienceArticles' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Topic *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Cosmology, Black Holes, Consciousness…"
                    className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Epistemic Classification *</label>
                  <select
                    value={epistemicLevel}
                    onChange={(e) => setEpistemicLevel(e.target.value as EpistemicLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                  >
                    <option value="fact">Established Scientific Fact</option>
                    <option value="theory">Scientific Theory</option>
                    <option value="hypothesis">Hypothesis</option>
                    <option value="speculation">Speculative Idea</option>
                    <option value="philosophy">Philosophical Question</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Summary (English)</label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Summary (Bengali)</label>
                  <input
                    type="text"
                    value={summaryBn}
                    onChange={(e) => setSummaryBn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Content Bodies */}
          {module !== 'questions' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Content (English)</label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Content (Bengali)</label>
                <textarea
                  rows={5}
                  value={bodyBn}
                  onChange={(e) => setBodyBn(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Context Note</label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
              />
            </div>
          )}

          {/* Media URLs */}
          {module !== 'questions' && module !== 'timelineEntries' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {module !== 'audioItems' ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    {module === 'memories'
                      ? 'Image URLs (one per line)'
                      : module === 'scienceArticles'
                      ? 'Diagram / Image URL'
                      : 'Image / Cover URL'}
                  </label>
                  <textarea
                    rows={2}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or /src/assets/images/..."
                    className="w-full p-2.5 rounded-lg bg-[#060810] border border-slate-700 text-xs text-slate-100"
                  />
                </div>
              ) : null}

              {module === 'memories' || module === 'dailyDiscoveries' || module === 'letters' ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Optional Audio URL</label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-xs text-slate-100"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {module === 'scienceArticles' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Author Notes</label>
                <textarea
                  rows={2}
                  value={authorNotes}
                  onChange={(e) => setAuthorNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#060810] border border-slate-700 text-xs text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Verified References & Sources (one per line)
                </label>
                <textarea
                  rows={2}
                  value={sourcesText}
                  onChange={(e) => setSourcesText(e.target.value)}
                  placeholder="https://arxiv.org/..."
                  className="w-full p-2.5 rounded-lg bg-[#060810] border border-slate-700 text-xs text-slate-100"
                />
              </div>
            </div>
          ) : null}

          {/* Asia/Dhaka Scheduling Bar */}
          <div className="border-t border-slate-800 pt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                  <span>Schedule Date (Asia/Dhaka BST)</span>
                </label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-xs font-mono text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Time (BST)</label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#060810] border border-slate-700 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave('draft')}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave('scheduled')}
                className="px-4 py-2 rounded-lg border border-indigo-400/40 bg-indigo-400/10 text-xs text-indigo-100 hover:bg-indigo-400/20"
              >
                Schedule (BST)
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave('published')}
                className="px-5 py-2 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200"
              >
                {saving ? 'Saving…' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Records Table */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading {module}…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-slate-800 rounded-xl p-10 text-center text-sm text-slate-400">
          No entries match the current filter.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0C1120]">
          <div className="divide-y divide-slate-800/80">
            {filtered.map((item) => {
              const displayTitle = String(item.title || item.questionEn || item.id);
              const schedAt = item.scheduledAt as Parameters<typeof formatDhakaDateTime>[0];
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span
                        className={
                          item.status === 'published'
                            ? 'text-emerald-300'
                            : item.status === 'scheduled'
                            ? 'text-indigo-300'
                            : 'text-slate-400'
                        }
                      >
                        {item.status}
                      </span>
                      {item.status === 'scheduled' && schedAt ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400 tabular-nums">
                            {formatDhakaDateTime(schedAt, 'en')} BST
                          </span>
                        </>
                      ) : null}
                      {item.dateKey ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-200 tabular-nums">{String(item.dateKey)}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="text-base font-medium text-slate-100 truncate">
                      {displayTitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {item.status !== 'published' ? (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatus(item.id, 'published')}
                        className="px-2.5 py-1 text-xs rounded border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatus(item.id, 'unpublished')}
                        className="px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Unpublish
                      </button>
                    )}

                    {item.status === 'scheduled' ? (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatus(item.id, 'draft')}
                        className="px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel Schedule
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      aria-label="Preview"
                      className="p-1.5 rounded border border-slate-800 text-slate-300 hover:text-amber-200"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      aria-label="Edit"
                      className="p-1.5 rounded border border-slate-800 text-slate-300 hover:text-amber-200"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      aria-label="Delete"
                      className="p-1.5 rounded border border-slate-800 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explicitly Shared Question Responses (ONLY when Hira opted in) */}
      {module === 'questions' ? (
        <div className="border border-slate-800 bg-[#0C1120]/70 rounded-xl p-6 space-y-3">
          <h4 className="font-editorial text-xl text-slate-100">
            Explicitly Shared Responses from Hira
          </h4>
          <p className="text-xs text-slate-400">
            Private Question Room responses are hidden by default. Only answers Hira explicitly marked as shared appear here.
          </p>
          {sharedResponses.length === 0 ? (
            <p className="text-xs text-slate-500">No responses have been shared.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {sharedResponses.map((resp) => (
                <div
                  key={resp.id}
                  className="p-4 rounded-lg border border-slate-800 bg-[#060810] space-y-1"
                >
                  <p className="text-xs font-mono text-amber-200">
                    Question ID: {resp.questionId}
                  </p>
                  <p className="text-sm text-slate-200 whitespace-pre-line">
                    {resp.responseText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewItem ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-800 bg-[#0C1120] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-editorial text-2xl text-slate-100">
                {String(previewItem.title || previewItem.questionEn || 'Preview')}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-xs text-slate-400 hover:text-slate-100"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {String(
                previewItem.story ||
                  previewItem.content ||
                  previewItem.description ||
                  previewItem.body ||
                  previewItem.contextNote ||
                  ''
              )}
            </p>
            {previewItem.titleBn || previewItem.contentBn || previewItem.storyBn ? (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-xs font-mono text-amber-200">Bengali Preview</p>
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {String(
                    previewItem.storyBn ||
                      previewItem.contentBn ||
                      previewItem.descriptionBn ||
                      previewItem.bodyBn ||
                      previewItem.questionBn ||
                      ''
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Confirm deletion"
        description="Are you sure you want to permanently delete this entry from Firestore?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
