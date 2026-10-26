"use client";
import { useState } from "react";
import { CATEGORY_LABEL, CATEGORY_ORDER, SWATCHES, createTag, deleteTag, inkFor, updateTag, useTags, type Tag, type TagCategory } from "@/lib/tags-client";

function ColorField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <span className="swatches" role="group" aria-label={label}>
      {SWATCHES.map((s) => (
        <button key={s} type="button" className={`sw${s === value ? " on" : ""}`} style={{ background: s }}
          aria-label={`Color ${s}`} aria-pressed={s === value} onClick={() => onChange(s)} />
      ))}
      <input type="color" value={value} aria-label="Custom color" onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

function Row({ tag, count }: { tag: Tag; count: number }) {
  const [name, setName] = useState(tag.name);
  const [editing, setEditing] = useState(false);
  const [color, setColor] = useState(tag.color);
  const [category, setCategory] = useState<TagCategory>(tag.category);
  const save = (n = name, c = color, k = category) => {
    const nn = n.replace(/\s+/g, " ").trim();
    if (!nn) { setName(tag.name); return; }
    if (nn === tag.name && c === tag.color && k === tag.category) return;
    void updateTag(tag.id, nn, c, k).catch(() => { setName(tag.name); setColor(tag.color); setCategory(tag.category); });
  };
  return (
    <li className="tm-row" data-tag={tag.slug}>
      <span className="tchip" style={{ background: color, color: inkFor(color) }}><span className="tchip-main">{name || "…"}</span></span>
      {editing ? (
        <div className="tm-edit">
          <input value={name} aria-label="Tag name" maxLength={60} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { save(); setEditing(false); } }} />
          <select value={category} aria-label="Category" onChange={(e) => setCategory(e.target.value as TagCategory)}>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
          <ColorField value={color} onChange={setColor} label="Tag color" />
          <span className="tm-actions">
            <button type="button" className="btn" onClick={() => { save(); setEditing(false); }}>Save</button>
            <button type="button" className="linkbtn" onClick={() => { setName(tag.name); setColor(tag.color); setCategory(tag.category); setEditing(false); }}>Cancel</button>
          </span>
        </div>
      ) : (
        <span className="tm-meta">{CATEGORY_LABEL[tag.category]} · {count} recipe{count === 1 ? "" : "s"}</span>
      )}
      {!editing && (
        <span className="tm-actions">
          <button type="button" className="linkbtn" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" className="linkbtn danger" onClick={() => {
            if (confirm(`Delete the tag “${tag.name}”?${count ? ` It will be removed from ${count} recipe${count === 1 ? "" : "s"}.` : ""}`)) void deleteTag(tag.id).catch(() => {});
          }}>Delete</button>
        </span>
      )}
    </li>
  );
}

export default function TagManager({ onClose }: { onClose: () => void }) {
  const { tags, counts, error } = useTags();
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [category, setCategory] = useState<TagCategory>("other");
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try { await createTag(name.trim(), color, category); setName(""); } catch {}
    setBusy(false);
  };
  return (
    <section className="tm box" aria-label="Manage tags">
      <div className="tm-head">
        <h2>Manage tags</h2>
        <button type="button" className="linkbtn" onClick={onClose}>Close</button>
      </div>
      <form className="tm-new" onSubmit={add}>
        <label>New tag
          <input value={name} maxLength={60} placeholder="e.g. Endometriosis, Warming, Quick" onChange={(e) => setName(e.target.value)} />
        </label>
        <label>Category
          <select value={category} onChange={(e) => setCategory(e.target.value as TagCategory)}>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        <div className="tm-color"><span>Color</span><ColorField value={color} onChange={setColor} label="New tag color" /></div>
        <button type="submit" className="btn" disabled={busy || !name.trim()}>Add tag</button>
      </form>
      {error && <p className="err">{error}</p>}
      {CATEGORY_ORDER.map((c) => {
        const list = tags.filter((t) => t.category === c);
        if (!list.length) return null;
        return (
          <div key={c}>
            <h3>{CATEGORY_LABEL[c]}</h3>
            <ul className="tm-list">{list.map((t) => <Row key={`${t.id}:${t.name}:${t.color}:${t.category}`} tag={t} count={counts.get(t.id) ?? 0} />)}</ul>
          </div>
        );
      })}
    </section>
  );
}
