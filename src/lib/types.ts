// Data models (mirror the architecture's tables, so Supabase can replace the mock 1:1).

export type Role = 'mentor' | 'mentee' | 'peer_mentor' | 'professional' | 'super_admin';
/** Architecture role codes: Mentor 5, Mentee 6, Peer Mentor 7, Super Admin 8 (Professional = mentor-type, 9). */
export const ROLE_CODES: Record<Role, number> = { mentor: 5, mentee: 6, peer_mentor: 7, professional: 9, super_admin: 8 };

export type Profile = {
  // General
  firstName: string;
  lastName: string;
  pronouns: string;
  affiliation: string;
  classification: string;
  college: string;
  officeNumber: string;
  availability: string[];
  communication: string[];
  ageRange: string;
  ethnicity: string[];
  ethnicityOther: string;
  mentoringInterests: string[];
  bio: string;
  socials: Record<string, string>;
  // Education
  education: string;
  academicStatus: string;
  major: string;
  minor: string;
  gradYear: string;
  careers: string;
  futureUniversity: string;
  gradMajor: string;
  goals: string;
  // Experiences
  describesMe: string[];
  extracurricular: string;
  professionalAffiliation: string;
  hobbies: string[];
  languages: string[];
  religion: string;
  // ---- Mentor & Match Student profile questions (content document, section 5) ----
  /** Gender Identity. */
  gender: string;
  /** Current Semester. (Enrollment Status is `academicStatus`, About is `bio`, transfer target is `futureUniversity`.) */
  currentSemester: string;
  /** Grade Point Average. */
  gpa: string;
  /** College Certificate. */
  certificate: string;
  collegeGoals: string[];
  careerGoals: string[];
  /** "I would like to attend the following type of college/university:" */
  attendType: string;
  /** "I can be described as having the following:" */
  describedHaving: string[];
  /** Have you met with a Counselor? (Yes/No) */
  metCounselor: string;
  /** Have you applied for Financial Aid? (Yes/No) */
  appliedFinancialAid: string;
  // Mentor profiles
  profession: string;
  officeLocation: string;
  officePhone: string;
  /** Education entries: college, degree achieved, location. */
  educationEntries: EducationEntry[];
  /** "As a student I experienced the following:" */
  mentorExperienced: string[];
  /** "I went to the following college/university:" */
  wentTo: string;
  /** "I attended the following type of college/university:" */
  attendedType: string;
  isCounselor: string;
  worksInFinancialAid: string;
};

export type EducationEntry = { id: string; college: string; degree: string; location: string };

export type User = {
  id: string;
  orgId: string;
  email: string;
  /** Demo only: a real server never sends passwords to the app. */
  password?: string;
  role: Role;
  photo: string | null;
  profileVisible: boolean;
  profile: Profile;
  joinedAt: string;
  /** Set by a Super Admin: the member can't use the app and is hidden from everyone. */
  suspended?: boolean;
  /** When the member accepted the Terms of Service (kept on the account, not just the phone). */
  termsAcceptedAt?: string;
};

/** 0 not connected, 1 requested, 3 connected (architecture values). 2 = request received (UI only). */
export type ConnectionStatus = 0 | 1 | 2 | 3;

export type Connection = { id: string; from: string; to: string; status: 'requested' | 'connected' | 'declined'; createdAt: string; referredBy?: string; reason?: string };

export type Message = {
  id: string;
  from: string;
  to: string;
  text: string;
  type: 'text' | 'image' | 'document';
  fileName?: string;
  fileUrl?: string;
  read: boolean;
  createdAt: string;
};

export type Meeting = {
  id: string;
  organizer: string;
  invitee: string;
  title: string;
  note: string;
  reason: string;
  start: string;
  end: string;
  /** Meeting Type: Audio or Video. */
  mode: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  declineReason?: string;
};

export type Slot = { id: string; mentorId: string; start: string; end: string };

export type NotificationType = 'view_profile' | 'request' | 'accepted' | 'chat' | 'meeting' | 'call' | 'system';
export type AppNotification = { id: string; userId: string; type: NotificationType; relatedId: string; title: string; body: string; read: boolean; createdAt: string };

export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type Report = { id: string; reporterId: string; reportedId: string; reason: string; description: string; createdAt: string; status?: ReportStatus; adminNote?: string; closedAt?: string };

/** Super Admin action log. */
export type AuditEntry = { id: string; actorId: string; action: string; detail: string; createdAt: string };

export type PushAudience = 'all' | 'mentor_types' | 'mentee' | 'peer_mentor' | 'super_admin';
export type PushRecord = { id: string; title: string; body: string; audience: PushAudience; recipients: number; createdAt: string };

export type Resource = { id: string; category: string; title: string; url: string; description: string };

export type EmailBranding = { logo: string; primary: string; accent: string; footer: string };

// ---------- Community feed ----------
export type PostKind = 'update' | 'question' | 'win' | 'opportunity' | 'event';
export type ReactionType = 'like' | 'love' | 'applause' | 'insightful' | 'celebrate' | 'support';

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  body: string;
  image?: string;
  /** Event / opportunity extras */
  title?: string;
  when?: string;
  place?: string;
  link?: string;
  deadline?: string;
  reactions: Record<string, ReactionType>; // userId -> reaction
  saves: string[];
  rsvps: string[];
  createdAt: string;
  editedAt?: string;
};

export type Comment = { id: string; postId: string; authorId: string; body: string; createdAt: string };

/** "Moments": 24-hour stories. Either a photo or a text card on a brand gradient. */
export type Story = { id: string; authorId: string; image?: string; text?: string; theme?: number; createdAt: string; seenBy: string[] };

// ---------- Calls ----------
export type CallKind = 'audio' | 'video';
export type CallLog = {
  id: string;
  withId: string;
  direction: 'incoming' | 'outgoing';
  kind: CallKind;
  status: 'completed' | 'missed' | 'declined';
  duration: number; // seconds
  createdAt: string;
  /** Post-call session recap (1-5) and private notes. */
  rating?: number;
  notes?: string;
};

/** Live mentor office hours: a drop-in group video room. */
export type LiveRoom = { id: string; hostId: string; title: string; topic: string; start: string; live: boolean; participants: string[]; cover?: string; reminded?: boolean };

// ---------- Invites ----------
/** Email invite lifecycle (admin and member invites). In-app invites take their status from the connection. */
export type InviteStatus = 'scheduled' | 'sent' | 'opened' | 'accepted';
export type Invite = {
  id: string; fromId: string; toId?: string; email?: string; name?: string; message: string; channel: 'app' | 'email'; createdAt: string;
  /** Role the person is invited as (email invites). */
  role?: Role; status?: InviteStatus; scheduledFor?: string;
};

// ---------- Admin email templates ----------
export type EmailTemplateKey =
  | 'invite_mentee' | 'invite_mentor' | 'invite_peer' | 'invite_professional' | 'reminder' | 'welcome' | 'finish_profile'
  | 'introduction' | 'checkin' | 'milestone' | 'announcement' | 'notice';
export type EmailTemplateCategory = 'Invitation' | 'Direct message' | 'Announcement';
export type EmailTemplate = { key: EmailTemplateKey; name: string; category: EmailTemplateCategory; headline: string; subject: string; body: string; updatedAt?: string };
export type OutboxEmail = {
  id: string; to: string; toName: string; userId?: string; templateKey: EmailTemplateKey; subject: string; body: string; byId: string; createdAt: string;
  status: 'sent' | 'scheduled'; sendAt?: string;
};
