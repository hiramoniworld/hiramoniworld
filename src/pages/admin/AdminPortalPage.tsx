import React, { useEffect, useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listAudioItems,
  listDailyDiscoveries,
  listLetters,
  listMediaLibrary,
  listMemories,
  listMessages,
  listStoryChapters,
  markMessageRead,
  saveSiteSettings,
  sendPrivateMessage,
} from '../../services/firestoreService';
import type { MessageItem, SectionId, SiteSettings } from '../../types/hira';
import { ALL_SECTIONS } from '../../types/hira';
import { formatDhakaDateTime } from '../../utils/dhakaTime';
import { AdminContentManager, type ContentModule } from './AdminContentManager';
import { AdminLoginGate } from './AdminLoginGate';
import { AdminMediaLibrary } from './AdminMediaLibrary';

type AdminTab =
  | 'overview'
  | ContentModule
  | 'inbox'
  | 'media'
  | 'settings';

interface DashboardMetrics {
  publishedMemories: number;
  draftMemories: number;
  scheduledDiscoveries: number;
  publishedLetters: number;
  unreadMessages: number;
  storyChapters: number;
  mediaCount: number;
  audioCount: number;
}

const MODULE_TABS: Array<{ id: ContentModule; label: string }> = [
  { id: 'memories', label: 'Memories' },
  { id: 'dailyDiscoveries', label: 'Daily Discovery' },
  { id: 'questions', label: 'Questions' },
  { id: 'letters', label: 'Letters' },
  { id: 'timelineEntries', label: 'Time Machine' },
  { id: 'hiddenDiscoveries', label: 'Hidden Universe' },
  { id: 'audioItems', label: 'Audio' },
  { id: 'storyChapters', label: 'Story Chapters' },
  { id: 'scienceArticles', label: 'Science Lab' },
];

export const AdminPortalPage: React.FC = () => {
  const { user, siteSettings } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    publishedMemories: 0,
    draftMemories: 0,
    scheduledDiscoveries: 0,
    publishedLetters: 0,
    unreadMessages: 0,
    storyChapters: 0,
    mediaCount: 0,
    audioCount: 0,
  });

  // Inbox state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  const loadDashboard = async () => {
    if (!user) return;
    const [mems, discs, lets, chaps, medias, audios, msgs] = await Promise.all([
      listMemories(true).catch(() => []),
      listDailyDiscoveries(true).catch(() => []),
      listLetters(true).catch(() => []),
      listStoryChapters(true).catch(() => []),
      listMediaLibrary().catch(() => []),
      listAudioItems(true).catch(() => []),
      listMessages(user.uid, true).catch(() => []),
    ]);

    setMetrics({
      publishedMemories: mems.filter((m) => m.status === 'published').length,
      draftMemories: mems.filter((m) => m.status === 'draft').length,
      scheduledDiscoveries: discs.filter((d) => d.status === 'scheduled').length,
      publishedLetters: lets.filter((l) => l.status === 'published').length,
      unreadMessages: msgs.filter((m) => !m.isRead && m.senderRole === 'hira').length,
      storyChapters: chaps.length,
      mediaCount: medias.length,
      audioCount: audios.length,
    });
    setMessages(msgs);
  };

  useEffect(() => {
    if (user) void loadDashboard();
  }, [user]);

  const handleReplySend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await sendPrivateMessage(user.uid, 'admin', replyText.trim());
      for (const m of messages) {
        if (!m.isRead && m.senderRole === 'hira') {
          void markMessageRead(m.id);
        }
      }
      setReplyText('');
      await loadDashboard();
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsNotice(null);
    try {
      await saveSiteSettings(settingsForm);
      setSettingsNotice('Universe settings saved.');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleSectionVisibility = (secId: SectionId) => {
    const current = new Set(settingsForm.visibleSections || ALL_SECTIONS);
    if (current.has(secId)) {
      current.delete(secId);
    } else {
      current.add(secId);
    }
    setSettingsForm({ ...settingsForm, visibleSections: Array.from(current) });
  };

  return (
    <AdminLoginGate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-amber-300/85">HIRA · CREATOR STUDIO</p>
            <h1 className="font-editorial text-4xl text-slate-50">Admin Portal</h1>
            <p className="text-xs text-slate-400">
              Manage published memories, scheduled discoveries (Asia/Dhaka), letters, media, and manual replies.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded-lg px-3 py-2">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Private Journal Isolated (Zero Admin Access)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0C1120] border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              tab === 'overview' ? 'bg-amber-300/20 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          {MODULE_TABS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setTab(m.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                tab === m.id ? 'bg-amber-300/20 text-amber-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              tab === 'inbox' ? 'bg-amber-300/20 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inbox ({metrics.unreadMessages})
          </button>
          <button
            type="button"
            onClick={() => setTab('media')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              tab === 'media' ? 'bg-amber-300/20 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Media Library
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              tab === 'settings' ? 'bg-amber-300/20 text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Published Memories', val: metrics.publishedMemories },
                { label: 'Draft Memories', val: metrics.draftMemories },
                { label: 'Scheduled Discoveries', val: metrics.scheduledDiscoveries },
                { label: 'Published Letters', val: metrics.publishedLetters },
                { label: 'Unread Messages', val: metrics.unreadMessages },
                { label: 'Story Chapters', val: metrics.storyChapters },
                { label: 'Media Assets', val: metrics.mediaCount },
                { label: 'Audio Items', val: metrics.audioCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-slate-800 bg-[#0C1120] rounded-xl p-5 space-y-1"
                >
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="font-mono text-3xl font-semibold text-slate-50 tabular-nums">
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="border border-slate-800 bg-[#0C1120]/80 rounded-xl p-6 space-y-2">
              <h2 className="font-editorial text-2xl text-slate-100">
                Real Database Counts Only
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                All numbers above reflect live Firestore documents. Private Journal entries and unshared Question Room answers are excluded by design and enforced by Firestore Security Rules.
              </p>
            </div>
          </div>
        ) : null}

        {/* Content Modules */}
        {MODULE_TABS.some((m) => m.id === tab) ? (
          <AdminContentManager
            module={tab as ContentModule}
            onDataChanged={() => void loadDashboard()}
          />
        ) : null}

        {/* Manual Communication Inbox */}
        {tab === 'inbox' ? (
          <div className="border border-slate-800 bg-[#0C1120] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 space-y-1">
              <h2 className="font-editorial text-2xl text-slate-100">
                Private Communication Inbox
              </h2>
              <p className="text-xs text-slate-400">
                Every reply sent here is manually authored by you and marked honestly as written by The Creator.
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No messages in the inbox yet.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${
                      m.senderRole === 'admin'
                        ? 'border-amber-300/30 bg-amber-300/5 ml-6'
                        : 'border-slate-800 bg-[#060810] mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                      <span>{m.senderRole === 'admin' ? 'The Creator (You)' : 'Hira'}</span>
                      <span className="tabular-nums">{formatDhakaDateTime(m.createdAt, 'en')}</span>
                    </div>
                    <p className="text-sm text-slate-100 whitespace-pre-line">{m.body}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => void handleReplySend(e)}
              className="p-5 border-t border-slate-800 bg-[#080C17] flex flex-col sm:flex-row gap-3"
            >
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a manual reply to Hira…"
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300 resize-none"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200 disabled:opacity-50"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Send Manual Reply</span>
              </button>
            </form>
          </div>
        ) : null}

        {/* Media Library */}
        {tab === 'media' ? <AdminMediaLibrary /> : null}

        {/* Site Settings */}
        {tab === 'settings' ? (
          <form
            onSubmit={(e) => void handleSaveSettings(e)}
            className="border border-slate-800 bg-[#0C1120] rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="border-b border-slate-800 pb-4">
              <h2 className="font-editorial text-2xl text-slate-100">Universe Settings</h2>
              <p className="text-xs text-slate-400">
                Customize landing welcome copy, default language, birthday marker, and visible chambers.
              </p>
            </div>

            {settingsNotice ? (
              <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3 text-xs text-emerald-200">
                {settingsNotice}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Website Title</label>
                <input
                  type="text"
                  required
                  value={settingsForm.siteTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Primary Tagline</label>
                <input
                  type="text"
                  value={settingsForm.tagline || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Birthday Marker (MM-DD)</label>
                <input
                  type="text"
                  pattern="^\d{2}-\d{2}$"
                  value={settingsForm.birthdayMonthDay}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, birthdayMonthDay: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm font-mono text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Welcome Title (Bengali)</label>
                <input
                  type="text"
                  value={settingsForm.welcomeTitleBn || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, welcomeTitleBn: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Welcome Title (English)</label>
                <input
                  type="text"
                  value={settingsForm.welcomeTitleEn || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, welcomeTitleEn: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Welcome Message (Bengali)</label>
                <textarea
                  rows={3}
                  value={settingsForm.welcomeBodyBn || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, welcomeBodyBn: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Welcome Message (English)</label>
                <textarea
                  rows={3}
                  value={settingsForm.welcomeBodyEn || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, welcomeBodyEn: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400">Visible Universe Chambers</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_SECTIONS.map((sec) => {
                  const checked = (settingsForm.visibleSections || ALL_SECTIONS).includes(sec);
                  return (
                    <label
                      key={sec}
                      className="flex items-center gap-2 text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSectionVisibility(sec)}
                      />
                      <span>{sec}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200 disabled:opacity-50"
              >
                {savingSettings ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </AdminLoginGate>
  );
};
