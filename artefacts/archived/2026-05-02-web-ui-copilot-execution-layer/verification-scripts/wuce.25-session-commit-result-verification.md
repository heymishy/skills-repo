# Verification Script: Session commit result

**Story:** wuce.25 — Session commit result
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- `tests/check-wuce25-session-commit-result.js` committed

---

## AC1 — GET /skills/:name/sessions/:id/commit-preview renders artefact preview

**Automated check:**
```bash
node tests/check-wuce25-session-commit-result.js
```
T1, T2, T3 must pass.

**Manual smoke check:**
1. Complete a skill question session to reach commit-preview URL
2. Confirm artefact preview shown in a `<pre>` block
3. Confirm commit button present

---

## AC2 — Commit form uses POST; 303 to result page

**Automated check:** T4, T5

**Manual smoke check:**
1. On commit-preview page, click "Commit" button (or equivalent)
2. Confirm redirect to `/skills/:name/sessions/:id/result`
3. Disable JavaScript — confirm form POST still works

---

## AC3 — Result page: success message, artefact path, link to artefact, link to /features

**Automated check:** T6, T7, T8, T9, T10

**Manual smoke check:**
1. After committing, on the result page:
2. Confirm success-conveying text visible
3. Confirm artefact path displayed (e.g. `artefacts/2026-05-03-my-feature/discovery.md`)
4. Confirm clickable link to view the artefact
5. Confirm "Back to features" or equivalent link to `/features`

---

## AC4 — Double-commit (409) → HTML informative page, not raw JSON

**Automated check:** T11

**Manual smoke check (if triggerable):**
1. Submit the commit form twice in rapid succession (or manually POST to the same commit URL twice)
2. On the second POST: confirm HTML response with nav shell and informative message (not `{"error": ...}`)

---

## AC5 — User-controlled values escaped in preview and result

**Automated check:** T15, T16

---

## AC6 — Unauthenticated → 302

**Automated check:** T17, T18

---

## AC7 — Unknown session ID → 404 HTML page on all three endpoints

**Automated check:** T12, T13, T14

**Manual smoke check:**
1. Navigate to `/skills/discovery/sessions/fakesession/commit-preview`
2. Confirm 404 HTML page with nav shell (not raw JSON, not 500)

---

## NFR checks

| NFR | Check |
|-----|-------|
| `handleGetCommitPreviewHtml` and `handlePostCommitHtml` are named exports (ADR-009) | T19 automated |
| `<pre>` has `role="region"` and `aria-label` (WCAG) | T3 automated |
| Audit log written on POST commit | T20 automated |
| No inline fetch in route handler (ADR-012) | `grep -n "https\.\|fetch(" src/web-ui/routes/skills.js` — no inline calls |
| 409 HTML page uses `renderShell()` (not raw text) | T11 asserts nav present |
