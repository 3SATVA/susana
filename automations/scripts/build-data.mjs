// Builds the flowchart data + email previews from ../emails (the source of truth).
//   data/flow.json             sequences, steps, rules, workflows (read by the page at build time)
//   public/previews/<id>.html  each template rendered with sample merge values
//   public/originals/<id>.png  the systeme.io editor screenshot of the original email
// The merge logic mirrors email_boss lib/templates.ts (partials, {{tag|fallback}}, html escaping).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const emails = path.resolve(app, "../emails");
const brandDir = path.join(emails, "yonisync");

const SAMPLE = {
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  unsubscribe_url: "#unsubscribe-preview",
  physical_address: "[Postal address placeholder: YoniSync, street or PO box, city, state, ZIP]",
  current_year: String(new Date().getFullYear()),
};

const read = (p) => fs.readFileSync(p, "utf8");
const brand = JSON.parse(read(path.join(brandDir, "brand.json")));
const partials = Object.fromEntries(
  fs.readdirSync(path.join(brandDir, "partials")).filter((f) => f.endsWith(".html")).map((f) => [path.basename(f, ".html"), read(path.join(brandDir, "partials", f))]),
);
const TAG_RE = /\{\{\s*(>\s*)?([a-zA-Z0-9_.-]+)\s*(?:\|([^}]*))?\}\}/g;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function frontMatter(src) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":");
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: src.slice(m[0].length) };
}
const expand = (src, d = 0) => src.replace(TAG_RE, (w, p, name) => (p ? expand(partials[name] ?? "", d + 1) : w));
function merge(src, vars, escape) {
  return src.replace(TAG_RE, (_w, _p, name, fb) => {
    const v = name === "brand.name" ? brand.name : name === "brand.from_name" ? brand.from_name : vars[name];
    const out = v == null || String(v).trim() === "" ? (fb ?? "").trim() : String(v);
    return escape ? esc(out) : out;
  });
}

const index = Object.fromEntries(JSON.parse(read(path.join(emails, "templates.index.json"))).map((t) => [t.template, t]));
const tplDir = path.join(brandDir, "templates");
const prevDir = path.join(app, "public", "previews");
const origDir = path.join(app, "public", "originals");
for (const d of [prevDir, origDir, path.join(app, "data")]) fs.mkdirSync(d, { recursive: true });

const templates = {};
for (const f of fs.readdirSync(tplDir).filter((f) => f.endsWith(".html")).sort()) {
  const id = path.basename(f, ".html");
  const { meta, body } = frontMatter(read(path.join(tplDir, f)));
  const vars = { ...SAMPLE, preheader: meta.preheader ? merge(meta.preheader, SAMPLE, false) : "" };
  const html = merge(expand(body), vars, true);
  fs.writeFileSync(path.join(prevDir, `${id}.html`), html.replace("<head>", '<head>\n<meta name="robots" content="noindex">\n<base target="_blank">'));
  const src = index[id];
  let original = null;
  if (src) {
    const shot = path.join(emails, "source-systeme", src.source, "screenshot.png");
    if (fs.existsSync(shot)) {
      fs.copyFileSync(shot, path.join(origDir, `${id}.png`));
      original = `/originals/${id}.png`;
    }
  }
  templates[id] = {
    id,
    subject: meta.subject ?? "",
    subjectPreview: merge(meta.subject ?? "", SAMPLE, false),
    preheader: meta.preheader ?? "",
    sender: src?.sender_name ? `${src.sender_name} <${src.sender_email}>` : `${brand.from_name} <${brand.from_email}>`,
    systemeCampaign: src?.campaign ?? null,
    preview: `/previews/${id}.html`,
    original,
    problems: src?.problems ?? [],
  };
}

const UNIT = { m: 1, min: 1, h: 60, d: 1440, w: 10080 };
function minutes(d) {
  if (typeof d === "number") return d;
  const s = String(d).trim().toLowerCase();
  if (s === "0" || s === "now" || s === "immediately") return 0;
  let t = 0;
  for (const m of s.matchAll(/(\d+)\s*(min|m|h|d|w)/g)) t += Number(m[1]) * UNIT[m[2]];
  return t;
}

const seqDir = path.join(brandDir, "sequences");
const sequences = fs.readdirSync(seqDir).filter((f) => f.endsWith(".json")).sort().map((f) => {
  const s = JSON.parse(read(path.join(seqDir, f)));
  let cum = 0;
  return {
    ...s,
    steps: s.steps.map((st) => {
      const m = minutes(st.delay);
      cum += m;
      return { ...st, delayMinutes: m, offsetMinutes: cum };
    }),
  };
});

const automations = JSON.parse(read(path.join(emails, "automations.json")));
const flow = { generatedAt: new Date().toISOString(), brand: { name: brand.name, from: `${brand.from_name} <${brand.from_email}>` }, templates, sequences, ...automations };
fs.writeFileSync(path.join(app, "data", "flow.json"), JSON.stringify(flow, null, 2));
console.log(`build-data: ${Object.keys(templates).length} templates, ${sequences.length} sequences, ${automations.rules.length} rules`);
