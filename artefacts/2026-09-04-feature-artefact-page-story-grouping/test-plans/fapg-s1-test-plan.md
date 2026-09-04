## Test Plan: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Story reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Multi-story feature: feature-level artefacts once, then epic/story accordion | 2 | — | — | — | — | 🟢 |
| AC2 (regression) | Single-/zero-story feature: no accordion, unaffected | 1 | — | — | — | — | 🟢 |
| AC3 | Story list read from local pipeline-state.json, not Postgres | 2 | — | — | — | — | 🟢 |
| AC4 (regression) | Local file absent: graceful fallback to today's flat rendering | 1 | — | — | — | — | 🟢 |
| AC5 (regression) | Resume-conversation links unaffected wherever they already apply | 1 | — | — | — | — | 🟢 |
| AC6 (regression) | Breadcrumb output unchanged | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** The accordion uses native `<details>`/`<summary>` (no custom CSS layout dependency for its core open/closed behaviour — browsers implement this natively). No CSS-layout-dependent language in the ACs themselves (presence/shape assertions on server-rendered HTML strings, matching this route's own established convention). N/A.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — real temporary directories via `fs.mkdtempSync` for the local pipeline-state.json read (matching `check-alrf-s1-artefact-list-repo-root-fallback.js`'s and `check-aada-s1-archived-directory-fallback.js`'s own established fixture pattern), plus mocked `setListArtefacts`/`setJourneyStoreModule` for the route-handler-level tests (matching `check-fal-s1-artefact-lookup-epic-nested-fix.js`'s own established pattern).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A temp repo with a real `.github/pipeline-state.json` containing a feature with 2 epics, 3 stories total; mocked `_listArtefacts` returning files matching those story slugs plus feature-level files | Synthetic | None | |
| AC2 | Same shape but 1 story only | Synthetic | None | |
| AC3 | Direct unit test of the new story-structure reader, isolated from the route handler | Synthetic | None | |
| AC4 | A temp repo with no `.github/` directory at all | Synthetic | None | |
| AC5 | A feature-level artefact path present in a mocked `resumeLookup` | Synthetic | None | |
| AC6 | Reuses `check-pdt-s4-story-breadcrumb.js`'s own fixture, run unmodified | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### getFeatureStoryStructure: reads a multi-story, epic-nested feature's real story list from local disk
- **Verifies:** AC3
- **Precondition:** A temp repo with `.github/pipeline-state.json` containing one feature (`slug: 'multi-x'`) with 2 epics, each with 1-2 stories (mixing object- and bare-string-shaped story references, matching `fal-s1`'s own established handling).
- **Action:** Call `getFeatureStoryStructure(root, 'multi-x')`.
- **Expected result:** Returns `{ epics: [{ epicName, epicSlug, storySlugs: [...] }, ...] }` with every story slug correctly extracted regardless of shape — not `undefined` for the bare-string ones.
- **Edge case:** Yes — bare-string story shape, matching the real `2026-04-14-skills-platform-phase3` data.

### getFeatureStoryStructure: returns null when pipeline-state.json is absent (regression guard)
- **Verifies:** AC4 (data-layer half)
- **Precondition:** A temp repo with no `.github/` directory.
- **Action:** Call `getFeatureStoryStructure(root, 'any-feature')`.
- **Expected result:** Returns `null` — no exception thrown.
- **Edge case:** No

### groupArtefactsByStory: classifies files correctly using the real story-slug list
- **Verifies:** AC1 (data-layer half)
- **Precondition:** An artefact list mixing feature-level files (`discovery.md`, `benefit-metric.md`) and per-story files (`p3.3-gate-structural-independence.md`, `p3.3-gate-structural-independence-test-plan.md`, `p3.4-eval-anti-gaming-controls.md`) — the real filenames from `2026-04-14-skills-platform-phase3`. Story structure: 1 epic with `storySlugs: ['p3.3', 'p3.4']`.
- **Action:** Call `groupArtefactsByStory(artefacts, storyStructure)`.
- **Expected result:** `featureLevel` contains exactly the 2 feature-level files; the epic's `p3.3` story group contains exactly its own 2 files; `p3.4`'s group contains exactly its own 1 file — no cross-contamination.
- **Edge case:** Yes — real filenames from the actual collision-adjacent feature this whole thread investigated.

### handleGetFeatureArtefacts: multi-story feature renders feature-level artefacts once, then an epic/story accordion
- **Verifies:** AC1 (route-level)
- **Precondition:** Mocked `setListArtefacts` returning the mixed file list above; a real temp-repo `.github/pipeline-state.json` matching the same 2-epic, 2-story structure, wired via `repoRoot`.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'multi-x', pool)` with `accept: text/html`.
- **Expected result:** The rendered HTML contains `discovery.md` and `benefit-metric.md` exactly once each (not duplicated per story), and contains `<details class="epic">` / `<details class="story-row">` elements for `p3.3` and `p3.4`, each containing only its own real files.
- **Edge case:** No

### handleGetFeatureArtefacts: single-story feature renders exactly as it does today (regression guard)
- **Verifies:** AC2
- **Precondition:** Same mocked setup, but `.github/pipeline-state.json` describes a feature with exactly 1 story.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'single-x', pool)`.
- **Expected result:** No `<details class="epic">` or `<details class="story-row">` elements anywhere in the rendered HTML — identical structure to `renderArtefactIndexHtml`'s own existing output.
- **Edge case:** No

### handleGetFeatureArtefacts: pipeline-state.json absent falls back to today's flat rendering (regression guard)
- **Verifies:** AC4 (route-level)
- **Precondition:** `repoRoot` points to a temp dir with no `.github/` directory at all (but `_listArtefacts` is still mocked to return real files, simulating the Postgres/pgArtefactRows-only durable-store path).
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'no-local-state', pool)`.
- **Expected result:** No exception thrown; the rendered HTML matches `renderArtefactIndexHtml`'s own existing flat-list output exactly.
- **Edge case:** Yes — this is the exact `alrf-s4`-named "volumeless container" scenario.

### handleGetFeatureArtefacts: resume-conversation links still render wherever they already apply (regression guard)
- **Verifies:** AC5
- **Precondition:** Multi-story fixture (as in AC1's route-level test); `setJourneyStoreModule`'s own mock returns a journey whose `completedStages` includes an entry with a `sessionId` for the feature-level `discovery.md` path.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'multi-x', pool)`.
- **Expected result:** The rendered HTML contains a `Resume conversation` link next to `discovery.md`'s own entry in the feature-level section — unaffected by the new grouped layout.
- **Edge case:** No

### handleGetFeatureArtefacts: breadcrumb output is unchanged (regression guard)
- **Verifies:** AC6
- **Precondition:** Reuses `check-pdt-s4-story-breadcrumb.js`'s own fixture exactly.
- **Action:** Run that pre-existing test file unmodified.
- **Expected result:** All its existing assertions still pass — confirms this story's own rendering change doesn't touch breadcrumb logic.

---

## Out of Scope for This Test Plan

- Any test of `fal-s1`'s own tenant-scoped Postgres taxonomy-scan resolver — unchanged, already covered by its own existing tests.
- Any test of `_listArtefacts`'s own internal logic (local filesystem scan, GitHub API fallback, Postgres merge, `aada-s1`'s archived-directory fallback) — unchanged, already covered by their own existing tests.
- Any visual/CSS test of the accordion's own styling — out of scope per the story (functional/architectural fix, not the fuller visual redesign).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
