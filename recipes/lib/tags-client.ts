"use client";
import { useSyncExternalStore } from "react";
import type { Tag, TagCategory, Assignment } from "@/lib/tags-db";

export type { Tag, TagCategory };
export const CATEGORY_LABEL: Record<TagCategory, string> = {
  phase: "Phase", fertility_type: "Fertility type", condition: "Condition", other: "Other",
};
export const CATEGORY_ORDER: TagCategory[] = ["phase", "fertility_type", "condition", "other"];
export const SWATCHES = ["#f6c6dc", "#f2c4c4", "#f7d6c4", "#f3d1a8", "#f4e6a6", "#d4ecc4", "#bfe3d0", "#c4e6ec", "#c9d8f2", "#e2d4f0", "#e7dccf", "#d9d4d6"];

type Status = "loading" | "synced" | "offline";
type Snap = { tags: Tag[]; byRecipe: Map<string, Set<string>>; counts: Map<string, number>; status: Status; error: string };
const LS = "yr_tags_v1";

let tags: Tag[] = [];
let assignments: Assignment[] = [];
let status: Status = "loading";
let error = "";
let started = false;
const listeners = new Set<() => void>();
let snapshot: Snap = build();

function build(): Snap {
  const byRecipe = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  const known = new Set(tags.map((t) => t.id));
  for (const a of assignments) {
    if (!known.has(a.tag_id)) continue;
    if (!byRecipe.has(a.recipe_id)) byRecipe.set(a.recipe_id, new Set());
    byRecipe.get(a.recipe_id)!.add(a.tag_id);
    counts.set(a.tag_id, (counts.get(a.tag_id) ?? 0) + 1);
  }
  return { tags, byRecipe, counts, status, error };
}
function emit() { snapshot = build(); listeners.forEach((l) => l()); }
function apply(j: { tags: Tag[]; assignments: Assignment[] }) {
  tags = j.tags; assignments = j.assignments; status = "synced";
  try { localStorage.setItem(LS, JSON.stringify({ tags, assignments })); } catch {}
}

async function call(body?: object) {
  const r = await fetch("/api/tags", body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }
    : { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j as { tags: Tag[]; assignments: Assignment[]; created?: string };
}

async function sync() {
  try { apply(await call()); } catch { status = "offline"; }
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try { const c = JSON.parse(localStorage.getItem(LS) || "null"); if (c) { tags = c.tags; assignments = c.assignments; } } catch {}
  emit();
  void sync();
  window.addEventListener("focus", () => void sync());
}

async function mutate(body: object, optimistic?: () => void): Promise<string | undefined> {
  const prev = { tags, assignments };
  if (optimistic) { optimistic(); emit(); }
  try {
    const j = await call(body);
    apply(j); error = ""; emit();
    return j.created;
  } catch (e) {
    tags = prev.tags; assignments = prev.assignments;
    error = e instanceof Error ? e.message : "Could not save";
    emit();
    throw e;
  }
}

export function clearTagError() { error = ""; emit(); }

export function createTag(name: string, color: string, category: TagCategory) {
  return mutate({ action: "create", name, color, category });
}
export function updateTag(id: string, name: string, color: string, category: TagCategory) {
  return mutate({ action: "update", id, name, color, category },
    () => { tags = tags.map((t) => (t.id === id ? { ...t, name, color, category } : t)); });
}
export function deleteTag(id: string) {
  return mutate({ action: "delete", id }, () => {
    tags = tags.filter((t) => t.id !== id); assignments = assignments.filter((a) => a.tag_id !== id);
  });
}
export function setRecipeTag(recipe_id: string, tag_id: string, on: boolean) {
  return mutate({ action: "assign", recipe_id, tag_id, on }, () => {
    assignments = assignments.filter((a) => !(a.recipe_id === recipe_id && a.tag_id === tag_id));
    if (on) assignments = [...assignments, { recipe_id, tag_id }];
  });
}
export async function createAndAssign(recipe_id: string, name: string, color: string, category: TagCategory) {
  const id = await createTag(name, color, category);
  if (id) await setRecipeTag(recipe_id, id, true);
}

/** Readable text colour on a pastel (or any) background. */
export function inkFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#521442" : "#ffffff";
}

const server: Snap = { tags: [], byRecipe: new Map(), counts: new Map(), status: "loading", error: "" };
export function useTags(): Snap {
  return useSyncExternalStore(
    (l) => { start(); listeners.add(l); return () => listeners.delete(l); },
    () => snapshot,
    () => server,
  );
}
