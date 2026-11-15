from pathlib import Path
import json
import re
import threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from xml.etree import ElementTree
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CASES = {
    "international-money-transfer-fee-calculator": ("Provider A received (recipient currency)", 1080.20),
    "credit-card-rewards-break-even-calculator": ("Net annual reward value", 319.0),
    "ecommerce-unit-economics-calculator": ("Monthly estimated profit after overhead", 3780.0),
    "cd-ladder-calculator": ("Principal allocated to each rung", 5000.0),
}
xml = ElementTree.parse(ROOT / "sitemap.xml")
locs = [x.text for x in xml.iter() if x.tag.endswith("loc")]
for slug in CASES:
    html = (ROOT / slug / "index.html").read_text(encoding="utf-8")
    url = "https://returnoninvestmentcalculator.in/" + slug + "/"
    assert url in locs, f"{slug} missing sitemap"
    assert html.count("adsbygoogle.js") == 1
    assert html.count("gtm.js") == 1
    assert html.count("common-branding.js") == 1
    assert html.count("common-pushdotify.js") == 1
    assert f'rel="canonical" href="{url}"' in html
    schema = re.search(r'<script type="application/ld[+]json">(.*?)</script>', html, re.S)
    assert schema and json.loads(schema.group(1))
    for p in ("assets/js/common-header.js", "assets/js/common-footer.js", "assets/js/common-search.js"):
        assert slug in (ROOT / p).read_text(encoding="utf-8")
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for slug, (label, expected) in CASES.items():
            for width in (375, 1440):
                page = browser.new_page(viewport={"width": width, "height": 850})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/{slug}/", wait_until="domcontentloaded")
                page.locator('button[type="submit"]').click()
                assert not page.locator("#error").inner_text(), (slug, page.locator("#error").inner_text())
                rows = page.locator("#results div")
                found = None
                for i in range(rows.count()):
                    if rows.nth(i).locator("dt").inner_text() == label:
                        found = float(rows.nth(i).locator("dd").inner_text().replace(",", ""))
                assert found is not None and abs(found - expected) < 0.02, (slug, label, found, expected)
                assert not errors, (slug, errors)
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), slug + " horizontal overflow"
                page.locator("input").first.fill("-999")
                page.locator("#calculator").dispatch_event("submit")
                assert page.locator("#error").inner_text(), slug + " invalid input not rejected"
                page.close()
        browser.close()
finally:
    server.shutdown()
print("PASS: 4 calculators x desktop/mobile; formula, validation, SEO, sitemap, shared navigation")
