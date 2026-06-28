## Test Plan: Phase row model with locked future-phase rows

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.2.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Test plan author:** Copilot
**Date:** 2026-06-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Phase rows rendered per discovery.md phases; current has data-phase-current="true"; others have false + locked class | 3 tests | — | — | — | — | 🟢 |
| AC2 | Locked row shows lock overlay with correct text; visually distinct; screen reader annotation | 2 tests | — | — | — | — | 🟢 |
| AC3 | Drag to locked future-phase row rejected — no dragover preventDefault, card snaps back | 2 tests | — | — | — | — | 🟢 |
| AC4 | No phases section in discovery.md → single "Phase 1 (current)" row, no error | 2 tests | — | — | — | — | 🟢 |
| AC5 | Drag within current-phase row succeeds (dic.1 AC2 regression) | 1 test | — | — | — | — | 🟢 |
| AC6 | Map re-initialisation re-derives phase model from discovery.md; pending changes cleared | 2 tests | — | — | — | — | 🟢 |
| AC7 | parsePhaseModel injectable adapter: stub-throw default + production wiring verified | 2 tests | — | — | — | — | 🟢 |
| NFR-A11Y | Locked row does not receive keyboard focus as drop target | 1 test | — | — | 1 scenario | Partial | 🟡 |
| NFR-PERF | parsePhaseModel called once at session start, cached; not called on every drag event | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Hatched CSS visual on locked row | AC2 | CSS rendering | JSDOM does not compute CSS | Review CSS rule in skills.js; manual visual check 🟡 |
| Real screen reader announcement of lock overlay | AC2 | AT behaviour | Requires real AT | axe-core validates role="note"/aria-label rule; real announcement is manual 🟡 |
| Keyboard focus not reaching locked row during tab navigation | NFR-A11Y | Browser focus behaviour | JSDOM focus model incomplete | Manual: verify Tab key does not land on locked row cells during drag-ready state 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — discovery.md content strings; mock session state.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | discovery.md content with `## Phases` section listing 3 phases | Synthetic | None | |
| AC2 | Rendered locked row HTML | Synthetic | None | Lock overlay text: "Not yet defined — awaits Phase N's Definition pass" |
| AC3 | Story map fixture with current + locked rows; drag event sequence | Synthetic | None | |
| AC4 | discovery.md content with no `## Phases` section | Synthetic | None | |
| AC5 | Story map fixture with current-phase row; drag within row | Synthetic | None | |
| AC6 | session with prior pending changes; re-init trigger | Synthetic | None | |
| AC7 | Injectable adapter test harness | Synthetic | None | |

### PCI / sensitivity constraints

None.

---

## Unit Tests

### parsePhaseModel returns phases array for well-formed discovery.md

- **Verifies:** AC1
- **Precondition:** `parsePhaseModel(discoveryContent)` is callable with a discovery.md string
- **Action:** Call with a string containing `## Phases\n- Phase 1 (current)\n- Phase 2\n- Phase 3`
- **Expected result:** Returns `[{ name: 'Phase 1 (current)', isCurrent: true }, { name: 'Phase 2', isCurrent: false }, { name: 'Phase 3', isCurrent: false }]`
- **Edge case:** No

### parsePhaseModel marks only the first phase as current

- **Verifies:** AC1 (only first phase is current)
- **Precondition:** Same
- **Action:** Same call with 3 phases
- **Expected result:** Exactly one entry has `isCurrent: true`; all others have `isCurrent: false`
- **Edge case:** No

### renderDefinitionMap renders locked class on non-current phase rows

- **Verifies:** AC1
- **Precondition:** `renderDefinitionMap(stories, canvasCards, phaseModel)` callable; phaseModel has 1 current + 2 locked phases
- **Action:** Call with the 3-phase model
- **Expected result:** HTML contains 1 `<tr data-phase-current="true">` and 2 `<tr data-phase-current="false" class="phase-row phase-row--locked">`
- **Edge case:** No

### locked row contains lock overlay with correct text

- **Verifies:** AC2
- **Precondition:** Rendered HTML from above
- **Action:** Inspect the locked row HTML
- **Expected result:** Contains `<div class="phase-lock-label">Not yet defined — awaits Phase 2's Definition pass</div>` (or equivalent Phase N substitution)
- **Edge case:** No

### lock overlay element has accessible annotation

- **Verifies:** AC2 (screen reader)
- **Precondition:** Same HTML
- **Action:** Run `axe.run` on the locked row HTML; also assert lock div has `role="note"` or `aria-label`
- **Expected result:** Zero axe violations at AA level; `role="note"` present on the lock overlay
- **Edge case:** No

### dragover on locked row does not call preventDefault

- **Verifies:** AC3
- **Precondition:** Story map DOM with current + locked row; drag guard handler attached; a card is in flight from the current row
- **Action:** Dispatch `dragover` on a cell in a locked row
- **Expected result:** `event.preventDefault()` is NOT called (tracked via mock event)
- **Edge case:** No

### drag to locked row produces no state change

- **Verifies:** AC3
- **Precondition:** Same; `session.canvasCards.pendingReorder` initially empty
- **Action:** Attempt drop on locked row cell
- **Expected result:** `pendingReorder` remains empty; DOM does not change
- **Edge case:** No

### parsePhaseModel returns single-row fallback when phases section absent

- **Verifies:** AC4
- **Precondition:** discovery.md string with no `## Phases` section
- **Action:** Call `parsePhaseModel(discoveryContent)`
- **Expected result:** Returns `[{ name: 'Phase 1 (current)', isCurrent: true }]`; no exception thrown
- **Edge case:** Yes — absent section

### parsePhaseModel returns single-row fallback when phases section present but empty

- **Verifies:** AC4 (malformed — from LOW-1 in review)
- **Precondition:** discovery.md string with `## Phases\n` and no items following
- **Action:** Call `parsePhaseModel(discoveryContent)`
- **Expected result:** Returns `[{ name: 'Phase 1 (current)', isCurrent: true }]`; no exception thrown
- **Edge case:** Yes — empty section

### drag within current-phase row succeeds (regression of dic.1 AC2)

- **Verifies:** AC5
- **Precondition:** Story map with a current-phase row containing 3 cards; drag guard attached
- **Action:** Dispatch `dragover` on a cell in the current-phase row
- **Expected result:** `event.preventDefault()` IS called (drop is allowed); phase guard does not block within-current-phase drag
- **Edge case:** No

### map re-init clears pendingReorder from prior pending state

- **Verifies:** AC6
- **Precondition:** `session.canvasCards.pendingReorder` has 2 entries; map re-init is triggered
- **Action:** Call the map re-initialisation function
- **Expected result:** `pendingReorder` is empty after re-init; pending-changes count resets to 0
- **Edge case:** No

### map re-init re-derives phase model from discovery.md (not from prior session state)

- **Verifies:** AC6
- **Precondition:** session has a cached phase model; discovery.md has been updated (or fresh read is expected)
- **Action:** Call re-init; capture the phase model used
- **Expected result:** The phase model passed to `renderDefinitionMap` is freshly parsed from the discovery.md on disk (not the stale cached value)
- **Edge case:** No

### parsePhaseModel stub default throws if adapter not wired

- **Verifies:** AC7
- **Precondition:** The `_parsePhaseModel` variable is set to the stub default (not wired)
- **Action:** Call the route handler that invokes `_parsePhaseModel()`
- **Expected result:** Throws `Error('Adapter not wired: parsePhaseModel. Call setParsePhaseModel() with a real implementation before use.')`
- **Edge case:** Yes — misconfiguration guard

### parsePhaseModel production wiring returns expected phase array from real discovery fixture

- **Verifies:** AC7 (production wiring)
- **Precondition:** `setParsePhaseModel(defaultParsePhaseModel)` has been called (production wiring); a real discovery.md fixture exists at a test path
- **Action:** Call `_parsePhaseModel(discoveryFixturePath)`
- **Expected result:** Returns a non-empty array with at least one `{ name, isCurrent }` entry; no exception
- **Edge case:** No

---

## NFR Tests

### parsePhaseModel parse count is exactly 1 per session init

- **NFR addressed:** Performance (parse-once, cache)
- **Measurement method:** Wrap `parsePhaseModel` with a call counter; trigger 3 drag events on the story map; assert the counter is still 1 (not incremented per drag)
- **Pass threshold:** Counter === 1 after N drag events

---

## Out of Scope for This Test Plan

- Add-story affordance rendering (locked rows have no `+` button) — tested in dic.3
- Touch placement rejection into locked rows — tested in dic.4
- Server-side phase guard in canvas-edit dispatch — tested in dic.5

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Hatched CSS visual on locked row | JSDOM does not compute CSS | Visual review of CSS rule; manual check in browser on fixture |
| Keyboard focus not reaching locked row | JSDOM focus model incomplete | Manual: Tab through story map with a locked row; verify focus stays in current-phase row |
