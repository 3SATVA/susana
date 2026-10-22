"use client";
import { useMemo, useState, useEffect } from "react";
import RecipeCard from "@/components/RecipeCard";
import StarIcon from "@/components/StarIcon";
import { useStars } from "@/lib/stars-client";

export type Item = {
  id: string; es: string; en: string; course: string; section: string;
  phases: string[]; types: string[]; tags: string[]; flags: number; page: string; search: string;
};

const COURSES: [string, string][] = [["starter", "Starters (Entradas)"], ["soup", "Soups (Sopas)"], ["main", "Mains (Segundos)"], ["dessert", "Desserts (Postres)"]];

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Browser({ items, phases, types, typeLabels }: {
  items: Item[]; phases: string[]; types: string[]; typeLabels: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [phase, setPhase] = useState("");
  const [ftype, setFtype] = useState("");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [starredFirst, setStarredFirst] = useState(true);
  const { stars, order, status } = useStars();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? ""); setCourse(p.get("course") ?? ""); setPhase(p.get("phase") ?? ""); setFtype(p.get("type") ?? "");
    setOnlyStarred(p.get("starred") === "1");
    try { setStarredFirst(localStorage.getItem("yr_starred_first") !== "0"); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("yr_starred_first", starredFirst ? "1" : "0"); } catch {} }, [starredFirst]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q); if (course) p.set("course", course); if (phase) p.set("phase", phase); if (ftype) p.set("type", ftype); if (onlyStarred) p.set("starred", "1");
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [q, course, phase, ftype, onlyStarred]);

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((r) => {
      if (onlyStarred && !stars.has(r.id)) return false;
      if (course && r.course !== course) return false;
      if (phase === "__untagged" ? r.phases.length > 0 : phase && !r.phases.includes(phase)) return false;
      if (ftype === "__untagged" ? r.types.length > 0 : ftype && !r.types.includes(ftype)) return false;
      return words.every((w) => r.search.includes(w));
    });
  }, [items, q, course, phase, ftype, onlyStarred, stars]);

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
      />
    </li>
  );

  const untaggedPhase = items.filter((r) => !r.phases.length).length;
  const untaggedType = items.filter((r) => !r.types.length).length;

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
        <label>Cycle phase
          <select value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">Any phase</option>
            <option value="__untagged">Untagged ({untaggedPhase})</option>
            {phases.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Fertility type
          <select value={ftype} onChange={(e) => setFtype(e.target.value)}>
            <option value="">Any type</option>
            <option value="__untagged">Untagged ({untaggedType})</option>
            {types.map((t) => <option key={t} value={t}>{typeLabels[t] ?? t}</option>)}
          </select>
        </label>
      </div>
      <div className="starbar">
        <button type="button" className={`toggle${onlyStarred ? " on" : ""}`} aria-pressed={onlyStarred} onClick={() => setOnlyStarred((v) => !v)}>
          <StarIcon filled={onlyStarred} size={16} /> Starred only <span className="badge">{stars.size}</span>
        </button>
        <label className="chk"><input type="checkbox" checked={starredFirst} onChange={(e) => setStarredFirst(e.target.checked)} /> Starred first</label>
        <span className="hint">Double-click (desktop) or press &amp; hold (phone) a recipe to star it.{status === "offline" ? " Offline: stars saved on this device and will sync." : ""}</span>
      </div>
      <div className="count">
        <span>{shown.length} of {items.length} recipes</span>
        {(q || course || phase || ftype || onlyStarred) && (
          <button className="reset" onClick={() => { setQ(""); setCourse(""); setPhase(""); setFtype(""); setOnlyStarred(false); }}>Clear filters</button>
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
