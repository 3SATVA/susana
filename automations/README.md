# YoniSync email automations: flowchart

Read-only, noindex site that charts every email automation (trigger → rules/tags → each email with the delay before it).
Click an email to see the rebuilt HTML (desktop/mobile width) or toggle to the original systeme.io screenshot. Deep link: `/#email=<template-id>`.

Live: https://yonisync-automations.vercel.app (Vercel project `yonisync-automations`, team 3SATVA, root directory `automations`; production public, previews behind Vercel Authentication).

Data comes from [`../emails`](../emails): `scripts/build-data.mjs` runs before `next build` and writes

- `data/flow.json`: sequences, steps (delay + cumulative offset), rules, workflow
- `public/previews/<id>.html`: each template rendered with sample values (first name "Jane", placeholder address, inert unsubscribe link)
- `public/originals/<id>.png`: systeme editor screenshots

(all three are generated and git-ignored). `public/email-assets/` holds the images the email templates link to, so it is committed and must stay deployed.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
python3 scripts/screens.py <url> <out-dir>   # desktop + mobile screenshots, asserts that clicking an email renders it
```

The build needs `../emails` next to this folder (Vercel: keep "Include files outside the root directory" on).
