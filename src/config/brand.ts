// White-label brand config (Layer 2 of the architecture). To launch a new client, copy this object,
// swap the logo, colours and names, and point `backendUrl` at that client's Supabase project.

export type BrandConfig = {
  id: string;
  appName: string;
  /** Short name for the header and push banners. */
  shortName: string;
  orgName: string;
  tagline: string;
  poweredBy: string;
  domain: string;
  packageId: string;
  /** Full logo (hexagon "M" plus wordmark), vector. */
  logo: string;
  logoFast?: string;
  /** Hexagon "M" only: blue for white backgrounds, white for blue ones. */
  mark: string;
  markWhite: string;
  icon: string;
  colors: { primary: string; primaryInk: string; accent: string; accentText: string };
  supportEmail: string;
  supportPhone: string;
  crisisLine: { label: string; phone: string };
  /** Minimum password length (the server sends this in `general`). */
  minPassword: number;
  /** The email verification code expires after this many seconds. */
  otpSeconds: number;
  backendUrl: string | null; // null = mock data (Phase 0)
  /** adminForEveryone: demo only. Every signed-in account except Professionals can open Admin. Set false before launch. */
  features: { calls: boolean; meetings: boolean; adminInApp: boolean; adminForEveryone: boolean };
};

/** Mentor & Match Student. Colours and logos come from the Android app (com.mentormatch.student). */
export const MM_STUDENT: BrandConfig = {
  id: 'mentor-and-match-student',
  appName: 'Mentor & Match Student',
  shortName: 'Mentor & Match',
  orgName: 'Mentor & Match',
  tagline: 'Mentoring Students Virtually Anywhere',
  poweredBy: 'Powered by Mentor & Match Corporation',
  domain: 'mentorandmatch.com',
  packageId: 'com.mentormatch.student',
  logo: '/brand/logo.svg',
  mark: '/brand/mark-blue.svg',
  markWhite: '/brand/mark-white.svg',
  icon: '/icon-192.png',
  colors: { primary: '#264672', primaryInk: '#FFFFFF', accent: '#3C6A97', accentText: '#3C6A97' },
  supportEmail: 'support@mentorandmatch.com',
  supportPhone: '(310) 435-8447',
  crisisLine: { label: 'Suicide Prevention Hotline', phone: '988' },
  minPassword: 8,
  otpSeconds: 5 * 60,
  backendUrl: null,
  features: { calls: true, meetings: true, adminInApp: true, adminForEveryone: true },
};

export const BRAND = MM_STUDENT;
