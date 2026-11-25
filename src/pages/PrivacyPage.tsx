import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';

export const PrivacyPage: React.FC = () => {
  const { language } = useAuth();
  const isBn = language === 'bn';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeader
        kicker={isBn ? 'নিরাপত্তা ও স্বচ্ছতা' : 'PRIVACY & TRANSPARENCY'}
        title={isBn ? 'এই মহাবিশ্বে গোপনীয়তা কীভাবে কাজ করে' : 'How Privacy Works Inside HIRA'}
        subtitle={
          isBn
            ? 'কী তথ্য সংরক্ষিত হয়, কোন অংশ সম্পূর্ণ একান্ত এবং কেন—তার পরিষ্কার ও সৎ ব্যাখ্যা।'
            : 'An honest, transparent explanation of what is stored, what stays strictly private to you, and why.'
        }
      />

      <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
        <section className="border border-slate-800 bg-[#0C1120]/75 rounded-xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-200">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <h2 className="font-editorial text-2xl text-slate-100">
              {isBn ? '১. আয়না — একান্ত ডায়েরি (ক্লায়েন্ট-সাইড এনক্রিপশন)' : '1. The Mirror — End-to-End Browser Encryption'}
            </h2>
          </div>
          <p>
            {isBn
              ? 'তুমি যখন "আয়না"-তে একটি গোপন পাসফ্রেজ দিয়ে ডায়েরি লেখো, তখন তোমার লেখা ও শিরোনাম তোমার ব্রাউজারের মধ্যেই Web Crypto API (PBKDF2 SHA-256 + AES-256-GCM) ব্যবহার করে এনক্রিপ্ট হয়। সার্ভারে কেবল দুর্বোধ্য সাইফারটেক্সট জমা থাকে।'
              : 'When you write in The Mirror using your separate journal passphrase, your title and entry body are encrypted inside your browser via the Web Crypto API (PBKDF2 SHA-256 + AES-256-GCM) before reaching Firestore.'}
          </p>
          <p className="text-slate-400 text-sm">
            {isBn
              ? 'তোমার পাসফ্রেজ বা এনক্রিপশন কী কখনো সার্ভারে, ডাটাবেসে বা ব্রাউজারের localStorage-এ সংরক্ষিত হয় না। ড্যাশবোর্ড বা অ্যাডমিন এপিআই থেকে এই ডায়েরি দেখার কোনো ব্যবস্থা নেই। তবে মনে রেখো: পাসফ্রেজ ভুলে গেলে এনক্রিপ্ট করা লেখা উদ্ধার করা সম্ভব নয়।'
              : 'Your passphrase and derived key never leave browser memory. The Creator and Admin Portal have zero access to privateJournal records. Because no recovery copy exists, forgetting your journal passphrase makes encrypted entries unrecoverable.'}
          </p>
        </section>

        <section className="border border-slate-800 bg-[#0C1120]/75 rounded-xl p-6 sm:p-8 space-y-3">
          <h2 className="font-editorial text-2xl text-slate-100">
            {isBn ? '২. প্রশ্নের ঘরের উত্তর' : '2. Question Room Answers'}
          </h2>
          <p>
            {isBn
              ? 'প্রশ্নের ঘরে তোমার লেখা প্রতিটি উত্তর ডিফল্টভাবে সম্পূর্ণ ব্যক্তিগত থাকে। অ্যাডমিন তা পড়তে পারেন না। কেবল তুমি যদি নির্দিষ্ট কোনো উত্তরে স্বেচ্ছায় "নির্মাতার সাথে ভাগ করে নাও" অপশন চালু করো, তবেই তিনি সেই উত্তরটি দেখতে পারবেন।'
              : 'Your answers in the Question Room remain private to your account by default. The Creator can only view an individual answer if you explicitly enable sharing for that specific response.'}
          </p>
        </section>

        <section className="border border-slate-800 bg-[#0C1120]/75 rounded-xl p-6 sm:p-8 space-y-3">
          <h2 className="font-editorial text-2xl text-slate-100">
            {isBn ? '৩. ব্যক্তিগত বার্তা ও সততা' : '3. Private Messages & Human Replies'}
          </h2>
          <p>
            {isBn
              ? 'ব্যক্তিগত বার্তা অংশটি কোনো এআই চ্যাটবট নয়। এখানে কোনো স্বয়ংক্রিয় উত্তর, ভুয়া অনলাইন স্ট্যাটাস বা ভুয়া টাইপিং ইন্ডিকেটর ব্যবহার করা হয় না। প্রতিটি উত্তর নির্মাতা নিজে হাতে লিখে পাঠান।'
              : 'The Private Messages chamber is not an AI chatbot. There are no automated replies, fake online indicators, or simulated typing states. Every reply is written manually by The Creator.'}
          </p>
        </section>

        <section className="border border-slate-800 bg-[#0C1120]/75 rounded-xl p-6 sm:p-8 space-y-3">
          <h2 className="font-editorial text-2xl text-slate-100">
            {isBn ? '৪. কোনো অপ্রয়োজনীয় ট্র্যাকিং নেই' : '4. No Surveillance or Invasive Analytics'}
          </h2>
          <p>
            {isBn
              ? 'HIRA কোনো জিপিএস লোকেশন, ব্রাউজার ফিঙ্গারপ্রিন্টিং, তৃতীয় পক্ষের বিজ্ঞাপন ট্র্যাকার বা গোপন নজরদারি ব্যবহার করে না। কেবল অনুমোদিত দুটি অ্যাকাউন্ট—হীরা ও নির্মাতা—এই মহাবিশ্বে প্রবেশ করতে পারেন।'
              : 'HIRA collects no GPS location, performs no browser fingerprinting, and runs no third-party tracking scripts. Access is strictly limited to two authorized accounts.'}
          </p>
        </section>
      </div>
    </div>
  );
};
