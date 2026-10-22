import { NextResponse } from "next/server";
import { COOKIE, sessionToken, timingSafeEqual } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const given = String(form.get("password") ?? "");
  let next = String(form.get("next") ?? "/");
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";
  const pw = process.env.RECIPES_PASSWORD;
  const base = new URL(req.url);
  if (!pw || !timingSafeEqual(await sessionToken(given), await sessionToken(pw))) {
    const u = new URL("/login", base);
    u.searchParams.set("error", "1");
    if (next !== "/") u.searchParams.set("next", next);
    return NextResponse.redirect(u, 303);
  }
  const res = NextResponse.redirect(new URL(next, base), 303);
  res.cookies.set(COOKIE, await sessionToken(pw), {
    httpOnly: true,
    secure: base.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
