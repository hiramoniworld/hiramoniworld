import React, { useEffect, useState } from 'react';
import { KeyRound, Sparkles, Unlock } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { ResilientImage } from '../components/ResilientMedia';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listHiddenDiscoveries, markHiddenUnlocked } from '../services/firestoreService';
import type { HiddenDiscoveryItem } from '../types/hira';
import { pickText } from '../utils/i18n';
import { sha256Hex } from '../utils/journalCrypto';

export const HiddenUniversePage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';

  const [items, setItems] = useState<HiddenDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [passcodes, setPasscodes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    listHiddenDiscoveries(role === 'admin')
      .then((rows) => {
        if (active) setItems(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const handleUnlock = async (item: HiddenDiscoveryItem) => {
    setErrors((prev) => ({ ...prev, [item.id]: '' }));

    if (item.passcodeSha256) {
      const attempt = passcodes[item.id] || '';
      const digest = await sha256Hex(attempt);
      if (digest !== item.passcodeSha256.toLowerCase()) {
        setErrors((prev) => ({
          ...prev,
          [item.id]: isBn ? 'সংকেত শব্দটি মেলেনি।' : 'That passphrase did not match.',
        }));
        return;
      }
    }

    setItems((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, isUnlockedByHira: true } : d))
    );
    if (role !== 'admin') {
      await markHiddenUnlocked(item.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৬ · লুকানো মহাবিশ্ব' : '06 · HIDDEN UNIVERSE'}
        title={isBn ? 'লুকানো মহাবিশ্ব' : 'Hidden Universe'}
        subtitle={
          isBn
            ? 'কিছু নক্ষত্র ও বার্তা আড়ালে রাখা আছে। কোনো তাড়া নেই—ইচ্ছে হলে ইঙ্গিত ধরে খুলে দেখতে পারো।'
            : 'Secret stars, clues, and quiet chapters waiting patiently to be uncovered when you feel curious.'
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {isBn ? 'নীরব নক্ষত্রগুলো খোঁজা হচ্ছে…' : 'Scanning hidden coordinates…'}
        </div>
      ) : items.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'এখনো কোনো গোপন অধ্যায় রাখা হয়নি' : 'No hidden discoveries yet'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন কোনো ইঙ্গিত বা লুকানো বার্তা যুক্ত করবেন, তখন তা এখানে দেখা যাবে।'
              : 'When The Creator places clues or locked chapters here, you will find them waiting.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => {
            const unlocked = Boolean(item.isUnlockedByHira || role === 'admin');
            const title = pickText(language, item.titleBn, item.title);
            const clue = pickText(language, item.clueBn, item.clue);
            const content = pickText(language, item.contentBn, item.content);

            return (
              <article
                key={item.id}
                className="border border-slate-800 bg-[#0C1120]/85 rounded-xl p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-200/85">
                    {unlocked ? (
                      <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {unlocked
                        ? isBn
                          ? 'উন্মুক্ত'
                          : 'Unlocked'
                        : isBn
                        ? 'আবৃত'
                        : 'Locked'}
                    </span>
                  </div>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl text-slate-50">{title}</h2>

                {clue ? (
                  <p className="text-sm text-indigo-200/80 italic leading-relaxed">
                    {isBn ? 'ইঙ্গিত: ' : 'Clue: '}
                    {clue}
                  </p>
                ) : null}

                {unlocked ? (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    {item.imageUrl ? (
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800">
                        <ResilientImage src={item.imageUrl} alt={title} />
                      </div>
                    ) : null}
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
                      {content}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    {item.passcodeSha256 ? (
                      <div className="space-y-2">
                        <label
                          htmlFor={`pass-${item.id}`}
                          className="block text-xs text-slate-400"
                        >
                          {isBn ? 'সংকেত শব্দ লিখো' : 'Enter unlock key'}
                        </label>
                        <input
                          id={`pass-${item.id}`}
                          type="password"
                          value={passcodes[item.id] || ''}
                          onChange={(e) =>
                            setPasscodes((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 focus:border-amber-300 outline-none"
                        />
                        {errors[item.id] ? (
                          <p className="text-xs text-rose-400">{errors[item.id]}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleUnlock(item)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 text-xs font-medium hover:bg-amber-300/20 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isBn ? 'খুলে দেখো' : 'Reveal Discovery'}</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
