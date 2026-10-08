## Test Plan: Fix stage side panel's initial focus target and correct the E2E spec's wrap-test labels

**Story reference:** artefacts/2026-10-08-stage-panel-initial-focus-fix/stories/pfi-s1-fix-stage-panel-initial-focus-and-e2e-labels.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed live against real staging data, 2026-10-08):** A real journey and stage were created via `fetch()` in an authenticated browser session (the operator's own login), the panel was opened via a real click, and `document.activeElement.id` was read directly: `sw-stage-panel-close`, not `sw-stage-field-description`. The focus-trap's own wrap logic was then live-verified independently of this bug: from the close button (true DOM-order first), `Shift+Tab` correctly wrapped to `moment_of_truth` (true last); from there, `Tab` correctly wrapped back to the close button. This confirms AC5 of `ep1-s3` is NOT broken — only the initial-focus target and the E2E spec's own labeling are.

**E2E/browser-layout detection (Step 3a):** AC1's own live behaviour was already manually confirmed this session (see grounding above) and will be re-confirmed by `ep1-s3`'s own existing E2E spec once AC3's fix lands (that spec remains written-but-unexecuted this session for the same reason as before — no `DATABASE_URL`). No new E2E spec is needed for this story; AC1/AC3 are verified by source-text assertions (the established convention for this kind of wiring/labeling check, matching `ep1-s1`'s own `"(boot) ..."` test), and AC2 is covered by the manual live verification already performed plus the existing (now-corrected) E2E spec.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | openPanel() explicitly focuses the description field | 1 test (source-text) | — | — | Already live-verified this session | — | 🟢 |
| AC2 | Focus trap wrap behaviour is unchanged | — | — | covered by ep1-s3's existing spec (corrected by AC3) | Already live-verified this session | — | 🟢 |
| AC3 | E2E spec's firstField/lastField locators match true DOM order | 1 test (source-text) | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This is a narrowly-scoped fix for a defect found and live-verified in the same session; AC1/AC3 are directly source-text-testable, and AC2's behaviour was already manually confirmed against real staging data before this story was even written.

---

## Test Data Strategy

**Source:** Real files (`src/web-ui/routes/journeys.js`, `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`) — both AC1 and AC3 are assertions against real source text, matching `ep1-s1`'s own `"(boot) ..."` test convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Raw source text of `journeys.js` | Real file | None | Regex-match `getElementById("sw-stage-field-description").focus()` (or equivalent) inside `openPanel` |
| AC3 | Raw source text of the E2E spec | Real file | None | Regex-match `firstField` assigned to `#sw-stage-panel-close` and `lastField` assigned to `#sw-stage-field-moment_of_truth` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### openPanel() focuses the description field explicitly, not the DOM-order-first element

- **Verifies:** AC1
- **Action:** Read `src/web-ui/routes/journeys.js`'s own source text
- **Expected result:** Contains an explicit `getElementById("sw-stage-field-description")` focus call inside `openPanel`, not a bare `getFocusable()[0].focus()` with no field-specific targeting
- **Edge case:** No

### E2E spec's firstField/lastField locators match the true DOM order

- **Verifies:** AC3
- **Action:** Read `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`'s own source text
- **Expected result:** `firstField` locator targets `#sw-stage-panel-close`; `lastField` locator targets `#sw-stage-field-moment_of_truth`
- **Edge case:** No
