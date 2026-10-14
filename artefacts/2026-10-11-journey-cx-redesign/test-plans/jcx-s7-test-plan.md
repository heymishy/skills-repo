## Test Plan: Fix the misleading save-error color, the view-reset-on-save standards violation, and empty-state/entry-point/spacing polish

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Review reference:** artefacts/2026-10-11-journey-cx-redesign/review/jcx-s7-review-1.md (PASS, run 1 — 2 MEDIUM implementation-risk notes resolved below)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-14

---

## Note on review finding 1-M1 (save-indicator timer race)

Resolved as its own explicit test (see Unit Tests, AC1c below): two fields' saves racing (one succeeds, a second fails shortly after) must not let the first field's stale success-clear timeout hide the second field's error state. The implementation must track which save is "current" (e.g. a per-indicator save-sequence token checked before any timeout clears the indicator) rather than letting every independent `setTimeout` clear unconditionally.

## Note on review finding 1-M2 (click-target double-fire)

Resolved as its own explicit test (see Unit Tests, AC3b below): clicking the existing `.sw-stage-edit` link (now nested inside the larger single-click cell target) must still result in exactly one correctly-populated panel open, not a double-open or a stale/incorrect `panelStageId`.

## Note on AC3's CSS-layout-dependent portion (B2 classification)

AC3 has two parts. The FUNCTIONAL part — clicking the header cell (not just the link) opens the panel for the right stage — is testable via jsdom `dispatchEvent`, no real layout needed. The VISUAL/SIZE part — the click target is actually larger in real rendering, and remains keyboard-focus-visible — requires real CSS layout. Per CLAUDE.md's B2 rule, this part is classified `CSS-layout-dependent`, covered by a new Playwright E2E scenario (`tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js`), following `jcx-s3`/`jcx-s6`'s own established precedent for this exact feature area (and their own precedent for a RISK-ACCEPT if the already-tracked dashboard CSRF gap blocks real E2E dispatch again).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | 3-state save indicator; error state visually distinct from success; no cross-field timer race | 3 tests | — | — | — | — | 🟢 |
| AC2 | Stage-add success patches DOM in place, no reload, view unchanged | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Single-click on header cell opens panel (functional); larger real click target + keyboard-focus-visible (visual) | 2 tests | — | 1 test | — | CSS-layout-dependent (visual portion only) | 🟡 |
| AC4 | Empty field values and unnamed stages render in muted, dulled treatment | 1 test | — | — | — | — | 🟢 |
| AC5 | Grid row padding/column-gap normalized to the 8px scale | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Real click-target hit-area size and keyboard-focus-visible rendering cannot be verified without real CSS layout | AC3 (visual portion only) | CSS-layout-dependent | jsdom does not compute real element box size or focus-ring rendering | E2E test — `tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js` (Playwright, ADR-018 already configured — not a tooling gap); if blocked by the already-tracked dashboard CSRF gap, RISK-ACCEPT at `/verify-completion` per `jcx-s3`/`jcx-s6`'s own established precedent |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; E2E spec seeds a real journey via `seedJourneyWithStages` (established helper).
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A rendered stage panel; a mocked `fetch` that can be made to resolve or reject on demand per call | jsdom + mocked `window.fetch` | None | |
| AC2 | A mock pool and a mocked `fetch` resolving `{id, name, position}` for the stage-add POST | jsdom + mocked `window.fetch` | None | |
| AC3 | A rendered grid header cell + drawflow node, each with their own stage data | jsdom (unit); real browser (E2E) | None | |
| AC4 | A stage with at least one empty field and a stage with a default/empty name | Synthetic mock pool | None | |
| AC5 | A rendered grid with 2+ stages | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the single CSS-layout-dependent AC3 portion already covered above.

---

## Unit Tests

### AC1a: a failed field save renders in a distinct, danger-colored element/class — never the success class

- **Verifies:** AC1
- **Precondition:** Rendered stage panel; mocked `fetch` configured to reject for one field's PATCH
- **Action:** Blur that field to trigger its autosave
- **Expected result:** The resulting error-state element does NOT carry the same class the success case uses (`sw-stage-panel-saved--visible` reused as-is today), and DOES carry a distinct danger-colored class (e.g. reusing this page's own existing `sw-stage-reorder-error`-style convention) — assert the two are never simultaneously true for the error case
- **Edge case:** No

### AC1b: 3 persistent states — Saved / Saving… / Failed to save — Retry

- **Verifies:** AC1
- **Precondition:** Rendered stage panel; mocked `fetch` with a controllable resolve/reject and a controllable delay
- **Action:** Trigger a save; inspect the indicator's text/state immediately (in-flight), then after resolve (success) and separately after reject (failure)
- **Expected result:** Exactly 3 distinguishable states appear at the right times: `Saving…` while the request is pending, `Saved` after a successful resolve, `Failed to save — Retry` after a rejection — and the `Failed to save` state does not auto-clear via any timeout
- **Edge case:** Yes — rapid double-blur before the first request resolves must not show a stale `Saving…` after the second (and final) result is known

### AC1c (resolves review 1-M1): a stale success-clear timeout from one field must not hide a later error on another field

- **Verifies:** AC1
- **Precondition:** Rendered stage panel; mocked `fetch` and mocked `setTimeout`/fake timers
- **Action:** Save field A successfully (schedules its own clear timer), then within the same timer window save field B and have it fail
- **Expected result:** When field A's original timer would have fired, field B's `Failed to save — Retry` state is still visible — the implementation must track which save is current (e.g. a sequence token) rather than letting every independent timeout clear unconditionally
- **Edge case:** Yes — this IS the edge case; it is the review finding being closed

### AC2 (unit): stage-add success patches the DOM in place, no reload, active view unchanged

- **Verifies:** AC2
- **Precondition:** Rendered canvas with the Customer-experience view active (or any non-default view); mocked `fetch` resolving `{id: 's9', name: 'New stage', position: 3}` for the stage-add POST; `window.location.reload` replaced with a spy
- **Action:** Click "+ Add stage," type a name, trigger save (blur or Enter)
- **Expected result:** `window.location.reload` is never called; a new stage element reflecting the response's own `id`/`name`/`position` appears in the DOM; the canvas root's own active-view class is unchanged after the save
- **Edge case:** No

### AC3a (unit, functional only): single-click on the grid header cell opens the panel for the right stage

- **Verifies:** AC3
- **Precondition:** Rendered Customer-experience grid with 1+ stages
- **Action:** Dispatch a click directly on the header cell (not on the nested `.sw-stage-edit` link)
- **Expected result:** The stage panel opens, populated with that exact stage's own data (`panelStageId` matches)
- **Edge case:** No

### AC3b (resolves review 1-M2): clicking the nested "Edit stage" link still produces exactly one correctly-populated open

- **Verifies:** AC3
- **Precondition:** Same as AC3a
- **Action:** Dispatch a click directly on the `.sw-stage-edit` link itself (which bubbles to the new cell-level listener too)
- **Expected result:** The panel opens exactly once, with the correct stage's data — no double-toggle (open-then-immediately-close), no incorrect `panelStageId` from a second, conflicting handler firing
- **Edge case:** Yes — this IS the edge case; it is the review finding being closed

### AC4: empty field values and unnamed stages render in a muted, dulled treatment

- **Verifies:** AC4
- **Precondition:** A stage with an empty `pain_points` field and a separate stage with no `name` set
- **Action:** Render the Customer experience tab
- **Expected result:** Both the empty-field cell and the empty-name stage header use the same muted-treatment class/color (not the full-strength real-data color/text) — a stage WITH that field/name set uses the normal, non-muted treatment, confirming the distinction is conditional, not applied unconditionally
- **Edge case:** Yes — a field containing only whitespace (not truly empty) must still be treated as a real value, not muted (matches this codebase's own existing `.trim()`-based emptiness convention elsewhere)

### AC5: grid row padding and column-gap normalized to the 8px scale

- **Verifies:** AC5
- **Precondition:** Rendered grid with 2+ stages
- **Action:** Inspect the rendered `<style>` block's own row/cell rules via jsdom `getComputedStyle`
- **Expected result:** Row padding and column-gap are both exact multiples of 8px (not `10px`/`12px`); `jcx-s6`'s own `grid-template-columns` value (column widths, `minmax(200px,1fr)`) is unchanged

---

## E2E Tests (`tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js`)

### Single-click target is visibly larger and remains keyboard-focus-visible

- **Verifies:** AC3 (visual portion)
- **Precondition:** Real browser, journey with 1+ stages
- **Action:** Measure the clickable header-cell element's own real bounding box (`getBoundingClientRect()`) vs. the nested link's own bounding box; Tab to the cell and confirm a visible focus indicator
- **Expected result:** The cell's own clickable area is materially larger than the link's own area alone; the focus-visible style is present when reached via keyboard, matching the existing link's own already-correct keyboard semantics

---

## NFR Tests

### Accessibility — AC3's larger click target remains keyboard-operable

- **NFR addressed:** Accessibility (WCAG 2.1 AA)
- **Measurement method:** AC3a/AC3b unit tests (functional) + the E2E scenario above (visual/focus-visible)
- **Pass threshold:** Reachable via Tab, operable via Enter/Space, exactly as the existing link already was
- **Tool:** jsdom (unit) + Playwright (E2E)

### Accessibility — AC1's danger-colored error state meets contrast requirements

- **NFR addressed:** Accessibility (WCAG 2.1 AA)
- **Measurement method:** Manual contrast check against `var(--danger)`'s own already-established use elsewhere on this page (`sw-stage-reorder-error`, `sw-feature-mapping-warning`) — reusing an already-compliant token, not introducing a new color
- **Pass threshold:** Same contrast ratio this page's existing danger-colored elements already meet
- **Tool:** Manual, consistent with how this page's existing danger-color usage was verified

---

## Gap table

No gaps beyond AC3's visual/size portion, already covered by the real E2E scenario above (not a RISK-ACCEPT-requiring gap unless the already-tracked dashboard CSRF gap blocks it at `/verify-completion` time, per `jcx-s3`/`jcx-s6`'s own established precedent).
