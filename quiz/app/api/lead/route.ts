import { NextResponse } from "next/server";
import { computeResult } from "@/lib/scoring";
import { parseLeadInput } from "@/lib/validation";
import { buildLeadRow } from "@/lib/lead";
import { saveLead, storageMode, syncMailerLite } from "@/lib/storage";
import { syncEmailBoss } from "@/lib/email-boss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = parseLeadInput(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  // Score on the server so the stored result never depends on client code.
  const { scores, resultType } = computeResult(parsed.value.answers);
  const row = buildLeadRow(parsed.value, scores, resultType, req.headers.get("user-agent"));

  let stored = false;
  try {
    stored = await saveLead(row);
  } catch (e) {
    console.error("Lead save failed", e);
    return NextResponse.json(
      { ok: false, error: "We couldn't save your answers. Please try again." },
      { status: 502 },
    );
  }

  // Optional integrations run only after the lead is safely stored, and never fail the request.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const [mailerlite, emailBoss] = await Promise.all([syncMailerLite(row), syncEmailBoss(row, ip)]);

  return NextResponse.json({ ok: true, resultType, scores, stored, storage: storageMode(), mailerlite, emailBoss });
}
