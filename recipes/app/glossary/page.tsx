import Header from "@/components/Header";
import { data } from "@/lib/data";

export const metadata = { title: "Glossary" };

export default function Glossary() {
  return (
    <div className="wrap">
      <Header />
      <h1>Glossary of Peruvian ingredients</h1>
      <p className="lead">Spanish terms kept in the translations, with US equivalents and substitutes.</p>
      <dl className="gloss">
        {data.glossary.map((g) => (
          <div className="box" key={g.term}>
            <dt>{g.term} <span>· {g.en}</span></dt>
            <dd>{g.desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
