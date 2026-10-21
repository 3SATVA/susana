import { isValidAnswers, type Answer } from "./scoring";

// Pragmatic email check: one @, no spaces, a dot in the domain, sane TLD.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.trim().length <= 254 && EMAIL_RE.test(email.trim());
}

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type LeadInput = {
  firstName: string | null;
  email: string;
  answers: Answer[];
  utm: Record<string, string>;
  clientTimestamp: string | null;
};

export type ParseResult = { ok: true; value: LeadInput } | { ok: false; error: string };

function cleanStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

export function parseLeadInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request" };
  const b = body as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.length > 0) return { ok: false, error: "Invalid request" }; // honeypot
  if (!isValidEmail(b.email)) return { ok: false, error: "Hmm... that email doesn't look right" };
  if (!isValidAnswers(b.answers)) return { ok: false, error: "Please answer all 12 questions" };
  const utm: Record<string, string> = {};
  if (b.utm && typeof b.utm === "object") {
    for (const [k, v] of Object.entries(b.utm as Record<string, unknown>)) {
      if (/^utm_[a-z0-9_]{1,40}$/i.test(k)) {
        const s = cleanStr(v, 500);
        if (s) utm[k.toLowerCase()] = s;
      }
    }
  }
  const ts = cleanStr(b.clientTimestamp, 40);
  return {
    ok: true,
    value: {
      firstName: cleanStr(b.firstName, 100),
      email: normalizeEmail(b.email),
      answers: b.answers,
      utm,
      clientTimestamp: ts && !Number.isNaN(Date.parse(ts)) ? new Date(ts).toISOString() : null,
    },
  };
}
