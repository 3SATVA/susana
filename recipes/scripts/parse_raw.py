#!/usr/bin/env python3
"""Parse the page-by-page transcription (raw/*.txt, gitignored) into recipes_es.json."""
import json, re, sys, unicodedata, glob, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK = "Nicolini promotional cookbook (title page not photographed)"
SECTIONS = {"ENTRADAS": "Entradas", "SOPAS": "Sopas", "SEGUNDOS": "Segundos", "POSTRES": "Postres"}
COURSE = {"ENTRADAS": "starter", "SOPAS": "soup", "SEGUNDOS": "main", "POSTRES": "dessert"}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def parse(lines):
    recipes, skipped = [], []
    page = photo = section = None
    cur = None
    group = None
    def ensure():
        if cur is None:
            raise SystemExit(f"content before first recipe on {photo}")
    for raw in lines:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        if line.startswith("@skip "):
            _, ph, pg, *reason = line.split(" ")
            skipped.append({"photo": ph + ".jpg", "page": int(pg[1:]), "reason": " ".join(reason)})
            continue
        if line.startswith("@page "):
            _, ph, pg, sec = line.split(" ", 3)
            photo, page, section = ph + ".jpg", int(pg[1:]), sec.strip()
            if cur is not None and page not in cur["source"]["pages"]:
                cur["source"]["pages"].append(page)
                cur["source"]["photos"].append(photo)
            continue
        if line.startswith("# "):
            title = line[2:].strip()
            cur = {"title_es": title, "section": section, "source": {"pages": [page], "photos": [photo]},
                   "ingredients": [], "steps": [], "notes": [], "uncertain": []}
            recipes.append(cur); group = None
            continue
        ensure()
        if line.startswith("## "):
            group = line[3:].strip().rstrip(":").strip()
            cur["ingredients"].append({"group": group, "items": []})
        elif line.startswith("- "):
            if not cur["ingredients"] or (group is None and cur["ingredients"][-1]["group"] is not None and False):
                pass
            if not cur["ingredients"]:
                cur["ingredients"].append({"group": None, "items": []})
            cur["ingredients"][-1]["items"].append(line[2:].strip())
        elif line.startswith("> "):
            t = line[2:].strip()
            if t.startswith("(cont.)"):
                t = t[len("(cont.)"):].strip()
                if cur["steps"]:
                    cur["steps"][-1] = (cur["steps"][-1].rstrip() + " " + t).strip()
                else:
                    cur["steps"].append(t)
            else:
                cur["steps"].append(t)
        elif line.startswith("!uncertain:"):
            cur["uncertain"].append(line.split(":", 1)[1].strip())
        elif line.startswith("!note:"):
            cur["notes"].append(line.split(":", 1)[1].strip())
        else:
            raise SystemExit(f"unparsed line: {line!r}")
    # merge steps that ended mid-sentence on a page break (step text ends with ',' or no punctuation and next has no VERB:)
    seen = {}
    for r in recipes:
        base = slug(r["title_es"]); n = seen.get(base, 0) + 1; seen[base] = n
        r["id"] = base if n == 1 else f"{base}-{n}"
        r["course"] = COURSE[r["section"]]
        r["section"] = SECTIONS[r["section"]]
        r["ingredients"] = [g for g in r["ingredients"] if g["items"] or g["group"]]
    return recipes, skipped

if __name__ == "__main__":
    lines = []
    for f in sorted(glob.glob(os.path.join(HERE, "raw", "*.txt"))):
        lines += open(f, encoding="utf-8").readlines()
    recipes, skipped = parse(lines)
    out = {"book": {"title": None, "publisher_brand": "Nicolini (Peru)", "note": "Cover/title pages were not among the photos; brand inferred from ingredients (FIDEOS/HARINA/SÉMOLA/DOBLE CALDO NICOLINI)."},
           "photos_total": 151, "skipped_pages": skipped, "recipes": recipes}
    json.dump(out, open(os.path.join(HERE, "recipes_es.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print(len(recipes), Counter(r["section"] for r in recipes))
    for r in recipes:
        if not r["steps"] or not r["ingredients"]:
            print("WARN empty", r["id"], len(r["ingredients"]), len(r["steps"]))
