import type { EmailTemplate, EmailTemplateKey, Role } from '@/lib/types';

/**
 * Default admin email templates.
 * Placeholders: {{first_name}} {{program}} {{org}} {{admin_name}} {{link}} {{role}} {{profile_score}} {{match_name}}.
 */
const inviteBody = (who: string, why: string) => `Hi {{first_name}},

You're invited to join {{program}} as a ${who}.

${why}

Accept your invitation here: {{link}}

Setting up your profile takes less than five minutes.

Warmly,
{{admin_name}}
{{org}}`;

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    key: 'invite_mentee', name: 'Invitation · Mentee', category: 'Invitation', headline: 'Your mentor is waiting',
    subject: "{{first_name}}, you're invited to {{program}}",
    body: inviteBody('mentee', 'Get matched with a mentor who has walked your path: classes, internships, careers and everything in between.'),
  },
  {
    key: 'invite_mentor', name: 'Invitation · Mentor', category: 'Invitation', headline: 'Students need your experience',
    subject: '{{first_name}}, will you mentor with {{program}}?',
    body: inviteBody('mentor', 'An hour a month can change a student’s path. You choose your availability and how you like to meet.'),
  },
  {
    key: 'invite_peer', name: 'Invitation · Peer Mentor', category: 'Invitation', headline: 'Lead the students behind you',
    subject: '{{first_name}}, become a Peer Mentor in {{program}}',
    body: inviteBody('peer mentor', 'Share what you’ve learned with newer students while growing your own network of mentors.'),
  },
  {
    key: 'invite_professional', name: 'Invitation · Professional', category: 'Invitation', headline: 'Open doors for the next generation',
    subject: '{{first_name}}, join {{program}} as an industry mentor',
    body: inviteBody('professional mentor', 'Help students understand your industry, review resumes and practice interviews, on your schedule.'),
  },
  {
    key: 'reminder', name: 'Invitation reminder', category: 'Invitation', headline: 'Your invitation is still open',
    subject: 'Reminder: your {{program}} invitation',
    body: `Hi {{first_name}},

Just a friendly reminder that your invitation to {{program}} is still waiting for you.

Join as a {{role}} here: {{link}}

If now isn't the right time, no worries. You can join whenever you're ready.

{{admin_name}}
{{org}}`,
  },
  {
    key: 'welcome', name: 'Welcome aboard', category: 'Direct message', headline: 'Welcome to the community',
    subject: 'Welcome to {{program}}, {{first_name}}!',
    body: `Hi {{first_name}},

Welcome to {{program}}! We're so glad you're here.

Your first week:
• Finish your profile so the right people find you
• Explore Discover and send your first request
• Set your availability so meetings are easy to book

Reply any time if you have questions.

{{admin_name}}
{{org}}`,
  },
  {
    key: 'finish_profile', name: 'Finish your profile', category: 'Direct message', headline: 'Your profile is almost there',
    subject: '{{first_name}}, you are {{profile_score}} of the way there',
    body: `Hi {{first_name}},

Your profile is {{profile_score}} complete. Members with full profiles get 3× more mentoring requests.

A few minutes is all it takes: add your bio, interests and availability here: {{link}}

{{admin_name}}
{{org}}`,
  },
  {
    key: 'introduction', name: 'Mentor introduction', category: 'Direct message', headline: 'We found someone you should meet',
    subject: '{{first_name}}, meet {{match_name}}: a strong match for you',
    body: `Hi {{first_name}},

Based on your goals and interests, we think you and {{match_name}} would be a great mentoring match.

Open {{program}} to see their profile and say hello: {{link}}

Here's to a great connection!

{{admin_name}}
{{org}}`,
  },
  {
    key: 'checkin', name: 'We miss you (check-in)', category: 'Direct message', headline: 'How is your semester going?',
    subject: 'Checking in, {{first_name}}',
    body: `Hi {{first_name}},

We haven't seen you in {{program}} for a while and wanted to check in.

Is there anything we can help with? A new match, a different meeting time, or just someone to talk to?

Hop back in here: {{link}}

{{admin_name}}
{{org}}`,
  },
  {
    key: 'milestone', name: 'Milestone celebration', category: 'Direct message', headline: 'Look how far you have come',
    subject: 'Congratulations on your progress, {{first_name}}!',
    body: `Hi {{first_name}},

We wanted to take a moment to celebrate you. Your commitment to mentoring makes {{program}} what it is.

Thank you for showing up for your community.

With gratitude,
{{admin_name}}
{{org}}`,
  },
  {
    key: 'announcement', name: 'Program announcement', category: 'Announcement', headline: 'News from the program',
    subject: 'An update from {{program}}',
    body: `Hi {{first_name}},

[Share your announcement here: an event, a deadline or program news.]

See the details in the app: {{link}}

{{admin_name}}
{{org}}`,
  },
  {
    key: 'notice', name: 'Account notice', category: 'Announcement', headline: 'An update about your account',
    subject: 'Important: an update about your {{program}} account',
    body: `Hi {{first_name}},

Following a review under our Community Guidelines, your {{program}} account has been temporarily paused. While paused, your profile is hidden and you can't send messages or requests.

If you think this is a mistake, reply to this email and our team will review it within 3 business days.

{{admin_name}}
{{org}} Safety Team`,
  },
];

export const INVITE_TEMPLATE: Record<Role, EmailTemplateKey> = {
  mentee: 'invite_mentee', mentor: 'invite_mentor', peer_mentor: 'invite_peer', professional: 'invite_professional', super_admin: 'invite_mentor',
};

/** Auto-selection rules: which template loads for each admin action. */
export const AUTO_RULES: { when: string; key: EmailTemplateKey }[] = [
  { when: 'Invite a Mentee / Mentor / Peer / Professional', key: 'invite_mentee' },
  { when: 'Resend an invitation', key: 'reminder' },
  { when: 'Invitation accepted', key: 'welcome' },
  { when: 'Finish profile nudge', key: 'finish_profile' },
  { when: 'Introduce a match', key: 'introduction' },
  { when: 'Re-engagement check-in', key: 'checkin' },
  { when: 'Celebrate progress', key: 'milestone' },
  { when: 'Announcement', key: 'announcement' },
  { when: 'Suspend or safety action', key: 'notice' },
];
