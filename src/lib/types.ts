// Data models. Field comments give the name the server uses, so the mock in api.ts can be swapped for
// real calls to admin.mentorandmatch.com without changing screens.

/** user_type: 5 Mentor, 6 Student (mentee), 7 Peer Mentor, 8 Super Admin. */
export type Role = 'mentor' | 'student' | 'peer_mentor' | 'super_admin';
export const USER_TYPE: Record<Role, number> = { mentor: 5, student: 6, peer_mentor: 7, super_admin: 8 };

export type Socials = { facebook: string; linkedin: string; x: string; instagram: string; threads: string };

/** A mentor's education entry (college plus degree). */
export type EducationEntry = { id: string; college: string; degree: string; location: string };

export type Profile = {
  // Basic info
  firstName: string;
  lastName: string;
  gender: string;
  ageRange: string;
  ethnicity: string;
  /** Server key `sexual_orientation`, shown as "Pronouns". */
  pronouns: string;
  languages: string[];
  religion: string;
  /** "Please describe your skills…" (500 characters). */
  about: string;
  socials: Socials;
  // Education (students)
  currentCollege: string;
  enrollmentStatus: string;
  currentSemester: string;
  gradYear: string;
  gpa: string;
  major: string;
  certificate: string;
  // Goals & More (students)
  collegeGoals: string[];
  careerGoals: string[];
  attendType: string;
  transferTo: string;
  describesMe: string[];
  describedHaving: string[];
  seeking: string[];
  metCounselor: string;
  appliedFinancialAid: string;
  // Mentor profiles
  profession?: string;
  classification?: string;
  officeLocation?: string;
  officeNumber?: string;
  officePhone?: string;
  education?: EducationEntry[];
  mentorDescribes?: string[];
  mentorExperienced?: string[];
  mentorHaving?: string[];
  wentTo?: string;
  attendedType?: string;
  isCounselor?: string;
  worksInFinancialAid?: string;
};

export type User = {
  id: string;
  email: string;
  /** Demo only: the real server never sends passwords to the app. */
  password: string;
  role: Role;
  photo: string | null;
  collegeId: string | null;
  profile: Profile;
  /** When the student accepted the Terms of Service (recorded on the server, not just the phone). */
  termsAcceptedAt?: string;
};

export type College = { id: string; name: string; city: string };
export type CollegeResource = { id: string; collegeId: string; title: string; description: string; phone?: string };
export type Certificate = { id: string; title: string; completedAt: string | null };

/** requested = student asked a mentor; invited = mentor invited the student; accepted = connected. */
export type Connection = { id: string; studentId: string; mentorId: string; status: 'requested' | 'invited' | 'accepted'; createdAt: string; referredBy?: string };

export type MessageType = 'text' | 'image' | 'document';
export type Message = { id: string; from: string; to: string; text: string; type: MessageType; fileName?: string; fileUrl?: string; read: boolean; createdAt: string };

export type MeetingType = 'Audio' | 'Video';
export type Meeting = {
  id: string;
  organizer: string;
  invitee: string;
  title: string;
  note: string;
  reason: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24h) */
  start: string;
  end: string;
  type: MeetingType;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  declineReason?: string;
};

export type AppNotification = { id: string; title: string; body: string; fromId?: string; link?: string; read: boolean; createdAt: string };

export type Availability = { date: string; slots: string[] };
