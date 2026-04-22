# Test plan: dr.1 — Pipeline review page

**Story:** dr.1
**Feature:** 2026-04-22-dashboard-review

---

## Tests

**T1 — review-html-exists**
`dashboards/review.html` exists. Fail if absent.

**T2 — review-html-react**
`dashboards/review.html` contains `react@18` (CDN script tag). Fail if absent.

**T3 — dual-url-loader**
`dashboards/review.html` contains `pipeline-state.json` AND `../.github/pipeline-state.json` (dual-URL candidate array). Fail if either string is absent.

**T4 — advance-endpoint**
`dashboards/review.html` contains `/advance` (the POST endpoint call). Fail if absent.

**T5 — health-poll**
`dashboards/review.html` contains `/health` (health-check polling). Fail if absent.

**T6 — md-renderer-script**
`dashboards/review.html` contains `md-renderer.js` (script src). Fail if absent.

**T7 — artefact-fetcher-script**
`dashboards/review.html` contains `artefact-fetcher.js` (script src). Fail if absent.

**T8 — review-server-exists**
`scripts/review-server.js` exists. Fail if absent.

**T9 — review-server-no-require-external**
`scripts/review-server.js` does NOT contain `require('express')` or `require('axios')` or `require('fetch')`. Confirm only built-in modules are used. Fail if any external require is found.

**T10 — atomic-write**
`scripts/review-server.js` contains `renameSync` (atomic write pattern). Fail if absent.

**T11 — path-traversal-guard**
`scripts/review-server.js` contains `startsWith` (path traversal protection check). Fail if absent.

**T12 — cors-headers**
`scripts/review-server.js` contains `Access-Control-Allow-Origin` (CORS header set). Fail if absent.

**T13 — save-endpoint**
`scripts/review-server.js` contains `/save` (save endpoint registered) and `review.html` contains `callSave` (client helper calling `POST /save`). Fail if either is absent.

**T14 — site-nav**
`dashboards/review.html` contains `site-nav` (the cross-page `<nav className="site-nav">` navigation bar). Fail if absent.

---

## Test script

`tests/check-dr1-dashboard-review.js`
