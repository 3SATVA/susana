import Header from "@/components/Header";
import Link from "next/link";
import { data, recipes } from "@/lib/data";

export const metadata = { title: "Source" };

export default function Source() {
  const counts = ["Entradas", "Sopas", "Segundos", "Postres"].map((s) => [s, recipes.filter((r) => r.section === s).length] as const);
  const flagged = recipes.filter((r) => r.uncertain.length);
  return (
    <div className="wrap">
      <Header />
      <h1>Source &amp; transcription notes</h1>
      <p>
        <b>Book:</b> {data.book.title_display}. Publisher/brand: {data.book.publisher_brand}. Author: not shown on the photographed pages.
        Transcribed from {data.photos_total} phone photos (2017). The photos themselves are not published here.
      </p>
      <p className="notes">{data.book.note}</p>
      <h2>Recipes per section</h2>
      <table className="t"><tbody>
        {counts.map(([s, n]) => <tr key={s}><td>{s}</td><td>{n}</td></tr>)}
        <tr><th>Total</th><th>{recipes.length}</th></tr>
      </tbody></table>
      <h2>Pages not transcribed</h2>
      <table className="t">
        <thead><tr><th>Page</th><th>Photo</th><th>Reason</th></tr></thead>
        <tbody>{data.skipped_pages.map((s) => <tr key={s.photo}><td>{s.page}</td><td>{s.photo}</td><td>{s.reason}</td></tr>)}</tbody>
      </table>
      <h2>Recipes to double-check against the book</h2>
      <ul>
        {flagged.map((r) => <li key={r.id}><Link href={`/r/${r.id}`}>{r.title_es}</Link>: {r.uncertain.join("; ")}</li>)}
      </ul>
    </div>
  );
}
