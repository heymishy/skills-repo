# Verification Script: Feature list HTML view

**Story:** wuce.19 — Feature list HTML view
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- At least one feature configured in `WUCE_REPOSITORIES`
- `tests/check-wuce19-feature-list-html.js` committed

---

## AC1 — GET /features with Accept: text/html returns HTML list

**Automated check:**
```bash
node tests/check-wuce19-feature-list-html.js
```
T1–T5, T12, T15 must pass.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/features` in a browser (authenticated)
2. Confirm the page shows a heading and a list of features
3. Each feature shows: slug, stage, date, and a link to `/features/:slug`
4. Confirm `Content-Type: text/html; charset=utf-8` in Network tab

**Pass criteria:** HTML page loads, feature list visible, links clickable

---

## AC2 — Accept: application/json returns JSON unchanged

**Automated check:** T6, T7

**Manual smoke check:**
```bash
curl -s http://localhost:3000/features -H "Accept: application/json" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); JSON.parse(d); console.log('JSON valid')"
```

**Pass criteria:** JSON parses successfully; no HTML in response

---

## AC3 — Zero features → empty-state message, no empty `<ul>`

**Automated check:** T8

**Manual smoke check (if testable with empty config):**
1. Remove all repos from `WUCE_REPOSITORIES` temporarily
2. Load `/features` in browser
3. Confirm "No features found" (or equivalent) shown
4. Confirm no empty bullet list is rendered

---

## AC4 — HTML-special chars in stage escaped

**Automated check:** T9, T16

---

## AC5 — Unauthenticated → 302

**Automated check:** T10, T11

**Manual smoke check:**
1. Incognito browser → `http://localhost:3000/features`
2. Confirm redirect to OAuth page

---

## NFR checks

| NFR | Check |
|-----|-------|
| Feature slugs and stage values escaped | T9, T16 automated |
| No extra API round-trip | T14 adapter call count spy |
| Audit log written | T13 automated |
| `renderFeatureList()` not duplicated — called from existing implementation | `grep -rn "renderFeatureList" src/` shows exactly one definition, called in HTML path |
