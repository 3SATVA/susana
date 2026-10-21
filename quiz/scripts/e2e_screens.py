"""Headless walkthrough + screenshots.
usage: python3 scripts/e2e_screens.py <base_url> <out_dir> <email> [pattern=CACBCBACCCBB]
Completes the quiz on desktop (1440x900) and mobile (iPhone 13, 390x664 CSS px, like the Typeform capture).
Only the desktop run submits the lead; the mobile run intercepts /api/lead locally so a single test row is created.
"""
import json, sys, time
from playwright.sync_api import sync_playwright

base, out, email = sys.argv[1], sys.argv[2], sys.argv[3]
pattern = sys.argv[4] if len(sys.argv) > 4 else "CACBCBACCCBB"
results = {}

def run(p, name, viewport, mobile, submit_for_real):
    b = p.chromium.launch()
    ctx = b.new_context(viewport=viewport, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile,
                        user_agent=None if not mobile else "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 yonisync-e2e")
    page = ctx.new_page()
    posted = []
    if not submit_for_real:
        def fake(route):
            body = json.loads(route.request.post_data or "{}")
            posted.append(body)
            # compute nothing here: ask the real scorer by calling the API would create a row, so mirror server shape
            route.continue_() if False else route.fulfill(status=200, content_type="application/json",
                body=json.dumps({"ok": True, "resultType": "kidney_yang", "stored": False, "storage": "mocked-in-e2e"}))
        page.route("**/api/lead", fake)
    else:
        page.on("request", lambda r: posted.append(json.loads(r.post_data)) if r.url.endswith("/api/lead") else None)
    resp_holder = {}
    page.on("response", lambda r: resp_holder.setdefault("lead", (r.status, r.text())) if r.url.endswith("/api/lead") else None)
    page.goto(f"{base}/?utm_source=e2e_test&utm_medium=headless&utm_campaign=rebuild_check", wait_until="networkidle")
    time.sleep(0.8)
    page.screenshot(path=f"{out}/{name}_01_welcome.png")
    btn = page.locator(".layer:not([aria-hidden]) .mobile-bar .btn-block" if mobile else ".layer:not([aria-hidden]) .actions .btn").first
    btn.click()
    time.sleep(0.8)
    page.screenshot(path=f"{out}/{name}_02_q01.png")
    for i, ch in enumerate(pattern):
        idx = "ABC".index(ch)
        if mobile:
            page.locator(".layer:not([aria-hidden]) .choice").nth(idx).click()
        else:
            page.keyboard.press(ch)  # keyboard shortcut path on desktop
        if i == 0:
            time.sleep(0.15)
            page.screenshot(path=f"{out}/{name}_03_q01_selected.png")
        time.sleep(1.25)
    page.screenshot(path=f"{out}/{name}_04_contact_empty.png")
    # try to continue without email -> must be blocked
    ok = page.locator(".layer:not([aria-hidden]) .mobile-bar .btn-block" if mobile else ".layer:not([aria-hidden]) .actions .btn").first
    ok.click(); time.sleep(0.4)
    blocked_text = page.locator(".layer:not([aria-hidden]) .error").inner_text()
    page.screenshot(path=f"{out}/{name}_05_contact_email_required.png")
    page.fill("input[name=firstName]", "Test")
    page.fill("input[name=email]", "not-an-email"); ok.click(); time.sleep(0.4)
    invalid_text = page.locator(".layer:not([aria-hidden]) .error").inner_text()
    page.fill("input[name=email]", email)
    page.screenshot(path=f"{out}/{name}_06_contact_filled.png")
    ok.click(); time.sleep(1.0)
    page.screenshot(path=f"{out}/{name}_07_reveal.png")
    sub = page.locator(".layer:not([aria-hidden]) .mobile-bar .btn-block" if mobile else ".layer:not([aria-hidden]) .actions .btn").first
    sub.click()
    page.wait_for_selector(".ending", timeout=20000); time.sleep(1.0)
    page.screenshot(path=f"{out}/{name}_08_result.png")
    page.screenshot(path=f"{out}/{name}_09_result_full.png", full_page=True)
    result_text = page.locator(".ending-text").inner_text()
    results[name] = {"blocked_msg": blocked_text, "invalid_msg": invalid_text, "posted": posted,
                     "lead_response": resp_holder.get("lead"), "result_first_line": result_text.split("\n")[0],
                     "title": page.title(), "og": page.locator("meta[property='og:image']").get_attribute("content"),
                     "robots": page.locator("meta[name=robots]").get_attribute("content")}
    b.close()

with sync_playwright() as p:
    run(p, "desktop", {"width": 1440, "height": 900}, False, True)
    run(p, "mobile", {"width": 390, "height": 664}, True, False)
print(json.dumps(results, indent=1))
