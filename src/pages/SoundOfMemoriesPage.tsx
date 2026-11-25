import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
import { EmptyUniverseState } from '../components/EmptyUniverseState';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { listAudioItems } from '../services/firestoreService';
import type { AudioItem } from '../types/hira';
import { pickText } from '../utils/i18n';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SoundOfMemoriesPage: React.FC = () => {
  const { role, language } = useAuth();
  const isBn = language === 'bn';

  const [items, setItems] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    listAudioItems(role === 'admin')
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        if (rows[0]) setActiveId(rows[0].id);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const categories = useMemo(() => {
    const set = new Set(items.map((a) => a.category || 'voice'));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => (category === 'all' ? true : (i.category || 'voice') === category));
  }, [items, category]);

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId) || null,
    [items, activeId]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSelectTrack = (track: AudioItem) => {
    setActiveId(track.id);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleTogglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      await el.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (nextTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? '০৭ · স্মৃতির সুর' : '07 · SOUND OF MEMORIES'}
        title={isBn ? 'স্মৃতির সুর' : 'Sound of Memories'}
        subtitle={
          isBn
            ? 'কণ্ঠস্বর, পরিবেশের শব্দ ও সংরক্ষিত অডিও। কোনো অডিও স্বয়ংক্রিয়ভাবে বাজবে না—তুমি চাইলে প্লে করতে পারো।'
            : 'Preserved voice notes and soundscapes. Nothing autoplays—listen whenever you choose.'
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {isBn ? 'অডিও আর্কাইভ লোড হচ্ছে…' : 'Loading audio archive…'}
        </div>
      ) : items.length === 0 ? (
        <EmptyUniverseState
          title={isBn ? 'এখনো কোনো অডিও যোগ করা হয়নি' : 'No audio recordings yet'}
          subtitle={
            isBn
              ? 'নির্মাতা যখন কোনো ভয়েস নোট বা সুর যোগ করবেন, তখন তা এখানে শোনা যাবে।'
              : 'When The Creator publishes voice recordings or soundscapes, they will appear here.'
          }
        />
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
                {cat === 'all' ? (isBn ? 'সব অডিও' : 'All Audio') : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Accessible Custom Audio Player */}
            <div className="lg:col-span-6 border border-slate-800 bg-[#0C1120]/90 rounded-xl p-6 sm:p-8 space-y-6">
              {activeItem ? (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-amber-200/80">
                      {activeItem.category || 'audio'}
                    </p>
                    <h2 className="font-editorial text-3xl text-slate-50">
                      {pickText(language, activeItem.titleBn, activeItem.title)}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {pickText(language, activeItem.descriptionBn, activeItem.description)}
                    </p>
                  </div>

                  <audio
                    ref={audioRef}
                    src={activeItem.audioUrl}
                    preload="metadata"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                    onEnded={() => setIsPlaying(false)}
                  />

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => void handleTogglePlay()}
                        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                        className="w-11 h-11 rounded-full bg-amber-300 text-slate-950 flex items-center justify-center hover:bg-amber-200 transition-colors shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <input
                          type="range"
                          min={0}
                          max={duration || activeItem.durationSeconds || 100}
                          step={0.5}
                          value={currentTime}
                          aria-label="Seek audio position"
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="w-full accent-amber-300 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration || activeItem.durationSeconds || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        aria-label="Volume"
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-32 accent-amber-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Track List */}
            <div className="lg:col-span-6 space-y-3">
              {filtered.map((item) => {
                const isSelected = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTrack(item)}
                    className={`w-full text-left p-5 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-amber-300/50 bg-[#11182E]'
                        : 'border-slate-800 bg-[#0C1120]/75 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400">{item.category || 'audio'}</p>
                      <h3 className="font-editorial text-xl text-slate-100 truncate">
                        {pickText(language, item.titleBn, item.title)}
                      </h3>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-slate-400 shrink-0">
                      {item.durationSeconds ? formatTime(item.durationSeconds) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
