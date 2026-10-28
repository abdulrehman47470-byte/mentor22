// Brand config for Mentor & Match Student. Colours and font come from the Android app
// (colors.xml and the Gilroy font files); the logos are its vector drawables exported to SVG.

export const BRAND = {
  appName: 'Mentor & Match Student',
  shortName: 'Mentor & Match',
  company: 'Mentor & Match Corporation',
  packageId: 'com.mentormatch.student',
  adminHost: 'admin.mentorandmatch.com',
  /** Hexagon "M" plus the "Mentor & Match" wordmark. */
  logo: '/brand/logo.svg',
  /** Hexagon "M" only, blue (for white backgrounds) and white (for blue backgrounds). */
  mark: '/brand/mark-blue.svg',
  markWhite: '/brand/mark-white.svg',
  icon: '/icon-192.png',
  supportEmail: 'support@mentorandmatch.com',
  supportPhone: '(310) 435-8447',
  address: '2785 Pacific Coast Highway #171 Torrance CA 90505',
  /** Minimum password length. The server sends this in `general`; 8 is the current value. */
  minPassword: 8,
  /** The verification code expires after this many seconds ("Expiring In:"). */
  otpSeconds: 5 * 60,
} as const;
