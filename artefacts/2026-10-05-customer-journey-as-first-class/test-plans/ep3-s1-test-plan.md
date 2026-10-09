## Test Plan: Customer experience view: emotion, pain points, opportunities annotation rows

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
**Epic reference:** journey-health-and-customer-experience-views
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-10):**

- **No new schema, no new query.** `emotion`, `pain_points`, `opportunities` already exist as columns on `customer_journey_stages` (added by `ep1-s3`'s own migration) and are already selected by the existing stages query in `handleGetJourneyCanvas` (`journeys.js`, the `SELECT id, name, position, description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities, moment_of_truth FROM customer_journey_stages ...` query). This story is pure rendering — no DB write, no new read query, no new route.
- **The view toggle already exists, built by `ep2-s3`.** The "Customer experience" button (`data-view="customer-experience"`) and its click handler (generic `className` swap, works for any `data-view` value) already exist and are already confirmed working for this exact button (Task 2's own spec-compliance review manually verified the Customer experience path, since it had no dedicated automated test at the time — see `ep2-s3`'s own review history). This story needs ONLY a new CSS rule pairing `.sw-journey-canvas--view-customer-experience` with a new `.sw-stage-annotations--customer-experience` class, following `ep2-s3`'s own exact `.sw-journey-canvas--view-delivery .sw-stage-annotations--delivery{display:block}` pattern — no new toggle markup, no new click-handler code.
- **Emotion enum values** (`STAGE_EMOTION_VALUES`, already defined in `journeys.js`): `['positive', 'neutral', 'negative', 'mixed']`. No design-system-mandated color mapping exists in `design.md` beyond "colour chip + text label (not colour alone)" — resolved by reusing this file's own existing semantic CSS custom properties (`--success` for positive, `--danger` for negative, `--warn` for mixed, `--ink-2` for neutral), consistent with how `MOMENT_OF_TRUTH_ICON`/health-state colors are handled elsewhere in this codebase. No operator decision needed — this is an implementation detail, not an ambiguity in the AC text itself.
- **Annotation block placement mirrors `ep2-s3`'s own precedent exactly:** a new sibling `<div class="sw-stage-annotations sw-stage-annotations--customer-experience" data-stage-id="...">` rendered alongside the existing `.sw-stage-annotations--delivery` block, inside the same per-stage template in `stagesHtml`'s own `stages.map(...)` callback.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern (no drag, no pointer coordinates, no `getBoundingClientRect`). AC3's toggle behavior is a pure CSS-class swap, already proven generic and reusable by `ep2-s3`'s own AC3 test. No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Customer experience view shows emotion chip/label, pain points, opportunities per stage | 1 test | — | — | — | — | 🟢 |
| AC2 | A stage with no emotion/pain points/opportunities set shows "Not set" for all three, none omitted | 1 test | — | — | — | — | 🟢 |
| AC3 | View toggle shows/hides Customer experience annotation rows via CSS class, no server round-trip | 1 test | — | — | — | — | 🟢 (jsdom behavioral) |
| AC4 | Emotion shown via both a colour chip AND a text label, not colour alone | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are covered by server-rendered markup assertions against mocked stage rows (with all 4 emotion enum values plus null, and null/non-null pain_points/opportunities), plus one jsdom behavioral test reusing `ep2-s3`'s own `extractFirstScript`/`buildDom` technique for the view-toggle interaction.

---

## Test Data Strategy

**Source:** Synthetic — extends `tests/check-ep2-s3-delivery-view.js`'s own `makeCanvasMockPool`/`buildDom` conventions (new test file, same helper shapes).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked stage row with `emotion: 'positive', pain_points: 'Checkout is slow', opportunities: 'Add express checkout'` | Synthetic | None | Assert the Customer experience annotation block contains "positive", "Checkout is slow", "Add express checkout" |
| AC2 | A mocked stage row with `emotion: null, pain_points: null, opportunities: null` | Synthetic | None | Assert all three rows show the exact text "Not set" — 3 occurrences, not a single combined message |
| AC3 | Rendered canvas with one stage having non-null emotion/pain_points/opportunities | Synthetic | None | jsdom: click the existing "Customer experience" toggle button, assert the new annotation block's `getComputedStyle(...).display` becomes `'block'`, assert zero fetch calls, click "Canvas" and assert it returns to `'none'` |
| AC4 | Mocked stage with `emotion: 'negative'` | Synthetic | None | Assert the rendered markup contains BOTH a colour-chip element (a `<span>` with a distinguishing CSS class, e.g. `sw-stage-emotion-chip`) AND the literal text "negative" — not just a bare coloured dot with no text |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Customer experience view shows emotion chip, pain points, and opportunities for a fully-populated stage

- **Verifies:** AC1, AC4
- **Action:** Call `handleGetJourneyCanvas` with a mocked stage row `{ id: 's1', name: 'Stage 1', emotion: 'positive', pain_points: 'Checkout is slow', opportunities: 'Add express checkout' }`
- **Expected result:** The rendered markup includes a `.sw-stage-annotations--customer-experience` block for `s1` containing: an emotion chip element (distinguishing CSS class, e.g. `sw-stage-emotion-chip--positive`) AND the literal text "positive" (not colour alone), the literal text "Checkout is slow", and the literal text "Add express checkout"
- **Edge case:** No

### A stage with no emotion, pain points, or opportunities shows "Not set" for all three, none omitted

- **Verifies:** AC2
- **Action:** Mocked stage row `{ id: 's2', name: 'Stage 2', emotion: null, pain_points: null, opportunities: null }`
- **Expected result:** The Customer experience annotation block for `s2` contains exactly 3 occurrences of the text "Not set" (one per row) — no row is hidden or collapsed into a single combined empty-state message
- **Edge case:** Yes

### Switching to the Customer experience view shows the annotation rows via CSS class, with no server round-trip

- **Verifies:** AC3
- **Action:** Render the canvas (real script extraction + jsdom, same technique as `check-ep2-s3-delivery-view.js`), stub `window.fetch`, click the existing "Customer experience" view-toggle button (`data-view="customer-experience"`), then click "Canvas"
- **Expected result:** After clicking "Customer experience", the canvas root gains `sw-journey-canvas--view-customer-experience` and the `.sw-stage-annotations--customer-experience` block's computed `display` is `'block'`; after clicking "Canvas", both revert. Zero `fetch` calls throughout
- **Edge case:** No
