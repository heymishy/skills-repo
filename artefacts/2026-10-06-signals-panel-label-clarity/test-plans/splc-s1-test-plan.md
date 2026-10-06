## Test Plan: Signals panel must not render redundant/meaningless source and type labels on every card

**Story reference:** artefacts/2026-10-06-signals-panel-label-clarity/stories/splc-s1-collapse-redundant-source-type-labels.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK)
**Date:** 2026-10-06

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. This story's own tests extend the existing dedicated test file `tests/check-ep2-s1-signals-panel.js` (not a new file — that file already owns `renderSignalsPanel`/`_signalItem` coverage).

**Real architecture grounding (confirmed by direct code read, 2026-10-06):**
- `src/web-ui/views/signals-panel-view.js`, `_signalItem()` (lines 58-77) is a pure function: `(signal, csrfToken, isDismissedFlag, currentUrl) -> htmlString`. No I/O, directly unit-testable by calling `renderSignalsPanel([signal], 'test-csrf-token')` and asserting on the returned HTML string, matching the existing test file's own convention.
- `signal.source` and `signal.type` are both already passed through `escHtml()` before this change (lines 42-43) — this fix changes only how the two already-escaped values are arranged into HTML, not escaping behaviour itself.
- `data-signal-type="' + safeType + '"` (line 59) is asserted by 3 other test files (`check-ep2-s1-signals-panel.js`, `check-sptu-s2-signals-filter.js`, `check-sptu-s3-signals-sort-visibility.js`) and must not move or change value.

**E2E/browser-layout detection (Step 3a):** N/A — this is a server-rendered HTML string change with no CSS layout, positioning, or drag/drop behaviour. Plain text/DOM-presence assertions are sufficient.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Single label line when source === type | 1 test | — | — | — | — | 🟢 |
| AC2 | Combined single line when source !== type | 1 test | — | — | — | — | 🟢 |
| AC3 | `data-signal-type` attribute unchanged | 1 test | — | — | — | — | 🟢 |
| AC4 | Pre-existing suites still pass | — | — | — | — | — | 🟢 (regression — reruns existing suites unchanged) |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — plain JS object literals built in test setup, matching this test file's own existing convention (no fixtures, no mocking of `fs`, since `_signalItem`/`renderSignalsPanel` take signal data as a plain argument).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A signal object with `source === type` (e.g. `{ source: 'parse-error', type: 'parse-error', text: '...' }`) | Synthetic | None | Mirrors the real `_makeSignal('parse-error', 'parse-error', ...)` shape exactly |
| AC2 | A signal object with `source !== type` (e.g. `{ source: 'pipeline-state', type: 'feature-status', text: '...' }`) | Synthetic | None | Mirrors the real `_parsePipelineState` output shape |
| AC3 | Either signal object above | Synthetic | None | Asserts `data-signal-type="..."` substring presence/value, same assertion style as existing tests in this file |
| AC4 | `tests/check-ep2-s1-signals-panel.js`, `check-sptu-s2-signals-filter.js`, `check-sptu-s3-signals-sort-visibility.js`, `check-sptu-s4-signals-dismiss.js`'s own existing fixtures | Synthetic | None | Regression only, no new fixtures |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderSignalsPanel collapses source/type to one label line when they are identical

- **Verifies:** AC1
- **Precondition:** A signal `{ id: 's1', source: 'parse-error', type: 'parse-error', text: 'results: ENOENT ...', timestamp: null }`
- **Action:** Call `renderSignalsPanel([signal], 'test-csrf-token')`
- **Expected result:** The returned HTML contains the string `parse-error` exactly once within that card's label region (not twice as two separate `.signal-source`/`.signal-type` divs each containing `parse-error`) — asserted by counting occurrences of `>parse-error<` (or the then-current rendered label wrapper) within the single-card output and asserting the count is `1`, not `2`
- **Edge case:** Yes — this is the exact defect pattern (`_makeSignal('parse-error', 'parse-error', ...)`) that caused the operator's real misreading this session

### renderSignalsPanel shows both values on one line when source and type differ

- **Verifies:** AC2
- **Precondition:** A signal `{ id: 's2', source: 'pipeline-state', type: 'feature-status', text: 'Some feature -- stage: definition', timestamp: '2026-10-06T00:00:00.000Z' }`
- **Action:** Call `renderSignalsPanel([signal], 'test-csrf-token')`
- **Expected result:** The returned HTML contains both `pipeline-state` and `feature-status` within a single label line/element for that card (not two separate full-width stacked `<div>` elements) — asserted by locating the single label container and confirming both substrings appear inside it, and that there are not two separate `.signal-source`/`.signal-type` sibling `<div>` elements each holding one value
- **Edge case:** No — this is the common differing-values case

### renderSignalsPanel leaves data-signal-type unchanged for both cases above

- **Verifies:** AC3
- **Precondition:** Both signal objects from the two tests above
- **Action:** Call `renderSignalsPanel([signal], 'test-csrf-token')` for each
- **Expected result:** `data-signal-type="parse-error"` and `data-signal-type="feature-status"` respectively are present, unchanged in value, in the same `data-signal-type="..."` attribute position on the outer card element
- **Edge case:** No — this is the explicit non-regression guard named by AC3

---

## Integration Tests

None — this is a pure view-function fix with no new route/handler behaviour. AC4's regression coverage is the full existing `tests/check-ep2-s1-signals-panel.js`, `check-sptu-s2-signals-filter.js`, `check-sptu-s3-signals-sort-visibility.js`, and `check-sptu-s4-signals-dismiss.js` suites, re-run unchanged.

---

## NFR Tests

None — this story's NFR section states no performance, security, or audit NFR applies beyond existing behaviour (see story). The one stated Accessibility NFR (combined label remains readable text, not icon-only) is verified by the AC1/AC2 unit tests themselves, which assert on text content — no separate dedicated NFR test needed.

---

## Out of Scope for This Test Plan

- A label-mapping dictionary test (named out of scope in the story itself — no such dictionary is being built).
- Any test of the filter-compose behaviour — confirmed this session to already work correctly; not part of this story's change set.

---

## Gap table

No gaps.
