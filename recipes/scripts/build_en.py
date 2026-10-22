#!/usr/bin/env python3
"""Merge recipes_es.json + raw_en/*.txt (hand translation) into recipes_en.json (single source of truth).
Validates that ingredient groups/items, steps, notes and uncertain counts mirror the Spanish."""
import json, glob, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from glossary import GLOSSARY

BOOK_TITLE = "Untitled Nicolini cookbook (Peru); cover/title pages not photographed"
CYCLE_PHASES = ["Menstrual", "Follicular", "Ovulatory", "Luteal"]
FERTILITY_TYPES = ["blood_deficiency", "kidney_yin", "kidney_yang", "liver_qi_stagnation",
                   "dampness_accumulation", "blood_stasis"]

def parse_en():
    out, cur = {}, None
    for f in sorted(glob.glob(os.path.join(HERE, "raw_en", "*.txt"))):
        for n, raw in enumerate(open(f, encoding="utf-8"), 1):
            line = raw.rstrip("\n")
            if not line.strip():
                continue
            if line.startswith("="):
                rid, sub = line[1:].split("|", 1)
                rid = rid.strip()
                if rid in out:
                    raise SystemExit(f"duplicate EN id {rid} in {f}:{n}")
                cur = out[rid] = {"subtitle": sub.strip(), "ingredients": [], "steps": [], "notes": [],
                                  "uncertain": [], "translator_notes": [], "_file": os.path.basename(f)}
                continue
            tag, text = line[:2], line[2:].strip()
            if tag == "##":
                cur["ingredients"].append({"group": line[3:].strip(), "items": []})
            elif tag == "- ":
                if not cur["ingredients"]:
                    cur["ingredients"].append({"group": None, "items": []})
                cur["ingredients"][-1]["items"].append(text)
            elif tag == "> ":
                cur["steps"].append(text)
            elif tag == "! ":
                cur["notes"].append(text)
            elif tag == "? ":
                cur["uncertain"].append(text)
            elif tag == "* ":
                cur["translator_notes"].append(text)
            else:
                raise SystemExit(f"unparsed {f}:{n}: {line!r}")
    return out

def main():
    es = json.load(open(os.path.join(HERE, "recipes_es.json"), encoding="utf-8"))
    en = parse_en()
    errs, recipes = [], []
    for r in es["recipes"]:
        e = en.pop(r["id"], None)
        if e is None:
            errs.append(f"missing EN for {r['id']}"); continue
        gs, ge = r["ingredients"], e["ingredients"]
        if len(gs) != len(ge):
            errs.append(f"{r['id']}: groups {len(gs)} vs {len(ge)}")
        else:
            for a, b in zip(gs, ge):
                if len(a["items"]) != len(b["items"]) or (a["group"] is None) != (b["group"] is None):
                    errs.append(f"{r['id']}: group {a['group']!r} items {len(a['items'])} vs {b['group']!r} {len(b['items'])}")
        for k in ("steps", "notes", "uncertain"):
            if len(r[k]) != len(e[k]):
                errs.append(f"{r['id']}: {k} {len(r[k])} vs {len(e[k])}")
        recipes.append({
            "id": r["id"],
            "title_es": r["title_es"],
            "title_en": f"{r['title_es']}, {e['subtitle']}",
            "subtitle": e["subtitle"],
            "section": r["section"],
            "course": r["course"],
            "source": {"book": BOOK_TITLE, "publisher_brand": "Nicolini (Peru)",
                       "pages": r["source"]["pages"], "photos": r["source"]["photos"]},
            "ingredients": ge,
            "steps": e["steps"],
            "notes": e["notes"],
            "uncertain": e["uncertain"],
            "translator_notes": e["translator_notes"],
            "cycle_phases": [],
            "fertility_types": [],
            "tags": [],
            "original_es": {"ingredients": gs, "steps": r["steps"], "notes": r["notes"], "uncertain": r["uncertain"]},
        })
    if en:
        errs.append(f"EN entries without ES: {sorted(en)}")
    if errs:
        print("\n".join(errs)); raise SystemExit(f"{len(errs)} validation errors")
    data = {
        "schema_version": 1,
        "book": {"title": None, "title_display": BOOK_TITLE, "author": None, "publisher_brand": "Nicolini (Peru)",
                 "note": es["book"]["note"], "photographed_year": 2017},
        "photos_total": es["photos_total"],
        "skipped_pages": es["skipped_pages"],
        "vocab": {"courses": ["starter", "soup", "main", "dessert"], "cycle_phases": CYCLE_PHASES,
                  "fertility_types": FERTILITY_TYPES},
        "glossary": GLOSSARY,
        "recipes": recipes,
    }
    with open(os.path.join(HERE, "recipes_en.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    from collections import Counter
    print(len(recipes), dict(Counter(r["section"] for r in recipes)))

if __name__ == "__main__":
    main()
