import { cookies } from "next/headers";
import { COOKIE, sessionToken, timingSafeEqual } from "@/lib/auth";

export async function isAuthed(): Promise<boolean> {
  const pw = process.env.RECIPES_PASSWORD;
  const c = (await cookies()).get(COOKIE)?.value;
  return Boolean(pw && c && timingSafeEqual(c, await sessionToken(pw)));
}
