import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listMessages, markMessageRead, sendPrivateMessage } from '../services/firestoreService';
import type { MessageItem } from '../types/hira';
import { formatDhakaDateTime } from '../utils/dhakaTime';

export const PrivateMessagesPage: React.FC = () => {
  const { user, role, language } = useAuth();
  const isBn = language === 'bn';

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadThread = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listMessages(user.uid, role === 'admin');
      setMessages(list);
      // Mark incoming messages from the other party as read
      const myRole = role === 'admin' ? 'admin' : 'hira';
      for (const m of list) {
        if (!m.isRead && m.senderRole !== myRole) {
          void markMessageRead(m.id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThread();
  }, [user, role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !draft.trim()) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const token = await user.getIdToken();
      // Server-side validation & rate-limiting check
      const checkResp = await fetch('/api/messages/validate', {
        method: 'POST',
        headers: {
          'X-Firebase-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: draft.trim() }),
      }).catch(() => null);

      if (checkResp && !checkResp.ok) {
        const errJson = (await checkResp.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || 'Could not validate message.');
      }

      await sendPrivateMessage(user.uid, role === 'admin' ? 'admin' : 'hira', draft.trim());
      setDraft('');
      await loadThread();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '১১ · ব্যক্তিগত বার্তা' : '11 · PRIVATE MESSAGES'}
        title={isBn ? 'ব্যক্তিগত বার্তা' : 'Private Communication'}
      />

      <div className="border border-slate-800 bg-[#0C1120]/85 rounded-xl overflow-hidden">
        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-8">
              {isBn ? 'বার্তা লোড হচ্ছে…' : 'Loading messages…'}
            </p>
          ) : messages.length === 0 ? (
            <EmptyUniverseState
              title={isBn ? 'এখনো কোনো বার্তা আদান-প্রদান হয়নি' : 'No messages yet'}
              subtitle={
                isBn
                  ? 'ইচ্ছে হলে নিচের ঘরে নির্মাতার জন্য একটি বার্তা লিখে পাঠাতে পারো।'
                  : 'Whenever you feel like leaving a note for The Creator, you can write below.'
              }
            />
          ) : (
            messages.map((m) => {
              const isMine =
                (role === 'admin' && m.senderRole === 'admin') ||
                (role !== 'admin' && m.senderRole === 'hira');
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 border ${
                      isMine
                        ? 'bg-amber-300/10 border-amber-300/30 text-slate-100'
                        : 'bg-[#060810] border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1">
                      <span>
                        {m.senderRole === 'admin'
                          ? isBn
                            ? 'নির্মাতা'
                            : 'The Creator'
                          : isBn
                          ? 'হীরা'
                          : 'Hira'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatDhakaDateTime(m.createdAt, language)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{m.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => void handleSend(e)}
          className="p-4 sm:p-6 border-t border-slate-800 bg-[#080C17] space-y-3"
        >
          {errorMsg ? (
            <p role="alert" className="text-xs text-rose-400">
              {errorMsg}
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              rows={2}
              value={draft}
              maxLength={5000}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                isBn ? 'তোমার বার্তা এখানে লিখো…' : 'Write a message…'
              }
              aria-label={isBn ? 'বার্তা লিখো' : 'Message text'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-300 text-slate-950 text-sm font-medium hover:bg-amber-200 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{sending ? (isBn ? 'পাঠানো হচ্ছে…' : 'Sending…') : isBn ? 'পাঠাও' : 'Send'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
