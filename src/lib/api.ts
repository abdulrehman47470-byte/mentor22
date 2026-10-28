// Mock backend. Screens only call these functions (and the hooks in store.tsx), so this file can be
// replaced with calls to admin.mentorandmatch.com without touching any screen. Each function notes the
// fields the real app sends. State lives in localStorage so reloads keep it.

import { BRAND } from '@/config/brand';
import { L } from '@/data/labels';
import { COLLEGES, COLLEGE_RESOURCES, DEMO_OTP, DEMO_STUDENT, MENTORS, seedConnections, seedMeetings, seedMessages } from '@/data/mock';
import { notifyPush } from './push';
import type { AppNotification, Availability, Connection, Meeting, Message, MessageType, Profile, User } from './types';

export type Db = {
  users: User[];
  connections: Connection[];
  messages: Message[];
  meetings: Meeting[];
  notifications: AppNotification[];
  availability: Availability[];
  blocks: { by: string; blocked: string }[];
  reports: { id: string; by: string; userId: string; reason: string; description: string; createdAt: string }[];
  tickets: { id: string; by: string; name: string; email: string; reason: string; message: string; createdAt: string }[];
  recentSearches: string[];
  /** Signed-in student. */
  sessionUserId: string | null;
  /** Waiting for the email code: who, and when the code expires. The code itself never reaches the app. */
  pendingOtp: { userId: string; expiresAt: number } | null;
  /** Saved on this phone only (as in the Android app). */
  device: { termsAccepted: boolean; eduAccepted: boolean; verified: string[]; textScale: number; reduceMotion: boolean };
};

const KEY = 'mm-student-db-v1';
const now = () => new Date().toISOString();
const rid = () => Math.random().toString(36).slice(2, 10);

function seed(): Db {
  return {
    users: [DEMO_STUDENT, ...MENTORS],
    connections: seedConnections(),
    messages: seedMessages(),
    meetings: seedMeetings(),
    notifications: [
      { id: 'n1', title: 'Meeting Invite', body: 'Daniel Reyes invited you to “TAG application review”.', fromId: 'u2', link: '/calendar', read: false, createdAt: new Date(Date.now() - 50 * 60_000).toISOString() },
      { id: 'n2', title: 'New request', body: 'Leilani Fonoti would like to mentor you.', fromId: 'u5', link: '/requests', read: false, createdAt: new Date(Date.now() - 5 * 3_600_000).toISOString() },
      { id: 'n3', title: 'Request accepted', body: 'Priya Sharma accepted your request.', fromId: 'u3', link: '/mentor/u3', read: true, createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString() },
    ],
    availability: [],
    blocks: [],
    reports: [],
    tickets: [],
    recentSearches: ['Transfer', 'Nursing'],
    sessionUserId: null,
    pendingOtp: null,
    device: { termsAccepted: false, eduAccepted: false, verified: [], textScale: 1, reduceMotion: false },
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch {
    /* private mode or bad data: start fresh */
  }
  return seed();
}

let db = load();
const listeners = new Set<() => void>();
let saveQueued = false;

function commit(mut: (d: Db) => void) {
  const next = structuredClone(db);
  mut(next);
  db = next;
  listeners.forEach((l) => l());
  // Writing localStorage is slow on big states, so batch it once per frame.
  if (!saveQueued) {
    saveQueued = true;
    requestAnimationFrame(() => {
      saveQueued = false;
      try {
        localStorage.setItem(KEY, JSON.stringify(db));
      } catch {
        /* storage full or blocked: keep working in memory */
      }
    });
  }
}

export const dbStore = {
  get: () => db,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// ---------- Lookups ----------
export const fullName = (u: Pick<User, 'profile'>) => `${u.profile.firstName} ${u.profile.lastName}`.trim();
export const me = (d: Db = db) => d.users.find((u) => u.id === d.sessionUserId) ?? null;
export const userById = (id: string, d: Db = db) => d.users.find((u) => u.id === id) ?? null;
export const collegeById = (id: string | null) => COLLEGES.find((c) => c.id === id) ?? null;
export const collegeName = (u: User) => collegeById(u.collegeId)?.name ?? '';
export const isMentor = (u: User) => u.role === 'mentor' || u.role === 'peer_mentor';
export const roleLabel = (u: User) => (u.role === 'peer_mentor' ? 'Peer Mentor' : u.role === 'mentor' ? L.mentor : L.mentee);
export const collegeResources = (collegeId: string | null) => COLLEGE_RESOURCES.filter((r) => r.collegeId === collegeId);

export const isBlocked = (a: string, b: string, d: Db = db) => d.blocks.some((x) => (x.by === a && x.blocked === b) || (x.by === b && x.blocked === a));
export const iBlocked = (other: string, d: Db = db) => d.blocks.some((x) => x.by === d.sessionUserId && x.blocked === other);

export type LinkStatus = 'none' | 'requested' | 'invited' | 'accepted';
export const connectionWith = (mentorId: string, d: Db = db) => d.connections.find((c) => c.studentId === d.sessionUserId && c.mentorId === mentorId) ?? null;
export const statusWith = (mentorId: string, d: Db = db): LinkStatus => connectionWith(mentorId, d)?.status ?? 'none';

/** Share of the student profile that is filled in (`completed_percentage`). */
export function profileCompletion(p: Profile) {
  const fields: unknown[] = [
    p.firstName, p.lastName, p.gender, p.ageRange, p.ethnicity, p.pronouns, p.languages, p.religion, p.about,
    p.currentCollege, p.enrollmentStatus, p.currentSemester, p.gradYear, p.gpa, p.major, p.certificate,
    p.collegeGoals, p.careerGoals, p.attendType, p.transferTo, p.describesMe, p.seeking, p.metCounselor, p.appliedFinancialAid,
  ];
  const done = fields.filter((f) => (Array.isArray(f) ? f.length > 0 : !!f)).length;
  return Math.round((done / fields.length) * 100);
}

/** Mentors at the student's college first, then everyone else. Hidden: blocked users. */
export function mentors(d: Db = db) {
  const u = me(d);
  if (!u) return [];
  return d.users
    .filter((x) => isMentor(x) && !isBlocked(u.id, x.id, d))
    .sort((a, b) => Number(b.collegeId === u.collegeId) - Number(a.collegeId === u.collegeId));
}

/** Home: mentors the student isn't linked to yet (`college_id`). */
export const recommended = (d: Db = db) => mentors(d).filter((m) => statusWith(m.id, d) === 'none');

export type Filters = { ageRange: string; gender: string; ethnicity: string; pronouns: string; major: string; describesMe: string; describedHaving: string; attendedType: string; wentTo: string };
export const NO_FILTERS: Filters = { ageRange: '', gender: '', ethnicity: '', pronouns: '', major: '', describesMe: '', describedHaving: '', attendedType: '', wentTo: '' };

/** Search: `search_text` plus the filter fields. */
export function searchMentors(q: string, f: Filters, d: Db = db) {
  const t = q.trim().toLowerCase();
  return mentors(d).filter((m) => {
    const p = m.profile;
    const hay = [fullName(m), p.profession, collegeName(m), p.about, ...(p.education ?? []).map((e) => e.college)].join(' ').toLowerCase();
    if (t && !hay.includes(t)) return false;
    if (f.ageRange && p.ageRange !== f.ageRange) return false;
    if (f.gender && p.gender !== f.gender) return false;
    if (f.ethnicity && p.ethnicity !== f.ethnicity) return false;
    if (f.pronouns && p.pronouns !== f.pronouns) return false;
    if (f.major && !hay.includes(f.major.toLowerCase())) return false;
    if (f.describesMe && !p.mentorDescribes?.includes(f.describesMe)) return false;
    if (f.describedHaving && !p.mentorHaving?.includes(f.describedHaving)) return false;
    if (f.attendedType && p.attendedType !== f.attendedType) return false;
    if (f.wentTo && p.wentTo !== f.wentTo) return false;
    return true;
  });
}

export function addRecentSearch(q: string) {
  const t = q.trim();
  if (t) commit((d) => void (d.recentSearches = [t, ...d.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8)));
}
export const clearRecentSearches = () => commit((d) => void (d.recentSearches = []));

// ---------- Auth ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const validEmail = (e: string) => EMAIL_RE.test(e.trim());
export const strongPassword = (p: string) => p.length >= BRAND.minPassword;

/** Where a signed-in student goes next. */
export type Step = '/verify' | '/upload-photo' | '/select-college' | '/home';

/** Log In: sends `email`, `password`, `firebase_token`. The reply never contains the OTP. */
export function logIn(email: string, password: string): { error: string } | { next: Step } {
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || isMentor(u)) return { error: L.user_not_found };
  if (u.password !== password) return { error: L.invalid_email_or_password };
  commit((d) => {
    const user = d.users.find((x) => x.id === u.id)!;
    // Terms acceptance is recorded on the account, not only on the phone.
    user.termsAcceptedAt ??= now();
    d.device.termsAccepted = true;
    if (d.device.verified.includes(u.id)) d.sessionUserId = u.id;
    else d.pendingOtp = { userId: u.id, expiresAt: Date.now() + BRAND.otpSeconds * 1000 };
  });
  return { next: db.sessionUserId === u.id ? (u.photo ? '/select-college' : '/upload-photo') : '/verify' };
}

/** Verify: sends `otp`, `user_id`, `firebase_token`. */
export function verifyOtp(code: string): { error: string } | { next: Step } {
  const p = db.pendingOtp;
  if (!p) return { error: L.authentication_failed };
  if (Date.now() > p.expiresAt) return { error: L.authentication_failed };
  if (code !== DEMO_OTP) return { error: L.please_enter_correct_otp };
  const u = userById(p.userId)!;
  commit((d) => {
    d.sessionUserId = p.userId;
    d.pendingOtp = null;
    d.device.verified.push(p.userId);
  });
  return { next: u.photo ? '/select-college' : '/upload-photo' };
}

/** Resend: sends `user_id`. */
export function resendOtp() {
  commit((d) => {
    if (d.pendingOtp) d.pendingOtp.expiresAt = Date.now() + BRAND.otpSeconds * 1000;
  });
}

export const pendingEmail = (d: Db = db) => (d.pendingOtp ? userById(d.pendingOtp.userId, d)?.email ?? '' : '');

/** Forgot password: sends `email`. */
export function forgotPassword(email: string): { error: string } | { ok: true } {
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return { error: L.user_not_found };
  sessionStorage.setItem('mm-reset-email', u.email);
  return { ok: true };
}

/** Create new password (from the email link): sends `password`, `user_id`, `token`. */
export function setNewPassword(password: string): { error: string } | { ok: true } {
  const email = sessionStorage.getItem('mm-reset-email') ?? db.users.find((u) => u.id === 'me')!.email;
  const u = db.users.find((x) => x.email === email);
  if (!u) return { error: L.user_not_found };
  if (u.password === password) return { error: L.your_new_password_should_be_different_from_previously_used };
  commit((d) => void (d.users.find((x) => x.id === u.id)!.password = password));
  sessionStorage.removeItem('mm-reset-email');
  return { ok: true };
}

/** Settings → Reset Password: sends `current_password`, `new_password`. */
export function changePassword(current: string, next: string): { error: string } | { ok: true } {
  const u = me();
  if (!u) return { error: L.authentication_failed };
  if (u.password !== current) return { error: L.password_is_incorrect };
  if (current === next) return { error: L.your_new_password_should_be_different_from_previously_used };
  commit((d) => void (me(d)!.password = next));
  return { ok: true };
}

export function signOut() {
  commit((d) => {
    d.sessionUserId = null;
    d.pendingOtp = null;
  });
}

/** Upload profile photo: the image goes to storage, then its link is sent as `user_profile`. */
export const setPhoto = (photo: string) => commit((d) => void (me(d)!.photo = photo));
/** Select your college: sends `college_id`. */
export const setCollege = (collegeId: string) => commit((d) => void (me(d)!.collegeId = collegeId));
export const acceptEducational = () => commit((d) => void (d.device.eduAccepted = true));
export const setTextScale = (v: number) => commit((d) => void (d.device.textScale = v));
export const setReduceMotion = (v: boolean) => commit((d) => void (d.device.reduceMotion = v));

export function saveProfile(p: Profile) {
  commit((d) => void (me(d)!.profile = p));
}

// ---------- Notifications ----------
function notify(d: Db, n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  d.notifications.unshift({ ...n, id: rid(), read: false, createdAt: now() });
  notifyPush(n.title, n.body);
}
export const markNotificationsRead = () => commit((d) => d.notifications.forEach((n) => (n.read = true)));

// ---------- Connections ----------
/** Connect: sends `to_user_id`. The demo mentor accepts a few seconds later. */
export function connect(mentorId: string) {
  commit((d) => {
    d.connections.push({ id: rid(), studentId: d.sessionUserId!, mentorId, status: 'requested', createdAt: now() });
  });
  setTimeout(() => {
    const c = connectionWith(mentorId);
    if (c?.status !== 'requested') return;
    commit((d) => {
      d.connections.find((x) => x.id === c.id)!.status = 'accepted';
      const m = userById(mentorId, d)!;
      notify(d, { title: 'Request accepted', body: `${fullName(m)} accepted your request.`, fromId: mentorId, link: `/mentor/${mentorId}` });
    });
  }, 6000);
}

/** Accept / reject / disconnect: sends `connection_id`, `accept_reject_status`, `reason`. */
export const acceptConnection = (id: string) => commit((d) => void (d.connections.find((c) => c.id === id)!.status = 'accepted'));
export const removeConnection = (id: string, _reason = '') => commit((d) => void (d.connections = d.connections.filter((c) => c.id !== id)));
export const cancelRequest = (mentorId: string) => {
  const c = connectionWith(mentorId);
  if (c) removeConnection(c.id);
};

// ---------- Chat ----------
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const BAD_WORDS = /\b(fuck|shit|bitch|asshole|bastard|dick|cunt|slut|whore)\b/i;

/** Returns the reason a message can't be sent, or null. Phone numbers and emails aren't allowed in chat. */
export function checkMessage(text: string): string | null {
  if (PHONE_RE.test(text) || EMAIL_IN_TEXT.test(text)) return L.you_can_not_share_personal_details_over_text;
  if (BAD_WORDS.test(text)) return L.bad_word_found;
  return null;
}

const REPLIES = ['Sounds good!', 'Thanks for the update. Let me know if you have questions.', 'Great question, let us talk about it at our next meeting.', 'Happy to help!'];

/** Chat: sends `to_user_id`, `message`, `message_type` (1 text, 2 image, 5 document), `message_url`. */
export function sendMessage(to: string, text: string, file?: { type: MessageType; name: string; url: string }) {
  commit((d) => {
    d.messages.push({ id: rid(), from: d.sessionUserId!, to, text, type: file?.type ?? 'text', fileName: file?.name, fileUrl: file?.url, read: true, createdAt: now() });
  });
  setTimeout(() => {
    if (isBlocked(db.sessionUserId ?? '', to)) return;
    commit((d) => {
      d.messages.push({ id: rid(), from: to, to: d.sessionUserId!, text: REPLIES[Math.floor(Math.random() * REPLIES.length)], type: 'text', read: false, createdAt: now() });
    });
  }, 3500);
}

export const markThreadRead = (other: string) =>
  commit((d) => d.messages.forEach((m) => m.from === other && m.to === d.sessionUserId && (m.read = true)));

export type Thread = { other: User; last: Message; unread: number };
export function threads(d: Db = db): Thread[] {
  const uid = d.sessionUserId;
  const map = new Map<string, Thread>();
  for (const m of d.messages) {
    if (m.from !== uid && m.to !== uid) continue;
    const otherId = m.from === uid ? m.to : m.from;
    const other = userById(otherId, d);
    if (!other) continue;
    const t = map.get(otherId) ?? { other, last: m, unread: 0 };
    if (m.createdAt >= t.last.createdAt) t.last = m;
    if (m.to === uid && !m.read) t.unread++;
    map.set(otherId, t);
  }
  return [...map.values()].sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
}

// ---------- Meetings ----------
/** Schedule: sends `to_user_id`, `title`, `date`, `start_time`, `end_time`, `note`, `call_type`, `meeting_reason`. */
export function scheduleMeeting(m: Omit<Meeting, 'id' | 'organizer' | 'status'>) {
  const id = rid();
  commit((d) => void d.meetings.push({ ...m, id, organizer: d.sessionUserId!, status: 'pending' }));
  setTimeout(() => {
    commit((d) => {
      const mt = d.meetings.find((x) => x.id === id);
      if (mt?.status !== 'pending') return;
      mt.status = 'accepted';
      notify(d, { title: 'Meeting accepted', body: `${fullName(userById(m.invitee, d)!)} accepted “${m.title}”.`, fromId: m.invitee, link: '/calendar' });
    });
  }, 4500);
}

/** Accept or decline a meeting: sends `meeting_id`, `accept_reject_status`, `reason`. */
export const respondMeeting = (id: string, accept: boolean, reason = '') =>
  commit((d) => {
    const m = d.meetings.find((x) => x.id === id)!;
    m.status = accept ? 'accepted' : 'declined';
    if (reason) m.declineReason = reason;
  });
export const cancelMeeting = (id: string) => commit((d) => void (d.meetings.find((x) => x.id === id)!.status = 'cancelled'));

/** Set availability: sends `date`, `slots`. */
export const setAvailability = (date: string, slots: string[]) =>
  commit((d) => {
    d.availability = d.availability.filter((a) => a.date !== date);
    if (slots.length) d.availability.push({ date, slots });
    d.availability.sort((a, b) => a.date.localeCompare(b.date));
  });

// ---------- Safety and support ----------
/** Report: sends `to_user_id`, `reason_id`, `description`. */
export const reportUser = (userId: string, reason: string, description: string) =>
  commit((d) => void d.reports.push({ id: rid(), by: d.sessionUserId!, userId, reason, description, createdAt: now() }));
/** Block / unblock: sends `to_user_id`. */
export const block = (userId: string) => commit((d) => void d.blocks.push({ by: d.sessionUserId!, blocked: userId }));
export const unblock = (userId: string) => commit((d) => void (d.blocks = d.blocks.filter((b) => !(b.by === d.sessionUserId && b.blocked === userId))));

/** Help & Support: sends the reason and message, and also the name and email the student typed. */
export const sendHelp = (t: { name: string; email: string; reason: string; message: string }) =>
  commit((d) => void d.tickets.push({ ...t, id: rid(), by: d.sessionUserId!, createdAt: now() }));
