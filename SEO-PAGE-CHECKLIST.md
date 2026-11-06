# InvestCalc Page Launch & SEO Checklist

Use this checklist whenever a new calculator, tool, or content page is created. A page is not complete until the page and sitemap have both been updated and verified.

## 1. Page fundamentals
- Use a clean, descriptive, lowercase URL slug.
- Use the existing InvestCalc design system and shared components:
  - `/assets/js/common-header.js`
  - `/assets/js/common-footer.js`
- Ensure the page is responsive and usable on mobile, tablet, and desktop.
- Make calculator inputs understandable, validate invalid values, and provide a working reset action where relevant.
- Test calculation logic with normal, boundary, zero/negative (where valid), and invalid inputs.
- Clearly label assumptions, units, and rounding.

## 2. On-page SEO
- Write a unique, descriptive `<title>` for every page.
- Add a unique, useful meta description; avoid keyword stuffing.
- Add an absolute canonical URL pointing to the preferred HTTPS URL.
- Set the correct language and viewport metadata.
- Use one clear, descriptive H1 and a logical H2/H3 hierarchy.
- Include useful original explanatory content: how to use the tool, methodology/formula, a worked example, assumptions, limitations, and relevant FAQs where genuinely useful.
- Add descriptive internal links to relevant existing calculators and navigation.
- Use meaningful link text and accessible form labels.
- Add Open Graph metadata and an appropriate Twitter card.
- Set robots directives intentionally; do not accidentally block indexable pages.

## 3. Structured data
- Add valid JSON-LD that accurately describes visible page content.
- Use WebPage and BreadcrumbList where appropriate.
- Use SoftwareApplication only for a real working application/calculator.
- Use FAQPage only when the same questions and answers are visible on the page.
- Do not add ratings, reviews, prices, authors, or claims that are not real and visible.
- Validate JSON-LD syntax and avoid duplicate/conflicting schema.

## 4. Technical quality
- Treat Google Analytics and NameDotify PushDotify as required site-wide technical vitals on every public page.
- Keep exactly one direct Google Analytics tag in each page's `<head>` using the verified site tag ID.
- Load `/assets/js/common-pushdotify.js` before `</head>` on every page; keep the NameDotify configuration and provider script centralized in that shared file.
- Keep the root `/sw.js` service worker available and do not overwrite its existing notification/click-tracking handlers without checking the provider requirements.
- Keep core page content and SEO metadata in the HTML, not dependent on JavaScript rendering.
- Avoid duplicate analytics or tracking scripts.
- Do not add AdSense code until the site is approved and the owner requests it.
- Keep CSS/JS efficient; avoid layout shifts and unnecessary third-party scripts.
- Check keyboard navigation, focus states, contrast, and accessible error messages.
- Check that page links, images, scripts, and calculator interactions work.


- Load the shared predictive search through `/assets/js/common-header.js`; keep its UI and logic in `/assets/js/common-search.js` with a data-driven catalogue of verified, working destinations. Add new live calculators to this catalogue when they launch.
- Keep future financial-instrument search extensible by asset type (mutual funds/schemes, equities/tickers, ETFs, bonds, deposits and commodities). Do not display live prices, NAVs, tickers or instrument listings until a verified data provider and refresh policy are integrated.
- Load `/assets/js/common-branding.js` on every public page before `</head>`; it centrally applies the InvestCalc SVG favicon, PNG browser/touch icon, web app manifest, and theme color.
- Keep the root `/favicon.svg`, `/favicon-180.png`, and `/site.webmanifest` available. Do not create duplicate favicon or manifest tags in individual page templates.

## 5. Sitemap and crawlability — mandatory for every new page
- Add the canonical, indexable page URL to the root `/sitemap.xml` in the same task as creating the page.
- Use the full HTTPS domain and the final trailing-slash URL.
- Set `lastmod` to the actual date the page was materially updated; do not invent future dates.
- Do not include redirects, duplicate URLs, noindex pages, drafts, or pages that do not exist.
- When a page is removed or its URL changes, update the sitemap accordingly.
- Keep `/robots.txt` accessible and include the sitemap directive:
  `Sitemap: https://returnoninvestmentcalculator.in/sitemap.xml`
- Validate sitemap XML and verify every listed URL maps to the intended page.
- After deployment, check the live sitemap and page. Submit the sitemap in Google Search Console when access is available/needed.

## 6. Release verification
- Fetch the committed page and sitemap from GitHub to verify the saved versions.
- Check the live URL after GitHub Pages deployment; do not claim live success until verified.
- Check canonical, title, meta description, schema, shared header/footer, mobile layout, and calculator output.
- Record the page URL and commit in the completion note.

## Current sitemap inventory
The sitemap should contain only pages that exist and are intended for indexing. Update this inventory whenever pages are added, removed, or renamed.
