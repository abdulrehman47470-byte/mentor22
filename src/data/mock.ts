// Demo data. Everyone here is fictional. Colleges, resources and certificates normally load from the
// server per college after login; these stand in until the app is connected.

import type { Certificate, College, CollegeResource, Connection, Meeting, Message, Profile, User } from '@/lib/types';

export const DEMO_EMAIL = 'alex.chen@student.edu';
export const DEMO_PASSWORD = 'Mentor2026';
/** The demo verification code. A real server emails it and never sends it to the app. */
export const DEMO_OTP = '123456';

export const COLLEGES: College[] = [
  { id: 'c1', name: 'El Camino College', city: 'Torrance, CA' },
  { id: 'c2', name: 'Long Beach City College', city: 'Long Beach, CA' },
  { id: 'c3', name: 'Santa Monica College', city: 'Santa Monica, CA' },
  { id: 'c4', name: 'Pasadena City College', city: 'Pasadena, CA' },
  { id: 'c5', name: 'Los Angeles Harbor College', city: 'Wilmington, CA' },
  { id: 'c6', name: 'Compton College', city: 'Compton, CA' },
  { id: 'c7', name: 'Cerritos College', city: 'Norwalk, CA' },
  { id: 'c8', name: 'Orange Coast College', city: 'Costa Mesa, CA' },
  { id: 'c9', name: 'Golden West College', city: 'Huntington Beach, CA' },
  { id: 'c10', name: 'Mt. San Antonio College', city: 'Walnut, CA' },
  { id: 'c11', name: 'East Los Angeles College', city: 'Monterey Park, CA' },
  { id: 'c12', name: 'Los Angeles Valley College', city: 'Valley Glen, CA' },
];

const RESOURCE_TEMPLATES = [
  ['Counseling Center', 'Book an appointment with an academic counselor to plan your classes and education plan.'],
  ['Financial Aid Office', 'Help with FAFSA, the California Dream Act, grants, and scholarships.'],
  ['Transfer Center', 'Workshops, university rep visits, and help with transfer applications.'],
  ['Basic Needs Center', 'Food pantry, housing support, and emergency assistance for students.'],
  ['Career Center', 'Resume reviews, mock interviews, and internship listings.'],
  ['Student Health Services', 'Free and low-cost health and mental health services for enrolled students.'],
] as const;

export const COLLEGE_RESOURCES: CollegeResource[] = COLLEGES.flatMap((c) =>
  RESOURCE_TEMPLATES.map(([title, description], i) => ({ id: `${c.id}-r${i}`, collegeId: c.id, title, description })),
);

export const CERTIFICATES: Certificate[] = [
  { id: 't1', title: 'Mentee Orientation', completedAt: '2026-09-02T17:00:00Z' },
  { id: 't2', title: 'Making the Most of Your Mentor', completedAt: '2026-09-15T17:00:00Z' },
  { id: 't3', title: 'Professional Communication', completedAt: null },
];

const socials = { facebook: '', linkedin: '', x: '', instagram: '', threads: '' };

export const emptyProfile = (): Profile => ({
  firstName: '', lastName: '', gender: '', ageRange: '', ethnicity: '', pronouns: '', languages: [], religion: '', about: '', socials: { ...socials },
  currentCollege: '', enrollmentStatus: '', currentSemester: '', gradYear: '', gpa: '', major: '', certificate: '',
  collegeGoals: [], careerGoals: [], attendType: '', transferTo: '', describesMe: [], describedHaving: [], seeking: [], metCounselor: '', appliedFinancialAid: '',
});

type MentorSeed = Partial<Profile> & Pick<Profile, 'firstName' | 'lastName'>;
const mentor = (id: string, role: User['role'], collegeId: string, p: MentorSeed): User => ({
  id,
  email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@mentor.edu`,
  password: 'demo-not-used',
  role,
  photo: `/demo/avatars/${id}.webp`,
  collegeId,
  profile: { ...emptyProfile(), ...p, socials: { ...socials, linkedin: `https://www.linkedin.com/in/${p.firstName.toLowerCase()}-${p.lastName.toLowerCase()}`, ...p.socials } },
});

export const MENTORS: User[] = [
  mentor('u1', 'mentor', 'c1', {
    firstName: 'Grace', lastName: 'Nakamura', profession: 'Professor of Computer Science', classification: 'Faculty', gender: 'Female', ageRange: '31–50', ethnicity: 'Asian', pronouns: 'She/Her', languages: ['English', 'Japanese'], religion: 'Decline to State',
    about: 'I teach intro programming and data structures. I transferred from a community college myself, so I love helping students plan their path into computer science.',
    officeLocation: 'MBA Building, Room 214', officeNumber: '214', officePhone: '(310) 555-0141',
    education: [{ id: 'e1', college: 'El Camino College', degree: 'Associate Degree for Transfer', location: 'Torrance, CA' }, { id: 'e2', college: 'UCLA', degree: "Master's Degree", location: 'Los Angeles, CA' }],
    mentorDescribes: ['First-Generation Student', 'Working Student'], mentorExperienced: ['Financial Hardship'], mentorHaving: ['Language Barriers'], wentTo: 'UCLA', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
  mentor('u2', 'mentor', 'c1', {
    firstName: 'Daniel', lastName: 'Reyes', profession: 'Transfer Counselor', classification: 'Staff', gender: 'Male', ageRange: '31–50', ethnicity: 'Hispanic or Latino', pronouns: 'He/Him', languages: ['English', 'Spanish'], religion: 'Christianity',
    about: 'Transfer counselor for eight years. Ask me about TAG agreements, UC and CSU applications, and building an education plan that keeps you on track.',
    officeLocation: 'Student Services Center, Transfer Center', officeNumber: '108', officePhone: '(310) 555-0172',
    education: [{ id: 'e1', college: 'CSU Dominguez Hills', degree: "Master's Degree", location: 'Carson, CA' }],
    mentorDescribes: ['First-Generation Student', 'Student Parent'], mentorExperienced: ['Housing Insecurity'], mentorHaving: ['Financial Hardship'], wentTo: 'CSU Dominguez Hills', attendedType: 'Community College', isCounselor: 'Yes', worksInFinancialAid: 'No',
  }),
  mentor('u3', 'peer_mentor', 'c1', {
    firstName: 'Priya', lastName: 'Sharma', profession: 'Peer Mentor, Nursing', classification: 'Student', gender: 'Female', ageRange: '18–30', ethnicity: 'Asian', pronouns: 'She/Her', languages: ['English', 'Hindi'], religion: 'Hinduism',
    about: 'Second-year nursing student and peer mentor. Happy to share how I balance prerequisites, work, and clinicals.',
    education: [{ id: 'e1', college: 'El Camino College', degree: 'Associate Degree', location: 'Torrance, CA' }],
    mentorDescribes: ['Working Student'], mentorExperienced: ['Limited Internet Access'], mentorHaving: [], wentTo: 'El Camino College', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
  mentor('u4', 'mentor', 'c2', {
    firstName: 'Kevin', lastName: 'Tran', profession: 'Software Engineer', classification: 'Community Member', gender: 'Male', ageRange: '18–30', ethnicity: 'Asian', pronouns: 'He/Him', languages: ['English', 'Vietnamese'], religion: 'Buddhism',
    about: 'I went from LBCC to CSULB to a software job. I can help with internships, resumes, and getting started in tech.',
    education: [{ id: 'e1', college: 'Long Beach City College', degree: 'Associate Degree for Transfer', location: 'Long Beach, CA' }, { id: 'e2', college: 'CSU Long Beach', degree: "Bachelor's Degree", location: 'Long Beach, CA' }],
    mentorDescribes: ['First-Generation Student'], mentorExperienced: ['Language Barriers'], mentorHaving: [], wentTo: 'CSU Long Beach', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
  mentor('u5', 'mentor', 'c1', {
    firstName: 'Leilani', lastName: 'Fonoti', profession: 'Financial Aid Advisor', classification: 'Staff', gender: 'Female', ageRange: '31–50', ethnicity: 'Native Hawaiian or Pacific Islander', pronouns: 'She/Her', languages: ['English'], religion: 'Christianity',
    about: 'I help students understand FAFSA, the Dream Act, Cal Grants, and scholarships. No question is too small.',
    officeLocation: 'Student Services Center, Financial Aid', officeNumber: '120', officePhone: '(310) 555-0190',
    education: [{ id: 'e1', college: 'CSU Long Beach', degree: "Bachelor's Degree", location: 'Long Beach, CA' }],
    mentorDescribes: ['Student Parent', 'Returning Adult Learner'], mentorExperienced: ['Financial Hardship'], mentorHaving: [], wentTo: 'CSU Long Beach', attendedType: 'California State University (CSU)', isCounselor: 'No', worksInFinancialAid: 'Yes',
  }),
  mentor('u8', 'peer_mentor', 'c3', {
    firstName: 'Jason', lastName: 'Park', profession: 'Peer Mentor, Business', classification: 'Student', gender: 'Other', ageRange: '18–30', ethnicity: 'Asian', pronouns: 'They/Them', languages: ['English', 'Korean'], religion: 'Decline to State',
    about: 'Business major heading to UC Irvine next fall. Ask me about study habits, clubs, and staying motivated.',
    education: [{ id: 'e1', college: 'Santa Monica College', degree: 'Associate Degree for Transfer', location: 'Santa Monica, CA' }],
    mentorDescribes: ['International Student'], mentorExperienced: [], mentorHaving: [], wentTo: 'Santa Monica College', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
  mentor('u9', 'mentor', 'c4', {
    firstName: 'Farah', lastName: 'Hosseini', profession: 'Registered Nurse', classification: 'Community Member', gender: 'Female', ageRange: '31–50', ethnicity: 'Middle Eastern or North African', pronouns: 'She/Her', languages: ['English', 'Farsi'], religion: 'Islam',
    about: 'ER nurse for twelve years. I mentor students heading into nursing and allied health.',
    education: [{ id: 'e1', college: 'Pasadena City College', degree: 'Associate Degree', location: 'Pasadena, CA' }, { id: 'e2', college: 'Cal State LA', degree: "Bachelor's Degree", location: 'Los Angeles, CA' }],
    mentorDescribes: ['Working Student', 'Student Parent'], mentorExperienced: ['Food Insecurity'], mentorHaving: [], wentTo: 'Cal State LA', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
  mentor('u10', 'mentor', 'c1', {
    firstName: 'Samuel', lastName: 'Lim', profession: 'Professor of Business', classification: 'Faculty', gender: 'Male', ageRange: '51–70', ethnicity: 'Asian', pronouns: 'He/Him', languages: ['English', 'Mandarin'], religion: 'Christianity',
    about: 'I teach accounting and small business. Former CPA. I enjoy helping students find internships and plan for a business degree.',
    officeLocation: 'Business Building, Room 302', officeNumber: '302', officePhone: '(310) 555-0133',
    education: [{ id: 'e1', college: 'USC', degree: "Master's Degree", location: 'Los Angeles, CA' }],
    mentorDescribes: ['Veteran'], mentorExperienced: [], mentorHaving: [], wentTo: 'USC', attendedType: 'Private University', isCounselor: 'No', worksInFinancialAid: 'No',
  }),
];

export const DEMO_STUDENT: User = {
  id: 'me',
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  role: 'student',
  photo: '/demo/avatars/me.webp',
  collegeId: 'c1',
  profile: {
    ...emptyProfile(),
    firstName: 'Alex', lastName: 'Chen', gender: 'Decline to State', ageRange: '18–30', ethnicity: 'Asian', pronouns: 'They/Them', languages: ['English', 'Mandarin'],
    about: 'Computer science student planning to transfer. I like building small apps and volunteering at the campus tech help desk.',
    currentCollege: 'El Camino College', enrollmentStatus: 'Full-time', currentSemester: 'Fall 2026', gradYear: '2027', gpa: '3.6', major: 'Computer Science', certificate: 'None',
    collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['Technology'], attendType: 'University of California (UC)', transferTo: 'UC Irvine',
    describesMe: ['First-Generation Student', 'Working Student'], describedHaving: [], seeking: ['Transfer Guidance', 'Internships'], metCounselor: 'Yes', appliedFinancialAid: '',
  },
};

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const seedConnections = (): Connection[] => [
  { id: 'k1', studentId: 'me', mentorId: 'u2', status: 'accepted', createdAt: ago(60 * 24 * 12) },
  { id: 'k2', studentId: 'me', mentorId: 'u3', status: 'accepted', createdAt: ago(60 * 24 * 6) },
  { id: 'k3', studentId: 'me', mentorId: 'u5', status: 'invited', createdAt: ago(60 * 5), referredBy: 'Daniel Reyes' },
  { id: 'k4', studentId: 'me', mentorId: 'u10', status: 'invited', createdAt: ago(60 * 26) },
  { id: 'k5', studentId: 'me', mentorId: 'u9', status: 'requested', createdAt: ago(60 * 30) },
];

export const seedMessages = (): Message[] => [
  { id: 'm1', from: 'u2', to: 'me', text: 'Hi Alex! I looked at your education plan. You are on track for the UC Irvine TAG.', type: 'text', read: true, createdAt: ago(60 * 26) },
  { id: 'm2', from: 'me', to: 'u2', text: 'That is great news, thank you! When is the TAG deadline?', type: 'text', read: true, createdAt: ago(60 * 25) },
  { id: 'm3', from: 'u2', to: 'me', text: 'September 1 to 30. Let us meet this week to go over it.', type: 'text', read: false, createdAt: ago(42) },
  { id: 'm4', from: 'u3', to: 'me', text: 'Welcome to Mentor & Match! Feel free to ask me anything about classes.', type: 'text', read: true, createdAt: ago(60 * 24 * 5) },
];

export const seedMeetings = (): Meeting[] => [
  { id: 'mt1', organizer: 'u2', invitee: 'me', title: 'TAG application review', note: 'Bring your unofficial transcript.', reason: 'Educational Guidance', date: day(1), start: '10:00', end: '10:30', type: 'Video', status: 'pending' },
  { id: 'mt2', organizer: 'me', invitee: 'u3', title: 'Study plan check-in', note: '', reason: 'Personal/Social Support', date: day(3), start: '15:00', end: '15:30', type: 'Audio', status: 'accepted' },
];
