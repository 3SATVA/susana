#!/usr/bin/env python3
"""One-off converter: systeme.io editor capture (source-systeme/) -> email-safe templates.

Reads  emails/source-systeme/<campaign>/<NN-slug>/{meta.json,body.html,images/}
Writes emails/yonisync/templates/<template-id>.html   (email_boss front-matter format)
       automations/public/email-assets/<template-id>/<image>   (served at ASSET_BASE)
       emails/templates.index.json  (template id -> source folder, subject, preview, delay)

Re-run after a fresh systeme capture:  python3 emails/scripts/convert_systeme.py
Hand edits to the generated templates are fine afterwards; just don't re-run over them.
"""
import json, os, re, shutil, sys
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "emails", "source-systeme")
OUT_T = os.path.join(ROOT, "emails", "yonisync", "templates")
OUT_A = os.path.join(ROOT, "automations", "public", "email-assets")
ASSET_BASE = os.environ.get("ASSET_BASE", "https://yonisync-automations.vercel.app/email-assets")
CONTENT_W = 860  # px: systeme editor canvas width the % image widths refer to
MAX_W = 560     # px: email content width (600 - 2*20 padding)

CAMPAIGN_PREFIX = {
    "checklist-campaign": "checklist",
    "fertility-type-quiz": "quiz",
    "fertility-webinar-signed-up": "webinar",
    "standalone": "yoniflow",
}

KEEP_STYLE = {"font-family", "font-size", "color", "font-weight", "font-style", "text-decoration",
              "text-decoration-line", "text-align", "background-color", "margin-left", "line-height"}


def rem(v):
    v = v.strip()
    m = re.fullmatch(r"([\d.]+)(rem|em)", v)
    if m:
        return f"{round(float(m.group(1)) * 16)}px"
    return v


def parse_style(s):
    out = {}
    for part in (s or "").split(";"):
        if ":" in part:
            k, v = part.split(":", 1)
            out[k.strip().lower()] = v.strip()
    return out


def fmt_style(d):
    return ";".join(f"{k}:{v}" for k, v in d.items())


def clean_style(tag, extra=None):
    st = parse_style(tag.get("style"))
    keep = {}
    for k, v in st.items():
        if k not in KEEP_STYLE:
            continue
        if k == "background-color" and v in ("transparent", "rgb(255, 255, 255)"):
            continue
        if k == "font-family" and v == "inherit":
            continue
        if k == "margin-left" and v in ("0px", "0"):
            continue
        keep[k] = rem(v)
    if extra:
        keep.update(extra)
    return keep


def convert(folder, tpl_id):
    html = open(os.path.join(folder, "body.html"), encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    problems = []
    img_dir = os.path.join(folder, "images")
    local_imgs = os.listdir(img_dir) if os.path.isdir(img_dir) else []
    os.makedirs(os.path.join(OUT_A, tpl_id), exist_ok=True)

    for s in soup.find_all("svg"):
        s.decompose()
    for d in soup.find_all("div", class_="absolute"):
        d.decompose()
    for d in soup.find_all("img", class_="ProseMirror-separator"):
        d.decompose()

    def asset_for(src):
        base = os.path.basename(src.split("?")[0])
        for f in local_imgs:
            if f.endswith(base) or f[3:] == base:
                clean = re.sub(r"[^A-Za-z0-9._-]", "_", base)
                shutil.copyfile(os.path.join(img_dir, f), os.path.join(OUT_A, tpl_id, clean))
                return f"{ASSET_BASE}/{tpl_id}/{clean}"
        problems.append(f"image not downloaded, kept original URL: {src}")
        return src

    def build_img(img, wrapper, block):
        pct = parse_style(wrapper.get("style")).get("width", "100%")
        try:
            w = round(float(pct.rstrip("%")) / 100 * CONTENT_W)
        except ValueError:
            w = CONTENT_W
        nat = int(img.get("width") or 0)
        if nat:
            w = min(w, nat)
        w = max(min(w, MAX_W), 60)
        new = soup.new_tag("img")
        new["src"] = asset_for(img["src"])
        new["width"] = str(w)
        new["alt"] = img.get("alt") or ""
        new["style"] = f"display:{'block' if block else 'inline-block'};width:{w}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" + ("margin:0 auto;" if block else "")
        a = img.find_parent("a")
        if a is not None and wrapper in a.parents or (a is not None and a in wrapper.descendants):
            link = soup.new_tag("a", href=a["href"], target="_blank")
            link["style"] = "text-decoration:none;"
            link.append(new)
            return link
        return new

    for blk in soup.select("div.node-block-image"):
        fig = blk.find("figure")
        img = blk.find("img")
        if not img:
            blk.decompose(); continue
        node = build_img(img, fig, True)
        t = BeautifulSoup('<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto;"><tr><td align="center"></td></tr></table>', "html.parser")
        t.find("td").append(node)
        blk.replace_with(t)

    for inl in soup.select("span.node-inline-image"):
        wrap = inl.find("span", attrs={"data-node-view-wrapper": True}) or inl
        img = inl.find("img")
        if not img:
            inl.decompose(); continue
        inl.replace_with(build_img(img, wrap, False))

    # unwrap editor scaffolding
    for _ in range(3):
        for t in soup.find_all(True):
            if t.name in ("div", "span") and (t.has_attr("data-node-view-content") or t.has_attr("data-node-view-content-react") or "react-renderer" in (t.get("class") or [])):
                t.unwrap()

    for t in soup.find_all(True):
        name = t.name
        if name == "p":
            st = parse_style(t.get("style"))
            mt, mb = rem(st.get("margin-top", "0")), rem(st.get("margin-bottom", "0"))
            extra = {"margin": f"{mt} 0 {mb} {rem(st.get('margin-left', '0px'))}"}
            keep = clean_style(t); keep.pop("margin-left", None); keep.update(extra)
            t.attrs = {"style": fmt_style(keep)}
        elif name in ("h1", "h2", "h3", "h4"):
            st = parse_style(t.get("style"))
            size = {"h1": "28px", "h2": "24px", "h3": "19px", "h4": "16px"}[name]
            keep = clean_style(t, {"margin": f"{rem(st.get('margin-top','1em'))} 0 {rem(st.get('margin-bottom','1em'))}", "font-size": size, "line-height": "1.3", "font-weight": "bold"})
            keep.pop("margin-left", None)
            t.attrs = {"style": fmt_style(keep)}
        elif name in ("ul", "ol"):
            t.attrs = {"style": f"margin:16px 0;padding-left:28px;list-style-type:{'disc' if name=='ul' else 'decimal'};"}
        elif name == "li":
            keep = clean_style(t, {"margin": "0 0 8px"})
            t.attrs = {"style": fmt_style(keep)}
        elif name == "a":
            href = t.get("href", "#")
            keep = clean_style(t)
            if not keep:
                keep = {"color": "rgb(17, 85, 204)", "text-decoration": "underline"}
            t.attrs = {"href": href, "target": "_blank", "style": fmt_style(keep)}
        elif name == "span":
            keep = clean_style(t)
            if keep:
                t.attrs = {"style": fmt_style(keep)}
            else:
                t.unwrap()
        elif name == "br":
            t.attrs = {}
        elif name in ("strong", "em", "b", "i", "u", "s"):
            t.attrs = {}
        elif name in ("img", "table", "tr", "td"):
            pass
        elif name == "div":
            t.name = "div"
            keep = clean_style(t)
            t.attrs = {"style": fmt_style(keep)} if keep else {}
        else:
            problems.append(f"unhandled tag <{name}> kept as is")

    body = str(soup)
    body = re.sub(r"\{\s*first_name\s*\}", "{{first_name|there}}", body)
    leftover = re.findall(r"(?<!\{)\{[a-z_]+\}(?!\})", body)
    if leftover:
        problems.append(f"unconverted merge tags: {leftover}")
    body = body.replace("\u00a0", "&nbsp;")
    return body, problems


def esc_fm(s):
    return s.replace("\n", " ").strip()


def main():
    index = []
    report = []
    os.makedirs(OUT_T, exist_ok=True)
    for camp in sorted(os.listdir(SRC)):
        cdir = os.path.join(SRC, camp)
        if not os.path.isdir(cdir):
            continue
        for em in sorted(os.listdir(cdir)):
            folder = os.path.join(cdir, em)
            meta = json.load(open(os.path.join(folder, "meta.json"), encoding="utf-8"))
            nn, slug = em.split("-", 1)
            slug = slug.strip("-")
            tpl_id = f"{CAMPAIGN_PREFIX[camp]}-{nn}-{slug}"[:80].rstrip("-")
            body, problems = convert(folder, tpl_id)
            subject = meta.get("subject", "").replace("{first_name}", "{{first_name|there}}")
            preview = (meta.get("preview_text") or "").replace("{first_name}", "{{first_name|there}}")
            fm = ["---", f"subject: {esc_fm(subject)}"]
            if preview:
                fm.append(f"preheader: {esc_fm(preview)}")
            fm += [f"# source: systeme.io {meta.get('campaign','standalone')} step {meta.get('step_id') or 'template ' + str(meta.get('template_id',''))}", "---"]
            out = "\n".join(fm) + "\n{{> header}}\n" + body + "\n{{> footer}}\n"
            open(os.path.join(OUT_T, tpl_id + ".html"), "w", encoding="utf-8").write(out)
            index.append({
                "template": tpl_id, "source": f"{camp}/{em}", "campaign": meta.get("campaign"),
                "position": meta.get("position"), "subject": meta.get("subject"),
                "preview_text": meta.get("preview_text") or "", "sender_name": meta.get("sender_name"),
                "sender_email": meta.get("sender_email"), "delay_value": meta.get("delay_value"),
                "delay_unit": meta.get("delay_unit"), "systeme_step_id": meta.get("step_id"), "systeme_template_id": meta.get("template_id"),
                "problems": problems,
            })
            report.append((tpl_id, problems))
    json.dump(index, open(os.path.join(ROOT, "emails", "templates.index.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    for t, p in report:
        print(t, "OK" if not p else p)


if __name__ == "__main__":
    main()
