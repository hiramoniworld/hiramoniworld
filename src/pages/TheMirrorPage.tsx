import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Plus, Search, ShieldAlert, Trash2, Unlock } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import {
  deleteEncryptedJournalEntry,
  listMyEncryptedJournal,
  saveEncryptedJournalEntry,
} from '../services/firestoreService';
import type { DecryptedJournalEntry, EncryptedJournalRecord } from '../types/hira';
import { getTodayDhakaKey } from '../utils/dhakaTime';
import {
  decryptTextWithKey,
  deriveJournalKey,
  encryptTextWithKey,
  generateSaltBase64,
  JOURNAL_KDF_ITERATIONS,
} from '../utils/journalCrypto';

export const TheMirrorPage: React.FC = () => {
  const { user, language } = useAuth();
  const isBn = language === 'bn';

  // In-memory only: NEVER persisted in storage or sent to any server
  const sessionKeyRef = useRef<{
    passphrase: string;
    keyCache: Map<string, CryptoKey>;
  } | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [records, setRecords] = useState<EncryptedJournalRecord[]>([]);
  const [entries, setEntries] = useState<DecryptedJournalEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [entryDate, setEntryDate] = useState(getTodayDhakaKey());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Clear in-memory encryption keys on unmount
  useEffect(() => {
    return () => {
      if (sessionKeyRef.current) {
        sessionKeyRef.current.passphrase = '';
        sessionKeyRef.current.keyCache.clear();
        sessionKeyRef.current = null;
      }
    };
  }, []);

  const getKeyForSalt = async (salt: string, iterations: number): Promise<CryptoKey> => {
    const holder = sessionKeyRef.current;
    if (!holder) throw new Error('Journal is locked.');
    const cacheKey = `${salt}:${iterations}`;
    const cached = holder.keyCache.get(cacheKey);
    if (cached) return cached;
    const derived = await deriveJournalKey(holder.passphrase, salt, iterations);
    holder.keyCache.set(cacheKey, derived);
    return derived;
  };

  const decryptAll = async (encryptedRows: EncryptedJournalRecord[]) => {
    const decoded: DecryptedJournalEntry[] = [];
    for (const row of encryptedRows) {
      try {
        const key = await getKeyForSalt(row.salt, row.kdfIterations || JOURNAL_KDF_ITERATIONS);
        const decTitle = await decryptTextWithKey(row.ciphertextTitle, row.ivTitle, key);
        const decBody = await decryptTextWithKey(row.ciphertextBody, row.ivBody, key);
        decoded.push({
          id: row.id,
          entryDate: row.entryDate,
          title: decTitle,
          body: decBody,
          isDraft: row.isDraft,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
      } catch {
        decoded.push({
          id: row.id,
          entryDate: row.entryDate,
          title: isBn ? '(ভিন্ন পাসফ্রেজে এনক্রিপ্ট করা)' : '(Encrypted with a different passphrase)',
          body: '',
          isDraft: row.isDraft,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          decryptionFailed: true,
        });
      }
    }
    setEntries(decoded);
    return decoded;
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passphraseInput.length < 6) {
      setUnlockError(
        isBn
          ? 'অন্তত ৬ অক্ষরের একটি শক্তিশালী পাসফ্রেজ দাও।'
          : 'Please enter a passphrase of at least 6 characters.'
      );
      return;
    }

    setUnlocking(true);
    setUnlockError(null);
    try {
      const encryptedRows = await listMyEncryptedJournal(user.uid);
      setRecords(encryptedRows);

      sessionKeyRef.current = {
        passphrase: passphraseInput,
        keyCache: new Map<string, CryptoKey>(),
      };

      const decoded = await decryptAll(encryptedRows);
      setPassphraseInput('');
      setUnlocked(true);
      if (decoded.length > 0 && !decoded[0].decryptionFailed) {
        selectEntry(decoded[0]);
      }
    } catch {
      sessionKeyRef.current = null;
      setUnlockError(
        isBn ? 'ডায়েরি খুলতে সমস্যা হয়েছে।' : 'Could not unlock journal.'
      );
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = () => {
    if (sessionKeyRef.current) {
      sessionKeyRef.current.passphrase = '';
      sessionKeyRef.current.keyCache.clear();
      sessionKeyRef.current = null;
    }
    setUnlocked(false);
    setEntries([]);
    setRecords([]);
    setSelectedId(null);
    setTitle('');
    setBody('');
    setStatusMsg(null);
  };

  const selectEntry = (entry: DecryptedJournalEntry) => {
    setSelectedId(entry.id);
    setEntryDate(entry.entryDate);
    setTitle(entry.decryptionFailed ? '' : entry.title);
    setBody(entry.decryptionFailed ? '' : entry.body);
    setIsDraft(entry.isDraft);
    setStatusMsg(null);
  };

  const startNewEntry = () => {
    setSelectedId(null);
    setEntryDate(getTodayDhakaKey());
    setTitle('');
    setBody('');
    setIsDraft(false);
    setStatusMsg(null);
  };

  const handleSave = async (saveAsDraft: boolean) => {
    if (!user || !sessionKeyRef.current) return;
    if (!title.trim() && !body.trim()) {
      setStatusMsg(isBn ? 'লেখার আগে কিছু শব্দ যোগ করো।' : 'Write a title or thought before saving.');
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const salt = generateSaltBase64();
      const key = await getKeyForSalt(salt, JOURNAL_KDF_ITERATIONS);
      const encTitle = await encryptTextWithKey(title.trim() || 'Untitled', key);
      const encBody = await encryptTextWithKey(body || ' ', key);

      const savedId = await saveEncryptedJournalEntry(selectedId, {
        ownerId: user.uid,
        entryDate,
        ciphertextTitle: encTitle.ciphertext,
        ivTitle: encTitle.iv,
        ciphertextBody: encBody.ciphertext,
        ivBody: encBody.iv,
        salt,
        kdfIterations: JOURNAL_KDF_ITERATIONS,
        isDraft: saveAsDraft,
      });

      const refreshed = await listMyEncryptedJournal(user.uid);
      setRecords(refreshed);
      const decoded = await decryptAll(refreshed);
      const justSaved = decoded.find((d) => d.id === savedId);
      if (justSaved) selectEntry(justSaved);
      setStatusMsg(
        saveAsDraft
          ? isBn
            ? 'খসড়া এনক্রিপ্ট করে সংরক্ষিত হয়েছে।'
            : 'Encrypted draft saved.'
          : isBn
          ? 'এনক্রিপ্ট করে সংরক্ষিত হয়েছে।'
          : 'Encrypted and saved privately.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId || !user) return;
    await deleteEncryptedJournalEntry(deleteTargetId);
    setDeleteTargetId(null);
    startNewEntry();
    const refreshed = await listMyEncryptedJournal(user.uid);
    setRecords(refreshed);
    await decryptAll(refreshed);
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.entryDate.includes(q)
    );
  }, [entries, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৮ · আয়না — একান্ত ডায়েরি' : '08 · THE MIRROR — PRIVATE JOURNAL'}
        title={isBn ? 'আয়না — তোমার একান্ত ডায়েরি' : 'The Mirror'}
        subtitle={
          isBn
            ? 'তোমার ব্রাউজারেই পাসফ্রেজ দিয়ে এনক্রিপ্ট করা হয়। নির্মাতা, অ্যাডমিন বা সার্ভার কেউ কখনোই এই লেখা পড়তে পারে না।'
            : 'Encrypted inside your browser using your personal passphrase. The Creator and Admin Portal have zero access to these entries.'
        }
        rightSlot={
          unlocked ? (
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 text-xs font-medium hover:bg-amber-300/20 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isBn ? 'ডায়েরি লক করো' : 'Lock Journal'}</span>
            </button>
          ) : undefined
        }
      />

      {!unlocked ? (
        <div className="max-w-lg mx-auto border border-slate-800 bg-[#0C1120]/90 rounded-xl p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-200/85">
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>PBKDF2 · AES-256-GCM</span>
            </div>
            <h2 className="font-editorial text-3xl text-slate-50">
              {isBn ? 'একান্ত পাসফ্রেজ দিয়ে খোলো' : 'Unlock Your Private Space'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isBn
                ? 'তোমার লগইন পাসওয়ার্ডের বাইরে আলাদা একটি ডায়েরি পাসফ্রেজ ব্যবহার করো। এটি কখনো সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না।'
                : 'Use a separate journal passphrase. It stays strictly in browser memory and is cleared the moment you lock or leave this room.'}
            </p>
          </div>

          <div className="border border-amber-400/25 bg-amber-400/5 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-100/90 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
            <p>
              {isBn
                ? 'গুরুত্বপূর্ণ: যেহেতু পাসফ্রেজ কোথাও সংরক্ষিত থাকে না, তাই পাসফ্রেজ ভুলে গেলে এনক্রিপ্ট করা লেখা উদ্ধার করা সম্ভব নয়।'
                : 'Important: Because no copy of your passphrase is stored anywhere, forgetting it will make previously encrypted entries unrecoverable.'}
            </p>
          </div>

          {unlockError ? (
            <p role="alert" className="text-xs text-rose-400">
              {unlockError}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleUnlock(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="journal-passphrase" className="block text-xs text-slate-300">
                {isBn ? 'ডায়েরি পাসফ্রেজ' : 'Journal Passphrase'}
              </label>
              <input
                id="journal-passphrase"
                type="password"
                required
                minLength={6}
                autoComplete="off"
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 focus:border-amber-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={unlocking}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-300 text-slate-950 font-medium text-sm hover:bg-amber-200 disabled:opacity-50 transition-colors"
            >
              <Unlock className="w-4 h-4" aria-hidden="true" />
              <span>
                {unlocking
                  ? isBn
                    ? 'ডিক্রিপ্ট হচ্ছে…'
                    : 'Unlocking…'
                  : isBn
                  ? 'আয়না খোলো'
                  : 'Unlock The Mirror'}
              </span>
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Entry Sidebar */}
          <aside className="lg:col-span-4 border border-slate-800 bg-[#0C1120]/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {records.length} {isBn ? 'টি লেখা' : 'entries'}
              </span>
              <button
                type="button"
                onClick={startNewEntry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-300/15 border border-amber-300/40 text-amber-100 text-xs hover:bg-amber-300/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isBn ? 'নতুন লেখা' : 'New Entry'}</span>
              </button>
            </div>

            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'ডায়েরি খুঁজো…' : 'Search entries…'}
                aria-label={isBn ? 'ডায়েরি খুঁজো' : 'Search journal entries'}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060810] border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-300 outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredEntries.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  {isBn ? 'এখনো কোনো লেখা নেই।' : 'No entries yet.'}
                </p>
              ) : (
                filteredEntries.map((item) => {
                  const active = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectEntry(item)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                        active
                          ? 'border-amber-300/50 bg-[#11182E]'
                          : 'border-slate-800/80 bg-[#060810]/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="tabular-nums">{item.entryDate}</span>
                        {item.isDraft ? (
                          <span className="text-amber-300/80">
                            {isBn ? 'খসড়া' : 'Draft'}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-100 truncate">
                        {item.title}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Distraction-Free Writing Canvas */}
          <div className="lg:col-span-8 border border-slate-800 bg-[#0C1120]/90 rounded-xl p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <label htmlFor="entry-date" className="text-xs text-slate-400">
                  {isBn ? 'তারিখ' : 'Date'}
                </label>
                <input
                  id="entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#060810] border border-slate-800 text-xs font-mono text-slate-200 focus:border-amber-300 outline-none"
                />
              </div>

              {selectedId ? (
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(selectedId)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isBn ? 'মুছে ফেলো' : 'Delete Entry'}</span>
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isBn ? 'শিরোনাম…' : 'Title of this reflection…'}
                aria-label={isBn ? 'শিরোনাম' : 'Entry title'}
                className="w-full bg-transparent font-editorial text-3xl sm:text-4xl text-slate-50 placeholder:text-slate-600 focus:outline-none"
              />

              <textarea
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  isBn
                    ? 'এখানে নির্ভয়ে লিখো—প্রতিটি শব্দ ব্রাউজারে এনক্রিপ্ট হয়েই সংরক্ষিত হবে…'
                    : 'Write freely—every character is encrypted in your browser before it leaves this screen…'
                }
                aria-label={isBn ? 'ডায়েরির মূল লেখা' : 'Journal entry body'}
                className="w-full bg-transparent text-base text-slate-200 placeholder:text-slate-600 focus:outline-none leading-relaxed resize-y"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-amber-200">
                {statusMsg || (isDraft ? (isBn ? 'খসড়া অবস্থা' : 'Draft mode') : '')}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave(true)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isBn ? 'খসড়া রাখো' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave(false)}
                  className="px-5 py-2 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200 disabled:opacity-50 transition-colors"
                >
                  {saving
                    ? isBn
                      ? 'এনক্রিপ্ট হচ্ছে…'
                      : 'Encrypting…'
                    : isBn
                    ? 'সংরক্ষণ করো'
                    : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={isBn ? 'ডায়েরির লেখা মুছে ফেলবে?' : 'Delete encrypted journal entry?'}
        description={
          isBn
            ? 'এই এনক্রিপ্ট করা লেখাটি স্থায়ীভাবে মুছে ফেলা হবে এবং আর ফিরিয়ে আনা যাবে না।'
            : 'This encrypted entry will be permanently deleted.'
        }
        confirmLabel={isBn ? 'মুছে ফেলো' : 'Delete'}
        cancelLabel={isBn ? 'বাতিল' : 'Cancel'}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
