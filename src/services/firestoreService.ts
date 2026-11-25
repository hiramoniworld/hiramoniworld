import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../firebase/config';
import type {
  AudioItem,
  ContentStatus,
  DailyDiscoveryItem,
  EncryptedJournalRecord,
  HiddenDiscoveryItem,
  LetterItem,
  MediaLibraryItem,
  MemoryItem,
  MessageItem,
  PrivateQuestionResponse,
  QuestionItem,
  ScienceArticleItem,
  SiteSettings,
  StoryChapterItem,
  TimelineEntryItem,
} from '../types/hira';
import { ALL_SECTIONS } from '../types/hira';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'HIRA',
  tagline: 'A Universe Made Just for You.',
  secondaryPhrase: 'Somewhere, Between Us.',
  welcomeTitleBn: 'স্বাগতম, হীরা।',
  welcomeBodyBn:
    'এই ছোট্ট মহাবিশ্বটা শুধু তোমার জন্য সাজানো। এখানে প্রতিটি কোণে তোমার জন্য কিছু না কিছু অপেক্ষা করছে।',
  welcomeTitleEn: 'Welcome, Hira.',
  welcomeBodyEn:
    'This little universe was made just for you. Every corner has something waiting to be discovered.',
  defaultLanguage: 'en',
  birthdayMonthDay: '10-13',
  visibleSections: ALL_SECTIONS,
};

function sanitizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|\/src\/assets\/|\/assets\/)/i.test(trimmed)) {
    return trimmed.slice(0, 1500);
  }
  return '';
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

async function fetchPublishedAndDue<T>(
  collectionName: string,
  isAdmin: boolean,
  supportsScheduling: boolean
): Promise<T[]> {
  try {
    if (isAdmin) {
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    }

    const publishedQ = query(
      collection(db, collectionName),
      where('status', '==', 'published')
    );
    const pubSnap = await getDocs(publishedQ);
    const results = pubSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);

    if (supportsScheduling) {
      try {
        const dueQ = query(
          collection(db, collectionName),
          where('status', '==', 'scheduled'),
          where('scheduledAt', '<=', Timestamp.fromMillis(Date.now() - 5000))
        );
        const dueSnap = await getDocs(dueQ);
        for (const d of dueSnap.docs) {
          results.push({ id: d.id, ...d.data() } as T);
        }
      } catch {
        // Ignore clock-skew or index warm-up on scheduled secondary query
      }
    }

    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
  }
}

// =============================================================================
// Site Settings
// =============================================================================
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'main'));
    if (!snap.exists()) return DEFAULT_SITE_SETTINGS;
    return { ...DEFAULT_SITE_SETTINGS, ...(snap.data() as Partial<SiteSettings>) };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'siteSettings/main');
  }
}

export function subscribeSiteSettings(
  onUpdate: (settings: SiteSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'siteSettings', 'main'),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(DEFAULT_SITE_SETTINGS);
      } else {
        onUpdate({ ...DEFAULT_SITE_SETTINGS, ...(snap.data() as Partial<SiteSettings>) });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  try {
    const payload = stripUndefined({
      siteTitle: (settings.siteTitle || 'HIRA').slice(0, 60),
      tagline: (settings.tagline || '').slice(0, 140),
      secondaryPhrase: (settings.secondaryPhrase || '').slice(0, 140),
      welcomeTitleEn: (settings.welcomeTitleEn || '').slice(0, 200),
      welcomeBodyEn: (settings.welcomeBodyEn || '').slice(0, 1500),
      welcomeTitleBn: (settings.welcomeTitleBn || '').slice(0, 200),
      welcomeBodyBn: (settings.welcomeBodyBn || '').slice(0, 1500),
      defaultLanguage: settings.defaultLanguage === 'en' ? 'en' : 'bn',
      birthdayMonthDay: /^\d{2}-\d{2}$/.test(settings.birthdayMonthDay)
        ? settings.birthdayMonthDay
        : '10-13',
      visibleSections: (settings.visibleSections || ALL_SECTIONS).slice(0, 12),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'siteSettings', 'main'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteSettings/main');
  }
}

// =============================================================================
// Memories
// =============================================================================
export async function listMemories(isAdmin: boolean): Promise<MemoryItem[]> {
  return fetchPublishedAndDue<MemoryItem>('memories', isAdmin, true);
}

export async function saveMemory(
  id: string | null,
  input: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `memories/${id}` : 'memories';
  try {
    const base = stripUndefined({
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      dateLabel: (input.dateLabel || '').slice(0, 60),
      story: (input.story || '').slice(0, 12000),
      storyBn: (input.storyBn || '').slice(0, 12000),
      notes: (input.notes || '').slice(0, 2000),
      celestialType: input.celestialType,
      starX: typeof input.starX === 'number' ? Math.max(5, Math.min(95, input.starX)) : 50,
      starY: typeof input.starY === 'number' ? Math.max(5, Math.min(95, input.starY)) : 50,
      images: (input.images || []).map((u) => sanitizeUrl(u)).filter(Boolean).slice(0, 10),
      audioUrl: sanitizeUrl(input.audioUrl),
      videoUrl: sanitizeUrl(input.videoUrl),
      relatedIds: (input.relatedIds || []).slice(0, 10),
      isFavoriteByHira: Boolean(input.isFavoriteByHira),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });

    if (id) {
      await updateDoc(doc(db, 'memories', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'memories'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function toggleMemoryFavorite(id: string, isFavorite: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'memories', id), {
      isFavoriteByHira: isFavorite,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `memories/${id}`);
  }
}

export async function deleteDocumentById(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// =============================================================================
// Daily Discoveries
// =============================================================================
export async function listDailyDiscoveries(isAdmin: boolean): Promise<DailyDiscoveryItem[]> {
  return fetchPublishedAndDue<DailyDiscoveryItem>('dailyDiscoveries', isAdmin, true);
}

export async function saveDailyDiscovery(
  id: string | null,
  input: Omit<DailyDiscoveryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `dailyDiscoveries/${id}` : 'dailyDiscoveries';
  try {
    const base = stripUndefined({
      dateKey: input.dateKey,
      type: input.type,
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      content: (input.content || '').slice(0, 8000),
      contentBn: (input.contentBn || '').slice(0, 8000),
      imageUrl: sanitizeUrl(input.imageUrl),
      audioUrl: sanitizeUrl(input.audioUrl),
      isHidden: Boolean(input.isHidden),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });

    if (id) {
      await updateDoc(doc(db, 'dailyDiscoveries', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'dailyDiscoveries'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

// =============================================================================
// Question Room & Private Responses
// =============================================================================
export async function listQuestions(isAdmin: boolean): Promise<QuestionItem[]> {
  return fetchPublishedAndDue<QuestionItem>('questions', isAdmin, true);
}

export async function saveQuestion(
  id: string | null,
  input: Omit<QuestionItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `questions/${id}` : 'questions';
  try {
    const base = stripUndefined({
      category: input.category.trim().slice(0, 60),
      questionEn: input.questionEn.trim().slice(0, 800),
      questionBn: (input.questionBn || '').slice(0, 800),
      contextNote: (input.contextNote || '').slice(0, 1000),
      isDaily: Boolean(input.isDaily),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });

    if (id) {
      await updateDoc(doc(db, 'questions', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'questions'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function listMyQuestionResponses(ownerId: string): Promise<PrivateQuestionResponse[]> {
  try {
    const q = query(
      collection(db, 'privateQuestionResponses'),
      where('ownerId', '==', ownerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PrivateQuestionResponse);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'privateQuestionResponses');
  }
}

export async function listSharedQuestionResponsesForAdmin(): Promise<PrivateQuestionResponse[]> {
  try {
    const q = query(
      collection(db, 'privateQuestionResponses'),
      where('isSharedWithAdmin', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PrivateQuestionResponse);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'privateQuestionResponses');
  }
}

export async function savePrivateQuestionResponse(
  existingId: string | null,
  ownerId: string,
  questionId: string,
  responseText: string,
  isSaved: boolean,
  isSharedWithAdmin: boolean
): Promise<string> {
  const path = existingId
    ? `privateQuestionResponses/${existingId}`
    : 'privateQuestionResponses';
  try {
    if (existingId) {
      await updateDoc(doc(db, 'privateQuestionResponses', existingId), {
        responseText: responseText.slice(0, 10000),
        isSaved,
        isSharedWithAdmin,
        updatedAt: serverTimestamp(),
      });
      return existingId;
    }
    const created = await addDoc(collection(db, 'privateQuestionResponses'), {
      questionId,
      ownerId,
      responseText: responseText.slice(0, 10000),
      isSaved,
      isSharedWithAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(
      err,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

// =============================================================================
// Letters
// =============================================================================
export async function listLetters(isAdmin: boolean): Promise<LetterItem[]> {
  return fetchPublishedAndDue<LetterItem>('letters', isAdmin, true);
}

export async function saveLetter(
  id: string | null,
  input: Omit<LetterItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `letters/${id}` : 'letters';
  try {
    const base = stripUndefined({
      category: input.category.trim().slice(0, 60),
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      content: (input.content || '').slice(0, 20000),
      contentBn: (input.contentBn || '').slice(0, 20000),
      imageUrl: sanitizeUrl(input.imageUrl),
      audioUrl: sanitizeUrl(input.audioUrl),
      writtenDate: (input.writtenDate || '').slice(0, 40),
      isReadByHira: Boolean(input.isReadByHira),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'letters', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'letters'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function markLetterRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'letters', id), {
      isReadByHira: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `letters/${id}`);
  }
}

// =============================================================================
// Timeline Entries
// =============================================================================
export async function listTimelineEntries(isAdmin: boolean): Promise<TimelineEntryItem[]> {
  return fetchPublishedAndDue<TimelineEntryItem>('timelineEntries', isAdmin, true);
}

export async function saveTimelineEntry(
  id: string | null,
  input: Omit<TimelineEntryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `timelineEntries/${id}` : 'timelineEntries';
  try {
    const base = stripUndefined({
      era: input.era,
      dateLabel: input.dateLabel.trim().slice(0, 80),
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      description: (input.description || '').slice(0, 5000),
      descriptionBn: (input.descriptionBn || '').slice(0, 5000),
      entryType: (input.entryType || 'milestone').slice(0, 50),
      isRecurringBirthday: Boolean(input.isRecurringBirthday),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'timelineEntries', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'timelineEntries'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

// =============================================================================
// Hidden Universe
// =============================================================================
export async function listHiddenDiscoveries(isAdmin: boolean): Promise<HiddenDiscoveryItem[]> {
  return fetchPublishedAndDue<HiddenDiscoveryItem>('hiddenDiscoveries', isAdmin, false);
}

export async function saveHiddenDiscovery(
  id: string | null,
  input: Omit<HiddenDiscoveryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `hiddenDiscoveries/${id}` : 'hiddenDiscoveries';
  try {
    const base = stripUndefined({
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      clue: (input.clue || '').slice(0, 1000),
      clueBn: (input.clueBn || '').slice(0, 1000),
      content: (input.content || '').slice(0, 10000),
      contentBn: (input.contentBn || '').slice(0, 10000),
      imageUrl: sanitizeUrl(input.imageUrl),
      passcodeSha256: (input.passcodeSha256 || '').slice(0, 128),
      isUnlockedByHira: Boolean(input.isUnlockedByHira),
      status: input.status,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'hiddenDiscoveries', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'hiddenDiscoveries'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function markHiddenUnlocked(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'hiddenDiscoveries', id), {
      isUnlockedByHira: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `hiddenDiscoveries/${id}`);
  }
}

// =============================================================================
// Sound of Memories
// =============================================================================
export async function listAudioItems(isAdmin: boolean): Promise<AudioItem[]> {
  return fetchPublishedAndDue<AudioItem>('audioItems', isAdmin, false);
}

export async function saveAudioItem(
  id: string | null,
  input: Omit<AudioItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `audioItems/${id}` : 'audioItems';
  try {
    const base = stripUndefined({
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      description: (input.description || '').slice(0, 2000),
      descriptionBn: (input.descriptionBn || '').slice(0, 2000),
      category: (input.category || 'voice').slice(0, 60),
      audioUrl: sanitizeUrl(input.audioUrl),
      durationSeconds: typeof input.durationSeconds === 'number' ? Math.max(0, input.durationSeconds) : 0,
      relatedMemoryId: (input.relatedMemoryId || '').slice(0, 128),
      status: input.status,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'audioItems', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'audioItems'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

// =============================================================================
// Unfinished Story
// =============================================================================
export async function listStoryChapters(isAdmin: boolean): Promise<StoryChapterItem[]> {
  const rows = await fetchPublishedAndDue<StoryChapterItem>('storyChapters', isAdmin, true);
  return rows.sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));
}

export async function saveStoryChapter(
  id: string | null,
  input: Omit<StoryChapterItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `storyChapters/${id}` : 'storyChapters';
  try {
    const base = stripUndefined({
      storyTitle: (input.storyTitle || '').slice(0, 160),
      chapterNumber: Number(input.chapterNumber) || 1,
      title: input.title.trim().slice(0, 160),
      titleBn: (input.titleBn || '').slice(0, 160),
      content: (input.content || '').slice(0, 30000),
      contentBn: (input.contentBn || '').slice(0, 30000),
      coverUrl: sanitizeUrl(input.coverUrl),
      illustrationUrl: sanitizeUrl(input.illustrationUrl),
      isReadByHira: Boolean(input.isReadByHira),
      status: input.status,
      scheduledAt: input.scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'storyChapters', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'storyChapters'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function markChapterRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'storyChapters', id), {
      isReadByHira: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `storyChapters/${id}`);
  }
}

// =============================================================================
// Science Laboratory
// =============================================================================
export async function listScienceArticles(isAdmin: boolean): Promise<ScienceArticleItem[]> {
  return fetchPublishedAndDue<ScienceArticleItem>('scienceArticles', isAdmin, false);
}

export async function saveScienceArticle(
  id: string | null,
  input: Omit<ScienceArticleItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `scienceArticles/${id}` : 'scienceArticles';
  try {
    const base = stripUndefined({
      topic: input.topic.trim().slice(0, 80),
      epistemicLevel: input.epistemicLevel,
      title: input.title.trim().slice(0, 180),
      titleBn: (input.titleBn || '').slice(0, 180),
      summary: (input.summary || '').slice(0, 1000),
      summaryBn: (input.summaryBn || '').slice(0, 1000),
      body: (input.body || '').slice(0, 25000),
      bodyBn: (input.bodyBn || '').slice(0, 25000),
      diagramUrl: sanitizeUrl(input.diagramUrl),
      authorNotes: (input.authorNotes || '').slice(0, 2000),
      sources: (input.sources || []).map((s) => s.trim().slice(0, 500)).filter(Boolean).slice(0, 10),
      isReadByHira: Boolean(input.isReadByHira),
      status: input.status,
      updatedAt: serverTimestamp(),
    });
    if (id) {
      await updateDoc(doc(db, 'scienceArticles', id), base);
      return id;
    }
    const created = await addDoc(collection(db, 'scienceArticles'), {
      ...base,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function markScienceArticleRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'scienceArticles', id), {
      isReadByHira: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `scienceArticles/${id}`);
  }
}

// =============================================================================
// Private Communication (Manual Replies Only)
// =============================================================================
export async function listMessages(uid: string, isAdmin: boolean): Promise<MessageItem[]> {
  try {
    if (isAdmin) {
      const snap = await getDocs(collection(db, 'messages'));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MessageItem);
      return all.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
    }

    const [mineSnap, adminSnap] = await Promise.all([
      getDocs(query(collection(db, 'messages'), where('senderId', '==', uid))),
      getDocs(query(collection(db, 'messages'), where('senderRole', '==', 'admin'))),
    ]);

    const map = new Map<string, MessageItem>();
    for (const d of mineSnap.docs) {
      map.set(d.id, { id: d.id, ...d.data() } as MessageItem);
    }
    for (const d of adminSnap.docs) {
      map.set(d.id, { id: d.id, ...d.data() } as MessageItem);
    }
    return Array.from(map.values()).sort(
      (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'messages');
  }
}

export async function sendPrivateMessage(
  senderId: string,
  senderRole: 'hira' | 'admin',
  body: string
): Promise<string> {
  try {
    const clean = body.trim().slice(0, 5000);
    if (!clean) throw new Error('Message body cannot be empty.');
    const created = await addDoc(collection(db, 'messages'), {
      senderId,
      senderRole,
      body: clean,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'messages');
  }
}

export async function markMessageRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'messages', id), { isRead: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `messages/${id}`);
  }
}

// =============================================================================
// Media Library (Admin Managed)
// =============================================================================
export async function listMediaLibrary(): Promise<MediaLibraryItem[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'mediaLibrary'), where('category', 'in', ['image', 'audio', 'video']))
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as MediaLibraryItem)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'mediaLibrary');
  }
}

export async function uploadMediaAsset(
  file: File,
  category: 'image' | 'audio' | 'video',
  uploadedBy: string,
  onProgress?: (pct: number) => void
): Promise<MediaLibraryItem> {
  const maxBytes = 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds the 50 MB size limit.');
  }
  const expectedPrefix = `${category}/`;
  if (!file.type.startsWith(expectedPrefix)) {
    throw new Error(`Invalid file MIME type (${file.type}) for ${category}.`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const storagePath = `universe-media/${category}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  const downloadUrl = await new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  try {
    const docRef = await addDoc(collection(db, 'mediaLibrary'), {
      fileName: safeName,
      mimeType: file.type.slice(0, 100),
      sizeBytes: file.size,
      category,
      storagePath,
      downloadUrl,
      uploadedBy,
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...snap.data() } as MediaLibraryItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'mediaLibrary');
  }
}

export async function registerExternalMediaAsset(
  fileName: string,
  category: 'image' | 'audio' | 'video',
  downloadUrl: string,
  uploadedBy: string
): Promise<void> {
  try {
    const cleanUrl = sanitizeUrl(downloadUrl);
    if (!cleanUrl) throw new Error('Invalid URL. Must start with https:// or /src/assets/.');
    await addDoc(collection(db, 'mediaLibrary'), {
      fileName: fileName.trim().slice(0, 200),
      category,
      downloadUrl: cleanUrl,
      uploadedBy,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'mediaLibrary');
  }
}

export async function deleteMediaAsset(item: MediaLibraryItem): Promise<void> {
  if (item.storagePath) {
    try {
      await deleteObject(ref(storage, item.storagePath));
    } catch {
      // File may already be absent in storage; still clean metadata record
    }
  }
  await deleteDocumentById('mediaLibrary', item.id);
}

// =============================================================================
// THE MIRROR — Client-Encrypted Private Journal (Strictly Owner-Only)
// NEVER referenced or called in Admin Portal.
// =============================================================================
export async function listMyEncryptedJournal(ownerId: string): Promise<EncryptedJournalRecord[]> {
  try {
    const q = query(collection(db, 'privateJournal'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as EncryptedJournalRecord)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'privateJournal');
  }
}

export async function saveEncryptedJournalEntry(
  id: string | null,
  record: Omit<EncryptedJournalRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = id ? `privateJournal/${id}` : 'privateJournal';
  try {
    if (id) {
      await updateDoc(doc(db, 'privateJournal', id), {
        entryDate: record.entryDate,
        ciphertextTitle: record.ciphertextTitle,
        ivTitle: record.ivTitle,
        ciphertextBody: record.ciphertextBody,
        ivBody: record.ivBody,
        salt: record.salt,
        kdfIterations: record.kdfIterations,
        isDraft: record.isDraft,
        updatedAt: serverTimestamp(),
      });
      return id;
    }
    const created = await addDoc(collection(db, 'privateJournal'), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteEncryptedJournalEntry(id: string): Promise<void> {
  await deleteDocumentById('privateJournal', id);
}

// =============================================================================
// Status Helpers for Admin
// =============================================================================
export async function updateContentStatus(
  collectionName: string,
  id: string,
  status: ContentStatus,
  scheduledAt?: Timestamp | null
): Promise<void> {
  try {
    await updateDoc(doc(db, collectionName, id), {
      status,
      scheduledAt: scheduledAt ?? null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}
