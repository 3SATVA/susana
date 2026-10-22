import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, sessionToken, timingSafeEqual } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const pw = process.env.RECIPES_PASSWORD;
  const cookie = req.cookies.get(COOKIE)?.value;
  if (pw && cookie && timingSafeEqual(cookie, await sessionToken(pw))) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = "/login";
  url.search = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/login|robots.txt|favicon.ico|_next/static|_next/image).*)"],
};
