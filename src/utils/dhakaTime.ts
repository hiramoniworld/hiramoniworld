import { Timestamp } from 'firebase/firestore';

export const DHAKA_TIMEZONE = 'Asia/Dhaka';

/**
 * Returns today's date string (YYYY-MM-DD) in Asia/Dhaka (Bangladesh Standard Time, UTC+6).
 */
export function getTodayDhakaKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date or Firestore Timestamp in Asia/Dhaka local time.
 */
export function formatDhakaDateTime(
  value: Timestamp | Date | null | undefined,
  lang: 'bn' | 'en' = 'bn'
): string {
  if (!value) return '—';
  const date = value instanceof Timestamp ? value.toDate() : value;
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Converts a local Asia/Dhaka date ("YYYY-MM-DD") and time ("HH:MM") input
 * into an accurate UTC-backed Firestore Timestamp (BST is permanently UTC+06:00).
 */
export function dhakaInputToTimestamp(dateStr: string, timeStr: string = '00:00'): Timestamp | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const safeTime = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '00:00';
  const isoWithOffset = `${dateStr}T${safeTime}:00+06:00`;
  const parsed = new Date(isoWithOffset);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

/**
 * Extracts YYYY-MM-DD and HH:MM strings in Asia/Dhaka from a Firestore Timestamp for form inputs.
 */
export function timestampToDhakaInputs(ts?: Timestamp | null): { date: string; time: string } {
  if (!ts) {
    return { date: getTodayDhakaKey(), time: '09:00' };
  }
  const d = ts.toDate();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '09';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour === '24' ? '00' : hour}:${minute}`,
  };
}

/**
 * Evaluates whether a content item is live for Hira in Asia/Dhaka.
 */
export function isContentLive(status: string, scheduledAt?: Timestamp | null): boolean {
  if (status === 'published') return true;
  if (status === 'scheduled' && scheduledAt) {
    return scheduledAt.toMillis() <= Date.now();
  }
  return false;
}
