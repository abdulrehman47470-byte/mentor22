// Demo imagery: stock scene photos chosen from each member's field and interests,
// used for profile covers, the Discover photo carousel and resource cards.
import type { User } from '@/lib/types';

const S = (n: string) => `/demo/scenes/${n}.webp`;
const P = (n: string) => `/demo/posts/${n}.webp`;

/** Field keywords (matched against major, profession and career interests) and photos for them. */
const BY_COLLEGE: [string, string[]][] = [
  ['Engineer', [S('laptop'), P('hackathon'), P('code')]],
  ['Computer', [S('laptop'), P('code'), P('hackathon')]],
  ['Software', [S('laptop'), P('code'), P('hackathon')]],
  ['Business', [S('finance'), P('office'), P('interview')]],
  ['Accounting', [S('finance'), P('office'), P('interview')]],
  ['Financial', [S('finance'), P('office'), P('study')]],
  ['Nurs', [S('health'), P('lab'), P('study')]],
  ['Health', [S('health'), P('lab'), P('study')]],
  ['Communication', [P('stage'), P('mixer'), P('zoom')]],
  ['Arts', [P('workshop'), S('art'), P('stage')]],
  ['Education', [P('lecture'), S('library'), P('books')]],
  ['Teach', [P('lecture'), S('library'), P('books')]],
  ['Transfer', [S('campus'), S('library'), P('lecture')]],
];
const field = (p: User['profile']) => [p.major, p.profession, p.careers].join(' ');

const BY_INTEREST: Record<string, string> = {
  'Career Advice': P('interview'),
  Networking: S('teamwork'),
  'Study Skills': S('students'),
  'Transfer Guidance': S('campus'),
  Internships: P('office'),
  'Personal Support': P('chat'),
};

const DEFAULT = [S('mentoring'), S('students'), S('campus')];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A wide cover photo for a member's profile and cards. */
export function coverFor(u: Pick<User, 'id' | 'profile'>): string {
  const set = BY_COLLEGE.find(([k]) => field(u.profile).includes(k))?.[1] ?? DEFAULT;
  return set[hash(u.id) % set.length];
}

/** Up to 4 photos for the Discover carousel and profile gallery: their photo first, then scenes from their world. */
export function galleryFor(u: Pick<User, 'id' | 'photo' | 'profile'>): string[] {
  const college = BY_COLLEGE.find(([k]) => field(u.profile).includes(k))?.[1] ?? [];
  const interests = u.profile.mentoringInterests.map((i) => BY_INTEREST[i]).filter(Boolean);
  const pool = [...college, ...interests, ...DEFAULT];
  const start = hash(u.id) % Math.max(1, college.length || 1);
  const scenes = [...new Set([...pool.slice(start), ...pool.slice(0, start)])].slice(0, u.photo ? 3 : 4);
  return u.photo ? [u.photo, ...scenes] : scenes;
}

/** Header photo for each resource category. */
export const RESOURCE_IMAGES: Record<string, string> = {
  Campus: S('campus'),
  Career: P('interview'),
  Academic: S('library'),
  Wellness: S('health'),
  Financial: S('finance'),
};
export const resourceImage = (category: string) => RESOURCE_IMAGES[category] ?? S('students');
