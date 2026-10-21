# YoniSync emails

Susana's systeme.io email automations, replicated as plain files for the **email_boss** engine (`3SATVA/email_boss`).
Captured read-only from systeme.io on 2026-10-21. Nothing here sends anything by itself.

Flowchart of everything below: **https://yonisync-automations.vercel.app** (app in [`../automations`](../automations)).

```
emails/
  yonisync/                     <- an email_boss brand folder (drop-in for email_boss/brands/yonisync)
    brand.json                  sender susana@yonisync.com, postal address placeholder (REPLACE_ME)
    partials/header.html        email shell (600px, table-based, hidden preheader)
    partials/footer.html        Susana Puelles, L.Ac. · YoniSync, {{physical_address}}, {{unsubscribe_url}}
    templates/<id>.html         20 emails (front matter: subject, preheader)
    sequences/<key>.json        4 sequences: trigger + steps + delays
  automations.json              systeme rules/workflow -> sequence mapping (feeds the flowchart)
  templates.index.json          template id -> systeme source folder, subject, delay, sender
  source-systeme/               raw capture: meta.json, body.html, body.txt, screenshot.png, images/
  scripts/convert_systeme.py    source-systeme -> templates + automations/public/email-assets
```

## Sequences

| Key | systeme source | Trigger in email_boss | Emails · delays (after previous email) |
|---|---|---|---|
| `fertility-webinar-signed-up` | campaign "Fertility Webinar Signed Up" (rules #1, #5) | tag `seq:fertility-webinar-signed-up` | 11 · 1m, 1h, 1d, 2d, 1d, 3d, 3d, 1d, 4d, 2d, 6d |
| `checklist-campaign` | campaign "Checklist Campaign" (rules #2, #4) | tag `seq:checklist-campaign` | 3 · 0, 1d, 2d |
| `fertility-type-quiz` | campaign "Fertiilty Type Quiz" (no rule found) | signup source `fertility-quiz` | 5 · 0, 1d, 2d, 2d, 1d |
| `yoni-flow-welcome` | standalone email, workflow "Purchased Yoni Flow" + rules #6, #7, #12 | tag `seq:yoni-flow-welcome` | 1 · 0 |

All sequences ship with `"status": "paused"`. Switch to `active` only once SES/DNS and the real postal address are in place.

**Why `seq:` tags?** In systeme a plain tag never starts a campaign; "Subscribe to campaign" is a separate action. To keep that behaviour, each sequence is triggered by its own enrollment tag, and the opt-in handler adds both the plain tag (e.g. `freebie-checklist-optin`) and the `seq:` tag. Rule #11, for example, only adds the plain tag, so it still does not start the Checklist Campaign.

## Formats (email_boss)

**Template** `templates/<id>.html` (id: lowercase `a-z 0-9 _ -`, max 80):

```
---
subject: Download your checklist >>
preheader: optional inbox preview text
---
{{> header}}
<p>Hi {{first_name|there}}, ...</p>
{{> footer}}
```

Merge tags: `{{first_name|fallback}}`, `{{last_name}}`, `{{email}}`, `{{brand.name}}`, `{{unsubscribe_url}}`, `{{physical_address}}`, `{{custom.<key>}}`. systeme's `{first_name}` became `{{first_name|there}}` ("Hi there," when the name is blank). Every value is HTML-escaped.

**Sequence** `sequences/<key>.json`: `key`, `name`, `description`, `status` (`active|paused|archived`), `trigger` (`{"type":"tag_added","tag":"..."}` / `{"type":"signup_source","source":"..."}` / `{"type":"manual"}`), optional `exit_tags`, `allow_reenroll`, and `steps[]` of `{ key, delay, template }`. `delay` is the wait after the previous step (or after enrollment for step 1): `"0"`, `"1m"`, `"1h"`, `"2d"`, `"1d 12h"`.

Validated against email_boss's own loader (`loadBrandDir`) and renderer: 20 templates, 4 sequences, no problems.

## Images

Template images are absolute URLs on the flowchart site: `https://yonisync-automations.vercel.app/email-assets/<template-id>/<file>` (files in `automations/public/email-assets/`). Copied from systeme's CDN so the emails no longer depend on systeme. The download links (checklist PDF, webinar MP4) still point at systeme's CDN (`d1yei2z3i6k35z.cloudfront.net`) and should be re-hosted before leaving systeme.

## Editing

Edit the templates directly (or ask in the chat). `convert_systeme.py` regenerates templates from `source-systeme/` and overwrites hand edits, so only re-run it after a fresh systeme capture. `ASSET_BASE=... python3 emails/scripts/convert_systeme.py` changes the image host.
