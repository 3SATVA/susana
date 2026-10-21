# susana

Monorepo for Susana Puelles' projects: **YoniSync** (natural fertility for women 35+), **Surasana** (acupuncture & wellness center) and an upcoming fertility tracking app.

| Folder | What | Status |
|---|---|---|
| [`quiz/`](quiz/) | "Discover Your Fertility Type" quiz: a faithful rebuild of the YoniSync Typeform, Next.js on Vercel, leads saved to Supabase | Live |
| [`emails/`](emails/) | Susana's systeme.io email automations replicated for email_boss: 20 email templates, 4 sequences, rule map | Paused (not sending) |
| [`automations/`](automations/) | Flowchart site of every automation; click an email to read it (yonisync-automations.vercel.app) | Live |
| `screens/` | Screenshots of the deployed sites (quiz, automations) | — |

Each project is self-contained (own `package.json`); deploy each one as its own Vercel project with its folder as the root directory.
