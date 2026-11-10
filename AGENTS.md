# InvestCalc project-wide rules

## Mandatory AdSense loader (never omit)

Every public HTML page that is intended to be served by the site must contain exactly one AdSense loader script inside its `<head>` element:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2057359438981933"
     crossorigin="anonymous"></script>
```

Rules:
- Keep the publisher ID exactly `ca-pub-2057359438981933`.
- Do not inject or rely on this script through `common-header.js`, `common-footer.js`, or other client-side JavaScript. It must be present in the raw HTML source inside `<head>` so crawlers and verification tools can detect it.
- Every new HTML page must include the loader before it is committed.
- When editing an existing HTML page, preserve the loader and ensure there is exactly one occurrence. Remove duplicates; never remove the only copy.
- Before completing any page creation, migration, or site-wide HTML change, audit all served HTML pages: each must have exactly one matching script in `<head>`, and zero copies outside `<head>`.
- Keep redirect/noindex pages aligned with their intended indexing purpose, but do not omit the loader from an HTML page unless the project owner explicitly changes this rule.
- Do not update the publisher ID or script URL without the project owner's explicit instruction.

## Release checklist
1. Check the changed page's raw HTML for exactly one loader in `<head>`.
2. For multi-page changes, run a repository-wide HTML audit.
3. After deployment, verify the live page source and allow time for Google's crawler to revisit the pages. A source-code check alone does not prove live deployment or AdSense approval.
