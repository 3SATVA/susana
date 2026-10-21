import { describe, expect, it, vi } from "vitest";
import { emailBossPayload, syncEmailBoss } from "@/lib/email-boss";
import { buildLeadRow } from "@/lib/lead";
import { computeResult, parsePattern } from "@/lib/scoring";

const answers = parsePattern("CACBCBACCCBB");
const { scores, resultType } = computeResult(answers);
const row = buildLeadRow(
  { email: "maya@example.com", firstName: "Maya", answers, utm: { utm_source: "ig" }, clientTimestamp: null },
  scores,
  resultType,
  "ua",
);
const env = { EMAIL_BOSS_URL: "https://eb.example.com/", EMAIL_BOSS_KEY: "eb_yonisync_test" } as unknown as NodeJS.ProcessEnv;

describe("email_boss hookup", () => {
  it("is a no-op when not configured", async () => {
    const f = vi.fn();
    expect(await syncEmailBoss(row, null, {} as NodeJS.ProcessEnv, f as unknown as typeof fetch)).toBe("skipped");
    expect(await syncEmailBoss(row, null, { EMAIL_BOSS_URL: "https://x" } as unknown as NodeJS.ProcessEnv, f as unknown as typeof fetch)).toBe("skipped");
    expect(f).not.toHaveBeenCalled();
  });

  it("posts the lead with source, sequence tag, result type and consent", async () => {
    const f = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    expect(await syncEmailBoss(row, "203.0.113.7", env, f as unknown as typeof fetch)).toBe("ok");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://eb.example.com/api/subscribe");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer eb_yonisync_test");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      email: "maya@example.com",
      first_name: "Maya",
      source: "fertility-quiz",
      tags: ["seq:fertility-type-quiz", `quiz:${resultType}`],
      consent: true,
      ip: "203.0.113.7",
    });
    expect(body.custom_fields.fertility_type_id).toBe(resultType);
    expect(typeof body.custom_fields.fertility_type).toBe("string");
    expect(body.custom_fields.utm_source).toBe("ig");
    expect(emailBossPayload(row, null)).not.toHaveProperty("ip");
  });

  it("never throws: HTTP errors, network errors and timeouts become a status", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await syncEmailBoss(row, null, env, (async () => new Response("no", { status: 401 })) as unknown as typeof fetch)).toBe("error_401");
    expect(await syncEmailBoss(row, null, env, (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch)).toBe("error");
    const hang = ((_u: string, init: RequestInit) =>
      new Promise((_r, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))) as unknown as typeof fetch;
    expect(await syncEmailBoss(row, null, { ...env, EMAIL_BOSS_TIMEOUT_MS: "50" }, hang)).toBe("timeout");
    quiet.mockRestore();
  });
});
