## Test Plan: Add `/signals` to the main navigation

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js` (read directly from `package.json`'s own `scripts.test` entry).

**Real architecture grounding (confirmed by direct code read, not assumed):**
- `NAV_ITEMS` (`src/web-ui/utils/html-shell.js:54-78`) has no `/signals` entry today.
- `handleGetSignalsPanelHtml` (`src/web-ui/routes/signals-panel.js:39`) already calls `renderShell({ ..., active: 'signals' })` — confirms the `id` the new entry must use.
- `/signals` is already a registered route in `server.js:3065` (`pathname === '/signals' && req.method === 'GET'`) — so the existing dangling-link regression test (`tests/check-b2-account-nav.js`, its own AC3 test `"AC3: zero dangling NAV_ITEMS entries"`, which filters `NAV_ITEMS` for any href not matching a known registered-route pattern) will pass against the new entry without modification to that test file.

**E2E/browser-layout detection (Step 3a):** AC4 ("receives focus in the same way every other `sw-nav-item` row does") sounds layout-dependent but is not — it only requires the new row to be a plain `<a>` element with no `tabindex` override, identical in shape to every existing `sw-nav-item`. This is a DOM-structure assertion, not a real sequential-focus-order measurement (unlike `ep1-s3`/`ep2-s1`'s own Tab-order AC7-style tests). No E2E test required for this story.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "Signals" nav row renders in the main sidebar | 1 test | — | — | — | — | 🟢 |
| AC2 | Nav row shows active state on `/signals` | 1 test | — | — | — | — | 🟢 |
| AC3 | No existing nav row or page is regressed | 1 test | — | — | — | — | 🟢 |
| AC4 | Nav row is keyboard-accessible (DOM structure) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — no real signal data needed; this story only touches a static array and the sidebar renderer.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | None — calls `renderSidebar`/`renderShell` with minimal args | Synthetic | None | |
| AC2 | `active: 'signals'` passed to `renderSidebar` | Synthetic | None | |
| AC3 | The real `NAV_ITEMS` array (post-change) and `server.js`'s real registered routes | Real code | None | Reuses `check-b2-account-nav.js`'s own existing route-resolution logic |
| AC4 | The rendered nav row's own HTML | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderSidebar includes a "Signals" nav row linking to /signals

- **Verifies:** AC1
- **Precondition:** Call `renderSidebar('dashboard', 'testuser', false)` (any non-`'signals'` active id)
- **Action:** Inspect the returned HTML string
- **Expected result:** Contains `href="/signals"` and the visible text `Signals`, within the main product nav section (not inside `.sw-nav-account`)
- **Edge case:** No

### renderSidebar marks the Signals row active when active='signals'

- **Verifies:** AC2
- **Precondition:** Call `renderSidebar('signals', 'testuser', false)`
- **Action:** Inspect the returned HTML string
- **Expected result:** The `<a href="/signals" ...>` element's `class` attribute contains `sw-nav-item--active`; no other nav row's class contains `sw-nav-item--active`
- **Edge case:** Yes — confirms exclusivity, not just presence

### NAV_ITEMS: all pre-existing entries still resolve to a registered route after the new entry is added

- **Verifies:** AC3
- **Precondition:** The real, post-change `NAV_ITEMS` array
- **Action:** Run `check-b2-account-nav.js`'s own existing `"AC3: zero dangling NAV_ITEMS entries"` test logic against it (reused, not duplicated)
- **Expected result:** Zero unresolved hrefs — Org board, Pod Manager, Settings, Admin credits, Admin mock gateway, and the new Signals entry all resolve
- **Edge case:** No

### The Signals nav row is a plain, focusable <a> element with no tabindex override

- **Verifies:** AC4
- **Precondition:** The rendered Signals `<a>` element from AC1's own test
- **Action:** Inspect its attributes
- **Expected result:** No `tabindex` attribute present (default DOM focus order applies, same as every other `sw-nav-item`)
- **Edge case:** No

---

## Integration Tests

None — this story's full behaviour is covered by direct `renderSidebar`/`NAV_ITEMS` unit tests; there is no new route handler or request-dispatch seam to integration-test.

---

## NFR Tests

### Accessibility — nav row keyboard-reachable

- **NFR addressed:** Accessibility
- **Measurement method:** Covered by the AC4 unit test above (no separate dedicated test) — the `tabindex` absence check is itself the accessibility assertion.
- **Pass threshold:** No `tabindex` override present on the new row.
- **Tool:** `node tests/check-sptu-s1-signals-nav.js` (AC4's own test, cross-referenced, not duplicated)

### Security — no new attack surface

- **NFR addressed:** Security
- **Measurement method:** No dedicated test — this story adds a static label/href only, no new input handling, no new query parsing. Confirmed by code review at `/review` (Category E, no findings).
- **Pass threshold:** N/A — no new input surface exists to test.
- **Tool:** N/A

---

## Out of Scope for This Test Plan

- Real sequential Tab-order verification across the whole sidebar — not needed; this story only confirms the new row matches the existing, already-covered pattern
- Any test of `sptu-s2`/`s3`/`s4`'s own behaviour — independent stories

---

## Test Gaps and Risks

None.
