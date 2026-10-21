import { RESULT_TYPES, type ResultTypeId } from "./scoring";
import type { LeadRow } from "./lead";

const LABEL: Record<ResultTypeId, string> = Object.fromEntries(RESULT_TYPES.map((t) => [t.id, t.label])) as Record<ResultTypeId, string>;

export type EmailBossStatus = "skipped" | "ok" | "timeout" | "error" | `error_${number}`;

export function emailBossPayload(row: LeadRow, ip: string | null) {
  return {
    email: row.email,
    first_name: row.first_name,
    source: "fertility-quiz",
    tags: ["seq:fertility-type-quiz", `quiz:${row.result_type}`],
    custom_fields: {
      fertility_type: LABEL[row.result_type],
      fertility_type_id: row.result_type,
      ...(row.utm_source ? { utm_source: row.utm_source.slice(0, 200) } : {}),
      ...(row.utm_medium ? { utm_medium: row.utm_medium.slice(0, 200) } : {}),
      ...(row.utm_campaign ? { utm_campaign: row.utm_campaign.slice(0, 200) } : {}),
    },
    // The email screen requires an address and the result page promises the newsletter.
    consent: true,
    ...(ip ? { ip: ip.slice(0, 45) } : {}),
  };
}

/**
 * Optional: add the quiz lead to email_boss (YoniSync brand) so the quiz email series starts.
 * No-op unless EMAIL_BOSS_URL and EMAIL_BOSS_KEY are set. Never throws, never takes longer than
 * the timeout; the quiz result is shown regardless.
 */
export async function syncEmailBoss(
  row: LeadRow,
  ip: string | null,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<EmailBossStatus> {
  const base = env.EMAIL_BOSS_URL?.trim().replace(/\/$/, "");
  const key = env.EMAIL_BOSS_KEY?.trim();
  if (!base || !key) return "skipped";
  const timeoutMs = Number(env.EMAIL_BOSS_TIMEOUT_MS ?? 3000);
  try {
    const res = await fetchImpl(`${base}/api/subscribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailBossPayload(row, ip)),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.error("email_boss subscribe failed", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return `error_${res.status}`;
    }
    return "ok";
  } catch (e) {
    const name = (e as Error)?.name;
    console.error("email_boss subscribe error", name, (e as Error)?.message);
    return name === "TimeoutError" || name === "AbortError" ? "timeout" : "error";
  }
}
