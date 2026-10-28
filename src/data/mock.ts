// Fictional demo data. Every person here is made up.
import { POLICIES, type PolicyKey } from './policies';
import type { CallLog, Comment, LiveRoom, Meeting, Message, Post, Profile, Resource, Slot, Story, User } from '@/lib/types';

export const ORG_ID = 'mentor-and-match';

/** Demo password for every demo account. The verification code is DEMO_OTP. */
export const DEMO_PASSWORD = 'Mentor2026';
export const DEMO_OTP = '123456';
export const DEMO_EMAIL = 'alex.chen@student.edu';

export function emptyProfile(): Profile {
  return {
    firstName: '', lastName: '', pronouns: '', affiliation: '', classification: '', college: '', officeNumber: '',
    availability: [], communication: [], ageRange: '', ethnicity: [], ethnicityOther: '', mentoringInterests: [], bio: '',
    socials: { Facebook: '', LinkedIn: '', X: '', Instagram: '', Threads: '' },
    education: '', academicStatus: '', major: '', minor: '', gradYear: '', careers: '', futureUniversity: '', gradMajor: '', goals: '',
    describesMe: [], extracurricular: '', professionalAffiliation: '', hobbies: [], languages: [], religion: '',
    gender: '', currentSemester: '', gpa: '', certificate: '', collegeGoals: [], careerGoals: [], attendType: '', describedHaving: [],
    metCounselor: '', appliedFinancialAid: '', profession: '', officeLocation: '', officePhone: '', educationEntries: [],
    mentorExperienced: [], wentTo: '', attendedType: '', isCounselor: '', worksInFinancialAid: '',
  };
}

function u(id: string, role: User['role'], p: Partial<Profile>, extra: Partial<User> = {}): User {
  return {
    id, orgId: ORG_ID, role, photo: `/demo/avatars/${id}.webp`, profileVisible: true, joinedAt: '2026-08-20T10:00:00Z',
    email: `${(p.firstName ?? id).toLowerCase()}.${(p.lastName ?? '').toLowerCase()}@${role === 'mentee' ? 'student' : 'mentor'}.edu`,
    password: DEMO_PASSWORD,
    profile: { ...emptyProfile(), ...p, socials: { ...emptyProfile().socials, ...(p.socials ?? {}) } },
    ...extra,
  };
}
const edu = (college: string, degree: string, location: string, i = 1) => ({ id: `e${i}`, college, degree, location });

export const MOCK_USERS: User[] = [
  u('u1', 'mentor', {
    firstName: 'Grace', lastName: 'Nakamura', pronouns: 'She/Her', gender: 'Female', affiliation: 'Faculty', classification: 'Mentor', profession: 'Professor of Computer Science',
    college: 'El Camino College', officeLocation: 'MBA Building, Room 214', officeNumber: '214', officePhone: '(310) 555-0141', availability: ['AM', 'PM'],
    communication: ['Video', 'In Person'], ageRange: '31–50', ethnicity: ['Asian'], mentoringInterests: ['Transfer Guidance', 'Career Advice', 'Internships'],
    bio: 'I teach intro programming and data structures. I transferred from a community college myself, so I love helping students plan their path into computer science.',
    socials: { LinkedIn: 'https://www.linkedin.com/in/grace-nakamura' }, education: "Master's Degree, UCLA", careers: 'Software engineering, research',
    goals: 'Help ten students land their first tech internship this year.', describesMe: ['First-Generation Student', 'Working Student'], mentorExperienced: ['Financial Hardship'], describedHaving: ['Language Barriers'],
    educationEntries: [edu('El Camino College', 'Associate Degree for Transfer', 'Torrance, CA'), edu('UCLA', "Master's Degree", 'Los Angeles, CA', 2)],
    wentTo: 'UCLA', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
    extracurricular: 'Faculty advisor, Women in Computing', professionalAffiliation: 'ACM, IEEE', hobbies: ['Dance', 'Hiking'], languages: ['English', 'Japanese'], religion: 'Buddhism',
  }),
  u('u2', 'mentor', {
    firstName: 'Daniel', lastName: 'Reyes', pronouns: 'He/Him', gender: 'Male', affiliation: 'Staff', classification: 'Mentor', profession: 'Transfer Counselor',
    college: 'El Camino College', officeLocation: 'Student Services Center, Transfer Center', officeNumber: '108', officePhone: '(310) 555-0172', availability: ['PM', 'Weekends'],
    communication: ['Video', 'Audio', 'Instant Message'], ageRange: '31–50', ethnicity: ['Hispanic or Latino'], mentoringInterests: ['Transfer Guidance', 'Career Advice'],
    bio: 'Transfer counselor for eight years. Ask me about TAG agreements, UC and CSU applications, resumes, and building an education plan that keeps you on track.',
    socials: { LinkedIn: 'https://www.linkedin.com/in/danreyes', Instagram: 'https://www.instagram.com/danreyes' }, education: "Master's Degree, CSU Dominguez Hills", careers: 'Counseling, higher education',
    goals: 'Help every mentee submit a strong transfer application.', describesMe: ['First-Generation Student', 'Student Parent'], mentorExperienced: ['Housing Insecurity'], describedHaving: ['Financial Hardship'],
    educationEntries: [edu('CSU Dominguez Hills', "Master's Degree", 'Carson, CA')], wentTo: 'CSU Dominguez Hills', attendedType: 'Community College', isCounselor: 'Yes', worksInFinancialAid: 'No',
    professionalAffiliation: 'NACADA', hobbies: ['Baseball', 'Cooking'], languages: ['English', 'Spanish'], religion: 'Catholicism',
  }),
  u('u3', 'peer_mentor', {
    firstName: 'Priya', lastName: 'Sharma', pronouns: 'She/Her', gender: 'Female', affiliation: 'Student', classification: 'Peer Mentor', profession: 'Peer Mentor, Nursing',
    college: 'El Camino College', availability: ['PM'], communication: ['Instant Message', 'In Person'], ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Study Skills', 'Personal Support'],
    bio: 'Second-year nursing student and peer mentor. Happy to share how I balance prerequisites, work, research and clinicals.',
    education: 'Associate Degree (in progress)', academicStatus: 'Full-time', major: 'Nursing', gradYear: '2027', careers: 'Nursing', futureUniversity: 'CSU Long Beach', goals: 'Transfer into a BSN program.',
    describesMe: ['Working Student'], mentorExperienced: ['Limited Internet Access'], educationEntries: [edu('El Camino College', 'Associate Degree', 'Torrance, CA')],
    wentTo: 'El Camino College', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
    extracurricular: 'Pre-Health Society, research assistant', hobbies: ['Dance'], languages: ['English', 'Hindi'], religion: 'Hinduism',
  }),
  u('u4', 'professional', {
    firstName: 'Kevin', lastName: 'Tran', pronouns: 'He/Him', gender: 'Male', affiliation: 'Community Member', classification: 'Professional', profession: 'Software Engineer',
    college: 'Long Beach City College', availability: ['PM', 'Weekends'], communication: ['Video', 'Audio'], ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Internships', 'Career Advice', 'Networking'],
    bio: 'I went from LBCC to CSULB to a software job. I can help with internships, resumes, and getting started in tech.',
    socials: { LinkedIn: 'https://www.linkedin.com/in/kevintran', Threads: 'https://www.threads.net/@ktran' }, education: "Bachelor's Degree, CSU Long Beach", careers: 'Software engineering',
    describesMe: ['First-Generation Student'], mentorExperienced: ['Language Barriers'],
    educationEntries: [edu('Long Beach City College', 'Associate Degree for Transfer', 'Long Beach, CA'), edu('CSU Long Beach', "Bachelor's Degree", 'Long Beach, CA', 2)],
    wentTo: 'CSU Long Beach', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
    professionalAffiliation: 'Vietnamese American Professionals', hobbies: ['Football', 'Gaming'], languages: ['English', 'Vietnamese'], religion: 'Buddhism',
  }),
  u('u5', 'mentor', {
    firstName: 'Leilani', lastName: 'Fonoti', pronouns: 'She/Her', gender: 'Female', affiliation: 'Administrator', classification: 'Mentor', profession: 'Financial Aid Advisor',
    college: 'El Camino College', officeLocation: 'Student Services Center, Financial Aid', officeNumber: '120', officePhone: '(310) 555-0190', availability: ['AM'], communication: ['In Person', 'Video'],
    ageRange: '31–50', ethnicity: ['Native Hawaiian or Pacific Islander'], mentoringInterests: ['Financial Aid Help', 'Personal Support'],
    bio: 'I help students understand FAFSA, the Dream Act, Cal Grants and scholarships. Proud Pacific Islander. My door is open for first-gen students and parents. No question is too small.',
    education: "Bachelor's Degree, CSU Long Beach", describesMe: ['Student Parent', 'Returning Adult Learner'], mentorExperienced: ['Financial Hardship'],
    educationEntries: [edu('CSU Long Beach', "Bachelor's Degree", 'Long Beach, CA')], wentTo: 'CSU Long Beach', attendedType: 'California State University (CSU)', isCounselor: 'No', worksInFinancialAid: 'Yes',
    hobbies: ['Dance'], languages: ['English', 'Samoan'], religion: 'Christianity',
  }),
  u('u6', 'mentee', {
    firstName: 'Minh', lastName: 'Le', pronouns: 'He/Him', gender: 'Male', affiliation: 'Student', classification: 'Mentee',
    college: 'El Camino College', availability: ['PM', 'Weekends'], communication: ['Instant Message', 'Video'], ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Internships', 'Transfer Guidance'],
    bio: 'First-year engineering student. Looking for advice on internships and how to get involved in research.',
    academicStatus: 'Full-time', currentSemester: 'Fall 2026', major: 'Engineering', gradYear: '2028', careers: 'Hardware engineering', collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['Engineering'],
    goals: 'Land a summer internship.', describesMe: ['Student Athlete'], hobbies: ['Football'], languages: ['English', 'Vietnamese'],
  }),
  u('u7', 'mentee', {
    firstName: 'Aisha', lastName: 'Rahman', pronouns: 'She/Her', gender: 'Female', affiliation: 'Student', classification: 'Mentee',
    college: 'Long Beach City College', availability: ['AM', 'PM'], communication: ['Video', 'In Person'], ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Career Advice', 'Personal Support'],
    bio: 'Communication Studies student. I want to work in broadcast news and would love a mentor who has been in a newsroom.',
    academicStatus: 'Part-time', currentSemester: 'Fall 2026', major: 'Communication Studies', gradYear: '2028', careers: 'Broadcast journalism', futureUniversity: 'CSU Long Beach',
    collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['The Arts'], describesMe: ['Working Student'], languages: ['English', 'Other'], religion: 'Islam',
  }),
  u('u8', 'peer_mentor', {
    firstName: 'Jason', lastName: 'Park', pronouns: 'They/Them', gender: 'Other', affiliation: 'Student', classification: 'Peer Mentor', profession: 'Peer Mentor, Business',
    college: 'Santa Monica College', availability: ['PM', 'Weekends'], communication: ['Instant Message', 'Video'], ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Study Skills', 'Networking'],
    bio: 'Business major heading to UC Irvine next fall. Ask me about study habits, clubs, pitch decks and staying motivated.',
    academicStatus: 'Full-time', major: 'Business Administration', gradYear: '2026', careers: 'Marketing', describesMe: ['International Student'],
    educationEntries: [edu('Santa Monica College', 'Associate Degree for Transfer', 'Santa Monica, CA')], wentTo: 'Santa Monica College', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No',
    hobbies: ['Dance', 'Photography'], languages: ['English', 'Korean'],
  }),
  u('u9', 'professional', {
    firstName: 'Farah', lastName: 'Hosseini', pronouns: 'She/Her', gender: 'Female', affiliation: 'Community Member', classification: 'Professional', profession: 'Registered Nurse',
    college: 'Pasadena City College', availability: ['Weekends'], communication: ['Video'], ageRange: '31–50', ethnicity: ['Middle Eastern or North African'], mentoringInterests: ['Career Advice'],
    bio: 'ER nurse for twelve years. I mentor students heading into nursing and allied health.',
    education: "Bachelor's Degree, Cal State LA", careers: 'Nursing', describesMe: ['Working Student', 'Student Parent'], mentorExperienced: ['Food Insecurity'],
    educationEntries: [edu('Pasadena City College', 'Associate Degree', 'Pasadena, CA'), edu('Cal State LA', "Bachelor's Degree", 'Los Angeles, CA', 2)],
    wentTo: 'Cal State LA', attendedType: 'Community College', isCounselor: 'No', worksInFinancialAid: 'No', languages: ['English', 'Farsi'], religion: 'Islam',
  }),
  u('u10', 'mentor', {
    firstName: 'Samuel', lastName: 'Lim', pronouns: 'He/Him', gender: 'Male', affiliation: 'Faculty', classification: 'Mentor', profession: 'Professor of Business',
    college: 'El Camino College', officeLocation: 'Business Building, Room 302', officeNumber: '302', officePhone: '(310) 555-0133', availability: ['AM', 'PM'], communication: ['In Person', 'Audio'],
    ageRange: '51–70', ethnicity: ['Asian'], mentoringInterests: ['Career Advice', 'Internships'],
    bio: 'I teach accounting and small business. Former CPA. I enjoy helping students find internships and plan for a business degree or graduate study.',
    education: "Master's Degree, USC", describesMe: ['Veteran'], educationEntries: [edu('USC', "Master's Degree", 'Los Angeles, CA')],
    wentTo: 'USC', attendedType: 'Private University', isCounselor: 'No', worksInFinancialAid: 'No', hobbies: ['Baseball'], languages: ['English', 'Mandarin'], religion: 'Christianity',
  }),
  u('u11', 'mentee', {
    firstName: 'Kalani', lastName: 'Akana', pronouns: 'Xe/Xem', gender: 'Other', affiliation: 'Student', classification: 'Mentee',
    college: 'El Camino College', availability: ['AM'], communication: ['In Person'], ageRange: '18–30', ethnicity: ['Native Hawaiian or Pacific Islander'], mentoringInterests: ['Transfer Guidance', 'Personal Support'],
    bio: 'Future elementary school teacher. New to California from Maui and looking for community.',
    academicStatus: 'Full-time', currentSemester: 'Fall 2026', major: 'Early Childhood Education', gradYear: '2027', careers: 'Teaching', collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['Education'],
    describesMe: ['Student Parent'], hobbies: ['Dance'], languages: ['English', 'Other'],
  }),
];

/** Pre-built demo account: a fully set-up mentee who is also given Super Admin access. */
export const DEMO_USER: User = u('me', 'mentee', {
  firstName: 'Alex', lastName: 'Chen', pronouns: 'They/Them', gender: 'Decline to State', affiliation: 'Student', classification: 'Mentee',
  college: 'El Camino College', availability: ['PM', 'Weekends'], communication: ['Video', 'Instant Message'],
  ageRange: '18–30', ethnicity: ['Asian'], mentoringInterests: ['Transfer Guidance', 'Internships'],
  bio: 'Computer science student planning to transfer. I like building small apps and volunteering at the campus tech help desk.',
  socials: { LinkedIn: 'https://www.linkedin.com/in/alexchen' }, education: 'Associate Degree for Transfer (in progress)',
  academicStatus: 'Full-time', currentSemester: 'Fall 2026', gpa: '3.6', major: 'Computer Science', certificate: 'None', gradYear: '2027', careers: 'Software engineering',
  collegeGoals: ['Transfer to a 4-Year University'], careerGoals: ['Technology'], attendType: 'University of California (UC)', futureUniversity: 'UC Irvine',
  describesMe: ['First-Generation Student', 'Working Student'], metCounselor: 'Yes', goals: 'Transfer to UC Irvine and land a tech internship.',
  extracurricular: 'Campus tech help desk', hobbies: ['Baseball'], languages: ['English', 'Mandarin'],
}, { email: DEMO_EMAIL });

const now = Date.now();
const ago = (min: number) => new Date(now - min * 60_000).toISOString();
const inDays = (d: number, h: number, m = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

export const MOCK_CONNECTIONS = [
  { id: 'c1', from: 'me', to: 'u2', status: 'connected' as const, createdAt: ago(60 * 24 * 7) },
  { id: 'c2', from: 'u3', to: 'me', status: 'connected' as const, createdAt: ago(60 * 24 * 3) },
  { id: 'c3', from: 'u4', to: 'me', status: 'requested' as const, createdAt: ago(90) },
  { id: 'c4', from: 'u10', to: 'me', status: 'requested' as const, createdAt: ago(60 * 5), referredBy: 'Daniel Reyes' },
  { id: 'c5', from: 'me', to: 'u1', status: 'requested' as const, createdAt: ago(60 * 26) },
  { id: 'c6', from: 'u5', to: 'me', status: 'connected' as const, createdAt: ago(60 * 24 * 12) },
  { id: 'c7', from: 'me', to: 'u8', status: 'connected' as const, createdAt: ago(60 * 24 * 9) },
  { id: 'c8', from: 'u9', to: 'me', status: 'connected' as const, createdAt: ago(60 * 24 * 15) },
  { id: 'c9', from: 'me', to: 'u6', status: 'connected' as const, createdAt: ago(60 * 24 * 4) },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', from: 'u2', to: 'me', text: 'Hi Alex! Great to connect. Send me your resume whenever you are ready.', type: 'text', read: true, createdAt: ago(8640) },
  { id: 'm2', from: 'me', to: 'u2', text: 'Thank you! Here it is.', type: 'text', read: true, createdAt: ago(8620) },
  { id: 'm3', from: 'me', to: 'u2', text: '', type: 'document', fileName: 'Alex_Chen_Resume.pdf', read: true, createdAt: ago(8619) },
  { id: 'm3b', from: 'u2', to: 'me', text: 'Got it. I will mark it up tonight.', type: 'text', read: true, createdAt: ago(8600) },
  { id: 'm3c', from: 'u2', to: 'me', text: 'Quick call earlier was great. Proud of how you handled the behavioral questions.', type: 'text', read: true, createdAt: ago(2880) },
  { id: 'm3d', from: 'me', to: 'u2', text: 'Thanks Daniel! The STAR method tip really helped.', type: 'text', read: true, createdAt: ago(2865) },
  { id: 'm4', from: 'u2', to: 'me', text: 'Looks strong. Two quick edits: lead with impact numbers, and move the tech help desk job to the top.', type: 'text', read: false, createdAt: ago(45) },
  { id: 'm5a', from: 'u3', to: 'me', text: 'Welcome to Mentor & Match! I was a mentee here two years ago 😊', type: 'text', read: true, createdAt: ago(4320) },
  { id: 'm5b', from: 'me', to: 'u3', text: 'That is so cool. How did you find your research lab?', type: 'text', read: true, createdAt: ago(4310) },
  { id: 'm5c', from: 'u3', to: 'me', text: 'Honestly? I emailed 12 professors. 2 replied, 1 said yes. Persistence wins!', type: 'text', read: true, createdAt: ago(4306) },
  { id: 'm5d', from: 'u3', to: 'me', text: '', type: 'image', fileName: 'lab.webp', fileUrl: '/demo/posts/lab.webp', read: true, createdAt: ago(4305) },
  { id: 'm5e', from: 'u3', to: 'me', text: 'This is where I spend my Tuesdays now 🧪', type: 'text', read: true, createdAt: ago(4305) },
  { id: 'm5', from: 'u3', to: 'me', text: 'Hey! Want to grab coffee at the student center on Thursday?', type: 'text', read: false, createdAt: ago(12) },
  { id: 'm6a', from: 'u5', to: 'me', text: 'Aloha Alex! Saw you signed up for the Fall Mixer. Bring a friend!', type: 'text', read: true, createdAt: ago(7200) },
  { id: 'm6b', from: 'me', to: 'u5', text: 'Will do, Dr. Fonoti! Is it okay to bring my roommate who is not on Mentor & Match yet?', type: 'text', read: true, createdAt: ago(7170) },
  { id: 'm6c', from: 'u5', to: 'me', text: 'Absolutely. That is how our ohana grows 🌺', type: 'text', read: true, createdAt: ago(7165) },
  { id: 'm6d', from: 'u5', to: 'me', text: 'Also: the first-gen scholarship closes Friday. You should apply.', type: 'text', read: false, createdAt: ago(1200) },
  { id: 'm7a', from: 'me', to: 'u8', text: 'Hey Jason, could you look at my pitch deck design for the case competition?', type: 'text', read: true, createdAt: ago(1640) },
  { id: 'm7b', from: 'u8', to: 'me', text: 'Of course! Send it over.', type: 'text', read: true, createdAt: ago(1630) },
  { id: 'm7c', from: 'u8', to: 'me', text: 'Biggest tip: one idea per slide, and use one brand colour only for emphasis.', type: 'text', read: true, createdAt: ago(1560) },
  { id: 'm7d', from: 'u8', to: 'me', text: '', type: 'image', fileName: 'team.webp', fileUrl: '/demo/posts/team.webp', read: true, createdAt: ago(1559) },
  { id: 'm7e', from: 'u8', to: 'me', text: 'This was our team at last year’s comp. We placed 2nd!', type: 'text', read: true, createdAt: ago(1558) },
  { id: 'm7f', from: 'me', to: 'u8', text: 'Legendary. Thank you 🙏', type: 'text', read: true, createdAt: ago(1540) },
  { id: 'm8a', from: 'u9', to: 'me', text: 'Hi Alex, happy to chat about healthcare tech careers.', type: 'text', read: true, createdAt: ago(14400) },
  { id: 'm8b', from: 'me', to: 'u9', text: 'That would be amazing. Do you have time for a video call this weekend?', type: 'text', read: true, createdAt: ago(14340) },
  { id: 'm8c', from: 'u9', to: 'me', text: 'Saturday 10am works. I will send an invite.', type: 'text', read: true, createdAt: ago(14330) },
  { id: 'm8d', from: 'u9', to: 'me', text: '', type: 'document', fileName: 'Transfer_Roadmap.pdf', read: true, createdAt: ago(12960) },
  { id: 'm9a', from: 'u6', to: 'me', text: 'Hey Alex! Saw your post about the coding club. Do they take engineers?', type: 'text', read: true, createdAt: ago(300) },
  { id: 'm9b', from: 'me', to: 'u6', text: 'Yes! Everyone is welcome. Meetings are Wednesdays at 6 in the Business Building.', type: 'text', read: true, createdAt: ago(292) },
  { id: 'm9c', from: 'u6', to: 'me', text: 'Awesome, see you there 🙌', type: 'text', read: false, createdAt: ago(240) },
];

export const MOCK_MEETINGS: Meeting[] = [
  { id: 'mt1', organizer: 'me', invitee: 'u2', title: 'Resume review', note: 'Bring printed copy', reason: 'Career Advisement', start: inDays(2, 15), end: inDays(2, 15, 30), mode: 'Video', status: 'accepted' },
  { id: 'mt2', organizer: 'u3', invitee: 'me', title: 'Study plan check-in', note: 'Bring your class schedule.', reason: 'Personal/Social Support', start: inDays(4, 11), end: inDays(4, 11, 45), mode: 'Audio', status: 'pending' },
];

/** Mentor free time slots for the next two weeks. */
export function mockSlots(): Slot[] {
  const slots: Slot[] = [];
  const mentors = ['u1', 'u2', 'u3', 'u4', 'u5', 'u8', 'u9', 'u10'];
  mentors.forEach((id, i) => {
    for (let d = 1; d <= 14; d++) {
      if ((d + i) % 3 === 0) continue;
      const h = [9, 11, 14, 16][(d + i) % 4];
      slots.push({ id: `${id}-${d}-${h}`, mentorId: id, start: inDays(d, h), end: inDays(d, h, 30) });
    }
  });
  return slots;
}

/** myCollege Resources: the college's own resource list, managed by Super Admins in the dashboard. */
export const MOCK_RESOURCES: Resource[] = [
  { id: 'r1', category: 'Academic', title: 'Counseling Center', url: 'https://www.elcamino.edu', description: 'Book an appointment with an academic counselor to plan your classes and education plan.' },
  { id: 'r2', category: 'Academic', title: 'Transfer Center', url: 'https://www.elcamino.edu', description: 'Workshops, university rep visits, and help with transfer applications.' },
  { id: 'r3', category: 'Financial', title: 'Financial Aid Office', url: 'https://www.elcamino.edu', description: 'Help with FAFSA, the California Dream Act, grants and scholarships.' },
  { id: 'r4', category: 'Career', title: 'Career Center', url: 'https://www.elcamino.edu', description: 'Resume reviews, mock interviews and internship listings.' },
  { id: 'r5', category: 'Wellness', title: 'Student Health Services', url: 'https://www.elcamino.edu', description: 'Free and low-cost health and mental health services for enrolled students.' },
  { id: 'r6', category: 'Wellness', title: 'Basic Needs Center', url: 'https://www.elcamino.edu', description: 'Food pantry, housing support and emergency assistance.' },
];

/** Policy pages. Super Admins edit them in the dashboard (Content); the text below is the current server copy. */
export const CMS = Object.fromEntries(Object.entries(POLICIES).map(([k, v]) => [k, v.body])) as Record<PolicyKey, string>;

// ---------- Community feed (fictional) ----------

const R = (m: Record<string, Post['reactions'][string]>) => m;

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1', image: '/demo/posts/mixer.webp', authorId: 'u5', kind: 'event', title: 'Fall Mentoring Mixer', when: inDays(3, 17), place: 'Student Center',
    body: 'Mentors, mentees and friends: come meet your Mentor & Match community! Food from local restaurants, a photo booth, and a speed-mentoring round. 🌺',
    reactions: R({ u1: 'celebrate', u2: 'love', u3: 'celebrate', u6: 'like', u7: 'love', u8: 'celebrate', u10: 'like' }), saves: [], rsvps: ['u1', 'u2', 'u3', 'u6', 'u8', 'u11'], createdAt: ago(60 * 3),
  },
  {
    id: 'p2', image: '/demo/posts/lab.webp', authorId: 'u3', kind: 'win',
    body: 'I GOT INTO THE SUMMER RESEARCH PROGRAM AT UCLA!! 🎉 Huge thank you to Professor Nakamura for reviewing my personal statement three times. Mentoring really works.',
    reactions: R({ u1: 'celebrate', u2: 'applause', u5: 'love', u6: 'celebrate', u7: 'applause', u8: 'love', u10: 'celebrate', u11: 'support', u4: 'applause' }), saves: [], rsvps: [], createdAt: ago(60 * 7),
  },
  {
    id: 'p3', image: '/demo/posts/product.webp', authorId: 'u4', kind: 'opportunity', title: 'Product Management Intern (Summer)', deadline: inDays(14, 23, 59), link: 'https://example.com/careers',
    body: 'My team is hiring a PM intern for next summer. Paid, hybrid in Irvine. Any major welcome. If you are curious about product, message me and I will refer the strongest Mentor & Match applicants.',
    reactions: R({ u2: 'insightful', u6: 'like', u7: 'like', u8: 'insightful' }), saves: ['me'], rsvps: [], createdAt: ago(60 * 20),
  },
  {
    id: 'p4', image: '/demo/posts/books.webp', authorId: 'u7', kind: 'question',
    body: 'Has anyone balanced a part-time job with 15 units? Looking for honest tips on time management. My first midterm season is coming up and I’m nervous. 😅',
    reactions: R({ u3: 'support', u11: 'support' }), saves: [], rsvps: [], createdAt: ago(60 * 26),
  },
  {
    id: 'p5', image: '/demo/posts/lecture.webp', authorId: 'u10', kind: 'update',
    body: 'Reminder for anyone planning grad school: start asking for recommendation letters at least 6 weeks before the deadline. Give your recommenders a one-page summary of your work with them. It makes a big difference.',
    reactions: R({ u3: 'insightful', u6: 'insightful', u7: 'insightful', u8: 'like', me: 'insightful' }), saves: [], rsvps: [], createdAt: ago(60 * 40),
  },
  {
    id: 'p6', image: '/demo/posts/zoom.webp', authorId: 'u2', kind: 'event', title: 'Resume Glow-Up Workshop', when: inDays(6, 12), place: 'Zoom',
    body: 'Bring your resume and leave with a stronger one. 45 minutes, live edits, and mock-interview sign-ups at the end.',
    reactions: R({ u6: 'like', u11: 'love' }), saves: [], rsvps: ['me', 'u6'], createdAt: ago(60 * 50),
  },
  {
    id: 'p7', image: '/demo/posts/hackathon.webp', authorId: 'u6', kind: 'win',
    body: 'Our team just won 1st place at the campus Hackathon! 🏆 We built an app that matches students with campus food pantry hours. Thank you Grace and Jason for the late-night help.',
    reactions: R({ u1: 'celebrate', u3: 'applause', u8: 'love', u5: 'celebrate', u2: 'applause', me: 'celebrate' }), saves: [], rsvps: [], createdAt: ago(60 * 2),
  },
  {
    id: 'p8', image: '/demo/posts/interview.webp', authorId: 'u2', kind: 'update',
    body: 'Mock interview tip of the week: when they ask "tell me about yourself", answer in 3 parts. Present → Past → Future. 90 seconds max. Practice it out loud with your mentor on a call this week!',
    reactions: R({ u6: 'insightful', u7: 'insightful', me: 'like', u11: 'insightful' }), saves: ['me'], rsvps: [], createdAt: ago(60 * 9),
  },
  {
    id: 'p9', image: '/demo/posts/grad.webp', authorId: 'u5', kind: 'win',
    body: 'Congratulations to the Mentor & Match Class of 2026! 🎓 87 graduates, 41 first-generation. Every one of you had a mentor in your corner. Now it is your turn to pay it forward. 🌺',
    reactions: R({ u1: 'love', u2: 'celebrate', u3: 'celebrate', u4: 'applause', u8: 'love', u9: 'celebrate', u10: 'love', me: 'love' }), saves: [], rsvps: [], createdAt: ago(60 * 30),
  },
  {
    id: 'p10', image: '/demo/posts/code.webp', authorId: 'u1', kind: 'event', title: 'Women in Computing: Study Night', when: inDays(2, 18), place: 'MBA-214 + Live office hours in app',
    body: 'Bring your data structures homework and snacks. I will also host a live video office hour in the app for anyone who cannot make it in person. 💻',
    reactions: R({ u3: 'like', u6: 'love', u7: 'like' }), saves: [], rsvps: ['u3', 'u6', 'u7'], createdAt: ago(60 * 14),
  },
  {
    id: 'p11', image: '/demo/posts/office.webp', authorId: 'u4', kind: 'opportunity', title: 'Startup Shadow Day (Irvine)', deadline: inDays(9, 23, 59), link: 'https://example.com/shadow',
    body: 'Spend a day with our product team. Lunch included, all majors welcome. 6 spots reserved for Mentor & Match members.',
    reactions: R({ u6: 'insightful', u7: 'like', me: 'like' }), saves: [], rsvps: [], createdAt: ago(60 * 60),
  },
  {
    id: 'p12', image: '/demo/posts/study.webp', authorId: 'u8', kind: 'question',
    body: 'Thinking about starting a weekly Mentor & Match study table in the library. Who is in? Drop your best study time below 👇',
    reactions: R({ u3: 'support', u6: 'like', u11: 'support' }), saves: [], rsvps: [], createdAt: ago(60 * 70),
  },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'cm1', postId: 'p2', authorId: 'u1', body: 'So proud of you Priya! You earned this. 🙌', createdAt: ago(60 * 6) },
  { id: 'cm2', postId: 'p2', authorId: 'u7', body: 'Congrats!! Any tips for the personal statement?', createdAt: ago(60 * 5) },
  { id: 'cm3', postId: 'p4', authorId: 'u3', body: 'Time-block your week on Sunday night, and protect your sleep. Happy to share my template!', createdAt: ago(60 * 24) },
  { id: 'cm4', postId: 'p4', authorId: 'u2', body: 'Talk to your manager early about exam weeks. Most are understanding if you ask in advance.', createdAt: ago(60 * 22) },
  { id: 'cm5', postId: 'p3', authorId: 'u6', body: 'Does this accept freshmen?', createdAt: ago(60 * 18) },
  { id: 'cm6', postId: 'p7', authorId: 'u1', body: 'So proud of this team! Real problem, real impact. 💙', createdAt: ago(60 * 1) },
  { id: 'cm7', postId: 'p7', authorId: 'u5', body: 'Let\u2019s get this in front of Basic Needs. Messaging you now.', createdAt: ago(50) },
  { id: 'cm8', postId: 'p9', authorId: 'u10', body: 'This never gets old. Congratulations, graduates.', createdAt: ago(60 * 28) },
  { id: 'cm9', postId: 'p12', authorId: 'u3', body: 'Tuesdays after 4! Count me in.', createdAt: ago(60 * 65) },
];

export const MOCK_STORIES: Story[] = [
  { id: 's1', authorId: 'u3', text: 'First day in the lab! 🧪 Dreams are loading…', theme: 0, createdAt: ago(60 * 2), seenBy: [] },
  { id: 's1b', authorId: 'u3', image: '/demo/posts/lab.webp', text: 'My new home away from home', createdAt: ago(60 * 1), seenBy: [] },
  { id: 's2', authorId: 'u5', text: 'Office hours today 10–12 in the Financial Aid office. Come say hi! 🌺', theme: 1, createdAt: ago(60 * 4), seenBy: [] },
  { id: 's2b', authorId: 'u5', image: '/demo/posts/mixer.webp', text: 'Mixer prep is underway!', createdAt: ago(60 * 3), seenBy: [] },
  { id: 's3', authorId: 'u8', image: '/demo/posts/stage.webp', text: 'Portfolio review night was 🔥 Thank you all for coming!', createdAt: ago(60 * 9), seenBy: [] },
  { id: 's4', authorId: 'u4', text: 'Mentoring tip: ask “what would you do differently?” It unlocks the best stories.', theme: 3, createdAt: ago(60 * 12), seenBy: [] },
  { id: 's5', authorId: 'u2', text: 'Career fair is next Wednesday. Bring 10 resumes. 📄', theme: 1, createdAt: ago(60 * 15), seenBy: [] },
  { id: 's6', authorId: 'u6', image: '/demo/posts/hackathon.webp', text: 'WE WON 🏆', createdAt: ago(60 * 2), seenBy: [] },
  { id: 's7', authorId: 'u11', image: '/demo/posts/sunset.webp', text: 'Grateful for this community 🌅', createdAt: ago(60 * 6), seenBy: [] },
];

// ---------- Calls (fictional history) ----------

export const MOCK_CALLS: CallLog[] = [
  { id: 'cl1', withId: 'u2', direction: 'outgoing', kind: 'video', status: 'completed', duration: 1712, createdAt: ago(60 * 24 * 2), rating: 5, notes: 'Practiced STAR answers. Next: quantify impact on resume.' },
  { id: 'cl2', withId: 'u3', direction: 'incoming', kind: 'audio', status: 'missed', duration: 0, createdAt: ago(60 * 3) },
  { id: 'cl3', withId: 'u5', direction: 'incoming', kind: 'video', status: 'completed', duration: 1245, createdAt: ago(60 * 24 * 4), rating: 5, notes: 'Talked first-gen scholarships and balancing work.' },
  { id: 'cl4', withId: 'u9', direction: 'outgoing', kind: 'video', status: 'completed', duration: 2630, createdAt: ago(60 * 24 * 8), rating: 4 },
  { id: 'cl5', withId: 'u8', direction: 'outgoing', kind: 'audio', status: 'completed', duration: 540, createdAt: ago(60 * 24 * 1) },
  { id: 'cl6', withId: 'u6', direction: 'incoming', kind: 'audio', status: 'declined', duration: 0, createdAt: ago(60 * 24 * 5) },
];

/** Live mentor office hours: drop-in group video rooms. */
export const MOCK_ROOMS: LiveRoom[] = [
  { id: 'lr1', hostId: 'u1', title: 'Tech internship AMA', topic: 'Resumes, LeetCode, first internships', start: ago(18), live: true, participants: ['u3', 'u6', 'u7', 'u8'], cover: '/demo/posts/code.webp' },
  { id: 'lr2', hostId: 'u2', title: 'Mock interview clinic', topic: 'Behavioral questions, live feedback', start: ago(6), live: true, participants: ['u6', 'u11'], cover: '/demo/posts/interview.webp' },
  { id: 'lr3', hostId: 'u10', title: 'Grad school 101', topic: 'Statements of purpose & recommendation letters', start: inDays(1, 16), live: false, participants: [], cover: '/demo/posts/lecture.webp' },
  { id: 'lr4', hostId: 'u9', title: 'Is law school for me?', topic: 'LSAT, costs, and public interest careers', start: inDays(3, 10), live: false, participants: [], cover: '/demo/posts/books.webp' },
];
