import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import PrintButton from "@/components/PrintButton";
import { byId, recipes, COURSE_LABEL, TYPE_LABEL, pagesLabel, type Group } from "@/lib/data";

export function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const r = byId.get((await params).id);
  return { title: r ? r.title_en : "Not found" };
}

function Step({ text }: { text: string }) {
  const m = text.match(/^([^:a-z]{2,40}?):\s*(.*)$/);
  if (!m) return <li>{text}</li>;
  const verb = m[1].charAt(0) + m[1].slice(1).toLowerCase();
  return <li><b>{verb}</b> {m[2]}</li>;
}

function Ingredients({ groups }: { groups: Group[] }) {
  return (
    <>
      {groups.map((g, i) => (
        <div key={i}>
          {g.group ? <h3>{g.group}</h3> : null}
          <ul>{g.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        </div>
      ))}
    </>
  );
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const r = byId.get((await params).id);
  if (!r) notFound();
  const idx = recipes.indexOf(r);
  const prev = recipes[idx - 1], next = recipes[idx + 1];
  return (
    <div className="wrap">
      <Header />
      <div className="tools noprint">
        <Link href="/">← All recipes</Link>
        <PrintButton />
      </div>
      <h1>{r.title_es}</h1>
      <p className="lead" style={{ fontSize: 18 }}>{r.subtitle}</p>
      <div className="tagrow">
        <span className="pill">{COURSE_LABEL[r.course]}</span>
        {r.cycle_phases.length ? r.cycle_phases.map((p) => <span className="pill" key={p}>{p}</span>) : <span className="pill ghost">Cycle phase: untagged</span>}
        {r.fertility_types.length ? r.fertility_types.map((t) => <span className="pill" key={t}>{TYPE_LABEL[t] ?? t}</span>) : <span className="pill ghost">Fertility type: untagged</span>}
        {r.tags.map((t) => <span className="pill" key={t}>#{t}</span>)}
      </div>
      {r.uncertain.map((u, i) => <div className="warn" key={i}><b>Check the original:</b> {u}</div>)}
      <div className="recipe">
        <aside className="box ing">
          <h2 style={{ marginTop: 0 }}>Ingredients</h2>
          <Ingredients groups={r.ingredients} />
        </aside>
        <section>
          <h2 style={{ marginTop: 0 }}>Method</h2>
          <ol className="steps">{r.steps.map((s, i) => <Step key={i} text={s} />)}</ol>
          {(r.notes.length > 0 || r.translator_notes.length > 0) && (
            <div className="notes">
              <h3>Notes</h3>
              <ul>
                {r.notes.map((n, i) => <li key={`n${i}`}>{n}</li>)}
                {r.translator_notes.map((n, i) => <li key={`t${i}`}><i>Translator:</i> {n}</li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
      <details className="es">
        <summary>Original Spanish</summary>
        <div className="recipe" style={{ marginTop: 12 }}>
          <aside className="box ing" lang="es"><Ingredients groups={r.original_es.ingredients} /></aside>
          <ol className="steps" lang="es">{r.original_es.steps.map((s, i) => <Step key={i} text={s} />)}</ol>
        </div>
      </details>
      <p className="source">
        Source: {r.source.book}, {pagesLabel(r.source.pages)} · photo {r.source.photos.join(", ")} · section “{r.section}” · id <code>{r.id}</code>
      </p>
      <p className="tools noprint" style={{ justifyContent: "space-between" }}>
        {prev ? <Link href={`/r/${prev.id}`}>← {prev.title_es}</Link> : <span />}
        {next ? <Link href={`/r/${next.id}`}>{next.title_es} →</Link> : <span />}
      </p>
    </div>
  );
}
