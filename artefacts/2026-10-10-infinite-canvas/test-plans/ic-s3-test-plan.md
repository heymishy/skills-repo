## Test Plan: Canvas pan and zoom

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-10

---

## Note on Step 3a reclassification

During `/review`, these ACs were tentatively flagged as possibly E2E-dependent. On closer inspection while writing this plan: drawflow's zoom/pan state (`editor.zoom`, `editor.canvas_x`/`canvas_y`) is plain JS state mutated by event handlers — not computed CSS layout. This was directly proven in `spikes/zero-build-canvas-library-outcome.md`'s own investigation, where synthetic `WheelEvent`/`MouseEvent` dispatch (not a real mouse) correctly changed these exact properties in a live test. jsdom supports synthetic event dispatch identically — the same technique `ep1-s4`'s own drag tests already use. All 4 ACs are therefore unit-testable via synthetic event dispatch + internal state/property assertions, not E2E. Revising the earlier Step 3a flag downward, not upward — documented here rather than silently changed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `Ctrl+scroll` zooms the canvas | 1 test | — | — | — | — | 🟢 |
| AC2 | Dragging empty space pans the canvas | 1 test | — | — | — | — | 🟢 |
| AC3 | Pan/zoom resets to default on reload (not persisted) | 1 test | — | — | — | — | 🟢 |
| AC4 | Pan/zoom interaction doesn't leak into the page's own outer scroll | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; no backend data involved (this story is pure client-side interaction wiring)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | A rendered canvas with 2+ nodes (reuses `ic-s1`'s own test fixture) | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Ctrl+scroll zooms the canvas, plain scroll does not

- **Verifies:** AC1
- **Precondition:** Canvas rendered, `editor.zoom` at default `1.0`
- **Action:** Dispatch a synthetic `WheelEvent` with `ctrlKey: true` over the canvas container; separately, dispatch one with `ctrlKey: false`
- **Expected result:** The `ctrlKey: true` event changes `editor.zoom`; the `ctrlKey: false` event does not
- **Edge case:** Yes — the plain-scroll-does-nothing case is the edge case

### Dragging empty canvas space pans the view

- **Verifies:** AC2
- **Precondition:** Canvas rendered, `editor.canvas_x`/`canvas_y` at default `{0, 0}`
- **Action:** Dispatch synthetic `mousedown` → `mousemove` → `mouseup` on empty canvas space (not a node)
- **Expected result:** `editor.canvas_x`/`canvas_y` change by an amount matching the simulated pointer delta
- **Edge case:** No

### pan/zoom state is session-only, not persisted

- **Verifies:** AC3
- **Precondition:** Canvas panned/zoomed away from default
- **Action:** Simulate a reload by constructing a fresh editor instance against the same backend data
- **Expected result:** The fresh instance starts at default pan/zoom (`zoom: 1.0`, `canvas_x/y: 0`) — and no network request was ever made to persist the prior pan/zoom state, confirming it genuinely isn't a server-side concern
- **Edge case:** No

### pan/zoom interaction does not leak into the page's outer scroll

- **Verifies:** AC4
- **Precondition:** The canvas is nested inside a container with its own `scrollTop`
- **Action:** Dispatch a `WheelEvent` (with `ctrlKey: true`) over the canvas
- **Expected result:** The event's `defaultPrevented` is `true` (or the outer container's `scrollTop` is unchanged after dispatch) — the interaction is contained, not bubbling to the page
- **Edge case:** No

---

## Integration Tests

None — this story has no server-side route or persisted data; all behaviour is client-side interaction wiring, fully covered at unit level.

---

## NFR Tests

### Performance — no automated threshold test

- **NFR addressed:** Performance
- **Measurement method:** Manual observation — drawflow's own default rendering behaviour, no custom optimisation work anticipated
- **Pass threshold:** N/A
- **Tool:** Manual

### Security — None, confirmed with story owner

No new input surface, no persisted data.

### Accessibility — see decisions.md RISK-ACCEPT

- **NFR addressed:** Accessibility
- **Measurement method:** N/A — keyboard-based pan/zoom is formally RISK-ACCEPTed as out of scope (`decisions.md`, 2026-10-10), not tested here
- **Pass threshold:** N/A
- **Tool:** N/A

### Audit — None, confirmed with story owner

---

## Out of Scope for This Test Plan

- Keyboard-based pan/zoom — formally RISK-ACCEPTed, not built, not tested
- Node positioning — `ic-s1-test-plan.md`/`ic-s2-test-plan.md`

---

## Test Gaps and Risks

None.
