import "server-only";
import postgres from "postgres";
import { RESULT_TYPES, type ResultTypeId } from "./scoring";
import type { LeadRow } from "./lead";

export type StorageMode = "supabase-rest" | "postgres" | "disabled";

export function storageMode(env = process.env): StorageMode {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return "supabase-rest";
  if (env.SUPABASE_DB_URL) return "postgres";
  return "disabled";
}

let sql: ReturnType<typeof postgres> | null = null;

/** Throws on failure when storage is configured. Returns false when storage is disabled. */
export async function saveLead(row: LeadRow): Promise<boolean> {
  const mode = storageMode();
  if (mode === "disabled") return false;

  if (mode === "supabase-rest") {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const res = await fetch(`${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/quiz_leads`, {
      method: "POST",
      headers: {
        apikey: key,
        // Legacy JWT service_role keys need the Bearer header; new sb_secret_ keys work with apikey alone.
        ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
    return true;
  }

  // SUPABASE_DB_URL may hold one connection string or several separated by whitespace
  // (e.g. pooler hosts for different clusters); the first one that accepts the insert is kept.
  const urls = process.env.SUPABASE_DB_URL!.split(/\s+/).filter(Boolean);
  let lastError: unknown;
  for (const url of sql ? [null] : urls) {
    const client = sql ?? postgres(url!, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 8 });
    try {
      await client`insert into public.quiz_leads ${client(
        { ...row, answers: client.json(row.answers), utm: client.json(row.utm) } as never,
      )}`;
      sql = client;
      return true;
    } catch (e) {
      lastError = e;
      if (client === sql) sql = null;
      await client.end({ timeout: 1 }).catch(() => {});
      console.error("Postgres insert failed", url ? new URL(url).host : "cached", (e as Error).message);
    }
  }
  throw lastError ?? new Error("No database URL worked");
}

const LABEL: Record<ResultTypeId, string> = Object.fromEntries(
  RESULT_TYPES.map((t) => [t.id, t.label]),
) as Record<ResultTypeId, string>;

/** Optional MailerLite upsert. Never throws; returns a short status string. */
export async function syncMailerLite(row: LeadRow): Promise<string> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) return "skipped";
  const group =
    process.env[`MAILERLITE_GROUP_${row.result_type.toUpperCase()}`] || process.env.MAILERLITE_GROUP_ID;
  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: row.email,
        fields: { name: row.first_name ?? undefined, fertility_type: LABEL[row.result_type] },
        ...(group ? { groups: [group] } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("MailerLite sync failed", res.status, (await res.text()).slice(0, 500));
      return `error_${res.status}`;
    }
    return "ok";
  } catch (e) {
    console.error("MailerLite sync error", e);
    return "error";
  }
}
