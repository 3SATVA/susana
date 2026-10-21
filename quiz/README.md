# YoniSync Fertility Type quiz

Faithful rebuild of Susana's Typeform quiz (`cL8EWv9z`, "Fertility Type") as a standalone Next.js (App Router, TypeScript) app.
Same copy, screen order, 12 questions (RARELY/NEVER · SOMETIMES · ALWAYS), six results, scoring and theme, without Typeform branding or the cookie banner.

**Differences from the Typeform (intentional):** email is **required** (first name optional) and the lead is saved server-side before the result is shown; utm_* params are captured.

## Flow
Intro → Q1–Q12 (one at a time, auto-advance, keys A/B/C + Enter) → #13 First name / Email → "CLICK NOW TO REVEAL" (Submit, Ctrl/Cmd+Enter) → POST `/api/lead` → result screen.

## Scoring
`lib/scoring-matrix.json` is the single source of truth (copied from the Typeform logic, quirks included — e.g. Q12 SOMETIMES scores nothing).
Each answer adds +1 to the listed types; highest total wins; ties go to the first type in order: Blood Deficiency, Kidney Yin, Kidney Yang, Liver Qi Stagnation, Dampness Accumulation, Blood Stasis.
The server recomputes the result from the raw answers (`lib/scoring.ts`).

```bash
npm install
npm test        # vitest: every verified Typeform pattern + the all-SOMETIMES tie -> Blood Deficiency
npm run dev
```

## Lead storage (`/api/lead`)
Stored per lead: first name, email, result type, all six scores, the 12 answers, every `utm_*` param (+ utm_source/medium/campaign columns), server timestamp, client timestamp, user agent.

Table `public.quiz_leads` (see `supabase/migrations/`): RLS **on**, **no** anon/authenticated policies, so the public Supabase API cannot read or write it.

Env vars (server-only; set in Vercel, never commit):

| Var | Purpose |
|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Preferred: insert through the Supabase REST API with the service-role / `sb_secret_` key |
| `SUPABASE_DB_URL` | Fallback when no service key is set: Postgres URL(s) for the insert-only `quiz_writer` role (space-separate several to try in order) |
| `MAILERLITE_API_KEY` | Optional: upsert subscriber into MailerLite with field `fertility_type` |
| `MAILERLITE_GROUP_<TYPE>` / `MAILERLITE_GROUP_ID` | Optional group per result type (`BLOOD_DEFICIENCY`, `KIDNEY_YIN`, `KIDNEY_YANG`, `LIVER_QI_STAGNATION`, `DAMPNESS_ACCUMULATION`, `BLOOD_STASIS`) or one group for all |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` to allow search indexing (Typeform original had indexing off, so default is `noindex`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG tags (defaults to the Vercel production URL) |

Behaviour: no storage configured → result still shows (lead not stored). Storage configured but insert fails → error on the Submit screen with retry; result is not shown. MailerLite errors are logged and never block the result.
For MailerLite, create a custom field named `fertility_type` (text) first.

## Deploy
Vercel project `yonisync-quiz` (team 3SATVA), root directory `quiz`, framework Next.js.

`scripts/e2e_screens.py <url> <out> <email>` walks the quiz headlessly on desktop and mobile and saves screenshots (only the desktop pass submits a real lead).
