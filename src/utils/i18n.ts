import type { Language, SectionId } from '../types/hira';

export interface SectionMeta {
  id: SectionId;
  path: string;
  labelBn: string;
  labelEn: string;
  subtitleBn: string;
  subtitleEn: string;
}

export const SECTION_DIRECTORY: SectionMeta[] = [
  {
    id: 'galaxy',
    path: '/galaxy',
    labelBn: 'স্মৃতির গ্যালাক্সি',
    labelEn: 'Memory Galaxy',
    subtitleBn: 'প্রতিটি তারার পেছনে একেকটি সংরক্ষিত স্মৃতি',
    subtitleEn: 'Every star holds a preserved moment',
  },
  {
    id: 'discovery',
    path: '/discovery',
    labelBn: 'আজকের আবিষ্কার',
    labelEn: 'Daily Discovery',
    subtitleBn: 'প্রতিদিনের জন্য একটি নির্বাচিত ভাবনা বা বিস্ময়',
    subtitleEn: 'One thoughtful discovery arranged for today',
  },
  {
    id: 'questions',
    path: '/questions',
    labelBn: 'প্রশ্নের ঘর',
    labelEn: 'Question Room',
    subtitleBn: 'নিজের সাথে নিরিবিলি কথা বলার প্রশ্ন',
    subtitleEn: 'Reflective prompts with private answers',
  },
  {
    id: 'letters',
    path: '/letters',
    labelBn: 'চিঠির আর্কাইভ',
    labelEn: 'Letter Archive',
    subtitleBn: 'সময়ের জন্য তুলে রাখা ব্যক্তিগত চিঠি',
    subtitleEn: 'Quiet letters preserved for the right moment',
  },
  {
    id: 'timemachine',
    path: '/time-machine',
    labelBn: 'সময়যান',
    labelEn: 'Time Machine',
    subtitleBn: 'অতীত, বর্তমান আর ভবিষ্যতের রেখায় সাজানো দিন',
    subtitleEn: 'Past, present, and future milestones',
  },
  {
    id: 'hidden',
    path: '/hidden',
    labelBn: 'লুকানো মহাবিশ্ব',
    labelEn: 'Hidden Universe',
    subtitleBn: 'অপেক্ষায় থাকা কিছু গোপন অধ্যায় ও ইঙ্গিত',
    subtitleEn: 'Quiet clues and unlockable discoveries',
  },
  {
    id: 'sound',
    path: '/sound',
    labelBn: 'স্মৃতির সুর',
    labelEn: 'Sound of Memories',
    subtitleBn: 'শব্দ ও কণ্ঠের সংরক্ষিত মুহূর্ত',
    subtitleEn: 'Recorded soundscapes and voice moments',
  },
  {
    id: 'mirror',
    path: '/mirror',
    labelBn: 'আয়না — একান্ত ডায়েরি',
    labelEn: 'The Mirror',
    subtitleBn: 'সম্পূর্ণ এনক্রিপ্টেড ব্যক্তিগত ডায়েরি',
    subtitleEn: 'Your end-to-end encrypted private journal',
  },
  {
    id: 'story',
    path: '/story',
    labelBn: 'অসমাপ্ত গল্প',
    labelEn: 'Unfinished Story',
    subtitleBn: 'অধ্যায়ে অধ্যায়ে লেখা এক ধারাবাহিক আখ্যান',
    subtitleEn: 'An unfolding story told chapter by chapter',
  },
  {
    id: 'science',
    path: '/science',
    labelBn: 'বিজ্ঞান গবেষণাগার',
    labelEn: 'Science Laboratory',
    subtitleBn: 'মহাবিশ্ব, চেতনা ও বাস্তবতার বিজ্ঞানভিত্তিক অন্বেষণ',
    subtitleEn: 'Cosmology, neuroscience, and open questions',
  },
  {
    id: 'messages',
    path: '/messages',
    labelBn: 'ব্যক্তিগত বার্তা',
    labelEn: 'Private Messages',
    subtitleBn: 'সরাসরি নির্মাতার সাথে নিরাপদ যোগাযোগ',
    subtitleEn: 'Direct messages with manual replies from The Creator',
  },
];

export const UI_COPY = {
  bn: {
    brand: 'HIRA',
    tagline: 'শুধু তোমার জন্য গড়া একটি মহাবিশ্ব।',
    secondaryPhrase: 'কোথাও, আমাদের মাঝে।',
    defaultWelcomeTitle: 'স্বাগতম, হীরা।',
    defaultWelcomeBody:
      'এই ছোট্ট মহাবিশ্বটা শুধু তোমার জন্য সাজানো। এখানে প্রতিটি কোণে তোমার জন্য কিছু না কিছু অপেক্ষা করছে। কোনো তাড়া নেই—নিজের মতো করে ঘুরে দেখো।',
    beginExploring: 'অন্বেষণ শুরু করো',
    enterUniverse: 'মহাবিশ্বে প্রবেশ করো',
    signIn: 'প্রবেশ করো',
    signOut: 'প্রস্থান',
    privacyNoteLink: 'গোপনীয়তা ও নিরাপত্তা',
    languageLabel: 'English',
    reducedMotionOn: 'গতি কমানো চালু',
    reducedMotionOff: 'স্বাভাবিক গতি',
    navGalaxy: 'গ্যালাক্সি',
    navDiscovery: 'আবিষ্কার',
    navLetters: 'চিঠি',
    navMirror: 'আয়না',
    navAllSections: 'সব অধ্যায়',
    emptyTitle: 'এই কোণটি এখনো নীরব',
    emptySubtitle: 'যখন কোনো প্রকৃত স্মৃতি বা লেখা যোগ করা হবে, তখন তা এখানে আলো হয়ে উঠবে।',
    loading: 'নক্ষত্রগুলো সাজানো হচ্ছে…',
    backToUniverse: 'মহাবিশ্বে ফিরে যাও',
    privacyBadge: 'ব্যক্তিগত মহাবিশ্ব · বাংলাদেশ সময় (BST)',
  },
  en: {
    brand: 'HIRA',
    tagline: 'A Universe Made Just for You.',
    secondaryPhrase: 'Somewhere, Between Us.',
    defaultWelcomeTitle: 'Welcome, Hira.',
    defaultWelcomeBody:
      'This little universe was made just for you. Every corner has something waiting to be discovered. Explore at your own pace—there is never any rush.',
    beginExploring: 'Begin Exploring',
    enterUniverse: 'Enter Universe',
    signIn: 'Enter',
    signOut: 'Sign Out',
    privacyNoteLink: 'Privacy & Security',
    languageLabel: 'বাংলা',
    reducedMotionOn: 'Reduced Motion On',
    reducedMotionOff: 'Standard Motion',
    navGalaxy: 'Galaxy',
    navDiscovery: 'Discovery',
    navLetters: 'Letters',
    navMirror: 'The Mirror',
    navAllSections: 'All Chambers',
    emptyTitle: 'This corner is still quiet',
    emptySubtitle: 'When authentic memories or writings are added by The Creator, they will appear here.',
    loading: 'Aligning the constellations…',
    backToUniverse: 'Back to Universe',
    privacyBadge: 'Private Universe · Asia/Dhaka (BST)',
  },
} as const;

export function pickText(lang: Language, bn?: string, en?: string): string {
  if (lang === 'bn') {
    return (bn && bn.trim()) || (en && en.trim()) || '';
  }
  return (en && en.trim()) || (bn && bn.trim()) || '';
}
