"use client";
import { useSyncExternalStore } from "react";

// Shared stars store: server (Supabase via /api/stars) is the source of truth;
// localStorage caches the last known set and queues changes if the API is unreachable.
type Op = { id: string; starred: boolean };
type Status = "loading" | "synced" | "offline";
type Snap = { stars: Set<string>; order: string[]; status: Status };
const LS_SET = "yr_stars_v1";
const LS_PENDING = "yr_stars_pending_v1";

let stars = new Set<string>();
let order: string[] = []; // most recent first
let status: Status = "loading";
let started = false;
const listeners = new Set<() => void>();
let snapshot: Snap = { stars, order, status };

function emit() {
  snapshot = { stars, order, status };
  listeners.forEach((l) => l());
}
function readLS<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
}
function writeLS(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function applyServer(list: { id: string }[]) {
  order = list.map((s) => s.id);
  stars = new Set(order);
  writeLS(LS_SET, order);
}
function pending(): Op[] { return readLS<Op[]>(LS_PENDING, []); }
function setPending(p: Op[]) { if (p.length) writeLS(LS_PENDING, p); else { try { localStorage.removeItem(LS_PENDING); } catch {} } }

async function send(ops: Op[]) {
  const r = await fetch("/api/stars", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }), cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j.stars as { id: string }[];
}

async function sync() {
  try {
    const p = pending();
    let list: { id: string }[];
    if (p.length) { list = await send(p); setPending([]); }
    else {
      const r = await fetch("/api/stars", { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      list = j.stars;
    }
    applyServer(list); status = "synced";
  } catch { status = "offline"; }
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  order = readLS<string[]>(LS_SET, []);
  for (const o of pending()) { order = order.filter((x) => x !== o.id); if (o.starred) order.unshift(o.id); }
  stars = new Set(order);
  emit();
  void sync();
  window.addEventListener("focus", () => void sync());
  window.addEventListener("online", () => void sync());
}

export async function toggleStar(id: string) {
  const starred = !stars.has(id);
  // optimistic
  order = order.filter((x) => x !== id);
  if (starred) order.unshift(id);
  stars = new Set(order);
  writeLS(LS_SET, order);
  emit();
  const queued = [...pending().filter((o) => o.id !== id), { id, starred }];
  try {
    const list = await send(queued);
    setPending([]);
    applyServer(list); status = "synced";
  } catch {
    setPending(queued); status = "offline";
  }
  emit();
  return starred;
}

export function haptic(ms = 15) {
  try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch {}
}

const server: Snap = { stars: new Set<string>(), order: [], status: "loading" };
export function useStars(): Snap {
  return useSyncExternalStore(
    (l) => { start(); listeners.add(l); return () => listeners.delete(l); },
    () => snapshot,
    () => server,
  );
}
