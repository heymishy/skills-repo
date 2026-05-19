# Implementation Plan: wuce.19 — Feature list HTML view

**Branch:** feature/wuce.19-feature-list-html-view
**Date:** 2026-05-04
**Tests:** 16 (all failing until production code is written)

---

## Task 1 — Create failing test file

**File:** `tests/check-wuce19-feature-list-html.js` (CREATE)

Write all 16 tests against the existing `handleGetFeatures()` before any production code changes. Tests that cover the new HTML path will fail at this point.

**Tests to implement:**
- T1: Accept: text/html → 200, Content-Type text/html, doctype, nav
- T2: `<ul>` present with ≥2 `<li>` items
- T3: Feature slugs in body
- T4: Pipeline stage per item
- T5: Links to /features/:slug per item
- T6: Accept: application/json → 200 JSON response
- T7: No Accept header → 200 JSON response
- T8: Zero features → empty-state message, no `<ul>`
- T9: XSS in stage value escaped
- T10: Unauthenticated text/html → 302 /auth/github
- T11: Unauthenticated application/json → 302 /auth/github
- T12: Date displayed per item
- T13: Audit log written with { userId, route: '/features', timestamp }
- T14: listFeatures adapter called exactly once
- T15: renderShell wraps output (nav present)
- T16: Special chars in slug escaped

**Mocking strategy:**
- Use `setConfiguredRepositories`, `setValidateRepositoryAccess`, `setFetchPipelineState` from the feature-list adapter to control `listFeatures()` output
- Standard mock state: 2 features with slug, stage, updatedAt (adapter normalises to lastUpdated)
- XSS test state: stage containing `<b>bad</b>`
- Empty state: features array = []
- Slug XSS state: slug containing `feat-<test>`

---

## Task 2 — Extend handleGetFeatures() in features.js

**File:** `src/web-ui/routes/features.js` (EXTEND)

**Changes:**

1. Import `renderShell` and `escHtml` from `../utils/html-shell` (canonical escaping module)
2. Remove local `escHtml` function (avoid duplication — ADR requirement)
3. Change auth check from 401 to 302 redirect to `/auth/github` (authGuard pattern)
4. Add content-type negotiation:
   - Check `req.headers['accept']` for `text/html`
   - HTML path: call `renderShell()` wrapping feature list body content
   - JSON path: return JSON unchanged (backward-compatible)
5. HTML body content:
   - Zero features: `<p class="no-features">No features found</p>` (no `<ul>`)
   - Non-zero features: call existing `renderFeatureList(features)`
6. Audit log update: add `route: '/features'` to `feature_list_accessed` event on both paths (keeping `featureCount` for backward compat with wuce.6 tests)

**Run command:** `node tests/check-wuce19-feature-list-html.js`

**Expected result:** 16 tests pass, 0 fail

---

## Task 3 — Add to npm test chain

**File:** `package.json` (EXTEND)

Append `&& node tests/check-wuce19-feature-list-html.js` to the end of the test script.

---

## File touchpoints summary

| File | Action |
|------|--------|
| `tests/check-wuce19-feature-list-html.js` | CREATE |
| `src/web-ui/routes/features.js` | EXTEND |
| `package.json` | EXTEND (test chain) |

## Files NOT touched
- `src/web-ui/utils/html-shell.js`
- `src/web-ui/server.js`
- Any file under `artefacts/`
