// Mock backend (Phase 0). Screens only call these functions and the hooks in store.tsx, so Phase 1
// can replace this file with Supabase calls (same function names) without touching the screens.
// State is kept in localStorage so reloads keep it; Sign Out resets everything.

import { BRAND } from '@/config/brand';
import { CMS, DEMO_OTP, DEMO_PASSWORD, DEMO_USER, MOCK_CALLS, MOCK_ROOMS, MOCK_COMMENTS, MOCK_POSTS, MOCK_STORIES, MOCK_CONNECTIONS, MOCK_MEETINGS, MOCK_MESSAGES, MOCK_RESOURCES, MOCK_USERS, ORG_ID, emptyProfile, mockSlots } from '@/data/mock';
import { L } from '@/data/labels';
import { MENTOR_CLASSES } from '@/data/options';
import { DEFAULT_TEMPLATES } from '@/data/templates';
import type {
  AppNotification, AuditEntry, EmailTemplate, EmailTemplateKey, Invite, InviteStatus, OutboxEmail, CallKind, CallLog, Comment, LiveRoom, Post, PostKind, PushAudience, PushRecord, ReactionType, Story, Connection, ConnectionStatus, EmailBranding, Meeting, Message, NotificationType, Profile, Report, ReportStatus, Resource, Role, Slot, User,
} from './types';
import { notifyPush } from './push';

export type Db = {
  users: User[];
  connections: Connection[];
  messages: Message[];
  meetings: Meeting[];
  slots: Slot[];
  notifications: AppNotification[];
  reports: Report[];
  blocks: { userId: string; blockedId: string }[];
  passes: { userId: string; passedId: string }[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  calls: CallLog[];
  rooms: LiveRoom[];
  incoming: { fromId: string; kind: CallKind } | null;
  resources: Resource[];
  cms: typeof CMS;
  emailBranding: EmailBranding;
  adminIds: string[];
  audit: AuditEntry[];
  pushHistory: PushRecord[];
  invites: Invite[];
  emailTemplates: EmailTemplate[];
  outbox: OutboxEmail[];
  sessionUserId: string | null;
  realUserId: string | null; // set while a Super Admin is logged in as someone else
  pushEnabled: boolean;
  /** Waiting for the email verification code: who, and when it expires. The code itself never reaches the app. */
  pendingOtp: { userId: string; expiresAt: number } | null;
  /** Help & Support messages (reason, message, and the name and email the member typed). */
  tickets: { id: string; userId: string; name: string; email: string; reason: string; message: string; createdAt: string }[];
  /** Saved on this phone only, as in the Android app. */
  device: { termsAccepted: boolean; eduAccepted: boolean; verified: string[]; textScale: number; reduceMotion: boolean };
};

const KEY = 'mm-student-db-v2';

function seed(): Db {
  const extra = demoExtras();
  return {
    users: [DEMO_USER, ...MOCK_USERS, ...extra.users],
    connections: [...MOCK_CONNECTIONS, ...extra.connections],
    messages: [...MOCK_MESSAGES, ...extra.messages],
    meetings: MOCK_MEETINGS,
    slots: mockSlots(),
    notifications: [
      n('me', 'request', 'u4', 'New mentoring request', 'Kevin Tran wants to connect with you.', 90),
      n('me', 'request', 'u10', 'New mentoring request', 'Samuel Lim wants to connect with you.', 300),
      n('me', 'call', 'u3', 'Missed call', 'You missed an audio call from Priya Sharma.', 180),
      n('me', 'system', 'lr1', 'Grace is live now', 'Tech internship AMA has started. Drop in from Calls.', 18),
      n('me', 'chat', 'u3', 'New message from Priya', 'Hey! Want to grab coffee at the student center on Thursday?', 12),
      n('me', 'meeting', 'mt2', 'Meeting request', 'Priya Sharma invited you to “Study plan check-in”.', 200),
      n('me', 'view_profile', 'u9', 'Profile view', 'Farah Hosseini viewed your profile.', 60 * 30),
    ],
    reports: extra.reports,
    blocks: [],
    passes: [],
    posts: MOCK_POSTS,
    comments: MOCK_COMMENTS,
    stories: MOCK_STORIES,
    calls: MOCK_CALLS,
    rooms: MOCK_ROOMS,
    incoming: null,
    resources: MOCK_RESOURCES,
    cms: CMS,
    emailBranding: { logo: BRAND.logo, primary: BRAND.colors.primary, accent: BRAND.colors.accent, footer: `${BRAND.orgName} · ${BRAND.poweredBy}` },
    adminIds: ['me'],
    audit: extra.audit,
    pushHistory: extra.pushHistory,
    invites: seedInvites(),
    emailTemplates: DEFAULT_TEMPLATES,
    outbox: seedOutbox(),
    sessionUserId: null,
    realUserId: null,
    pushEnabled: true,
    pendingOtp: null,
    tickets: [],
    device: { termsAccepted: false, eduAccepted: false, verified: [], textScale: 1, reduceMotion: false },
  };
}

/** Extra demo activity across the whole app: new members, pairs, two weeks of chats, reports and admin history. */
function demoExtras() {
  const joined = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
  const member = (id: string, role: Role, firstName: string, lastName: string, days: number, p: Partial<Profile>): User => ({
    id, orgId: ORG_ID, role, photo: `/demo/avatars/${id}.webp`, profileVisible: true, joinedAt: joined(days), email: `${firstName}.${lastName}@${role === 'mentee' ? 'student' : 'mentor'}.edu`.toLowerCase(), password: DEMO_PASSWORD,
    profile: { ...emptyProfile(), firstName, lastName, ...p },
  });
  const users: User[] = [
    member('n1', 'mentee', 'Hannah', 'Kim', 5, { classification: 'Mentee', affiliation: 'Student', college: 'El Camino College', pronouns: 'She/Her', gender: 'Female', ageRange: '18–30', mentoringInterests: ['Career Advice'] }),
    member('n2', 'mentee', 'Sofia', 'Alvarez', 8, {
      classification: 'Mentee', affiliation: 'Student', college: 'Long Beach City College', pronouns: 'She/Her', gender: 'Female', availability: ['PM'], communication: ['Video'],
      ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Transfer Guidance', 'Personal Support'], bio: 'Nursing student, first in my family at college.', languages: ['English', 'Tagalog'], hobbies: ['Cooking'], goals: 'Get into a BSN program.',
      major: 'Nursing', academicStatus: 'Full-time', collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['Healthcare'], describesMe: ['First-Generation Student'],
    }),
    member('n3', 'mentor', 'Ethan', 'Brooks', 11, {
      classification: 'Mentor', affiliation: 'Community Member', profession: 'Software Lead', college: 'El Camino College', pronouns: 'He/Him', gender: 'Male', availability: ['Weekends'], communication: ['Video', 'Audio'],
      ageRange: '31–50', ethnicity: ['Asian'], mentoringInterests: ['Career Advice', 'Internships'], bio: 'Software lead at a fintech startup. El Camino and UCLA alum.', languages: ['English', 'Korean'], hobbies: ['Hiking'], goals: 'Help students break into tech.',
      wentTo: 'UCLA', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
    }),
  ];
  const hours = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const connections: Connection[] = [
    { id: 'x1', from: 'u1', to: 'u7', status: 'connected', createdAt: hours(24 * 20) },
    { id: 'x2', from: 'u2', to: 'u11', status: 'connected', createdAt: hours(24 * 30) },
    { id: 'x3', from: 'u3', to: 'n2', status: 'connected', createdAt: hours(24 * 26) },
    { id: 'x4', from: 'n3', to: 'u11', status: 'requested', createdAt: hours(24 * 4) },
    { id: 'x5', from: 'n1', to: 'u5', status: 'requested', createdAt: hours(30) },
  ];
  // Two weeks of conversations at realistic times of day.
  const lines: [string, string, string][] = [
    ['u1', 'u7', 'How did the data structures midterm go?'], ['u7', 'u1', 'Better than expected! The practice set helped a lot.'],
    ['u1', 'u7', 'Great. Next up: let’s polish your internship resume.'], ['u7', 'u1', 'Sending it tonight 🙏'],
    ['u2', 'u11', 'Reminder: mock interview Thursday at 5.'], ['u11', 'u2', 'Thanks Daniel, I’ll be ready.'],
    ['u11', 'u2', 'Got the offer from the credit union!!'], ['u2', 'u11', 'Huge! So proud of you 🎉'],
    ['u1', 'u7', 'Here is the list of labs hiring undergrads.'], ['u7', 'u1', 'This is perfect, thank you.'],
    ['u2', 'u11', 'Let’s plan your negotiation talking points.'], ['u11', 'u2', 'Yes please. Free after 2pm.'],
  ];
  const slots = [[13, 9], [13, 10], [12, 18], [11, 9], [10, 13], [9, 9], [8, 20], [7, 9], [6, 11], [5, 9], [4, 15], [3, 9], [2, 10], [1, 9], [1, 19], [0, 8]];
  const messages: Message[] = [];
  slots.forEach(([day, hour], i) => {
    const t = new Date();
    t.setDate(t.getDate() - day);
    t.setHours(hour, (i * 7) % 60, 0, 0);
    if (t.getTime() > Date.now()) return;
    const [from, to, text] = lines[i % lines.length];
    messages.push({ id: `xm${i}`, from, to, text, type: 'text', read: true, createdAt: t.toISOString() });
    if (i % 3 === 0) messages.push({ id: `xm${i}r`, from: to, to: from, text: 'Sounds good 👍', type: 'text', read: true, createdAt: new Date(t.getTime() + 6 * 60_000).toISOString() });
  });
  const reports: Report[] = [
    { id: 'r1', reporterId: 'u7', reportedId: 'u10', reason: 'Inappropriate Messages', description: 'Kept messaging late at night after I asked to keep it to weekdays.', createdAt: hours(20), status: 'open' },
    { id: 'r2', reporterId: 'u6', reportedId: 'u4', reason: 'Spam', description: 'Sent the same promotional link to several students.', createdAt: hours(52), status: 'open' },
    { id: 'r3', reporterId: 'u11', reportedId: 'u9', reason: 'Other', description: 'Missed two meetings without notice.', createdAt: hours(24 * 9), status: 'resolved', adminNote: 'Talked with both members. Rescheduled.', closedAt: hours(24 * 8) },
  ];
  const pushHistory: PushRecord[] = [
    { id: 'p1', title: 'Fall Mentoring Mixer is Friday', body: 'Join mentors and mentees at the Student Center, 5pm. Food provided!', audience: 'all', recipients: 15, createdAt: hours(24 * 3) },
    { id: 'p2', title: 'Mentors: set your availability', body: 'Add a few office-hour slots so mentees can book you this month.', audience: 'mentor_types', recipients: 9, createdAt: hours(24 * 6) },
  ];
  const audit: AuditEntry[] = [
    { id: 'a1', actorId: 'me', action: 'Email sent', detail: '“Wei, you’re invited to Mentor & Match” to Wei Zhang', createdAt: hours(11) },
    { id: 'a2', actorId: 'me', action: 'Match created', detail: 'Grace Nakamura ↔ Aisha Rahman', createdAt: hours(24 * 2) },
    { id: 'a3', actorId: 'me', action: 'Push sent', detail: '“Fall Mentoring Mixer is Friday” to 15 members', createdAt: hours(24 * 3) },
    { id: 'a4', actorId: 'me', action: 'Report resolved', detail: 'Other · Farah Hosseini', createdAt: hours(24 * 8) },
  ];
  return { users, connections, messages, reports, pushHistory, audit };
}

const hAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Demo outreach so the admin dashboard has history to show. */
function seedInvites(): Invite[] {
  const e = (id: string, name: string, role: Role, status: InviteStatus, h: number, scheduledFor?: string): Invite => ({
    id, fromId: 'me', email: `${name.toLowerCase().replace(' ', '.')}@student.edu`, name, role, status, channel: 'email', message: '', createdAt: hAgo(h), scheduledFor,
  });
  return [
    e('iv1', 'Diego Ramos', 'peer_mentor', 'scheduled', 1, new Date(Date.now() + 2 * 86_400_000).toISOString()),
    e('iv2', 'Wei Zhang', 'mentee', 'sent', 11),
    e('iv3', 'Lucia Gomez', 'mentee', 'sent', 26),
    e('iv4', 'Emily Ross', 'peer_mentor', 'sent', 50),
    e('iv5', 'Omar Haddad', 'mentee', 'opened', 75),
    e('iv6', 'Marcus Bell', 'mentor', 'opened', 98),
    e('iv7', 'Hannah Kim', 'mentee', 'accepted', 140),
    e('iv8', 'Noah Patel', 'professional', 'opened', 170),
    e('iv9', 'Sofia Alvarez', 'mentee', 'accepted', 200),
    e('iv10', 'Ethan Brooks', 'mentor', 'accepted', 260),
    e('iv11', 'Grace Liu', 'professional', 'sent', 300),
    { id: 'iv12', fromId: 'u1', toId: 'u6', message: 'Your project work caught my eye. Happy to mentor you this semester!', channel: 'app', createdAt: hAgo(48) },
  ];
}

function seedOutbox(): OutboxEmail[] {
  const o = (id: string, toName: string, templateKey: EmailTemplateKey, subject: string, h: number): OutboxEmail => ({
    id, to: `${toName.toLowerCase().replace(' ', '.')}@student.edu`, toName, templateKey, subject, body: '', byId: 'me', createdAt: hAgo(h), status: 'sent',
  });
  return [
    o('ob1', 'Wei Zhang', 'invite_mentee', 'Wei, you’re invited to Mentor & Match', 11),
    o('ob2', 'Lucia Gomez', 'invite_mentee', 'Lucia, you’re invited to Mentor & Match', 26),
    o('ob3', 'Emily Ross', 'invite_peer', 'Emily, become a Peer Mentor with Mentor & Match', 50),
    o('ob4', 'Omar Haddad', 'invite_mentee', 'Omar, you’re invited to Mentor & Match', 75),
    o('ob5', 'Marcus Bell', 'invite_mentor', 'Marcus, will you mentor with Mentor & Match?', 98),
    o('ob6', 'Hannah Kim', 'welcome', 'Welcome to Mentor & Match, Hannah!', 130),
    o('ob7', 'Noah Patel', 'invite_professional', 'Noah, join Mentor & Match as an industry mentor', 170),
    o('ob8', 'Sofia Alvarez', 'welcome', 'Welcome to Mentor & Match, Sofia!', 190),
    o('ob9', 'Ethan Brooks', 'welcome', 'Welcome to Mentor & Match, Ethan!', 250),
    o('ob10', 'Grace Liu', 'invite_professional', 'Grace, join Mentor & Match as an industry mentor', 300),
  ];
}

function n(userId: string, type: NotificationType, relatedId: string, title: string, body: string, minAgo: number, read = false): AppNotification {
  return { id: rid(), userId, type, relatedId, title, body, read, createdAt: new Date(Date.now() - minAgo * 60_000).toISOString() };
}

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d: Db = { ...seed(), ...JSON.parse(raw) };
      if (d.sessionUserId) giveDemoSocial(d, d.sessionUserId);
      return d;
    }
  } catch {
    /* storage unavailable: run in memory */
  }
  return seed();
}

/**
 * Demo: a brand-new account starts with the same connections and chats as the demo member,
 * so Messages never looks empty in the prototype.
 */
function giveDemoSocial(d: Db, userId: string) {
  if (userId === 'me' || d.messages.some((m) => m.from === userId || m.to === userId)) return;
  const swap = (id: string) => (id === 'me' ? userId : id);
  d.connections.push(...MOCK_CONNECTIONS.filter((c) => !d.connections.some((x) => (x.from === swap(c.from) && x.to === swap(c.to))))
    .map((c) => ({ ...c, id: rid(), from: swap(c.from), to: swap(c.to) })));
  d.messages.push(...MOCK_MESSAGES.map((m) => ({ ...m, id: rid(), from: swap(m.from), to: swap(m.to) })));
}

let db: Db = load();
const listeners = new Set<() => void>();

// Writing the whole db to localStorage is the slowest part of an update, so it runs after the UI has
// re-rendered (coalesced into one write per burst) and is flushed right away if the page is hidden or closed.
let saveQueued = false;
function persist() {
  if (!saveQueued) return;
  saveQueued = false;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota or private mode: keep in memory */
  }
}
const idle: (cb: () => void) => void =
  typeof requestIdleCallback === 'function' ? (cb) => requestIdleCallback(cb, { timeout: 500 }) : (cb) => setTimeout(cb, 0);
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && persist());
}

function commit(mut: (d: Db) => void) {
  const next = structuredClone(db);
  mut(next);
  db = next;
  listeners.forEach((l) => l());
  if (!saveQueued) {
    saveQueued = true;
    idle(persist);
  }
}

export const dbStore = {
  get: () => db,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

// ---------- helpers ----------

export const fullName = (u: User) => `${u.profile.firstName} ${u.profile.lastName}`.trim() || u.email;
export const isMentorType = (role: Role) => role === 'mentor' || role === 'peer_mentor' || role === 'professional';
export function roleFromClassification(c: string): Role {
  return c === 'Mentor' ? 'mentor' : c === 'Peer Mentor' ? 'peer_mentor' : c === 'Professional' ? 'professional' : 'mentee';
}
export const isMentorClass = (c: string) => (MENTOR_CLASSES as readonly string[]).includes(c);

export function me(d: Db = db): User | null {
  return d.users.find((u) => u.id === d.sessionUserId) ?? null;
}
export function userById(id: string, d: Db = db) {
  return d.users.find((u) => u.id === id);
}

export function statusBetween(a: string, b: string, d: Db = db): ConnectionStatus {
  const c = d.connections.find((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
  if (!c || c.status === 'declined') return 0;
  if (c.status === 'connected') return 3;
  return c.from === a ? 1 : 2;
}

export function isBlocked(a: string, b: string, d: Db = db) {
  return d.blocks.some((x) => (x.userId === a && x.blockedId === b) || (x.userId === b && x.blockedId === a));
}

/** Who shows up in the swipe deck: mentees see mentor-types; mentors see mentees; peer mentors see both. */
export function discoverable(viewer: User, d: Db = db): User[] {
  const passed = new Set(d.passes.filter((p) => p.userId === viewer.id).map((p) => p.passedId));
  return d.users.filter((u) => {
    if (u.id === viewer.id || !u.profileVisible || u.suspended || isBlocked(viewer.id, u.id, d) || passed.has(u.id)) return false;
    if (statusBetween(viewer.id, u.id, d) !== 0) return false;
    if (!u.profile.firstName) return false;
    if (viewer.role === 'mentee') return isMentorType(u.role);
    if (viewer.role === 'peer_mentor') return true;
    if (isMentorType(viewer.role)) return u.role === 'mentee' || u.role === 'peer_mentor';
    return true;
  });
}

export function profileCompleteness(p: Profile) {
  // The Basic Info, Education and Goals & More questions (`completed_percentage`).
  const mentee = !MENTOR_CLASSES.includes(p.classification as (typeof MENTOR_CLASSES)[number]);
  const checks = [
    p.firstName, p.lastName, p.gender, p.ageRange, p.ethnicity.length, p.pronouns, p.languages.length, p.religion, p.classification, p.bio, p.college,
    ...(mentee
      ? [p.academicStatus, p.currentSemester, p.gradYear, p.gpa, p.major, p.collegeGoals.length, p.careerGoals.length, p.attendType, p.futureUniversity, p.describesMe.length, p.mentoringInterests.length, p.metCounselor, p.appliedFinancialAid]
      : [p.profession, p.educationEntries.length, p.describesMe.length, p.wentTo, p.attendedType, p.isCounselor, p.worksInFinancialAid, p.availability.length]),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function notify(userId: string, type: NotificationType, relatedId: string, title: string, body: string) {
  commit((d) => d.notifications.unshift(n(userId, type, relatedId, title, body, 0)));
  if (userId === db.sessionUserId && db.pushEnabled) notifyPush(title, body);
}

// ---------- auth (mock) ----------

export const DEMO_CODE = DEMO_OTP;

export function signInDemo() {
  commit((d) => {
    d.sessionUserId = 'me';
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const validEmail = (e: string) => EMAIL_RE.test(e.trim());
export const strongPassword = (p: string) => p.length >= BRAND.minPassword;

/** Where a member goes after logging in. */
export type Step = '/verify' | '/upload-photo' | '/select-college';

/**
 * Log In: sends `email`, `password`, `firebase_token`. Accounts are created by the college (admin), so
 * there is no sign-up. The reply never contains the verification code.
 */
export function logIn(email: string, password: string): { error: string } | { next: Step } {
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return { error: L.user_not_found };
  if ((u.password ?? DEMO_PASSWORD) !== password) return { error: L.invalid_email_or_password };
  if (u.suspended) return { error: L.your_account_is_deleted_or_you_are_removed_please_contact_admin_for_further_assistance };
  const verified = db.device.verified.includes(u.id);
  commit((d) => {
    // Terms acceptance is recorded on the account, not only on the phone.
    const user = d.users.find((x) => x.id === u.id)!;
    user.termsAcceptedAt ??= new Date().toISOString();
    d.device.termsAccepted = true;
    if (verified) d.sessionUserId = u.id;
    else d.pendingOtp = { userId: u.id, expiresAt: Date.now() + BRAND.otpSeconds * 1000 };
  });
  if (verified) giveDemoSocialNow(u.id);
  return { next: !verified ? '/verify' : u.photo ? '/select-college' : '/upload-photo' };
}

/** Verify: sends `otp`, `user_id`, `firebase_token`. */
export function verifyOtp(code: string): { error: string } | { next: Step } {
  const p = db.pendingOtp;
  if (!p || Date.now() > p.expiresAt) return { error: L.authentication_failed };
  if (code !== DEMO_OTP) return { error: L.please_enter_correct_otp };
  commit((d) => {
    d.sessionUserId = p.userId;
    d.pendingOtp = null;
    d.device.verified.push(p.userId);
  });
  giveDemoSocialNow(p.userId);
  return { next: userById(p.userId)?.photo ? '/select-college' : '/upload-photo' };
}

function giveDemoSocialNow(userId: string) {
  commit((d) => giveDemoSocial(d, userId));
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
  try {
    sessionStorage.setItem('mm-reset-email', u.email);
  } catch {
    /* private mode */
  }
  return { ok: true };
}

/** Create new password (from the email link): sends `password`, `user_id`, `token`. */
export function setNewPassword(password: string): { error: string } | { ok: true } {
  let email = '';
  try {
    email = sessionStorage.getItem('mm-reset-email') ?? '';
  } catch {
    /* private mode */
  }
  const u = db.users.find((x) => x.email === email) ?? userById('me');
  if (!u) return { error: L.user_not_found };
  if ((u.password ?? DEMO_PASSWORD) === password) return { error: L.your_new_password_should_be_different_from_previously_used };
  commit((d) => (d.users.find((x) => x.id === u.id)!.password = password));
  return { ok: true };
}

/** Settings → Reset Password: sends `current_password`, `new_password`. */
export function changePassword(current: string, next: string): { error: string } | { ok: true } {
  const u = me();
  if (!u) return { error: L.authentication_failed };
  if ((u.password ?? DEMO_PASSWORD) !== current) return { error: L.password_is_incorrect };
  if (current === next) return { error: L.your_new_password_should_be_different_from_previously_used };
  commit((d) => (d.users.find((x) => x.id === u.id)!.password = next));
  return { ok: true };
}

/** Select Your College: sends `college_id`. */
export const setCollege = (college: string) => commit((d) => (d.users.find((x) => x.id === d.sessionUserId)!.profile.college = college));
export const acceptEducational = () => commit((d) => (d.device.eduAccepted = true));
export const setTextScale = (v: number) => commit((d) => (d.device.textScale = v));
export const setReduceMotion = (v: boolean) => commit((d) => (d.device.reduceMotion = v));

/** Help & Support: sends the reason and message, and also the name and email the member typed. */
export function sendHelp(t: { name: string; email: string; reason: string; message: string }) {
  commit((d) => d.tickets.push({ ...t, id: rid(), userId: d.sessionUserId!, createdAt: new Date().toISOString() }));
}

export function signOut() {
  const device = db.device;
  db = { ...seed(), device };
  saveQueued = false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function deleteAccount() {
  signOut();
}

// ---------- profile ----------

export function saveProfile(profile: Profile) {
  commit((d) => {
    const u = d.users.find((x) => x.id === d.sessionUserId)!;
    u.profile = profile;
    if (profile.classification) u.role = roleFromClassification(profile.classification);
  });
}

export function setPhoto(dataUrl: string | null) {
  commit((d) => {
    d.users.find((x) => x.id === d.sessionUserId)!.photo = dataUrl;
  });
}

export function setProfileVisible(v: boolean) {
  commit((d) => {
    d.users.find((x) => x.id === d.sessionUserId)!.profileVisible = v;
  });
}

export function setPushEnabled(v: boolean) {
  commit((d) => (d.pushEnabled = v));
}

// ---------- connections ----------

export function sendRequest(to: string) {
  const from = db.sessionUserId!;
  commit((d) => {
    d.connections = d.connections.filter((c) => !((c.from === from && c.to === to) || (c.from === to && c.to === from)));
    d.connections.push({ id: rid(), from, to, status: 'requested', createdAt: new Date().toISOString() });
  });
  // Demo: mentors accept after a few seconds so the full flow can be tried.
  setTimeout(() => {
    const c = db.connections.find((x) => x.from === from && x.to === to && x.status === 'requested');
    if (!c || db.sessionUserId !== from) return;
    commit((d) => (d.connections.find((x) => x.id === c.id)!.status = 'connected'));
    const other = userById(to);
    if (other) notify(from, 'accepted', to, 'Request accepted', `${fullName(other)} accepted your mentoring request. Say hello!`);
  }, 6000);
}

export function pass(id: string) {
  commit((d) => d.passes.push({ userId: d.sessionUserId!, passedId: id }));
}

export function resetPasses() {
  commit((d) => (d.passes = d.passes.filter((p) => p.userId !== d.sessionUserId)));
}

/** Accept or reject: sends `connection_id`, `accept_reject_status`, `reason`. */
export function respondRequest(otherId: string, accept: boolean, reason = '') {
  commit((d) => {
    const c = d.connections.find((x) => x.from === otherId && x.to === d.sessionUserId && x.status === 'requested');
    if (c) {
      c.status = accept ? 'connected' : 'declined';
      if (reason) c.reason = reason;
    }
  });
}

export function cancelRequest(otherId: string) {
  commit((d) => {
    d.connections = d.connections.filter((x) => !(x.from === d.sessionUserId && x.to === otherId && x.status === 'requested'));
  });
}

/** Disconnect: sends `connection_id` and an optional `reason`. */
export function disconnect(otherId: string, _reason = '') {
  commit((d) => {
    d.connections = d.connections.filter((x) => !((x.from === otherId && x.to === d.sessionUserId) || (x.to === otherId && x.from === d.sessionUserId)));
  });
}

// ---------- messages ----------

const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const BAD_WORDS = /\b(fuck|shit|bitch|asshole|bastard|dick|cunt|slut|whore)\b/i;

/** Returns why a chat message can't be sent, or null. Phone numbers and emails aren't allowed in chat. */
export function checkMessage(text: string): string | null {
  if (PHONE_RE.test(text) || EMAIL_IN_TEXT.test(text)) return L.you_can_not_share_personal_details_over_text;
  if (BAD_WORDS.test(text)) return L.bad_word_found;
  return null;
}

const REPLIES = [
  'Sounds great!',
  'Thanks for reaching out. Happy to help.',
  'Let’s set up a time to talk. Check my availability in Calendar.',
  'Good question. Let me think about it and get back to you.',
];

export function sendMessage(to: string, text: string, file?: { type: 'image' | 'document'; name: string; url: string }) {
  const from = db.sessionUserId!;
  commit((d) =>
    d.messages.push({ id: rid(), from, to, text, type: file?.type ?? 'text', fileName: file?.name, fileUrl: file?.url, read: true, createdAt: new Date().toISOString() }),
  );
  // Demo: the other person replies.
  setTimeout(() => {
    if (db.sessionUserId !== from) return;
    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    commit((d) => d.messages.push({ id: rid(), from: to, to: from, text: reply, type: 'text', read: false, createdAt: new Date().toISOString() }));
    const other = userById(to);
    if (other) notify(from, 'chat', to, `New message from ${other.profile.firstName}`, reply);
  }, 2500);
}

export function markThreadRead(otherId: string) {
  if (!db.messages.some((m) => m.from === otherId && m.to === db.sessionUserId && !m.read)) return;
  commit((d) => d.messages.forEach((m) => m.from === otherId && m.to === d.sessionUserId && (m.read = true)));
}

export type Thread = { other: User; last: Message; unread: number };
export function threads(d: Db = db): Thread[] {
  const meId = d.sessionUserId;
  const byOther = new Map<string, Message[]>();
  for (const m of d.messages) {
    if (m.from !== meId && m.to !== meId) continue;
    const other = m.from === meId ? m.to : m.from;
    if (!byOther.has(other)) byOther.set(other, []);
    byOther.get(other)!.push(m);
  }
  return [...byOther.entries()]
    .map(([id, ms]) => ({ other: userById(id, d)!, last: ms[ms.length - 1], unread: ms.filter((m) => m.to === meId && !m.read).length }))
    .filter((t) => t.other && !isBlocked(meId!, t.other.id, d))
    .sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
}

// ---------- meetings & availability ----------

export function scheduleMeeting(m: Omit<Meeting, 'id' | 'organizer' | 'status'>, slotId?: string) {
  const id = rid();
  commit((d) => {
    d.meetings.push({ ...m, id, organizer: d.sessionUserId!, status: 'pending' });
    if (slotId) d.slots = d.slots.filter((s) => s.id !== slotId);
  });
  // Demo: invitee accepts.
  setTimeout(() => {
    if (!db.meetings.some((x) => x.id === id && x.status === 'pending')) return;
    commit((d) => (d.meetings.find((x) => x.id === id)!.status = 'accepted'));
    const other = userById(m.invitee);
    if (other) notify(db.sessionUserId!, 'meeting', id, 'Meeting accepted', `${fullName(other)} accepted “${m.title}”.`);
  }, 7000);
}

/** Accept, decline or cancel a meeting: sends `meeting_id`, `accept_reject_status`, `reason`. */
export function respondMeeting(id: string, status: Meeting['status'], reason = '') {
  commit((d) => {
    const m = d.meetings.find((x) => x.id === id)!;
    m.status = status;
    if (reason) m.declineReason = reason;
  });
}

export function addSlot(start: string, end: string) {
  commit((d) => d.slots.push({ id: rid(), mentorId: d.sessionUserId!, start, end }));
}

export function removeSlot(id: string) {
  commit((d) => (d.slots = d.slots.filter((s) => s.id !== id)));
}

// ---------- notifications ----------

export function markNotificationsRead() {
  commit((d) => d.notifications.forEach((x) => x.userId === d.sessionUserId && (x.read = true)));
}

// ---------- safety ----------

export function report(reportedId: string, reason: string, description: string) {
  commit((d) => d.reports.push({ id: rid(), reporterId: d.sessionUserId!, reportedId, reason, description, createdAt: new Date().toISOString() }));
}

export function block(otherId: string) {
  commit((d) => {
    d.blocks.push({ userId: d.sessionUserId!, blockedId: otherId });
    d.connections = d.connections.filter((x) => !((x.from === otherId && x.to === d.sessionUserId) || (x.to === otherId && x.from === d.sessionUserId)));
  });
}

export function unblock(otherId: string) {
  commit((d) => (d.blocks = d.blocks.filter((x) => !(x.userId === d.sessionUserId && x.blockedId === otherId))));
}

// ---------- admin ----------

export const isAdmin = (d: Db = db) => {
  const id = d.realUserId ?? d.sessionUserId ?? '';
  if (d.adminIds.includes(id)) return true;
  // Demo: open to everyone except Professionals (see BRAND.features.adminForEveryone).
  const u = userById(id, d);
  return BRAND.features.adminForEveryone && !!u && u.role !== 'professional';
};

/** Records a Super Admin action in the audit log (call inside a commit). */
function audit(d: Db, action: string, detail: string) {
  d.audit.unshift({ id: rid(), actorId: d.realUserId ?? d.sessionUserId ?? '', action, detail, createdAt: new Date().toISOString() });
  d.audit = d.audit.slice(0, 300);
}
const nameIn = (d: Db, id: string) => {
  const u = userById(id, d);
  return u ? fullName(u) : 'Unknown member';
};

export function impersonate(userId: string) {
  commit((d) => {
    audit(d, 'Logged in as', nameIn(d, userId));
    d.realUserId = d.realUserId ?? d.sessionUserId;
    d.sessionUserId = userId;
  });
}

export function stopImpersonating() {
  commit((d) => {
    if (d.realUserId) d.sessionUserId = d.realUserId;
    d.realUserId = null;
  });
}

export function updateEmailBranding(b: EmailBranding) {
  commit((d) => {
    d.emailBranding = b;
    audit(d, 'Email branding', 'Updated logo, colours and footer');
  });
}

export function updateCms(key: keyof typeof CMS, body: string) {
  commit((d) => {
    d.cms[key] = body;
    audit(d, 'Content edited', key);
  });
}

export function saveResource(r: Resource) {
  commit((d) => {
    const i = d.resources.findIndex((x) => x.id === r.id);
    if (i >= 0) d.resources[i] = r;
    else d.resources.push({ ...r, id: rid() });
    audit(d, i >= 0 ? 'Resource updated' : 'Resource added', r.title);
  });
}

export function deleteResource(id: string) {
  commit((d) => {
    audit(d, 'Resource removed', d.resources.find((r) => r.id === id)?.title ?? id);
    d.resources = d.resources.filter((r) => r.id !== id);
  });
}

export function setUserRole(userId: string, role: Role) {
  commit((d) => {
    d.users.find((u) => u.id === userId)!.role = role;
    audit(d, 'Role changed', `${nameIn(d, userId)} → ${role}`);
  });
}

export function setUserVisible(userId: string, v: boolean) {
  commit((d) => {
    d.users.find((u) => u.id === userId)!.profileVisible = v;
    audit(d, v ? 'Profile shown' : 'Profile hidden', nameIn(d, userId));
  });
}

export function setUserSuspended(userId: string, v: boolean) {
  commit((d) => {
    d.users.find((u) => u.id === userId)!.suspended = v;
    audit(d, v ? 'Suspended' : 'Reinstated', nameIn(d, userId));
  });
}

/** Grant or revoke Super Admin. Returns false when it would remove the last admin. */
export function setAdminAccess(userId: string, v: boolean): boolean {
  if (!v && db.adminIds.length <= 1 && db.adminIds.includes(userId)) return false;
  commit((d) => {
    d.adminIds = v ? [...new Set([...d.adminIds, userId])] : d.adminIds.filter((x) => x !== userId);
    audit(d, v ? 'Admin granted' : 'Admin revoked', nameIn(d, userId));
  });
  return true;
}

/** Removes a member and everything tied to them. */
export function adminDeleteUser(userId: string) {
  commit((d) => {
    audit(d, 'Member deleted', `${nameIn(d, userId)} (${userById(userId, d)?.email ?? ''})`);
    const mine = (...ids: string[]) => ids.includes(userId);
    d.users = d.users.filter((u) => u.id !== userId);
    d.connections = d.connections.filter((c) => !mine(c.from, c.to));
    d.messages = d.messages.filter((m) => !mine(m.from, m.to));
    d.meetings = d.meetings.filter((m) => !mine(m.organizer, m.invitee));
    d.slots = d.slots.filter((s) => s.mentorId !== userId);
    d.notifications = d.notifications.filter((x) => x.userId !== userId);
    d.reports = d.reports.filter((r) => !mine(r.reporterId, r.reportedId));
    d.blocks = d.blocks.filter((b) => !mine(b.userId, b.blockedId));
    d.passes = d.passes.filter((p) => !mine(p.userId, p.passedId));
    d.posts = d.posts.filter((p) => p.authorId !== userId);
    d.comments = d.comments.filter((c) => c.authorId !== userId);
    d.stories = d.stories.filter((s) => s.authorId !== userId);
    d.adminIds = d.adminIds.filter((x) => x !== userId);
  });
}

/** Admin pairs two members directly (skips the request step) and tells both. */
export function adminCreateMatch(a: string, b: string) {
  commit((d) => {
    d.connections = d.connections.filter((c) => !((c.from === a && c.to === b) || (c.from === b && c.to === a)));
    d.connections.push({ id: rid(), from: a, to: b, status: 'connected', createdAt: new Date().toISOString() });
    d.notifications.unshift(n(a, 'accepted', b, 'You have a new match', `${BRAND.orgName} matched you with ${nameIn(d, b)}. Say hello!`, 0));
    d.notifications.unshift(n(b, 'accepted', a, 'You have a new match', `${BRAND.orgName} matched you with ${nameIn(d, a)}. Say hello!`, 0));
    audit(d, 'Match created', `${nameIn(d, a)} ↔ ${nameIn(d, b)}`);
  });
}

export function adminRemoveConnection(id: string) {
  commit((d) => {
    const c = d.connections.find((x) => x.id === id);
    if (c) audit(d, 'Connection removed', `${nameIn(d, c.from)} ↔ ${nameIn(d, c.to)} (${c.status})`);
    d.connections = d.connections.filter((x) => x.id !== id);
  });
}

export function adminSetMeetingStatus(id: string, status: Meeting['status']) {
  commit((d) => {
    const m = d.meetings.find((x) => x.id === id)!;
    m.status = status;
    audit(d, 'Meeting updated', `“${m.title}” → ${status}`);
  });
}

export function updateReport(id: string, status: ReportStatus, note = '') {
  commit((d) => {
    const r = d.reports.find((x) => x.id === id)!;
    r.status = status;
    if (note) r.adminNote = note;
    r.closedAt = status === 'open' ? undefined : new Date().toISOString();
    audit(d, `Report ${status}`, `${r.reason} · ${nameIn(d, r.reportedId)}`);
  });
}

export function pushAudience(a: PushAudience, d: Db = db): User[] {
  return d.users.filter((u) => !u.suspended && (a === 'all' || (a === 'mentor_types' ? isMentorType(u.role) : a === 'super_admin' ? d.adminIds.includes(u.id) : u.role === a)));
}

/** Branded push to a group of members (mock: also shows on this device when you're in the group). */
export function broadcastPush(title: string, body: string, audience: PushAudience = 'all') {
  const to = pushAudience(audience);
  commit((d) => {
    for (const u of to) d.notifications.unshift(n(u.id, 'system', '', title, body, 0));
    d.pushHistory.unshift({ id: rid(), title, body, audience, recipients: to.length, createdAt: new Date().toISOString() });
    audit(d, 'Push sent', `“${title}” to ${to.length} members`);
  });
  if (to.some((u) => u.id === db.sessionUserId)) notifyPush(title, body);
  return to.length;
}

// ---------- matching score ----------

/** How well two members fit (0-99), with the reasons, for "why you match" chips. */
export function matchScore(a: User, b: User): { score: number; reasons: string[] } {
  const pa = a.profile;
  const pb = b.profile;
  const shared = (x: string[], y: string[]) => x.filter((v) => y.includes(v));
  const reasons: string[] = [];
  let pts = 0;
  const interests = shared(pa.mentoringInterests, pb.mentoringInterests);
  if (interests.length) { pts += 12 * interests.length; reasons.push(...interests.map((i) => `${i}`)); }
  if (pa.college && pa.college === pb.college) { pts += 14; reasons.push('Same college'); }
  const langs = shared(pa.languages, pb.languages).filter((l) => l !== 'English');
  if (langs.length) { pts += 10; reasons.push(`Speaks ${langs[0]}`); }
  if (shared(pa.ethnicity, pb.ethnicity).length) { pts += 10; reasons.push('Shared heritage'); }
  const avail = shared(pa.availability, pb.availability);
  if (avail.length) { pts += 8; reasons.push(`Free ${avail.join('/')}`); }
  if (shared(pa.communication, pb.communication).length) pts += 6;
  if (shared(pa.hobbies, pb.hobbies).length) { pts += 6; reasons.push('Shared hobbies'); }
  if (shared(pa.describesMe, pb.describesMe).length) { pts += 6; reasons.push(shared(pa.describesMe, pb.describesMe)[0]); }
  return { score: Math.min(99, 55 + pts), reasons: reasons.slice(0, 4) };
}

// ---------- community feed ----------

export const POST_MAX = 1000;

export function feed(d: Db = db, filter: 'all' | PostKind | 'saved' = 'all'): Post[] {
  const meId = d.sessionUserId ?? '';
  return d.posts
    .filter((p) => !isBlocked(meId, p.authorId, d))
    .filter((p) => (filter === 'all' ? true : filter === 'saved' ? p.saves.includes(meId) : p.kind === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPost(p: Pick<Post, 'kind' | 'body' | 'image' | 'title' | 'when' | 'place' | 'link' | 'deadline'>) {
  commit((d) => d.posts.unshift({ ...p, id: rid(), authorId: d.sessionUserId!, reactions: {}, saves: [], rsvps: [], createdAt: new Date().toISOString() }));
  // Demo: the community reacts to new posts.
  const id = db.posts[0].id;
  setTimeout(() => {
    commit((d) => {
      const post = d.posts.find((x) => x.id === id);
      if (!post) return;
      const kinds: ReactionType[] = p.kind === 'win' ? ['celebrate', 'applause', 'love'] : p.kind === 'question' ? ['support', 'insightful'] : ['like', 'love', 'insightful'];
      ['u1', 'u3', 'u5', 'u8'].forEach((u, i) => (post.reactions[u] = kinds[i % kinds.length]));
    });
    notify(db.sessionUserId!, 'system', id, 'Your post is getting love', 'Grace, Priya and 2 others reacted to your post.');
  }, 5000);
}

export function editPost(id: string, body: string) {
  commit((d) => {
    const p = d.posts.find((x) => x.id === id)!;
    p.body = body;
    p.editedAt = new Date().toISOString();
  });
}

export function deletePost(id: string) {
  commit((d) => {
    d.posts = d.posts.filter((p) => p.id !== id);
    d.comments = d.comments.filter((c) => c.postId !== id);
  });
}

export function react(postId: string, r: ReactionType | null) {
  commit((d) => {
    const p = d.posts.find((x) => x.id === postId)!;
    if (r) p.reactions[d.sessionUserId!] = r;
    else delete p.reactions[d.sessionUserId!];
  });
}

export function toggleSave(postId: string) {
  commit((d) => {
    const p = d.posts.find((x) => x.id === postId)!;
    const me = d.sessionUserId!;
    p.saves = p.saves.includes(me) ? p.saves.filter((x) => x !== me) : [...p.saves, me];
  });
}

export function toggleRsvp(postId: string) {
  commit((d) => {
    const p = d.posts.find((x) => x.id === postId)!;
    const me = d.sessionUserId!;
    p.rsvps = p.rsvps.includes(me) ? p.rsvps.filter((x) => x !== me) : [...p.rsvps, me];
  });
}

export function addComment(postId: string, body: string) {
  commit((d) => d.comments.push({ id: rid(), postId, authorId: d.sessionUserId!, body, createdAt: new Date().toISOString() }));
}

export function deleteComment(id: string) {
  commit((d) => (d.comments = d.comments.filter((c) => c.id !== id)));
}

// ---------- moments (stories) ----------

export function activeStories(d: Db = db): Story[] {
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
  const meId = d.sessionUserId ?? '';
  return d.stories.filter((s) => s.createdAt > cutoff && !isBlocked(meId, s.authorId, d));
}

export function addStory(s: { image?: string; text?: string; theme?: number }) {
  commit((d) => d.stories.unshift({ ...s, id: rid(), authorId: d.sessionUserId!, createdAt: new Date().toISOString(), seenBy: [d.sessionUserId!] }));
}

export function markStorySeen(id: string) {
  const me = db.sessionUserId!;
  if (db.stories.find((s) => s.id === id)?.seenBy.includes(me)) return;
  commit((d) => d.stories.find((s) => s.id === id)?.seenBy.push(me));
}

// ---------- calls ----------

export function callLog(d: Db = db): CallLog[] {
  const meId = d.sessionUserId ?? '';
  return d.calls.filter((c) => !isBlocked(meId, c.withId, d)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function logCall(c: Omit<CallLog, 'id' | 'createdAt'>): string {
  const id = rid();
  commit((d) => d.calls.unshift({ ...c, id, createdAt: new Date().toISOString() }));
  return id;
}

export function updateCall(id: string, patch: Partial<Pick<CallLog, 'rating' | 'notes'>>) {
  commit((d) => Object.assign(d.calls.find((c) => c.id === id)!, patch));
}

/** Demo: someone rings the signed-in member (shows the incoming call screen). */
export function ringMe(fromId: string, kind: CallKind) {
  commit((d) => (d.incoming = { fromId, kind }));
}

export function answerIncoming(accept: boolean) {
  const inc = db.incoming;
  commit((d) => (d.incoming = null));
  if (inc && !accept) {
    logCall({ withId: inc.fromId, direction: 'incoming', kind: inc.kind, status: 'declined', duration: 0 });
  }
  return inc;
}

export function joinRoom(id: string) {
  commit((d) => {
    const r = d.rooms.find((x) => x.id === id)!;
    if (!r.participants.includes(d.sessionUserId!)) r.participants.push(d.sessionUserId!);
  });
}

export function leaveRoom(id: string) {
  commit((d) => {
    const r = d.rooms.find((x) => x.id === id);
    if (r) r.participants = r.participants.filter((p) => p !== d.sessionUserId);
  });
}

export function toggleRoomReminder(id: string) {
  commit((d) => {
    const r = d.rooms.find((x) => x.id === id)!;
    r.reminded = !r.reminded;
  });
}

// ---------- invites ----------

/** A member invites an existing member to connect (sends a request) or someone new by email. */
export function sendInvite(i: { toId?: string; email?: string; name?: string; role?: Role; message: string }) {
  const fromId = db.sessionUserId!;
  if (i.toId) sendRequest(i.toId);
  commit((d) => {
    d.invites.unshift({ id: rid(), fromId, ...i, channel: i.toId ? 'app' : 'email', status: i.toId ? undefined : 'sent', createdAt: new Date().toISOString() });
    if (i.toId) {
      const from = userById(fromId, d);
      d.notifications.unshift(n(i.toId, 'request', fromId, `${from ? fullName(from) : 'Someone'} invited you to connect`, i.message || 'Open Connections to reply.', 0));
    }
  });
}

export type InviteState = InviteStatus | 'pending' | 'declined';
/** Email invites keep their own status; in-app invites follow the connection between the two members. */
export function inviteStatus(i: Invite, d: Db = db): InviteState {
  if (i.channel === 'email' || !i.toId) return i.status ?? 'sent';
  const c = d.connections.find((x) => (x.from === i.fromId && x.to === i.toId) || (x.from === i.toId && x.to === i.fromId));
  return !c || c.status === 'declined' ? 'declined' : c.status === 'connected' ? 'accepted' : 'pending';
}

export function resendInvite(id: string) {
  commit((d) => {
    const i = d.invites.find((x) => x.id === id)!;
    i.status = 'sent';
    i.createdAt = new Date().toISOString();
    audit(d, 'Invitation resent', i.name || i.email || id);
  });
}

export function revokeInvite(id: string) {
  commit((d) => {
    const i = d.invites.find((x) => x.id === id);
    if (i) audit(d, 'Invitation revoked', i.name || i.email || id);
    d.invites = d.invites.filter((x) => x.id !== id);
  });
}

// ---------- admin email templates ----------

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m);
}

export function saveTemplate(t: EmailTemplate) {
  commit((d) => {
    d.emailTemplates = d.emailTemplates.map((x) => (x.key === t.key ? { ...t, updatedAt: new Date().toISOString() } : x));
    audit(d, 'Template edited', t.name);
  });
}

export function resetTemplate(key: EmailTemplateKey) {
  commit((d) => {
    const def = DEFAULT_TEMPLATES.find((x) => x.key === key)!;
    d.emailTemplates = d.emailTemplates.map((x) => (x.key === key ? def : x));
    audit(d, 'Template reset', def.name);
  });
}

/** Mock email send: lands in the outbox (or is scheduled); members also get an in-app notification; invitations are tracked. */
export function sendAdminEmail(e: { to: string; toName: string; userId?: string; templateKey: EmailTemplateKey; subject: string; body: string; sendAt?: string; role?: Role }) {
  commit((d) => {
    const byId = d.realUserId ?? d.sessionUserId ?? '';
    const scheduled = !!e.sendAt && e.sendAt > new Date().toISOString();
    d.outbox.unshift({ id: rid(), to: e.to, toName: e.toName, userId: e.userId, templateKey: e.templateKey, subject: e.subject, body: e.body, byId, createdAt: new Date().toISOString(), status: scheduled ? 'scheduled' : 'sent', sendAt: e.sendAt });
    if (e.userId && !scheduled) d.notifications.unshift(n(e.userId, 'system', '', e.subject, e.body.split('\n').find((l) => l.trim() && !l.startsWith('Hi ')) ?? '', 0));
    if (e.templateKey.startsWith('invite_') && !e.userId) {
      d.invites.unshift({ id: rid(), fromId: byId, email: e.to, name: e.toName, role: e.role, message: e.subject, channel: 'email', status: scheduled ? 'scheduled' : 'sent', scheduledFor: scheduled ? e.sendAt : undefined, createdAt: new Date().toISOString() });
    }
    audit(d, scheduled ? 'Email scheduled' : 'Email sent', `“${e.subject}” to ${e.toName || e.to}`);
  });
}

// ---------- admin data ----------

export function exportDbJson() {
  return JSON.stringify({ ...db, sessionUserId: null, realUserId: null, incoming: null }, null, 2);
}

/** Replaces all data with a backup file. Keeps the current admin signed in. */
export function importDbJson(json: string): boolean {
  try {
    const data = JSON.parse(json) as Partial<Db>;
    if (!Array.isArray(data.users)) return false;
    const keep = { sessionUserId: db.sessionUserId, realUserId: null };
    commit((d) => {
      Object.assign(d, seed(), data, keep);
      if (!d.users.some((u) => u.id === keep.sessionUserId)) d.users.push(userById(keep.sessionUserId!, db)!);
      audit(d, 'Data imported', `${data.users!.length} members`);
    });
    return true;
  } catch {
    return false;
  }
}

/** Restores the demo data but keeps the admin signed in. */
export function resetDemoData() {
  const sessionUserId = db.realUserId ?? db.sessionUserId;
  commit((d) => {
    Object.assign(d, seed(), { sessionUserId });
    audit(d, 'Data reset', 'Demo data restored');
  });
}

export function clearAdminLog(what: 'audit' | 'outbox' | 'pushHistory') {
  commit((d) => {
    d[what] = [];
  });
}
