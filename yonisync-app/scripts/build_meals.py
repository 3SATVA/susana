"""Builds lib/meals.json: a small curated set of recipe names (title + ingredient list only) for the demo meal plan.
Reads ../recipes/recipes_en.json. No steps, notes, source pages or photos leave the private collection.
Phase and fertility-type tags here are DEMO placeholders until Susana tags the real recipes."""
import json, pathlib, re

def clean(t):
    t = re.sub(r'Nicolini\s*"[^"]*"\s*\(([^)]*)\)', r"\1", t)
    return re.sub(r"\s{2,}", " ", re.sub(r"\bNicolini\b\s*", "", t)).strip()

here = pathlib.Path(__file__).resolve().parent.parent
src = json.load(open(here.parent / "recipes" / "recipes_en.json"))
by_id = {r["id"]: r for r in src["recipes"]}
PLAN = {
  "menstrual": {
    "breakfast": ["mazamorra-de-chancaca", "arroz-zambito", "humitas-dulces"],
    "lunch": ["crema-de-lentejas", "sopa-de-frijoles", "aguadito-de-pollo", "cazuela-de-pollo"],
    "dinner": ["lentejas", "estofado-de-pollo", "garbanzos-con-acelgas", "locro-de-zapallo"],
  },
  "follicular": {
    "breakfast": ["tortilla-de-pescado", "flan-de-verduras", "pancitos-de-manzana"],
    "lunch": ["cebiche-de-atun", "crema-de-espinacas", "timbal-de-espinacas", "menestron"],
    "dinner": ["pescado-a-la-chorrillana", "tallarines-con-esparragos", "fideos-con-salsa-de-albahaca", "arroz-con-pescado"],
  },
  "ovulation": {
    "breakfast": ["flan-de-alcachofas", "pudin-de-semola", "zanahorias-rellenas"],
    "lunch": ["anticuchos-de-pescado", "crema-de-tomate", "pastel-de-acelgas", "zapallitos-rellenos"],
    "dinner": ["fideos-con-camarones", "arroz-con-choros-atamalado", "coliflor-saltada", "adobo-de-pescado"],
  },
  "luteal": {
    "breakfast": ["quinua-atamalada", "pastelitos-de-semola", "sopa-de-semola"],
    "lunch": ["crema-de-zapallo", "sopa-de-ollucos", "papas-con-mani", "chupe-de-pescado"],
    "dinner": ["cau-cau-de-pollo", "pepian-de-choclo", "ajiaco-de-caiguas", "salsa-de-hongos"],
  },
}
out = []
for phase, slots in PLAN.items():
    for slot, ids in slots.items():
        for i in ids:
            r = by_id[i]
            es, _, en = r["title_en"].partition(", ")
            items = [clean(it) for g in r["ingredients"] for it in g["items"]][:9]
            out.append({"id": i, "name": en or es, "local": es, "phase": phase, "slot": slot, "course": r["course"], "ingredients": items})
(here / "lib" / "meals.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(len(out), "meals")
