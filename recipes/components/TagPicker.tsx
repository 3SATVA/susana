"use client";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABEL, CATEGORY_ORDER, SWATCHES, createAndAssign, inkFor, setRecipeTag, useTags } from "@/lib/tags-client";

export default function TagPicker({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const { tags, byRecipe, error } = useTags();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const mine = byRecipe.get(recipeId) ?? new Set<string>();

  useEffect(() => {
    input.current?.focus();
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down, true); document.removeEventListener("keydown", key); };
  }, [onClose]);

  const nq = q.trim().toLowerCase();
  const visible = tags.filter((t) => !nq || t.name.toLowerCase().includes(nq));
  const exact = tags.some((t) => t.name.toLowerCase() === nq);
  const create = async () => {
    if (!nq || exact || busy) return;
    setBusy(true);
    try { await createAndAssign(recipeId, q.trim(), SWATCHES[tags.length % SWATCHES.length], "other"); setQ(""); } catch {}
    setBusy(false);
  };

  return (
    <div className="tpicker" ref={ref} role="dialog" aria-label="Tags for this recipe"
      onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <input ref={input} className="tpicker-q" value={q} placeholder="Find or create a tag…" aria-label="Find or create a tag"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (visible.length === 1 && nq) void setRecipeTag(recipeId, visible[0].id, !mine.has(visible[0].id)).catch(() => {});
          else void create();
        }} />
      <div className="tpicker-list">
        {CATEGORY_ORDER.map((c) => {
          const list = visible.filter((t) => t.category === c);
          if (!list.length) return null;
          return (
            <div key={c}>
              <div className="tpicker-cat">{CATEGORY_LABEL[c]}</div>
              {list.map((t) => (
                <label key={t.id} className="tpicker-row">
                  <input type="checkbox" checked={mine.has(t.id)}
                    onChange={(e) => void setRecipeTag(recipeId, t.id, e.target.checked).catch(() => {})} />
                  <span className="tdot" style={{ background: t.color, color: inkFor(t.color) }} />
                  {t.name}
                </label>
              ))}
            </div>
          );
        })}
        {!visible.length && !nq && <p className="hint">No tags yet.</p>}
      </div>
      {nq && !exact && (
        <button type="button" className="tpicker-create" disabled={busy} onClick={() => void create()}>
          + Create “{q.trim()}” and add it
        </button>
      )}
      {error && <p className="err">{error}</p>}
      <button type="button" className="linkbtn tpicker-done" onClick={onClose}>Done</button>
    </div>
  );
}
