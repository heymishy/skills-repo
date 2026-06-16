# Test Plan Template

## Test Plan: Truncated Kanban card titles, artefact-count indicator, and design-system-styled feature/artefact detail pages

**Story reference:** `artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md`
**Epic reference:** N/A — short-track
**Test plan author:** Copilot
**Date:** 2026-06-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Card title truncated at 48 chars + ellipsis, full title in `title=` attr; 3 mojibake `name` values in `pipeline-state.json` corrected | 5 tests (`AC1a`-`AC1e`) + 9 data-integrity assertions (`AC1f`-`AC1h` ×3) | — | — | Visual hover-tooltip check | Untestable-by-nature (hover affordance "feel") | 🟢 |
| AC2 | Artefact-count badge on card ("N artefacts" / "No artefacts yet"); `handleGetFeatures` board view wires real counts via `listArtefacts` | 3 tests (`AC2a`-`AC2c`) | 3 tests (`AC2d`-`AC2f`) | — | — | — | 🟢 |
| AC3 | `/features/:slug` detail page grouped by stage using `.sw-card`/`.sw-section-title` design-system classes | — | 8 tests (`AC3a`-`AC3h`) | — | Visual layout/spacing check | CSS-layout-dependent (visual rhythm/spacing not assertable in jsdom string match) | 🟢 |
| AC4 | `/artefact/:slug/:type` wrapped in `renderShell`, markdown content in `.sw-doc`, 404 path also shelled | — | 8 tests (`AC4a`-`AC4h`) | — | Visual markdown rendering check (tables, code blocks) | CSS-layout-dependent | 🟢 |
| AC5 | `ideation` stage added to Discovery lane's `stages`; ideation-stage cards render inside Discovery lane | 1 test (`AC5a`) | 1 test (`AC5b`) | — | — | — | 🟢 |
| AC6 | `listLocalArtefacts(repoRoot, slug)` recursively walks `artefacts/<slug>/` including subdirectories; missing dir returns null/empty to trigger fallback | 6 tests (`AC6a`-`AC6g`) | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest/jsdom | Handling |
|-----|----|----------|--------------------------|---------|
| Hover tooltip actually appears and is readable on mouse hover | AC1 | Untestable-by-nature | jsdom does not render hover affordances; `title=` attribute presence is verified automatically, but the rendered tooltip behaviour is a browser-only effect | Manual scenario — see AC verification script 🔴 |
| Grouped layout reads as visually coherent ("follows the design system") rather than just containing the right CSS classes | AC3 | CSS-layout-dependent | String-match assertions can confirm classes are applied to elements but cannot confirm visual spacing/alignment renders correctly in a real browser | Manual scenario — see AC verification script 🔴 |
| Markdown tables/code blocks render legibly with the `.sw-doc` prose styling at real viewport widths | AC4 | CSS-layout-dependent | Same as above — computed layout is not available in jsdom/Node-only test harness | Manual scenario — see AC verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic / Fixtures (in-memory mock objects + a `fs.mkdtempSync` temp directory tree for AC6) and the repo's own `.github/pipeline-state.json` for the AC1 mojibake-correction assertions.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | One long synthetic feature title (>48 chars); the 3 real mojibake-affected feature records | In-memory literal / `.github/pipeline-state.json` | None | Test reads the real pipeline-state.json so the data fix is enforced directly against the file the operator sees, not a copy |
| AC2 | Synthetic features with `artefactCount` of 4 and 0; a board-view feature stub plus a mocked `listArtefacts` resolver | In-memory literal | None | Mock `listArtefacts` is asserted to be called with the correct slug (AC2d) |
| AC3 | Two synthetic artefact records (`discovery`, `dor` types) with `createdAt`/`path` | In-memory literal | None | Mirrors the shape `listArtefacts` actually returns in production |
| AC4 | A small markdown fixture string (`# Heading\n\nSome paragraph text.\n`); a forced `ArtefactNotFoundError` for the 404 path | In-memory literal | None | |
| AC5 | One synthetic feature with `stage: 'ideation'` | In-memory literal | None | |
| AC6 | A temp directory tree under the repo root (`fs.mkdtempSync`) with `artefacts/<slug>/discovery.md`, `dor/x-dor.md`, `stories/x-story.md` | Generated fixture, deleted in `finally` | None | Cleaned up unconditionally even on assertion failure |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Card title is truncated to 48 chars with trailing ellipsis when the resolved title exceeds 48 characters

- **Verifies:** AC1a, AC1c, AC1d
- **Precondition:** A feature object with `title` longer than 48 characters is passed to `renderKanban`.
- **Action:** Call `renderKanban({ features: [...], ideas: [] })` and inspect the `kb-card-title` span.
- **Expected result:** The span's text content is ≤49 characters and ends with `…`; the full untruncated title string does not appear anywhere else in the rendered HTML as visible text.
- **Edge case:** Yes — title exactly at the 48-char boundary is not separately tested here; covered implicitly by the `<=49` assertion being inclusive.

### Full title is preserved in a `title=` attribute for hover accessibility

- **Verifies:** AC1e
- **Precondition:** Same long-title feature as above.
- **Action:** Search rendered HTML for `title="<full title>"` (HTML-entity-escaped or raw).
- **Expected result:** The attribute is present and contains the complete, untruncated title text.
- **Edge case:** No.

### Three known mojibake `name` fields in pipeline-state.json are corrected to a real em dash

- **Verifies:** AC1f, AC1g, AC1h
- **Precondition:** `.github/pipeline-state.json` is read directly from disk.
- **Action:** For each of the three known affected slugs, locate the feature record and inspect `name`.
- **Expected result:** `name` contains no `Ã` or `â€` byte-sequence fragments and does contain a literal `—` (em dash, U+2014).
- **Edge case:** No — this is a one-time data correction, not a behavioural branch.

### Artefact-count badge renders count text and class for a feature with artefacts

- **Verifies:** AC2a, AC2b
- **Precondition:** A feature with `artefactCount: 4`.
- **Action:** Call `renderKanban` and inspect the card markup.
- **Expected result:** Markup includes an element with class `kb-artefact-badge` and text matching `/4\s*artefacts/`.
- **Edge case:** No.

### Zero-artefact feature shows an explicit "no artefacts yet" indicator

- **Verifies:** AC2c
- **Precondition:** A feature with `artefactCount: 0`.
- **Action:** Call `renderKanban` and inspect the card markup.
- **Expected result:** Markup matches `/no artefacts yet/i` rather than omitting the badge.
- **Edge case:** Yes — zero is the boundary case for "has artefacts," tested explicitly rather than just inferred from the count-present case.

### Discovery lane's `stages` array includes `'ideation'`

- **Verifies:** AC5a
- **Precondition:** None — `LANES` is a static export.
- **Action:** Find the lane with `id === 'discovery'` and inspect `.stages`.
- **Expected result:** `stages.indexOf('ideation') !== -1`.
- **Edge case:** No.

### `listLocalArtefacts` recursively includes files in nested subdirectories

- **Verifies:** AC6a, AC6b, AC6c, AC6d, AC6e, AC6f
- **Precondition:** A temp directory with `artefacts/<slug>/discovery.md` (root-level) and `artefacts/<slug>/dor/x-dor.md`, `artefacts/<slug>/stories/x-story.md` (nested).
- **Action:** Call `listLocalArtefacts(tmpDir, slug)`.
- **Expected result:** Returns an array including all three files (root and both nested subdirectories), each with `type === 'file'`.
- **Edge case:** Yes — nested-subdirectory inclusion is the core regression this AC targets (the existing GitHub-API-based fetch is non-recursive).

### `listLocalArtefacts` returns null/empty for a non-existent feature directory (fallback trigger)

- **Verifies:** AC6g
- **Precondition:** `slug` does not correspond to any directory under `artefacts/`.
- **Action:** Call `listLocalArtefacts(tmpDir, 'does-not-exist-slug')`.
- **Expected result:** Returns `null` or an empty array, signalling the caller to fall back to the GitHub Contents API path.
- **Edge case:** Yes — this is the explicit fallback-trigger contract relied on by `server.js`'s local-first wiring.

---

## Integration Tests

### Board view (`/features?view=board`) attaches a real `artefactCount` per feature

- **Verifies:** AC2d, AC2e, AC2f
- **Components involved:** `handleGetFeatures` (`routes/features.js`), `listArtefacts` (mocked via `setListArtefacts`), `feature-list.js` adapter (mocked pipeline-state fetch), `renderKanban`.
- **Precondition:** A single feature `feat-board-1` is returned by the mocked pipeline-state fetch; `setListArtefacts` mock returns 2 artefacts for that slug and asserts it was called with the correct slug.
- **Action:** Call `handleGetFeatures(req, res)` with `req.query.view = 'board'`.
- **Expected result:** Response status 200; rendered board HTML matches `/2\s*artefacts/` for `feat-board-1`; the mock confirms `listArtefacts` was invoked with `'feat-board-1'`.

### `ideation`-stage feature card renders inside the Discovery lane (not omitted)

- **Verifies:** AC5b
- **Components involved:** `renderKanban`, `LANES`.
- **Precondition:** A feature with `stage: 'ideation'` is passed to `renderKanban`.
- **Action:** Render the board and extract the HTML slice between the `data-lane="discovery"` and `data-lane="definition"` markers.
- **Expected result:** The Discovery-lane HTML slice contains the `feat-ideation` card.

### `/features/:slug` renders a grouped, design-system-styled artefact list

- **Verifies:** AC3a-AC3h
- **Components involved:** `handleGetFeatureArtefacts` (`routes/features.js`), `listArtefacts` (mocked), `getLabel`/`groupArtefactsByStage` (`plain-language-labels.js`), `renderShell` (`html-shell.js`).
- **Precondition:** Mocked `listArtefacts` returns two artefacts of distinct types (`discovery`, `dor`) with `createdAt`/`path`.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'feat')`.
- **Expected result:** Status 200; response contains an element with `class="sw-card"` and one with `class="sw-section-title"` (not merely the CSS rule definitions in the `<style>` block — verified via a `class="..."` attribute regex, not a bare substring match); group labels "Discovery" and "Ready Check" are present as visible text; raw lowercase `>discovery<` is not rendered; the artefact link `href="/artefact/feat/discovery"` and date `2026-04-01` are preserved from the existing contract.

### `/artefact/:slug/:type` is wrapped in the shared HTML shell for both success and 404 paths

- **Verifies:** AC4a-AC4h
- **Components involved:** `handleArtefactRoute` (`routes/artefact.js`), `renderShell` (`html-shell.js`), `renderArtefactToHTML` (`markdown-renderer.js`), `ArtefactNotFoundError` (`adapters/artefact-fetcher.js`).
- **Precondition:** Mocked fetcher returns `'# Heading\n\nSome paragraph text.\n'` for the success path, then a forced `ArtefactNotFoundError` for the 404 path.
- **Action:** Call `handleArtefactRoute(req, res, 'feat', 'discovery')` twice (success, then 404).
- **Expected result:** Success path: status 200, `<!doctype html` present, `<nav aria-label="Main navigation">` present, an element with `class="sw-doc"` actually applied (not just CSS-defined) wraps the rendered markdown, `<h1>Heading</h1>` present. 404 path: status 404 preserved, body still includes the lowercase-matched `'artefact not found'` message and is still wrapped in the shared shell (`<!doctype html` present).

---

## NFR Tests

### Local-first artefact listing introduces no noticeable latency for boards up to ~25 features

- **NFR addressed:** Performance
- **Measurement method:** Manual timing observation of `/features?view=board` page-load in local dev with the full `.github/pipeline-state.json` feature set (24 features) after AC2/AC6 land, since filesystem-only reads at this scale are not expected to need an automated load-test harness.
- **Pass threshold:** No perceptible delay (subjectively <500ms added) versus the pre-change board render.
- **Tool:** Manual — see AC verification script.

### No change to auth guards on `/features/:slug` or `/artefact/:slug/:type`

- **NFR addressed:** Security
- **Measurement method:** Existing auth-guard tests (`tests/check-wuce6-feature-navigation.js`, `tests/check-wuce2-read-render-artefact.js`) continue to pass unmodified after this story's changes — no new test is needed since the guard logic itself is untouched by this story's scope.
- **Pass threshold:** Full existing suite green (`npm test`).
- **Tool:** Jest-style `node tests/*.js` runner (existing `npm test` script).

### Truncated card titles remain readable via `title=` attribute (no information loss)

- **NFR addressed:** Accessibility
- **Measurement method:** AC1e's automated assertion confirms the `title=` attribute always carries the full text whenever truncation occurs.
- **Pass threshold:** `title=` attribute present and equal to the full untruncated title string for every truncated card.
- **Tool:** `tests/check-kfd1-kanban-card-and-detail-page-cx.js` (AC1e).

### No change to existing audit log calls on `/features/:slug` and `/features`

- **NFR addressed:** Audit
- **Measurement method:** Existing audit-log assertions in `tests/check-wuce20-artefact-index-html.js` (T17.x) continue to pass unmodified.
- **Pass threshold:** Full existing suite green.
- **Tool:** Existing `npm test` script.

---

## Out of Scope for This Test Plan

- Item 5 from the operator's original request (next-best-action determination + kick-off-from-view) — explicitly deferred to a future `/discovery` session, not implemented or tested here.
- The non-board `/features` flat-list view — unchanged by this story.
- In-place markdown editing from the detail page — unchanged by this story.
- Drag-and-drop stage transitions on the Kanban board — unchanged from the pmf.1 render-only constraint.
- End-to-end Playwright specs for the new grouped/shelled markup — the existing e2e specs (`tests/e2e/wuce20-artefact-index-html.spec.js`) impose no markup constraints beyond nav/content-type and remain valid as-is; no new e2e spec is added since the Jest-level integration tests already assert the DOM structure changes directly.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Hover tooltip visibility/legibility on the truncated card title | Browser-only rendering effect, not observable via jsdom string assertions | Manual scenario in AC verification script; risk is low since `title=` is a well-supported native HTML affordance |
| Visual coherence ("follows the design system") of the grouped detail-page layout and markdown prose styling | CSS layout/spacing computation is not available in the Node-only test harness used by this repo's `tests/*.js` convention | Manual scenario in AC verification script with explicit visual-check steps |
