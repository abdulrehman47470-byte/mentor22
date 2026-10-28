# Mentor & Match Student (web)

The student app for Mentor & Match, rebuilt from the client's content document ("Mentor & Match Student: all
written content in the app, A to Z", October 28, 2026) and the landing design "N". Every screen works on demo
data; no backend or keys are needed.

## Run it

```bash
npm install
npm run dev        # development, port 5174
npm run build && npm run preview   # production build, port 4174
```

Demo log-in: `alex.chen@student.edu` / `Mentor2026`. The verification code is `123456`.
Demo data is saved in the browser.

## Where things live

| Path | What |
|---|---|
| `src/data/labels.ts` | Every screen text, keyed by the app's label keys, so the server's `labels` can replace them |
| `src/data/policies.ts` | Student Code of Conduct, Privacy Policy, Terms of Service, Confidentiality, Educational Purposes, Disclaimer (full text) |
| `src/data/options.ts` | Choice lists, Settings menu (student items, PDF order), hotlines and links |
| `src/data/mock.ts` | Demo mentors, colleges, resources and certificates |
| `src/lib/api.ts` | Mock backend. Each function lists the fields the real app sends, so it can be swapped for admin.mentorandmatch.com |
| `public/brand/` | Vector logos from the Android app. `public/fonts/` holds Gilroy as WOFF2 |

## Fixed from the old app (spec "Issues worth fixing")

1. The log-in reply no longer contains the verification code.
2. Help & Support sends the name and email the student types.
3. "National Crisis Hotline" calls 988, not the housing hotline. **The client should confirm this number.**
4. Accepting the Terms is recorded on the account, not only on the phone.

Also: "Mental Health Crisis Hotline" (741741) is a text line, so it opens a text message ("HOME") instead of a call.

## Wording corrections

Obvious typos in the label list were corrected: "Did’t" → "Didn't", "email addressed" → "email address",
"log into continue" → "log in to continue", "You do not has" → "You do not have", "Refered" → "Referred",
"greater than to" → "greater than", "between 3 to 40" → "between 3 and 40", "Linkedin" → "LinkedIn",
"Thread" → "Threads". Policy (legal) text is kept exactly as published.

## Still needed from the client or server

- Lists the server only sends after log-in (ethnicity, pronouns, religion, languages, majors, degrees, colleges,
  goals, "describes me", report reasons). `options.ts` has stand-ins.
- Each college's myCollege Resources and training certificates (demo entries for now).
- Real back end, push notifications (Firebase), file storage (Azure) and calls (Agora).
