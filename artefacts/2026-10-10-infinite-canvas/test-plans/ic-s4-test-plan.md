## Test Plan: Keyboard-accessible node movement (WCAG 2.1 AA)

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-10

---

## Note on Step 3a classification

This story mixes two different classes of behaviour. Arrow-key-driven position movement (AC1b, AC4, AC5) is pure JS state mutation triggered by `keydown` events — unit/jsdom-testable, same reasoning as `ic-s3`'s pan/zoom tests. **Native browser Tab-order traversal and real computed `:focus` styling (AC1a's style claim, AC2, AC3) are different** — jsdom does not reliably implement the browser's own native tab-order algorithm or full CSS cascade resolution for pseudo-classes. This matches the real, already-established precedent in this exact codebase: `ep1-s3-stage-panel-focus-management.spec.js` exists specifically because this class of behaviour needed a real browser. Following that precedent, not inventing a new one.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1a | `tabindex="0"` present on each node | 1 test | — | — | — | — | 🟢 |
| AC1a (focus style) | Visible `:focus` style, not browser default | — | — | 1 test | — | — | 🟡 |
| AC1b | Arrow key moves node, saves position | 1 test | — | — | — | — | 🟢 |
| AC2 | Tab/Shift+Tab order, no focus trap | — | — | 1 test | — | — | 🟡 |
| AC3 | Full no-mouse walkthrough works end to end | — | — | 1 test | 1 scenario | — | 🟡 |
| AC4 | Drag and keyboard movement write the same fields | 1 test | — | — | — | — | 🟢 |
| AC5 | Continued arrow-key press keeps moving the node | 1 test | — | — | — | — | 🟢 |

AC1a's focus-style check, AC2, and AC3 are combined into a single new spec, `tests/e2e/ic-s4-keyboard-node-movement.spec.js` — 3 tests in one file, following `ep1-s3-stage-panel-focus-management.spec.js`'s own established structure. 🟡 not 🔴: these are real, written E2E tests, not gaps — same pre-existing `fake-test-db.js` local-execution limitation as `ic-s2`'s own E2E test, not new.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----|---------------------------|---------|
| Native browser Tab-order traversal and computed `:focus` style cannot be reliably simulated in jsdom | AC1a (style), AC2, AC3 | DOM-behaviour | jsdom does not implement the browser's own native tab-order algorithm or full CSS pseudo-class cascade resolution | E2E test — `tests/e2e/ic-s4-keyboard-node-movement.spec.js` (Playwright), matching `ep1-s3-stage-panel-focus-management.spec.js`'s own precedent. Same local-execution gap already carried by `ic-s2`'s own E2E spec. |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup. Unit tests use self-contained mock pools; the E2E spec seeds a real journey/stages via the same `seedJourneyWithStages` helper already established by `ep1-s3`/`ep1-s4`.
**PCI/sensitivity in scope:** No
**Availability:** Available now (E2E spec requires `DATABASE_URL` to actually execute, same pre-existing dependency as `ic-s2`)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1a, AC1b, AC4, AC5 | A rendered canvas with 1+ nodes | Synthetic mock pool | None | |
| AC2, AC3 | A real journey with 2+ stages, seeded in Postgres | `seedJourneyWithStages` (reused) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the already-noted E2E local-execution gap.

---

## Unit Tests

### each node has tabindex="0"

- **Verifies:** AC1a
- **Precondition:** Canvas rendered with 2+ nodes
- **Action:** Inspect each node's rendered DOM attributes
- **Expected result:** Every node element has `tabindex="0"` — not missing, not `-1`
- **Edge case:** No

### arrow key moves a focused node and saves the new position

- **Verifies:** AC1b
- **Precondition:** A node is focused (simulated via setting `document.activeElement` / dispatching `focus`)
- **Action:** Dispatch a synthetic `keydown` for `ArrowRight`
- **Expected result:** The node's position state updates by the fixed step in the correct direction, and the same save route `ic-s2` established is called with the new coordinates
- **Edge case:** No

### keyboard and mouse-drag movement write to the same fields

- **Verifies:** AC4
- **Precondition:** A node exists
- **Action:** Trigger a simulated mouse-drag position update, then a simulated arrow-key move on the same node
- **Expected result:** Both code paths call the exact same position-update mechanism (same route, same field names `position_x`/`position_y`) — no divergent or parallel data model
- **Edge case:** No

### holding an arrow key keeps moving the node, not a one-shot nudge

- **Verifies:** AC5
- **Precondition:** A node is focused
- **Action:** Dispatch the same `ArrowRight` `keydown` event twice in succession
- **Expected result:** The node's position changes by the fixed step both times (cumulative, not clamped to a single move)
- **Edge case:** Yes — this is the "repeated input" edge case

---

## Integration Tests

None — this story reuses `ic-s2`'s own persistence route unchanged; no new server-side behaviour.

---

## E2E Tests (`tests/e2e/ic-s4-keyboard-node-movement.spec.js`)

### visible focus style appears on a focused node

- **Verifies:** AC1a (style claim)
- **Precondition:** Real browser, journey canvas loaded
- **Action:** `page.keyboard.press('Tab')` until a node is focused
- **Expected result:** The focused node has a visually distinct style (not the invisible/default browser outline) — assert via a CSS class or computed style check Playwright can reliably perform in a real rendering engine

### Tab order moves between nodes and off the canvas cleanly

- **Verifies:** AC2
- **Precondition:** Real browser, canvas with 3+ nodes
- **Action:** Repeated `page.keyboard.press('Tab')` and `Shift+Tab`
- **Expected result:** Focus moves node-to-node in a predictable order, then off the canvas to the next page element — no focus trap (focus never gets stuck cycling only within the canvas)

### full keyboard-only walkthrough: focus, move, persist

- **Verifies:** AC3
- **Precondition:** Real browser, no mouse interaction used at all in this test
- **Action:** Tab to a node, press arrow keys to move it, reload the page
- **Expected result:** The node is at its new, moved position after reload — the entire flow works end to end using only the keyboard

---

## NFR Tests

### Accessibility — this story's entire purpose, covered by the E2E spec above

- **NFR addressed:** Accessibility
- **Measurement method:** The 3 E2E tests above directly constitute the WCAG 2.1 AA conformance check for node-repositioning functionality
- **Pass threshold:** All 3 E2E tests pass
- **Tool:** Playwright

### Performance, Security, Audit — None beyond ic-s2's own bounds, confirmed with story owner

---

## Out of Scope for This Test Plan

- Continuous freehand keyboard dragging — explicitly ruled out in `/clarify`
- Keyboard-based canvas pan/zoom — formally RISK-ACCEPTed, not built, not tested here

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1a/AC2/AC3's real browser tests cannot run locally without `DATABASE_URL` | Pre-existing `fake-test-db.js` limitation, same as `ic-s2` | E2E spec is written and real — runs in CI/staging with a real Postgres instance. Pre-merge verification falls back to the manual scenario in the verification script. |
