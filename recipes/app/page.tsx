import Header from "@/components/Header";
import Browser, { type Item } from "@/components/Browser";
import { recipes, TYPE_LABEL, pagesLabel } from "@/lib/data";

export default function Home() {
  const items: Item[] = recipes.map((r) => ({
    id: r.id, es: r.title_es, en: r.subtitle, course: r.course, section: r.section,
    phases: r.cycle_phases, types: r.fertility_types, tags: r.tags,
    flags: r.uncertain.length, page: pagesLabel(r.source.pages),
    search: [r.title_es, r.subtitle, r.tags.join(" "), ...r.ingredients.flatMap((g) => g.items),
      ...r.original_es.ingredients.flatMap((g) => g.items)].join(" ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
  }));
  return (
    <div className="wrap">
      <Header />
      <h1>Peruvian Recipes</h1>
      <p className="lead">
        {recipes.length} recipes transcribed and translated from a printed Nicolini cookbook (Peru). Private working collection:
        tag recipes by cycle phase, fertility type or anything else (the Yoni Sync app will use these tags to plan meals).
      </p>
      <Browser items={items} typeLabels={TYPE_LABEL} />
    </div>
  );
}
