# susana

Monorepo for Susana Puelles' projects: **YoniSync** (natural fertility for women 35+), **Surasana** (acupuncture & wellness center) and an upcoming fertility tracking app.

| Folder | What | Status |
|---|---|---|
| [`quiz/`](quiz/) | "Discover Your Fertility Type" quiz: a faithful rebuild of the YoniSync Typeform, Next.js on Vercel, leads saved to Supabase | Live |
| `screens/` | Screenshots of the deployed quiz (desktop + mobile) used to compare against the Typeform original | — |

Each project is self-contained (own `package.json`); deploy each one as its own Vercel project with its folder as the root directory.
