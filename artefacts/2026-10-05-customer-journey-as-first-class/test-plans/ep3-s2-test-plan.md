## Test Plan: Journey health indicators: per-stage health state and summary bar

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
**Epic reference:** journey-health-and-customer-experience-views
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-10):**

- **No new query needed.** Health computation needs exactly the data `ep2-s3`'s own `mappingsByStage` lookup already provides (`SELECT id, journey_stage_id, feature_slug, metric_keys FROM feature_customer_journey_stage_mappings WHERE journey_id = $1`, already grouped by stage). Health state is a pure function of that already-fetched data: zero mappings → ❌; ≥1 mapping, none with `metric_keys.length > 0` → ⚠️; ≥1 mapping with at least one having `metric_keys.length > 0` → ✅. Matches the Architecture Constraint "Health computation is server-side at render time (no separate background job)" exactly — it's computed inline in `handleGetJourneyCanvas`, same render pass as everything else.
- **Icon set correction (operator decision not required — same resolution pattern already applied twice this session, `ep2-s3` Task 1 WARNING_ICON and this feature's own established DESIGN.md enforcement):** AC1/AC2/AC3's own literal ✅/⚠️/❌ unicode glyphs violate DESIGN.md's "no unicode glyphs in new work, use the SVG icon set instead" rule (rule confirmed again: `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md` line 73, explicitly naming "check"/"warning"/"close" as defined icon types). Resolved: `check` icon (new `CHECK_ICON` constant) for the ✅ semantic, `ep2-s3`'s own existing `WARNING_ICON` reused unmodified for the ⚠️ semantic, `close` icon (new `CLOSE_ICON` constant) for the ❌ semantic — each coloured via the existing `--success`/`--warn`/`--danger` CSS custom properties, matching `MOMENT_OF_TRUTH_ICON`/`ARROW_UP_ICON`/`ARROW_DOWN_ICON`/`WARNING_ICON`'s own established style (20×20 viewBox, 1.5px stroke). The semantic meaning described by each AC is preserved exactly; only the glyph-vs-SVG implementation detail changes, consistent with this file's own already-enforced convention.
- **AC6 reload gap (operator decision, 2026-10-10):** AC6 requires health indicators to update immediately after a feature mapping is saved/removed, "the same server round-trip the save action itself already triggers" — but the real `handlePostFeatureMapping`/`handleDeleteFeatureMapping` client-side success handlers (shipped in `ep2-s2`/`ep2-s3`) only close the modal or remove a DOM row; neither triggers a page reload. Resolved: add `window.location.reload()` to both success handlers, matching the already-established "+ Add stage" precedent (`ep1-s2`), which already reloads on successful save. This is a real, scoped modification to two previously-merged stories' own shipped client-side code — operator-confirmed on 2026-10-10, not treated as a new ambiguity requiring further question since the resolution direction was explicit.
- **No new route, no new DB write.** This story only reads already-fetched data and adds a `window.location.reload()` call to two existing handlers — `server.js` is untouched.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern. AC1-AC5 are pure server-rendered markup assertions; AC6 is testable via a jsdom behavioral test asserting the reload call fires (stubbing `window.location.reload`, not navigating a real browser). No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stage with ≥1 mapped feature AND ≥1 selected metric key shows ✅ (check icon) with accessible label | 1 test | — | — | — | — | 🟢 |
| AC2 | Stage with mapped features but zero metric keys selected shows ⚠️ (warning icon) with accessible label | 1 test | — | — | — | — | 🟢 |
| AC3 | Stage with no mapped features shows ❌ (close icon) with accessible label | 1 test | — | — | — | — | 🟢 |
| AC4 | Summary bar shows "X of Y stages have metric coverage" | 1 test | — | — | — | — | 🟢 |
| AC5 | Health state communicated via icon AND accessible label, not colour alone | — | — | — | — | — | 🟢 (asserted within AC1/AC2/AC3's own tests, not a separate test case) |
| AC6 | Saving/removing a mapping triggers a reload so health/summary reflect the new state | 2 tests | — | — | — | — | 🟢 (jsdom behavioral) |

---

## Coverage gaps

None. AC5 has no dedicated test entry because it is structurally inseparable from AC1/AC2/AC3 — each of those 3 tests asserts both the icon element AND a real accessible label (`aria-label` or equivalent) are present together, which is exactly what AC5 requires; a separate test would only re-check the same markup.

---

## Test Data Strategy

**Source:** Synthetic — extends `tests/check-ep2-s3-delivery-view.js`'s own `makeCanvasMockPool` convention (adding `mappingRows` per stage) and `check-ep2-s2-feature-mapping-save.js`'s own `makeMappingMockPool`/`makeMappingReqRes` conventions for AC6's handler-level assertions.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A stage with one mapping row `{ metric_keys: ['m1'] }` | Synthetic | None | Assert the check icon + an accessible label (e.g. `aria-label` containing "Covered" or similar) render for that stage |
| AC2 | A stage with one mapping row `{ metric_keys: [] }` | Synthetic | None | Assert the warning icon + accessible label render |
| AC3 | A stage with zero mapping rows | Synthetic | None | Assert the close icon + accessible label render |
| AC4 | 3 stages: one ✅ (mapping with metric keys), one ⚠️ (mapping, no metric keys), one ❌ (no mapping) | Synthetic | None | Assert the summary bar shows the exact text "1 of 3 stages have metric coverage" |
| AC6 (save) | A mock `window.fetch` resolving `{ok:true}` for the Save-mapping request | Synthetic | None | Assert `window.location.reload` is called after a successful Save |
| AC6 (remove) | A mock `window.fetch` resolving `{ok:true}` for the Remove request | Synthetic | None | Assert `window.location.reload` is called after a successful Remove |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### A stage with a mapped feature and a selected metric key shows the ✅ health indicator with an accessible label

- **Verifies:** AC1, AC5
- **Action:** Call `handleGetJourneyCanvas` with a mocked mapping `{ journey_stage_id: 's1', metric_keys: ['m1'] }` for stage `s1`
- **Expected result:** The rendered markup for `s1` includes a health indicator element containing the check icon (a distinguishing CSS class, e.g. `sw-stage-health--covered`) AND a real accessible label (`aria-label` or visible text) describing it as covered/healthy — not an icon alone
- **Edge case:** No

### A stage with mapped features but zero metric keys shows the ⚠️ health indicator with an accessible label

- **Verifies:** AC2, AC5
- **Action:** Mocked mapping `{ journey_stage_id: 's2', metric_keys: [] }`
- **Expected result:** The health indicator for `s2` shows the warning icon (reusing `ep2-s3`'s own `WARNING_ICON`) with a real accessible label distinct from the ✅ case's label
- **Edge case:** Yes

### A stage with no mapped features shows the ❌ health indicator with an accessible label

- **Verifies:** AC3, AC5
- **Action:** Zero mapping rows for stage `s3`
- **Expected result:** The health indicator for `s3` shows the close icon with a real accessible label distinct from the other two cases
- **Edge case:** Yes

### The summary bar shows the correct "X of Y stages have metric coverage" count

- **Verifies:** AC4
- **Action:** Render a canvas with 3 stages: one with a mapping+metric key (✅), one with a mapping but no metric key (⚠️), one with no mapping (❌)
- **Expected result:** The summary bar renders the exact text "1 of 3 stages have metric coverage" — X counts only ✅ stages, Y is the total stage count regardless of health state
- **Edge case:** No

---

## Integration Tests

### Saving a feature mapping triggers a reload so the health indicator reflects the new state

- **Verifies:** AC6
- **Components involved:** The existing Save-mapping client-side handler (`ep2-s2`), extended with a reload call
- **Action:** jsdom: render the canvas, stub both `window.fetch` (resolving `{ok:true}`) and `window.location.reload`, click through Map feature → select feature → Save mapping
- **Expected result:** `window.location.reload` is called exactly once after the successful save, after the existing `fpCloseFn()` cleanup

### Removing an orphaned mapping triggers a reload so the health indicator reflects the new state

- **Verifies:** AC6
- **Components involved:** The existing Remove-mapping client-side handler (`ep2-s3`), extended with a reload call
- **Action:** jsdom: render a canvas with a feature-not-found mapping, stub `window.fetch` (resolving `{ok:true}`) and `window.location.reload`, click the Remove button
- **Expected result:** `window.location.reload` is called exactly once after the successful delete
