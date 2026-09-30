## Test Plan: Signals panel — render real signals in a web UI page

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Test plan author:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-01

**E2E/browser-layout detection (Step 3a):** None of AC1–AC5 individually describe layout-position or computed-visual-style assertions — AC4's "visually distinguished" requirement is satisfiable by asserting a differentiating CSS class is present on parse-error signal items (DOM-level, not layout-level), matching how `ep1-s3`'s own AC2/AC3 were handled at unit level. However, this story's own Accessibility NFR ("signal list items and CTA buttons are keyboard-navigable") is judged CSS-layout-dependent by extension of this feature's own established precedent (`ep1-s3`'s NFR-Accessibility test): real sequential Tab-order focus movement across multiple elements is not reliably reproduced by a DOM-simulation environment (jsdom) — this repo's own earlier `ep1-s3` test plan, and its later real DoD finding, confirms real Playwright is the correct tool for this specific class of assertion even though Step 3a's own literal trigger-pattern list does not name "keyboard Tab order" explicitly. Handled as Option 1 (real E2E test) — Playwright is already configured and in active use (`tests/e2e/*.spec.js`).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real signals render on page load | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Each signal's CTA label is visible | 1 test | — | — | — | — | 🟢 |
| AC3 | Empty state when no signals exist | 1 test | — | — | — | — | 🟢 |
| AC4 | Parse-error signals visually distinguished | 1 test | — | — | — | — | 🟢 |
| AC5 | Page requires authentication | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None against the 5 ACs. The Accessibility NFR (not an AC) is CSS-layout-dependent and covered by a real E2E test — see NFR Tests below, not silently downgraded to DOM-presence or left manual-only.

---

## Test Data Strategy

**Source:** Synthetic — a fixed array of `Signal`-shaped fixture objects (matching the real shape confirmed in the story's own Architecture Constraints: `{id, source, type, text, timestamp, cta: {label, skill}}`), including at least one `type: 'parse-error'` entry, provided to the panel's render function under test. Integration tests also exercise the real route handler with the real `GET /api/signals` consumption path (matching `ep1-s2`'s own already-established test convention), using an injected/stubbed signals response rather than a live aggregator run.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A small set of real-shaped signals (3–5, varied `source`/`type`) | Synthetic fixture | None | Confirms `text`/`source`/`type` all render, not just presence of a list |
| AC2 | Signals with both a default `cta` (`{label: 'Review', skill: '/improve'}`) and a non-default `cta` (e.g. `{label: 'Open feature', skill: '/workflow'}`, matching the real `_parsePipelineState` call site) | Synthetic fixture | None | Confirms the CTA label rendered is the signal's own, not a hardcoded string |
| AC3 | Empty array | Synthetic | None | — |
| AC4 | At least one `type: 'parse-error'` signal alongside normal signals | Synthetic fixture | None | Confirms the distinguishing class/style applies only to parse-error items, not all signals |
| AC5 | No fixture data needed — tests the auth guard itself | N/A | None | Matches the existing auth-guard test pattern already used for `/skills` |

### PCI / sensitivity constraints

None. Signal content is internal engineering process data (capture-log, learnings, etc.), not customer or regulated data — matches this feature's own already-assessed NFR profile (Tier 3, no compliance framework applies).

### Gaps

None.

---

## Unit Tests

### Every real signal field renders on the panel

- **Verifies:** AC1
- **Precondition:** Render function given a fixture array of 3–5 signals with varied `source`/`type`/`text`
- **Action:** Render the panel; query the rendered HTML
- **Expected result:** Every fixture signal's `text`, `source`, and `type` values appear in the output, once per signal — not a placeholder, not a subset
- **Edge case:** No

### Signal's own CTA label renders, not a hardcoded string

- **Verifies:** AC2
- **Precondition:** Fixture includes one signal with the default `cta` (`{label: 'Review', skill: '/improve'}`) and one with a non-default `cta` (`{label: 'Open feature', skill: '/workflow'}`)
- **Action:** Render the panel
- **Expected result:** Both signals' own distinct `cta.label` text appear verbatim on their respective list items — confirms the label is read from each signal's own `cta` field, not a single hardcoded button text reused for every item
- **Edge case:** Yes — the non-default `cta` case is the one that would fail if the label were hardcoded

### Empty signal list shows a clear empty state, not a blank page

- **Verifies:** AC3
- **Precondition:** Render function given an empty array
- **Action:** Render the panel
- **Expected result:** Output contains a clear, non-error empty-state message (e.g. "No signals yet"); does not contain any list-item markup and does not throw
- **Edge case:** Yes — the zero-signals boundary

### Parse-error signals carry a distinguishing class; normal signals do not

- **Verifies:** AC4
- **Precondition:** Fixture includes a mix of normal signals and at least one `type: 'parse-error'` signal
- **Action:** Render the panel; inspect each list item's class attribute
- **Expected result:** Only the `parse-error` signal's list item carries the distinguishing class (e.g. `signal-parse-error` or equivalent); normal signals do not carry it
- **Edge case:** Yes — confirms the distinction is signal-specific, not applied globally or omitted entirely

---

## Integration Tests

### Real router dispatch: the panel route consumes the real /api/signals response shape

- **Verifies:** AC1 (behavioural half — the route genuinely fetches and renders, not just that the render function works in isolation)
- **Components involved:** New panel route handler, `ep1-s2`'s real `/api/signals` response contract (via its own handler function or HTTP call, per the story's own Architecture Constraints — not a re-implementation of aggregation)
- **Precondition:** `ep1-s2`'s signals-fetching path stubbed at its own already-established seam (matching `ep1-s2`'s own test convention — the aggregator itself is stubbed, not `/api/signals`'s own contract), returning a real-shaped `Signal[]` fixture
- **Action:** Dispatch a real GET request to the panel route
- **Expected result:** Response is 200 HTML containing the fixture signals' own content — confirms the route is genuinely wired to the real endpoint contract, not a mock that merely resembles it (mirrors the mock-shape-verification discipline from `CLAUDE.md`'s own D37/tir-s5 guidance)

### Unauthenticated request redirects to sign-in

- **Verifies:** AC5
- **Components involved:** Existing auth-guard middleware, new panel route
- **Precondition:** Request made with no session/auth token
- **Action:** Dispatch a GET request to the panel route unauthenticated
- **Expected result:** Redirect to sign-in, matching the exact existing behaviour of every other authenticated web UI page (e.g. `/skills`) — reuses the same guard, not a new one

---

## E2E Tests (Playwright, real browser — NFR only, no AC requires it)

### NFR-Accessibility: signal list items and CTA buttons are keyboard-navigable

- **Verifies:** Accessibility NFR (not an AC)
- **Precondition:** Real browser, panel page loaded with real signal data present (`WIRE_SKILL_ADAPTERS`-equivalent real-adapter wiring for this story's own endpoint, matching the `ep1-s3` lesson that an E2E webServer must have its real data path wired or the page renders an empty state instead)
- **Action:** Load the panel page; walk the real Tab order from document start
- **Expected result:** Every CTA button has a non-empty accessible name (its own signal's `cta.label` text); Tab order reaches every rendered CTA button in document order
- **Tool:** `npx playwright test tests/e2e/ep2-s1-signals-panel.spec.js`

---

## NFR Tests

### Panel renders within the stated performance budget

- **NFR addressed:** Performance
- **Measurement method:** Server-side render-time measurement (the render function's own execution time via `process.hrtime.bigint()`), matching `ep1-s3`'s own established, deliberately-chosen method — not full-browser navigation timing, which this feature's own `ep1-s3-dod.md` already found to risk environmental flakiness at a tight threshold
- **Pass threshold:** <100ms (matches the story's own stated NFR)
- **Tool:** `node tests/check-ep2-s1-signals-panel.js`

### No new attack surface

- **NFR addressed:** Security
- **Measurement method:** Code inspection + a dedicated test confirming no new npm runtime dependency was added (`package.json` diff check, matching `ep1-s3`'s own DoD verification method) and that all interpolated signal content passes through `escHtml` (grep-based or render-output-based assertion that no raw `<`/`>`/`"` from signal text appears unescaped in the output)
- **Pass threshold:** Zero new dependencies; zero unescaped interpolation sites
- **Tool:** `node tests/check-ep2-s1-signals-panel.js`

---

## Out of Scope for This Test Plan

- Any test of `ep1-s1`'s aggregator or `ep1-s2`'s own `/api/signals` route logic — separate stories, separate test plans; this plan only tests this story's own consumption of that contract.
- Testing the CTA's actual click-through/seeding behaviour — `ep2-s2`'s own test plan, not this one (this story renders the CTA label only).
- Visual regression / pixel-diff screenshot testing — Phase 5 concern per the epic's own scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
