import React, { useEffect, useState } from 'react';
import { Copy, Trash2, Upload } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ResilientImage } from '../../components/ResilientMedia';
import { useAuth } from '../../context/AuthContext';
import {
  deleteMediaAsset,
  listMediaLibrary,
  registerExternalMediaAsset,
  uploadMediaAsset,
} from '../../services/firestoreService';
import type { MediaLibraryItem } from '../../types/hira';

export const AdminMediaLibrary: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'image' | 'audio' | 'video'>('image');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaLibraryItem | null>(null);

  const [extName, setExtName] = useState('');
  const [extUrl, setExtUrl] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listMediaLibrary();
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);
    setProgress(0);
    try {
      await uploadMediaAsset(file, category, user.uid, (pct) => setProgress(pct));
      setProgress(null);
      await refresh();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRegisterUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !extName.trim() || !extUrl.trim()) return;
    setError(null);
    try {
      await registerExternalMediaAsset(extName, category, extUrl, user.uid);
      setExtName('');
      setExtUrl('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register URL.');
    }
  };

  const handleCopy = async (item: MediaLibraryItem) => {
    await navigator.clipboard.writeText(item.downloadUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMediaAsset(deleteTarget);
    setDeleteTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Storage Upload */}
        <div className="border border-slate-800 bg-[#0C1120] rounded-xl p-6 space-y-4">
          <h2 className="font-editorial text-2xl text-slate-100">Upload to Firebase Storage</h2>
          <p className="text-xs text-slate-400">
            Supports images, audio, and video up to 50 MB. Files are validated by MIME type and stored outside private journal directories.
          </p>

          <div className="flex items-center gap-2">
            {(['image', 'audio', 'video'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  category === cat
                    ? 'border-amber-300/50 bg-amber-300/15 text-amber-100'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-amber-300/50 rounded-lg p-6 cursor-pointer text-sm text-slate-300 transition-colors">
            <Upload className="w-4 h-4 text-amber-300" aria-hidden="true" />
            <span>Select {category} file to upload</span>
            <input
              type="file"
              accept={`${category}/*`}
              onChange={(e) => void handleFileUpload(e)}
              className="hidden"
            />
          </label>

          {progress !== null ? (
            <div className="space-y-1">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-slate-400 tabular-nums">{progress}%</p>
            </div>
          ) : null}
        </div>

        {/* Register Reference URL */}
        <form
          onSubmit={(e) => void handleRegisterUrl(e)}
          className="border border-slate-800 bg-[#0C1120] rounded-xl p-6 space-y-4"
        >
          <h2 className="font-editorial text-2xl text-slate-100">Register Media URL</h2>
          <p className="text-xs text-slate-400">
            Add an existing HTTPS asset URL to reuse across memories, letters, and science articles.
          </p>
          <input
            type="text"
            required
            value={extName}
            onChange={(e) => setExtName(e.target.value)}
            placeholder="Asset name (e.g. Autumn Sky)"
            className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
          />
          <input
            type="url"
            required
            value={extUrl}
            onChange={(e) => setExtUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#060810] border border-slate-700 text-sm text-slate-100 outline-none focus:border-amber-300"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-300 text-slate-950 text-xs font-medium hover:bg-amber-200 transition-colors"
          >
            Save to Library
          </button>
        </form>
      </div>

      {error ? (
        <div role="alert" className="border border-rose-500/40 bg-rose-500/10 rounded-lg p-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-400">Loading media library…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 border border-slate-800 rounded-xl p-8 text-center">
          No media assets uploaded yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-slate-800 bg-[#0C1120] rounded-xl overflow-hidden flex flex-col justify-between"
            >
              {item.category === 'image' ? (
                <div className="aspect-[4/3] border-b border-slate-800">
                  <ResilientImage src={item.downloadUrl} alt={item.fileName} />
                </div>
              ) : item.category === 'audio' ? (
                <div className="p-4 border-b border-slate-800 bg-[#060810]">
                  <audio controls preload="metadata" className="w-full" src={item.downloadUrl} />
                </div>
              ) : (
                <div className="aspect-video border-b border-slate-800 bg-[#060810]">
                  <video controls preload="metadata" className="w-full h-full" src={item.downloadUrl} />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-mono text-slate-400">
                    {item.category}
                    {item.sizeBytes
                      ? ` · ${(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                      : ''}
                  </p>
                  <p className="text-sm font-medium text-slate-100 truncate">{item.fileName}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => void handleCopy(item)}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-200 hover:text-amber-100"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copiedId === item.id ? 'Copied URL' : 'Copy URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete media asset?"
        description="This removes the asset from Firebase Storage and the Media Library."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
