// Choice lists (PDF section 6), Settings menu (section 4) and the links and numbers the app uses.

import type { LabelKey } from './labels';

// ---------- Choice lists from the PDF ----------
export const AGE_RANGES = ['Under 17', '18–30', '31–50', '51–70', 'Above'] as const;
export const GENDERS = ['Female', 'Male', 'Other', 'Decline to State'] as const;
export const YES_NO = ['Yes', 'No'] as const;
export const MEETING_TYPES = ['Audio', 'Video'] as const;
/** Live from the server. */
export const MEETING_REASONS = ['Career Advisement', 'Educational Guidance', 'Personal/Social Support'] as const;
/** Live from the server. */
export const HELP_REASONS = ['Technical Support', 'Disability Accommodation', 'Issue/Bug', 'Compliment', 'Cosmetic Issue', 'Feature Request', 'Miscellaneous', 'Other'] as const;
export const ABOUT_MAX = 500;

// ---------- Lists the server only sends after login ----------
// The PDF could not include these (they need a real account). These are stand-ins for the demo and are
// replaced by the server's lists when the app is connected to admin.mentorandmatch.com.
export const ETHNICITIES = ['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Middle Eastern or North African', 'Native Hawaiian or Pacific Islander', 'White', 'Two or More', 'Decline to State'] as const;
export const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'Ze/Zir', 'Decline to State'] as const;
export const RELIGIONS = ['Buddhism', 'Christianity', 'Hinduism', 'Islam', 'Judaism', 'Sikhism', 'Spiritual', 'None', 'Decline to State'] as const;
export const LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Cantonese', 'Vietnamese', 'Tagalog', 'Korean', 'Arabic', 'Hindi', 'Farsi', 'Armenian', 'Japanese', 'French', 'Other'] as const;
export const MAJORS = ['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communication Studies', 'Computer Science', 'Criminal Justice', 'Early Childhood Education', 'Engineering', 'English', 'Kinesiology', 'Mathematics', 'Nursing', 'Political Science', 'Psychology', 'Sociology', 'Undeclared'] as const;
export const CERTIFICATES = ['None', 'Accounting', 'Automotive Technology', 'Child Development', 'Computer Information Systems', 'Medical Assisting', 'Paralegal Studies', 'Welding'] as const;
export const DEGREES = ['Associate Degree', 'Associate Degree for Transfer', "Bachelor's Degree", "Master's Degree", 'Doctorate', 'Certificate'] as const;
export const ENROLLMENT = ['Full-time', 'Part-time'] as const;
export const SEMESTERS = ['Fall 2026', 'Winter 2027', 'Spring 2027', 'Summer 2027'] as const;
export const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => String(2026 + i));
export const COLLEGE_TYPES = ['Community College', 'California State University (CSU)', 'University of California (UC)', 'Private University', 'Out-of-State University', 'Trade/Vocational School'] as const;
export const TRANSFER_TARGETS = ['CSU Long Beach', 'CSU Dominguez Hills', 'CSU Fullerton', 'Cal Poly Pomona', 'UCLA', 'UC Irvine', 'UC Berkeley', 'USC', 'Undecided'] as const;
export const COLLEGE_GOALS = ['Earn an Associate Degree', 'Transfer to a 4-Year University', 'Earn a Certificate', 'Improve my GPA', 'Explore Majors'] as const;
export const CAREER_GOALS = ['Business', 'Education', 'Engineering', 'Healthcare', 'Law', 'Public Service', 'Technology', 'The Arts', 'Undecided'] as const;
export const DESCRIBES_ME = ['First-Generation Student', 'Working Student', 'Student Parent', 'Veteran', 'Student Athlete', 'International Student', 'Returning Adult Learner', 'Foster Youth'] as const;
export const DESCRIBED_HAVING = ['Financial Hardship', 'Food Insecurity', 'Housing Insecurity', 'A Disability', 'Language Barriers', 'Limited Internet Access'] as const;
export const SEEKING = ['Career Advice', 'Transfer Guidance', 'Study Skills', 'Networking', 'Internships', 'Financial Aid Help', 'Personal Support'] as const;
export const REPORT_REASONS = ['Inappropriate Messages', 'Harassment', 'Fake Profile', 'Spam', 'Other'] as const;
/** Time slots for Set Availability. */
export const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'] as const;

// ---------- Links and numbers (PDF "Useful links and numbers the app uses") ----------
export const LINKS = {
  edvisorlyAndroid: 'https://play.google.com/store/apps/details?id=com.edvisorly',
  edvisorlyIos: 'https://apps.apple.com/us/app/edvisorly-the-transfer-app/id6444823123',
  handshakeAndroid: 'https://play.google.com/store/apps/details?id=com.joinhandshake.student',
  bookstore: 'https://simplitaught-store.vitalsource.com/',
  financingEducation: 'https://meratas.vercel.app/MentorMatch',
  financialLiteracy: 'https://education.intuit.com/register',
  healthInsurance: 'https://easycare2go.com/college-program/',
  scholarships: 'https://www.mentorandmatch.org',
  ccjn: 'https://www.ccjn.org',
  ferpa: 'http://www2.ed.gov/policy/gen/reg/ferpa/index.html',
};

// ---------- Settings menu: student-visible items, in the order the app lists them ----------
export type SettingsAction =
  | { kind: 'route'; to: string }
  | { kind: 'call'; number: string; notice?: boolean }
  | { kind: 'sms'; number: string; body: string }
  | { kind: 'external'; url: string | 'edvisorly'; notice?: boolean };

export type SettingsItem = { label: LabelKey; action: SettingsAction };
export type SettingsGroup = { title: string; items: SettingsItem[] };

export const SETTINGS: SettingsGroup[] = [
  {
    title: 'Resources',
    items: [{ label: 'mentee_resources', action: { kind: 'route', to: '/settings/resources' } }],
  },
  {
    title: 'Hotlines',
    items: [
      { label: 'national_domestic_violence_hotline', action: { kind: 'call', number: '800-799-7233', notice: true } },
      { label: 'suicide_prevention_hotline', action: { kind: 'call', number: '988', notice: true } },
      // 741741 is the Crisis Text Line: it takes texts, not calls, so this opens a text message.
      { label: 'mental_health_crisis_hotline', action: { kind: 'sms', number: '741741', body: 'HOME' } },
      { label: '_911', action: { kind: 'call', number: '911' } },
      { label: '_24_7_virtual_mental_health_counseling', action: { kind: 'call', number: '(800) 854-7771' } },
      // The old app dialled the housing hotline (800-569-4287) here. 988 is the national crisis line.
      { label: 'national_crisis_hotline', action: { kind: 'call', number: '988' } },
    ],
  },
  {
    title: 'Apps and tools',
    items: [
      { label: 'handshake', action: { kind: 'external', url: LINKS.handshakeAndroid, notice: true } },
      { label: 'my_college_resources', action: { kind: 'route', to: '/settings/college-resources' } },
      { label: 'set_availability', action: { kind: 'route', to: '/availability' } },
    ],
  },
  {
    title: 'Account and policies',
    items: [
      { label: 'student_code_of_conduct', action: { kind: 'route', to: '/policy/code-of-conduct' } },
      { label: 'reset_password', action: { kind: 'route', to: '/settings/reset-password' } },
      { label: 'accessibility', action: { kind: 'route', to: '/settings/accessibility' } },
      { label: 'help_and_support', action: { kind: 'route', to: '/settings/help' } },
      { label: 'terms_of_service', action: { kind: 'route', to: '/policy/terms' } },
      { label: 'confidentiality', action: { kind: 'route', to: '/policy/confidentiality' } },
      { label: 'privacy_policy', action: { kind: 'route', to: '/policy/privacy' } },
    ],
  },
];

/** "Mentee Resources" sub-menu: the student-visible Resources items. */
export const RESOURCE_ITEMS: SettingsItem[] = [
  { label: 'mentee_training', action: { kind: 'route', to: '/settings/training' } },
  { label: 'edvisorly_transfer_planning', action: { kind: 'external', url: 'edvisorly' } },
];
