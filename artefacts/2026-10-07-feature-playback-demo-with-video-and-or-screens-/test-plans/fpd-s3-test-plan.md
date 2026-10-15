## Test Plan: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s3-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop, pointer coordinates, or on-screen position — every AC is a DOM-presence/content/ordering check, testable via this repo's own established `handleGetJourneyCanvas`-style harness (mocked pool + `res._b.bodyContent` string/DOM assertions, used throughout this session for `jae-s5`/`cnsf-s1`). No E2E tooling gap; no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Viewer lists DoD-validated features with a playback package | 1 test | — | — | — | — | 🟢 |
| AC2 | Feature review page opens with a scope/benefit summary from discovery/benefit-metric | 1 test | — | — | — | — | 🟢 |
| AC3 | Per-story sections show that story's own ACs from the DoD Coverage table | 1 test | — | — | — | — | 🟢 |
| AC4 | Per-story sections ordered consistently with `pipeline-state.json`'s own epic/story structure | 1 test | — | — | — | — | 🟢 |
| AC5 | A DoD-validated feature with no package does not appear in the list | 1 test | — | — | — | — | 🟢 |
| ADR-028 compliance (not an AC) | The route's own traversal is the one canonical builder, or reuses an existing one | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — mocked `pipeline-state.json` content (2–3 fixture features, varying `dodStatus` and playback-package presence), fixture `discovery.md`/`benefit-metric.md`/DoD artefact file content, reusing this repo's own established `withMockedPipelineState` mock-`fs.readFileSync` pattern.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | 2 fixture features: one DoD-complete with a package, one DoD-complete without | Synthetic | None | |
| AC2 | Fixture `discovery.md` problem statement + `benefit-metric.md` named metrics | Synthetic | None | |
| AC3 | Fixture feature with 2 stories, each with its own DoD AC Coverage table | Synthetic | None | |
| AC4 | Fixture feature with epics in a specific, non-alphabetical order | Synthetic | None | Confirms real ordering, not an accidental alphabetical match |
| AC5 | A fixture DoD-complete feature with no `artefacts/[slug]/playback/` directory | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): viewer lists only DoD-validated features with a playback package

- **Verifies:** AC1
- **Precondition:** 2 fixture features — one DoD-complete with `playback/` present, one DoD-complete without
- **Action:** Render the viewer's own list route
- **Expected result:** The rendered HTML lists exactly 1 feature (the one with a package), linking to its own review page
- **Edge case:** No

### AC2 (unit): review page opens with the scope/benefit summary, not re-authored

- **Verifies:** AC2
- **Precondition:** Fixture feature with a specific discovery problem statement and 2 named benefit metrics
- **Action:** Render the feature's own review page
- **Expected result:** The rendered HTML contains the discovery's own problem statement text and both metric names/targets verbatim — not a paraphrase or summary
- **Edge case:** No

### AC3 (unit): per-story AC sections sourced from the DoD Coverage table

- **Verifies:** AC3
- **Precondition:** Fixture feature, 1 story, DoD artefact with 3 ACs in its own Coverage table
- **Action:** Render the review page
- **Expected result:** The rendered HTML has one section per AC within that story's own section, text matching the DoD table row verbatim
- **Edge case:** No

### AC4 (unit): per-story sections follow the real epic/story order, not alphabetical

- **Verifies:** AC4
- **Precondition:** Fixture feature with 2 epics, stories named so that alphabetical order would differ from the real `pipeline-state.json` epic/story array order
- **Action:** Render the review page
- **Expected result:** Story sections appear in the exact order they're listed in `pipeline-state.json`'s own `epics[].stories[]` array, not alphabetically re-sorted
- **Edge case:** Yes — the alphabetical-mismatch fixture is deliberately chosen to catch an accidental re-sort

### AC5 (unit): a DoD-validated feature with no package is excluded from the list

- **Verifies:** AC5
- **Precondition:** Fixture feature with `dodStatus: "complete"` but no `artefacts/[slug]/playback/` directory/files
- **Action:** Render the viewer's own list route
- **Expected result:** That feature does not appear in the rendered list at all
- **Edge case:** Yes — this is the edge case itself (DoD-complete alone is not sufficient to appear)

---

## Integration Tests

### ADR-028 compliance (integration): one canonical traversal, reused or newly-established correctly

- **Verifies:** Architecture Constraints (not a story AC) — confirms the implementation-time reuse-check named in `decisions.md` was actually resolved one way or the other, not silently skipped
- **Precondition:** Real `require` of the new route module
- **Action:** Source-level check: does the route's own feature/epic/story/AC traversal call an existing shared traversal function (if one is found to exist in `/trace` or `dashboards/pipeline-viz.html`), or is it the sole canonical builder for this shape (if none existed)?
- **Expected result:** Exactly one traversal implementation is reachable from this route — either a call into an existing one, or a newly-established one with no duplicate derivation elsewhere in the codebase for this exact shape
- **Edge case:** No

---

## Gap table

No gaps.
