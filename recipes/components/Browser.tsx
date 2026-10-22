"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? ""); setCourse(p.get("course") ?? ""); setPhase(p.get("phase") ?? ""); setFtype(p.get("type") ?? "");
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q); if (course) p.set("course", course); if (phase) p.set("phase", phase); if (ftype) p.set("type", ftype);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [q, course, phase, ftype]);

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.filter((r) => {
      if (course && r.course !== course) return false;
      if (phase === "__untagged" ? r.phases.length > 0 : phase && !r.phases.includes(phase)) return false;
      if (ftype === "__untagged" ? r.types.length > 0 : ftype && !r.types.includes(ftype)) return false;
      return words.every((w) => r.search.includes(w));
    });
  }, [items, q, course, phase, ftype]);

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
      <div className="count">
        <span>{shown.length} of {items.length} recipes</span>
        {(q || course || phase || ftype) && (
          <button className="reset" onClick={() => { setQ(""); setCourse(""); setPhase(""); setFtype(""); }}>Clear filters</button>
        )}
      </div>
      {COURSES.map(([c, label]) => {
        const list = shown.filter((r) => r.course === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h2 className="section-h">{label} · {list.length}</h2>
            <ul className="list">
              {list.map((r) => (
                <li key={r.id}>
                  <Link className="card" href={`/r/${r.id}`}>
                    <div className="es">{r.es}</div>
                    <div className="en">{r.en}</div>
                    <div className="meta">
                      {r.page}
                      {r.phases.length ? ` · ${r.phases.join(", ")}` : ""}
                      {r.types.length ? ` · ${r.types.map((t) => typeLabels[t] ?? t).join(", ")}` : ""}
                      {r.flags ? <span className="flag"> · check source</span> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!shown.length && <p className="lead">No recipes match. Try fewer words or clear the filters.</p>}
    </>
  );
}
