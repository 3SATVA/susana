"use client";
import { useMemo, useState, useEffect } from "react";
import RecipeCard from "@/components/RecipeCard";
import StarIcon from "@/components/StarIcon";
import { useStars } from "@/lib/stars-client";
import TagChip from "@/components/TagChip";
import TagManager from "@/components/TagManager";
import RecipeTags from "@/components/RecipeTags";
import { CATEGORY_LABEL, CATEGORY_ORDER, useTags } from "@/lib/tags-client";

export type Item = {
  id: string; es: string; en: string; course: string; section: string;
  phases: string[]; types: string[]; tags: string[]; flags: number; page: string; search: string;
};

const COURSES: [string, string][] = [["starter", "Starters (Entradas)"], ["soup", "Soups (Sopas)"], ["main", "Mains (Segundos)"], ["dessert", "Desserts (Postres)"]];

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Browser({ items, typeLabels }: { items: Item[]; typeLabels: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [sel, setSel] = useState<string[]>([]); // tag slugs (AND); "__untagged" = recipes with no tags
  const [manage, setManage] = useState(false);
  const { tags, byRecipe, status: tagStatus } = useTags();
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [starredFirst, setStarredFirst] = useState(true);
  const { stars, order, status } = useStars();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? ""); setCourse(p.get("course") ?? ""); setSel((p.get("tags") ?? "").split(",").filter(Boolean));
    setOnlyStarred(p.get("starred") === "1");
    try { setStarredFirst(localStorage.getItem("yr_starred_first") !== "0"); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("yr_starred_first", starredFirst ? "1" : "0"); } catch {} }, [starredFirst]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q); if (course) p.set("course", course); if (sel.length) p.set("tags", sel.join(",")); if (onlyStarred) p.set("starred", "1");
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [q, course, sel, onlyStarred]);

  const slugToId = useMemo(() => new Map(tags.map((t) => [t.slug, t.id])), [tags]);
  // unknown slugs (e.g. a deleted tag still in the URL) are ignored once tags have loaded
  const selIds = useMemo(() => sel.filter((s) => s !== "__untagged").map((s) => slugToId.get(s) ?? (tagStatus === "loading" ? s : "")).filter(Boolean), [sel, slugToId, tagStatus]);
  const tagText = useMemo(() => {
    const names = new Map(tags.map((t) => [t.id, norm(t.name)]));
    return (id: string) => [...(byRecipe.get(id) ?? [])].map((t) => names.get(t) ?? "").join(" ");
  }, [tags, byRecipe]);
  const toggleTag = (slug: string) => setSel((cur) => {
    if (slug === "__untagged") return cur.includes(slug) ? [] : [slug];
    const c = cur.filter((x) => x !== "__untagged");
    return c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug];
  });
  const selSet = new Set(sel);

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((r) => {
      if (onlyStarred && !stars.has(r.id)) return false;
      if (course && r.course !== course) return false;
      if (sel.length) {
        const mine = byRecipe.get(r.id);
        if (sel.includes("__untagged")) { if (mine && mine.size) return false; }
        else if (!selIds.every((id) => mine?.has(id))) return false;
      }
      return words.every((w) => r.search.includes(w) || tagText(r.id).includes(w));
    });
  }, [items, q, course, sel, selIds, onlyStarred, stars, byRecipe, tagText]);

  const rank = new Map(order.map((id, i) => [id, i]));
  const topStarred = starredFirst && !onlyStarred
    ? shown.filter((r) => stars.has(r.id)).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
    : [];
  const rest = topStarred.length ? shown.filter((r) => !stars.has(r.id)) : shown;
  const card = (r: Item) => (
    <li key={r.id}>
      <RecipeCard
        id={r.id} es={r.es} en={r.en} starred={stars.has(r.id)} flagged={r.flags > 0}
        meta={r.page + (r.phases.length ? ` · ${r.phases.join(", ")}` : "") + (r.types.length ? ` · ${r.types.map((t) => typeLabels[t] ?? t).join(", ")}` : "")}
        footer={<RecipeTags recipeId={r.id} small onTagClick={toggleTag} activeTags={selSet} />}
      />
    </li>
  );

  const untagged = items.filter((r) => !byRecipe.get(r.id)?.size).length;

  return (
    <>
      <div className="filters" role="search">
        <label>Search
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ingredient, Spanish or English…" />
        </label>
        <label>Course
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="">All courses</option>
            {COURSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="tagbar" aria-label="Filter by tag">
        <div className="tagbar-head">
          <span className="tagbar-title">Filter by tag</span>
          <span className="hint">{sel.length > 1 && !sel.includes("__untagged") ? "Showing recipes with all selected tags." : "Tap tags to filter; tap a recipe’s “+ Tag” to tag it."}{tagStatus === "offline" ? " Tags offline: showing the last saved copy." : ""}</span>
          <button type="button" className={`toggle${manage ? " on" : ""}`} aria-expanded={manage} onClick={() => setManage((v) => !v)}>Manage tags</button>
        </div>
        <div className="tagbar-chips">
          {CATEGORY_ORDER.map((c) => {
            const list = tags.filter((t) => t.category === c);
            if (!list.length) return null;
            return (
              <span className="tagbar-group" key={c}>
                <span className="tagbar-cat">{CATEGORY_LABEL[c]}</span>
                {list.map((t) => <TagChip key={t.id} tag={t} small active={selSet.has(t.slug)} onClick={() => toggleTag(t.slug)} />)}
              </span>
            );
          })}
          <span className="tagbar-group">
            <button type="button" className={`tchip sm ghostchip clickable${selSet.has("__untagged") ? " active" : ""}`} aria-pressed={selSet.has("__untagged")} onClick={() => toggleTag("__untagged")}>
              Untagged ({untagged})
            </button>
          </span>
        </div>
      </div>
      {manage && <TagManager onClose={() => setManage(false)} />}
      <div className="starbar">
        <button type="button" className={`toggle${onlyStarred ? " on" : ""}`} aria-pressed={onlyStarred} onClick={() => setOnlyStarred((v) => !v)}>
          <StarIcon filled={onlyStarred} size={16} /> Starred only <span className="badge">{stars.size}</span>
        </button>
        <label className="chk"><input type="checkbox" checked={starredFirst} onChange={(e) => setStarredFirst(e.target.checked)} /> Starred first</label>
        <span className="hint">Double-click (desktop) or press &amp; hold (phone) a recipe to star it.{status === "offline" ? " Offline: stars saved on this device and will sync." : ""}</span>
      </div>
      <div className="count">
        <span>{shown.length} of {items.length} recipes</span>
        {(q || course || sel.length > 0 || onlyStarred) && (
          <button className="reset" onClick={() => { setQ(""); setCourse(""); setSel([]); setOnlyStarred(false); }}>Clear filters</button>
        )}
      </div>
      {topStarred.length > 0 && (
        <section>
          <h2 className="section-h starred-h"><StarIcon filled size={14} /> Starred · {topStarred.length}</h2>
          <ul className="list">{topStarred.map(card)}</ul>
        </section>
      )}
      {COURSES.map(([c, label]) => {
        const list = rest.filter((r) => r.course === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h2 className="section-h">{label} · {list.length}</h2>
            <ul className="list">{list.map(card)}</ul>
          </section>
        );
      })}
      {!shown.length && <p className="lead">{onlyStarred && !stars.size ? "No starred recipes yet. Double-click or press and hold a recipe to star it." : "No recipes match. Try fewer words or clear the filters."}</p>}
    </>
  );
}
