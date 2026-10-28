# Mentor & Match Student (web)

The existing mentoring app (Discover, Connections, Messages, Profile, Meetings, calls, live rooms, invites and the
Super Admin dashboard), updated with the client's new information from "Mentor & Match Student: all written content
in the app, A to Z" (October 28, 2026) and the landing design "N". Every screen works on demo data.

## Run it

```bash
npm install
npm run dev        # development, port 5174
npm run build && npm run preview   # production build, port 4174
```

Demo log-in: `alex.chen@student.edu` / `Mentor2026`. The verification code is `123456`. Alex also has Super Admin
access, so the Admin tab is visible. Every demo account uses the same password.

## What the new information changed

| Area | Change |
|---|---|
| Brand | Mentor & Match Student name, vector logos (`public/brand`), Gilroy font (`public/fonts`), Mentor & Match blues. The old colour names (navy, orange) now map to the blues in `src/styles.css`. |
| Landing | Design "N": fits one screen on any phone; phone frame on desktop |
| Sign-in | Log In (email + password, first-time Terms pop-up), 5-minute verification code, Forgot / Create New Password, Upload Profile, Select Your College, Educational Purposes notice, then the existing profile wizard if the profile isn't finished |
| Profile | Basic Info, Education and Goals & More questions added to the wizard and profile pages; mentor background questions and education entries |
| Discover | Profile-completion card, new search filters (age range, gender identity, pronouns, major, background) |
| Connections | Reject and disconnect with an optional reason note; "Referred By" |
| Meetings | Month calendar, Meeting Type (Audio/Video), Meeting Reasons, Start/End Time with every validation message |
| Messages | Phone numbers, emails and inappropriate words are blocked; attach Gallery or Document |
| Settings | Full menu from the document: Mentee Resources, hotlines, Handshake, myCollege Resources, Set Availability, Code of Conduct, Reset Password, Accessibility, Help & Support, policies |
| Policies | Full text of all six pages; Super Admins edit them in Admin → Content |
| Wording | Every label from the document in `src/data/labels.ts`, keyed by the app's label keys |

## Fixed from the old Android app (spec "Issues worth fixing")

1. The log-in reply no longer contains the verification code.
2. Help & Support sends the name and email the member types.
3. "National Crisis Hotline" calls 988, not the housing hotline. **The client should confirm this number.**
4. Accepting the Terms is recorded on the account, not only on the phone.

"Mental Health Crisis Hotline" (741741) is a text line, so it opens a text message ("HOME") instead of a call.
Obvious typos in the label list were corrected (for example "Did’t", "You do not has"); policy text is word for word.

## Still needed from the client or server

- Lists the server sends after log-in (ethnicity, pronouns, religion, languages, majors, degrees, colleges, goals,
  "describes me", report reasons). `src/data/options.ts` has stand-ins.
- Each college's resources (editable in Admin → Content) and training certificates.
- Real back end, push notifications, file storage and calls.
