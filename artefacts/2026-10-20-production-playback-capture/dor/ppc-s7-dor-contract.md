# DoR Contract Proposal: Record an in-app sign-off decision on captured evidence

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s7-test-plan.md
**Date:** 2026-10-26

---

## What will be built

- `src/web-ui/routes/playback-evidence.js` (modified):
  - Sign-off area render: "Approve" (primary button variant), "Needs changes" (destructive button variant), optional comment `<textarea>` (AC1, AC6 empty state)
  - New POST handler writing `journeys.data.signOff = { status, by, at, comment, coverageSnapshot }`, `by` resolved via `req.session.login || req.session.userId` (never `accessToken`), scoped to the requesting tenant/product (AC2, AC5)
  - Render of an existing recorded decision as a status badge (`--success`/`--danger` token) with `escHtml()`-escaped who/when/comment/coverage text (AC3)
  - Stale-decision handling: the recorded `coverageSnapshot` always renders alongside the decision, never silently implying current coverage (AC4)
- `src/web-ui/adapters/journey-store-pg.js` (modified) — add `signOff` to `_sanitise()`'s allowlist (fdn-s1 rule)
- `tests/check-ppc-s7-sign-off-recording.js` (new) — 13 unit/integration tests

## What will NOT be built

- No edit/retract mechanism for a recorded decision — once recorded, permanent.
- No multi-approver workflow.
- No notification/alerting on decision recorded.
- No change to how `dodStatus`/DoD-complete status is derived — this story only records a human decision alongside it.
- No new access-control mechanism — reuses the exact same tenant/product guard every other `ppc` write already uses.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render-function test asserting correct button variants + comment field present | Unit |
| AC2 | Route test asserting `journeys.data.signOff` written with correct identity/timestamp/coverage snapshot, tenant-scoped | Integration |
| AC3 | Render-function test (badge + escaped text) + Unit test (XSS-injection on the comment field) | Integration + Unit |
| AC4 | Two-step route test: decision recorded at one coverage level, new evidence captured, assert the original snapshot still displays | Integration |
| AC5 | Cross-tenant route test, mirroring `ppc-s1`'s own access-control test | Integration |
| AC6 | Render-function test for the empty state, distinct from the "Approved" badge | Unit |

## Assumptions

- `req.session.login` is populated for every authenticated session reaching this route (consistent with `admin-credits.js`'s own existing fallback to `req.session.userId` when `login` is absent) — no new identity-resolution gap is introduced.
- A PO can record a decision even if coverage is 0 of N (no minimum-coverage gate before sign-off is allowed) — the story doesn't state a minimum, so none is assumed either way; this is implementation-neutral and doesn't need a DoR-level decision.

## Estimated touch points

**Files:** `src/web-ui/routes/playback-evidence.js`, `src/web-ui/adapters/journey-store-pg.js`, `tests/check-ppc-s7-sign-off-recording.js` (new)
**Services:** None
**APIs:** New internal route `POST /products/:id/playback-evidence/:featureSlug/sign-off` (or equivalent path, consistent with this route module's existing URL shape)

**Do not modify:** `src/web-ui/routes/admin-credits.js` (pattern reference only, not touched), `src/web-ui/adapters/session-page-adapter.js`, `src/web-ui/modules/journey-store.js` (in-memory store has no `_sanitise()` allowlist gate — no change needed there)

**schemaDepends:** `[]` — dependency on `ppc-s1` (the page) and `ppc-s6` (the shell-wrapped page this adds a CTA to) is on their shipped code, not a `pipeline-state.schema.json` field.
