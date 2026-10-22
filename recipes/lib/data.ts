import raw from "@/recipes_en.json";

export type Group = { group: string | null; items: string[] };
export type Recipe = {
  id: string;
  title_es: string;
  title_en: string;
  subtitle: string;
  section: string;
  course: "starter" | "soup" | "main" | "dessert";
  source: { book: string; publisher_brand: string; pages: number[]; photos: string[] };
  ingredients: Group[];
  steps: string[];
  notes: string[];
  uncertain: string[];
  translator_notes: string[];
  cycle_phases: string[];
  fertility_types: string[];
  tags: string[];
  original_es: { ingredients: Group[]; steps: string[]; notes: string[]; uncertain: string[] };
};
export type GlossaryEntry = { term: string; en: string; desc: string };
type Data = {
  book: { title: string | null; title_display: string; author: string | null; publisher_brand: string; note: string };
  photos_total: number;
  skipped_pages: { photo: string; page: number; reason: string }[];
  vocab: { courses: string[]; cycle_phases: string[]; fertility_types: string[] };
  glossary: GlossaryEntry[];
  recipes: Recipe[];
};

export const data = raw as unknown as Data;
export const recipes = data.recipes;
export const byId = new Map(recipes.map((r) => [r.id, r]));

export const COURSE_LABEL: Record<string, string> = {
  starter: "Starters (Entradas)",
  soup: "Soups (Sopas)",
  main: "Mains (Segundos)",
  dessert: "Desserts (Postres)",
};

export const TYPE_LABEL: Record<string, string> = {
  blood_deficiency: "Blood Deficiency",
  kidney_yin: "Kidney Yin",
  kidney_yang: "Kidney Yang",
  liver_qi_stagnation: "Liver Qi Stagnation",
  dampness_accumulation: "Dampness Accumulation",
  blood_stasis: "Blood Stasis",
};

export function pagesLabel(p: number[]) {
  return p.length > 1 ? `pp. ${p[0]}–${p[p.length - 1]}` : `p. ${p[0]}`;
}
