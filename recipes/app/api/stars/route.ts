import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/session";
import { listStars, setStar } from "@/lib/stars-db";
import { byId } from "@/lib/data";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const stars = (await listStars()).filter((s) => byId.has(s.id));
    return NextResponse.json({ ok: true, stars }, { headers: noStore });
  } catch (e) {
    console.error("stars list failed", e);
    return NextResponse.json({ ok: false, error: "storage unavailable" }, { status: 503, headers: noStore });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: noStore });
  let body: { id?: unknown; starred?: unknown; ops?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400, headers: noStore }); }
  const ops: { id: string; starred: boolean }[] = Array.isArray(body.ops)
    ? (body.ops as { id?: unknown; starred?: unknown }[]).map((o) => ({ id: String(o.id), starred: o.starred === true }))
    : [{ id: String(body.id), starred: body.starred === true }];
  if (!ops.length || ops.length > 300 || ops.some((o) => !byId.has(o.id))) {
    return NextResponse.json({ ok: false, error: "unknown recipe" }, { status: 400, headers: noStore });
  }
  try {
    for (const o of ops) await setStar(o.id, o.starred);
    const stars = (await listStars()).filter((s) => byId.has(s.id));
    return NextResponse.json({ ok: true, stars }, { headers: noStore });
  } catch (e) {
    console.error("stars write failed", e);
    return NextResponse.json({ ok: false, error: "storage unavailable" }, { status: 503, headers: noStore });
  }
}
