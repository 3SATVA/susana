"""Screenshots of the automations site.
usage: python3 scripts/screens.py <base_url> <out_dir> [prefix=automations]
Desktop (1440x900) + mobile (390x844): full page, an email preview modal, and the original-screenshot toggle.
Exits non-zero if clicking an email does not show its rendered preview.
"""
import sys
from playwright.sync_api import sync_playwright

base, out = sys.argv[1].rstrip("/"), sys.argv[2]
prefix = sys.argv[3] if len(sys.argv) > 3 else "automations"

def run(p, name, viewport, mobile):
    b = p.chromium.launch()
    ctx = b.new_context(viewport=viewport, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(base + "/", wait_until="networkidle")
    page.screenshot(path=f"{out}/{prefix}_{name}_full.png", full_page=True)
    page.screenshot(path=f"{out}/{prefix}_{name}_top.png")
    btn = page.locator("button.email").nth(2)
    subj = btn.locator(".email-subj").inner_text()
    btn.click()
    page.wait_for_selector(".modal iframe")
    frame = page.frame_locator(".modal iframe")
    frame.locator("body").wait_for()
    page.wait_for_timeout(1200)
    body_text = frame.locator("body").inner_text()
    assert page.locator("#modal-subject").inner_text() == subj, "modal subject mismatch"
    assert "Unsubscribe" in body_text and len(body_text) > 300, "preview did not render"
    page.screenshot(path=f"{out}/{prefix}_{name}_email.png")
    page.get_by_role("tab", name="Original (systeme)").click()
    page.wait_for_selector(".orig img")
    page.wait_for_function("document.querySelector('.orig img').complete && document.querySelector('.orig img').naturalWidth > 0")
    page.screenshot(path=f"{out}/{prefix}_{name}_original.png")
    print(name, "ok:", subj, "| preview chars:", len(body_text), "| page errors:", errors)
    b.close()

with sync_playwright() as p:
    run(p, "desktop", {"width": 1440, "height": 900}, False)
    run(p, "mobile", {"width": 390, "height": 844}, True)
