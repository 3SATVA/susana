import { describe, expect, it } from "vitest";
import { isValidEmail, parseLeadInput } from "@/lib/validation";
import { buildLeadRow } from "@/lib/lead";
import { computeResult, parsePattern } from "@/lib/scoring";

const answers = parsePattern("CACBCBACCCBB");

describe("lead validation", () => {
  it("accepts good emails and rejects bad ones", () => {
    expect(isValidEmail("test+quiz@yonisync.com")).toBe(true);
    for (const bad of ["", "jane", "jane@", "jane@x", "a b@c.com", "@c.com"]) expect(isValidEmail(bad)).toBe(false);
  });

  it("requires email, first name optional", () => {
    expect(parseLeadInput({ answers }).ok).toBe(false);
    const r = parseLeadInput({ email: " Test+Quiz@YoniSync.com ", answers });
    expect(r.ok && r.value.email).toBe("test+quiz@yonisync.com");
    expect(r.ok && r.value.firstName).toBe(null);
  });

  it("requires 12 valid answers", () => {
    expect(parseLeadInput({ email: "a@b.co", answers: answers.slice(0, 11) }).ok).toBe(false);
  });

  it("keeps only utm_* params and builds the row", () => {
    const r = parseLeadInput({
      email: "a@b.co",
      firstName: "Jane",
      answers,
      utm: { utm_source: "ig", utm_campaign: "fall", evil: "x" },
      clientTimestamp: "2026-10-21T17:00:00.000Z",
    });
    if (!r.ok) throw new Error("expected ok");
    expect(r.value.utm).toEqual({ utm_source: "ig", utm_campaign: "fall" });
    const { scores, resultType } = computeResult(r.value.answers);
    const row = buildLeadRow(r.value, scores, resultType, "UA");
    expect(row.result_type).toBe("kidney_yang");
    expect(row.score_kidney_yang).toBe(10);
    expect(row.answers[0]).toEqual({ q: 1, answer: "ALWAYS" });
    expect(row.utm_source).toBe("ig");
    expect(row.first_name).toBe("Jane");
  });

  it("rejects honeypot submissions", () => {
    expect(parseLeadInput({ email: "a@b.co", answers, website: "spam" }).ok).toBe(false);
  });
});
