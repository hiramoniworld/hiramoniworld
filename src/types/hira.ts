import type { Timestamp } from 'firebase/firestore';

export type Language = 'bn' | 'en';
export type UserRole = 'hira' | 'admin';
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'unpublished';

export type SectionId =
  | 'galaxy'
  | 'discovery'
  | 'questions'
  | 'letters'
  | 'timemachine'
  | 'hidden'
  | 'sound'
  | 'mirror'
  | 'story'
  | 'science'
  | 'messages';

export const ALL_SECTIONS: SectionId[] = [
  'galaxy',
  'discovery',
  'questions',
  'letters',
  'timemachine',
  'hidden',
  'sound',
  'mirror',
  'story',
  'science',
  'messages',
];

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  preferredLanguage?: Language;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SiteSettings {
  siteTitle: string;
  tagline?: string;
  secondaryPhrase?: string;
  welcomeTitleEn?: string;
  welcomeBodyEn?: string;
  welcomeTitleBn?: string;
  welcomeBodyBn?: string;
  defaultLanguage: Language;
  birthdayMonthDay: string; // e.g. "10-13"
  visibleSections?: SectionId[];
  updatedAt?: Timestamp;
}

export type CelestialType = 'star' | 'planet' | 'nebula' | 'moon' | 'comet';

export interface MemoryItem {
  id: string;
  title: string;
  titleBn?: string;
  dateLabel?: string;
  story?: string;
  storyBn?: string;
  notes?: string;
  celestialType: CelestialType;
  starX?: number;
  starY?: number;
  images?: string[];
  audioUrl?: string;
  videoUrl?: string;
  relatedIds?: string[];
  isFavoriteByHira?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DiscoveryType =
  | 'question'
  | 'science_fact'
  | 'image'
  | 'thought'
  | 'message'
  | 'audio'
  | 'discovery'
  | 'clue'
  | 'story_excerpt'
  | 'mystery';

export interface DailyDiscoveryItem {
  id: string;
  dateKey: string; // YYYY-MM-DD in Asia/Dhaka
  type: DiscoveryType;
  title: string;
  titleBn?: string;
  content?: string;
  contentBn?: string;
  imageUrl?: string;
  audioUrl?: string;
  isHidden?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuestionItem {
  id: string;
  category: string;
  questionEn: string;
  questionBn?: string;
  contextNote?: string;
  isDaily?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PrivateQuestionResponse {
  id: string;
  questionId: string;
  ownerId: string;
  responseText?: string;
  isSaved: boolean;
  isSharedWithAdmin: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LetterItem {
  id: string;
  category: string;
  title: string;
  titleBn?: string;
  content?: string;
  contentBn?: string;
  imageUrl?: string;
  audioUrl?: string;
  writtenDate?: string;
  isReadByHira?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TimelineEra = 'past' | 'present' | 'future';

export interface TimelineEntryItem {
  id: string;
  era: TimelineEra;
  dateLabel: string;
  sortOrder?: number;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  entryType?: string;
  isRecurringBirthday?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HiddenDiscoveryItem {
  id: string;
  title: string;
  titleBn?: string;
  clue?: string;
  clueBn?: string;
  content?: string;
  contentBn?: string;
  imageUrl?: string;
  passcodeSha256?: string;
  isUnlockedByHira?: boolean;
  status: ContentStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AudioItem {
  id: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  category?: string;
  audioUrl: string;
  durationSeconds?: number;
  relatedMemoryId?: string;
  status: ContentStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StoryChapterItem {
  id: string;
  storyTitle?: string;
  chapterNumber: number;
  title: string;
  titleBn?: string;
  content?: string;
  contentBn?: string;
  coverUrl?: string;
  illustrationUrl?: string;
  isReadByHira?: boolean;
  status: ContentStatus;
  scheduledAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type EpistemicLevel = 'fact' | 'theory' | 'hypothesis' | 'speculation' | 'philosophy';

export interface ScienceArticleItem {
  id: string;
  topic: string;
  epistemicLevel: EpistemicLevel;
  title: string;
  titleBn?: string;
  summary?: string;
  summaryBn?: string;
  body?: string;
  bodyBn?: string;
  diagramUrl?: string;
  authorNotes?: string;
  sources?: string[];
  isReadByHira?: boolean;
  status: ContentStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderRole: UserRole;
  body: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface MediaLibraryItem {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  category: 'image' | 'audio' | 'video';
  storagePath?: string;
  downloadUrl: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

export interface EncryptedJournalRecord {
  id: string;
  ownerId: string;
  entryDate: string; // YYYY-MM-DD
  ciphertextTitle: string;
  ivTitle: string;
  ciphertextBody: string;
  ivBody: string;
  salt: string;
  kdfIterations: number;
  isDraft: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DecryptedJournalEntry {
  id: string;
  entryDate: string;
  title: string;
  body: string;
  isDraft: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  decryptionFailed?: boolean;
}
