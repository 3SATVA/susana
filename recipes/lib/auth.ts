export const COOKIE = "yr_session";

/** Cookie value = SHA-256 of a fixed prefix + the shared password (never the password itself). */
export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`yonisync-recipes:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
