import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/session";
import { byId } from "@/lib/data";
import { CATEGORIES, TagError, createTag, deleteTag, loadState, setAssignment, updateTag, type TagCategory } from "@/lib/tags-db";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status, headers: noStore });

async function state() {
  const s = await loadState();
  return { ...s, assignments: s.assignments.filter((a) => byId.has(a.recipe_id)) };
}

export async function GET() {
  if (!(await isAuthed())) return bad("unauthorized", 401);
  try {
    return NextResponse.json({ ok: true, ...(await state()) }, { headers: noStore });
  } catch (e) {
    console.error("tags list failed", e);
    return bad("storage unavailable", 503);
  }
}

type Body = { action?: unknown; id?: unknown; name?: unknown; color?: unknown; category?: unknown; recipe_id?: unknown; tag_id?: unknown; on?: unknown };

export async function POST(req: Request) {
  if (!(await isAuthed())) return bad("unauthorized", 401);
  let b: Body;
  try { b = await req.json(); } catch { return bad("bad json"); }
  const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim() : "";
  const color = typeof b.color === "string" && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color.toLowerCase() : "#f6c6dc";
  const category = (CATEGORIES as string[]).includes(String(b.category)) ? (b.category as TagCategory) : "other";
  const id = String(b.id ?? "");
  let created: string | undefined;
  try {
    switch (b.action) {
      case "create":
        if (!name || name.length > 60) return bad("Tag name must be 1–60 characters");
        created = await createTag(name, color, category);
        break;
      case "update":
        if (!UUID.test(id)) return bad("bad tag id");
        if (!name || name.length > 60) return bad("Tag name must be 1–60 characters");
        await updateTag(id, name, color, category);
        break;
      case "delete":
        if (!UUID.test(id)) return bad("bad tag id");
        await deleteTag(id);
        break;
      case "assign": {
        const rid = String(b.recipe_id ?? ""), tid = String(b.tag_id ?? "");
        if (!byId.has(rid)) return bad("unknown recipe");
        if (!UUID.test(tid)) return bad("bad tag id");
        await setAssignment(rid, tid, b.on === true);
        break;
      }
      default:
        return bad("unknown action");
    }
    return NextResponse.json({ ok: true, created, ...(await state()) }, { headers: noStore });
  } catch (e) {
    if (e instanceof TagError) return bad(e.message, 409);
    console.error("tags write failed", e);
    return bad("storage unavailable", 503);
  }
}
