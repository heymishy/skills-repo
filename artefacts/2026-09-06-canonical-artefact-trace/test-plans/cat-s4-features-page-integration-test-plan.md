# Test Plan: The feature artefact-index page renders every document's real status, using the canonical trace

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target module:** `src/web-ui/routes/features.js` — `renderGroupedArtefactIndexHtml` (and its callers) rewired to consume `buildArtefactTrace`/`classifyDivergence` (`cat-s1`/`cat-s3`) instead of `feature-story-structure.js`
**Test runner:** `node scripts/run-all-tests.js`
**Test file:** `tests/check-cat-s4-features-page-integration.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 205 phase4 documents render, grouped by inference where possible | 2 | 1 | — | — | — | 🟢 |
| AC2 | `unregistered` documents carry a visible `.sw-pill` text-labeled indicator | 2 | — | — | — | — | 🟢 |
| AC3 | `orphaned-registration` stories show a distinct empty/gap state | 2 | — | — | — | — | 🟢 |
| AC4 | Fully-registered, non-divergent feature renders byte-identical to current `fadm-s1` output | 1 | 1 | — | — | — | 🟢 |
| AC5 | `not-yet-synced` feature shows a clear message, not a 500 or empty page | 2 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are assertable via string/DOM-substring checks on server-rendered HTML — the same `assert.ok(html.indexOf(...) !== -1)` style `fadm-s1`'s own test file already uses. None require real browser layout: every AC concerns markup *presence* (a pill, a section, a message string), not visual position, so no CSS-layout-dependent classification applies (see Step 3a screening below).

### Step 3a screening note

Scanned all 5 ACs for CSS-layout-dependent language (drag-drop, pointer coordinates, `getBoundingClientRect`, visual stacking). None found — AC2/AC3's ".sw-pill indicator"/"distinct empty state" language concerns HTML class/text presence, consistent with how `fadm-s1`'s own MC-A11Y-02 compliance was tested (string assertion, not pixel measurement). No E2E tooling gap applies to this story.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Real 205-file phase4 trace, passed through classification | `cat-s1`/`cat-s3`'s own real-fixture outputs | None | Reuses upstream stories' fixtures directly rather than re-deriving |
| AC2 | A trace containing at least one `unregistered`-classified document | Synthetic, built directly from `cat-s3`'s AC1 fixture | None | |
| AC3 | A trace containing at least one `orphaned-registration`-classified story | Synthetic, built directly from `cat-s3`'s AC2 fixture | None | |
| AC4 | Real, fully-registered `2026-09-06-feature-artefact-document-matrix` trace | Real, on disk | None | Diffed byte-for-byte against `fadm-s1`'s existing rendered output for the same feature — the AC's own comparison basis |
| AC5 | A trace with feature-level `not-yet-synced` status | Synthetic, built directly from `cat-s1`'s AC5 fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### phase4's 205 documents all appear in the rendered page (AC1)

- **Verifies:** AC1
- **Precondition:** Real `phase4` trace, classified via `cat-s3`
- **Action:** Call `renderGroupedArtefactIndexHtml` with the trace-derived input, count document rows/links in the output HTML
- **Expected result:** 205 distinct document references appear in the rendered HTML — none silently dropped
- **Edge case:** No

### documents with a successful inference render inside a labeled group, not the old 73-card type dump (AC1)

- **Verifies:** AC1
- **Precondition:** Same phase4 trace, at least one document with a successful inferred grouping
- **Action:** Render and inspect output structure
- **Expected result:** The inferred-group document appears under a grouped section heading, not inside the legacy `.sw-card`/`sw-section-title` type-grouped markup `fadm-s1`'s own test already asserts is gone (zero `.sw-card` sections)
- **Edge case:** Yes — directly guards against regressing to the pre-`fadm-s1` 73-card dump described in the discovery artefact

### unregistered document renders with a visible .sw-pill indicator carrying a text label (AC2)

- **Verifies:** AC2
- **Precondition:** Trace with one `unregistered`-classified document
- **Action:** Render and search output for the pill markup around that document's row
- **Expected result:** `html` contains a `.sw-pill` element with visible text content "Unregistered" (or equivalent), not merely a CSS class with no text — satisfying MC-A11Y-02's "color not sole indicator"
- **Edge case:** No

### unregistered indicator renders even when inference failed to group the document (AC2)

- **Verifies:** AC2
- **Precondition:** Trace with one `unregistered`-classified document that has no `inferredGroup`
- **Action:** Render and search for the pill
- **Expected result:** The "Unregistered" pill still renders, regardless of grouping success — matching the AC's explicit "regardless of whether it was successfully grouped by inference" clause
- **Edge case:** Yes

### orphaned-registration story renders a distinct empty/gap state (AC3)

- **Verifies:** AC3
- **Precondition:** Trace with one `orphaned-registration`-classified story (zero matching files)
- **Action:** Render and inspect the section for that story
- **Expected result:** A distinct gap-state marker (different CSS class and/or text label than the AC2 "Unregistered" pill) appears — e.g. text indicating a registered story with no files found
- **Edge case:** No

### orphaned-registration marker is visually and textually distinguishable from the unregistered pill (AC3, non-conflation check)

- **Verifies:** AC3
- **Precondition:** Both the AC2 and AC3 fixtures rendered together in one page (a trace containing both an unregistered document and an orphaned-registration story)
- **Action:** Compare the two markers' class names and text content
- **Expected result:** `assert.notStrictEqual` on both the CSS class and the text label between the two — an operator must be able to tell the two failure modes apart at a glance, per the AC's own explicit language
- **Edge case:** Yes

### fully-registered, non-divergent feature renders byte-identical to fadm-s1's current output (AC4)

- **Verifies:** AC4
- **Precondition:** Real `2026-09-06-feature-artefact-document-matrix` fixture, fully registered, `cat-s3` classifies every document `registered`
- **Action:** Render via the new trace-backed code path; separately capture the existing `fadm-s1` code path's output for the same fixture (pre-change baseline, captured once and stored as a golden fixture in the test file)
- **Expected result:** `assert.strictEqual(newHtml, goldenHtml)` — byte-identical output for the common case, per the AC's own explicit "byte-identical" requirement
- **Edge case:** No

### not-yet-synced feature shows a clear syncing message, not a crash or empty page (AC5)

- **Verifies:** AC5
- **Precondition:** Trace with feature-level `not-yet-synced` status
- **Action:** Render the page for this feature
- **Expected result:** Output HTML contains a clear, human-readable "still syncing" (or equivalent) message; `assert.ok(html.length > 0)` (not empty); no exception thrown during render
- **Edge case:** No

### not-yet-synced message is distinct from the unregistered pill and from a 500 error page (AC5, non-conflation check)

- **Verifies:** AC5
- **Precondition:** Same not-yet-synced fixture
- **Action:** Inspect rendered output
- **Expected result:** No "Unregistered" pill text appears anywhere on a not-yet-synced page; no generic error-page markup (matching this repo's existing 500-page template) is produced
- **Edge case:** Yes — directly tests AC5's own "not the unregistered flag (a different state)" clause

---

## Integration Tests

### full page render pipeline: route handler through buildArtefactTrace, classifyDivergence, to renderGroupedArtefactIndexHtml (AC1 seam)

- **Verifies:** AC1, AC2, AC3, AC5 (the full 3-way wiring)
- **Components involved:** `features.js` route handler, `artefact-trace.js` (`cat-s1`/`cat-s3`), `renderGroupedArtefactIndexHtml`
- **Precondition:** A mock Express `req`/`res` pair, real `phase4` slug
- **Action:** Invoke the route handler function directly (not via a live HTTP server — consistent with this repo's existing route-handler unit-test convention)
- **Expected result:** `res.send`/`res.end` is called once with HTML containing all 205 documents, correctly classified — confirms the three modules are wired together correctly end-to-end at the function level
- **Edge case:** No

### fadm-s1's own golden-output regression baseline stays reproducible after the data-source swap (AC4 seam)

- **Verifies:** AC4
- **Components involved:** Route handler, new trace-based data source, existing rendering function (unchanged per the story's own claim that only the data source changes)
- **Precondition:** `2026-09-06-feature-artefact-document-matrix` fixture
- **Action:** Run the full route handler before and after the `cat-s1`–`cat-s4` changes land (captured as a golden snapshot at test-authorship time, re-run post-implementation)
- **Expected result:** Identical output — confirms the rendering function itself (per AC4's own text: "this story changes the data source underneath the rendering, not the rendering itself") was not modified in a way that changes the common-case output
- **Edge case:** No

---

## NFR Tests

### page render for phase4's 205-file case does not regress beyond the 6ms walk cost plus normal rendering overhead

- **NFR addressed:** Performance
- **Measurement method:** `process.hrtime()` around the full route-handler call (walk + classify + render) for the `phase4` fixture
- **Pass threshold:** Total time comparable to `cat-s1`'s own measured 6ms walk plus the existing `fadm-s1` render time for a similarly-sized feature (baseline captured at test-authorship time) — no new performance ceiling is invented per the story's own NFR text
- **Tool:** Node `process.hrtime()`, asserted inline

### Unregistered indicator never relies on color alone

- **NFR addressed:** Accessibility (MC-A11Y-02)
- **Measurement method:** Source/output inspection — confirm the `.sw-pill` markup for "Unregistered" always includes a text node, never a CSS-only/icon-only indicator
- **Pass threshold:** Every rendered "Unregistered" pill in the AC2 tests contains visible text content, asserted via `assert.ok(html.match(/sw-pill[^>]*>[^<]*Unregistered/))` or equivalent
- **Tool:** `assert`, inline in the unit tests already covering AC2 (no separate axe/automated a11y scanner is configured in this repo for server-rendered HTML strings)

---

## Out of Scope for This Test Plan

- `/artefact/:slug/:type`'s own fetch/resolve logic — `cat-s5`'s own test plan.
- Sorting, filtering, or search — explicitly out of scope per the story and discovery artefact; no test exists for these because no such feature is being built.
- Real browser rendering / Playwright — not required per the Step 3a screening above; all 5 ACs are markup-presence assertions on server-rendered HTML strings.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's "byte-identical" golden fixture must be captured from the *pre-change* codebase before `cat-s1`–`cat-s3`'s changes land, or the comparison is meaningless | Test authorship happens before implementation (TDD discipline); the golden snapshot must be captured at the current `fadm-s1` state, before this story's own changes are made | Capture the golden HTML fixture as the very first step of this story's implementation, before any other code changes, and commit it alongside the test file |
