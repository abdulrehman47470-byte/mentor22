// Profile option lists, choice lists (content document, section 6), the Settings menu (section 4) and the
// links and numbers the app uses. Lists marked "stand-in" are sent by the server after log-in in the real
// app; these values are used until the app is connected.

import type { LabelKey } from './labels';

// ---------- Profile lists used across the app and the admin dashboard ----------
/** Server key `sexual_orientation`, shown as "Pronouns". Stand-in. */
export const PRONOUNS = ['She/Her', 'He/Him', 'They/Them', 'Ze/Zir', 'Xe/Xem', 'Decline to State'] as const;
export const AFFILIATIONS = ['Student', 'Staff', 'Faculty', 'Administrator', 'Community Member'] as const;
/** Classification (role in the program). */
export const CLASSIFICATIONS = ['Mentee', 'Mentor', 'Peer Mentor', 'Professional'] as const;
/** College list for "Select Your College" and Current College Enrolled. Stand-in. */
export const COLLEGES = [
  'El Camino College', 'Long Beach City College', 'Santa Monica College', 'Pasadena City College', 'Los Angeles Harbor College', 'Compton College',
  'Cerritos College', 'Orange Coast College', 'Golden West College', 'Mt. San Antonio College', 'East Los Angeles College', 'Los Angeles Valley College',
] as const;
/** City for each college in COLLEGES (same order). */
export const COLLEGE_CITIES = ['Torrance, CA', 'Long Beach, CA', 'Santa Monica, CA', 'Pasadena, CA', 'Wilmington, CA', 'Compton, CA', 'Norwalk, CA', 'Costa Mesa, CA', 'Huntington Beach, CA', 'Walnut, CA', 'Monterey Park, CA', 'Valley Glen, CA'] as const;
export const AVAILABILITY = ['AM', 'PM', 'Weekends'] as const;
export const COMMUNICATION = ['Video', 'Audio', 'Instant Message', 'In Person'] as const;
/** Age range (content document, section 6). */
export const AGE_RANGES = ['Under 17', '18–30', '31–50', '51–70', 'Above'] as const;
/** Gender Identity (content document, section 6). */
export const GENDERS = ['Female', 'Male', 'Other', 'Decline to State'] as const;
/** Stand-in. */
export const ETHNICITIES = ['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Middle Eastern or North African', 'Native Hawaiian or Pacific Islander', 'White', 'Two or More', 'Other', 'Decline to State'] as const;
/** "What are you seeking from a mentor?" Stand-in. */
export const MENTORING_INTERESTS = ['Career Advice', 'Transfer Guidance', 'Study Skills', 'Networking', 'Internships', 'Financial Aid Help', 'Personal Support'] as const;
export const SOCIALS = ['Facebook', 'LinkedIn', 'X', 'Instagram', 'Threads'] as const;
/** "Please describe your skills, interest, and anything unique you would like to tell (500 characters):" */
export const BIO_MAX = 500;
/** Enrollment Status. Stand-in. */
export const ACADEMIC_STATUS = ['Full-time', 'Part-time'] as const;
/** Anticipated Graduation Year. */
export const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => String(2026 + i));
/** "The following best describe me:" Stand-in. */
export const DESCRIBES_ME = ['First-Generation Student', 'Working Student', 'Student Parent', 'Veteran', 'Student Athlete', 'International Student', 'Returning Adult Learner', 'Foster Youth'] as const;
export const HOBBIES = ['Football', 'Baseball', 'Dance', 'Music', 'Gaming', 'Hiking', 'Cooking', 'Photography'] as const;
/** Stand-in. */
export const LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Cantonese', 'Vietnamese', 'Tagalog', 'Korean', 'Japanese', 'Hindi', 'Arabic', 'Farsi', 'Armenian', 'Samoan', 'French', 'Other'] as const;
/** Religious Affiliation. Stand-in. */
export const RELIGIONS = ['Buddhism', 'Christianity', 'Catholicism', 'Hinduism', 'Islam', 'Judaism', 'Sikhism', 'Spiritual', 'None', 'Decline to State'] as const;
/** Report reasons. Stand-in. */
export const REPORT_REASONS = ['Inappropriate Messages', 'Harassment', 'Fake Profile', 'Spam', 'Made me feel unsafe', 'Other'] as const;
/** Meeting Reason (live from the server). */
export const MEETING_REASONS = ['Career Advisement', 'Educational Guidance', 'Personal/Social Support'] as const;
/** Classifications that act as mentors (accept requests, set availability, can hide their profile). */
export const MENTOR_CLASSES = ['Mentor', 'Peer Mentor', 'Professional'] as const;


// ---------- Choice lists from the PDF ----------
export const YES_NO = ['Yes', 'No'] as const;
export const MEETING_TYPES = ['Audio', 'Video'] as const;
/** Live from the server. */
export const HELP_REASONS = ['Technical Support', 'Disability Accommodation', 'Issue/Bug', 'Compliment', 'Cosmetic Issue', 'Feature Request', 'Miscellaneous', 'Other'] as const;
export const ABOUT_MAX = 500;

// ---------- Lists the server only sends after login ----------
// The PDF could not include these (they need a real account). These are stand-ins for the demo and are
// replaced by the server's lists when the app is connected to admin.mentorandmatch.com.
export const MAJORS = ['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communication Studies', 'Computer Science', 'Criminal Justice', 'Early Childhood Education', 'Engineering', 'English', 'Kinesiology', 'Mathematics', 'Nursing', 'Political Science', 'Psychology', 'Sociology', 'Undeclared'] as const;
export const CERTIFICATES = ['None', 'Accounting', 'Automotive Technology', 'Child Development', 'Computer Information Systems', 'Medical Assisting', 'Paralegal Studies', 'Welding'] as const;
export const DEGREES = ['Associate Degree', 'Associate Degree for Transfer', "Bachelor's Degree", "Master's Degree", 'Doctorate', 'Certificate'] as const;
export const ENROLLMENT = ['Full-time', 'Part-time'] as const;
export const SEMESTERS = ['Fall 2026', 'Winter 2027', 'Spring 2027', 'Summer 2027'] as const;
export const COLLEGE_TYPES = ['Community College', 'California State University (CSU)', 'University of California (UC)', 'Private University', 'Out-of-State University', 'Trade/Vocational School'] as const;
export const TRANSFER_TARGETS = ['CSU Long Beach', 'CSU Dominguez Hills', 'CSU Fullerton', 'Cal Poly Pomona', 'UCLA', 'UC Irvine', 'UC Berkeley', 'USC', 'Undecided'] as const;
export const COLLEGE_GOALS = ['Earn an Associate Degree', 'Transfer to a 4-Year University', 'Earn a Certificate', 'Improve my GPA', 'Explore Majors'] as const;
export const CAREER_GOALS = ['Business', 'Education', 'Engineering', 'Healthcare', 'Law', 'Public Service', 'Technology', 'The Arts', 'Undecided'] as const;
export const DESCRIBED_HAVING = ['Financial Hardship', 'Food Insecurity', 'Housing Insecurity', 'A Disability', 'Language Barriers', 'Limited Internet Access'] as const;
export const SEEKING = ['Career Advice', 'Transfer Guidance', 'Study Skills', 'Networking', 'Internships', 'Financial Aid Help', 'Personal Support'] as const;
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
      { label: 'my_college_resources', action: { kind: 'route', to: '/resources' } },
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
