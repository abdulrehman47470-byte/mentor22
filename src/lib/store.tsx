import { useSyncExternalStore } from 'react';
import { dbStore, me, type Db } from './api';

/** Read from the mock database; re-renders when it changes. */
export function useDb<T>(select: (d: Db) => T): T {
  const d = useSyncExternalStore(dbStore.subscribe, dbStore.get);
  return select(d);
}

export const useMe = () => useDb((d) => me(d));

export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Local YYYY-MM-DD for a Date. */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Parses YYYY-MM-DD as a local date (not UTC). */
export const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const fmtDay = (s: string) => fromYmd(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
/** "14:30" → "2:30 PM" */
export function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
