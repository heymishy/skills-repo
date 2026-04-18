# Test Plan: Archive completed features from pipeline-state.json

**Story reference:** artefacts/2026-04-18-pipeline-state-archive/stories/psa.1-archive-completed-features.md
**Epic reference:** Single-story short-track
**Test plan author:** Copilot (Claude Opus 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | DoD features moved to archive file | 3 tests | — | — | — | — | 🟢 |
| AC2 | Active file contains only in-flight features | 2 tests | — | — | — | — | 🟢 |
| AC3 | Viz merges archive + active for full history | 2 tests | — | — | — | — | 🟢 |
| AC4 | Signal recording works against archive | 1 test | — | — | — | — | 🟢 |
| AC5 | npm test passes after archiving | — | 1 test | — | — | — | 🟢 |
| AC6 | Top-level archive field points to archive path | 1 test | — | — | — | — | 🟢 |
| AC7 | Phase 3 partial archive: only in-flight stories remain | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are testable via unit tests against JSON fixtures and the archive script.

---

## Test Data Strategy

**Source:** Synthetic fixtures based on current pipeline-state.json structure
**PCI/sensitivity in scope:** No
**Availability:** Available now — fixtures can be derived from the existing file
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | pipeline-state.json with 2+ features, 1+ at stage definition-of-done | Synthetic fixture | None | |
| AC2 | Same fixture — verify post-archive state | Synthetic fixture | None | |
| AC3 | Archive file + active file pair | Synthetic fixture | None | Needs mock loadState in viz |
| AC4 | Archived feature with benefitMetrics block | Synthetic fixture | None | |
| AC5 | Real pipeline-state.json after archive | Live | None | Run npm test post-archive |
| AC6 | Active file post-archive | Synthetic fixture | None | |
| AC7 | Feature with mix of DoD-complete and in-flight stories | Synthetic fixture | None | |

### PCI / sensitivity constraints

None

### Gaps

None

---

## Unit Tests

### T1 — Archive script moves DoD-complete features to archive file

- **Verifies:** AC1
- **Precondition:** pipeline-state fixture with 3 features: Phase 1 (stage: definition-of-done), Phase 2 (stage: definition-of-done), Phase 3 (stage: definition, active)
- **Action:** Run archive function on fixture
- **Expected result:** Archive file contains Phase 1 and Phase 2 feature objects. Active file does not contain them.
- **Edge case:** No

### T2 — Archive script preserves feature data integrity

- **Verifies:** AC1
- **Precondition:** Same fixture as T1
- **Action:** Run archive, compare archived feature JSON to original
- **Expected result:** Archived feature objects are byte-identical to originals (no field loss, no mutation)
- **Edge case:** No

### T3 — Archive script is idempotent

- **Verifies:** AC1
- **Precondition:** Run archive twice on same input
- **Action:** Run archive, run archive again
- **Expected result:** Second run produces no changes — already-archived features are not duplicated
- **Edge case:** Yes — prevents double-archive corruption

### T4 — Active file contains only in-flight features after archive

- **Verifies:** AC2
- **Precondition:** 3-feature fixture with 2 complete, 1 active
- **Action:** Run archive
- **Expected result:** Active file `features` array length is 1. Remaining feature has `stage !== "definition-of-done"` or contains in-flight stories.
- **Edge case:** No

### T5 — Active file size is reduced

- **Verifies:** AC2
- **Precondition:** Fixture with known byte sizes per feature
- **Action:** Run archive, measure active file size
- **Expected result:** Active file byte count is less than original by approximately the sum of archived feature sizes
- **Edge case:** No

### T6 — Viz merge function combines archive and active features

- **Verifies:** AC3
- **Precondition:** Separate archive file (2 features) and active file (1 feature)
- **Action:** Call merge function
- **Expected result:** Merged result contains all 3 features. Feature order: archived first, then active. All fields preserved.
- **Edge case:** No

### T7 — Viz merge handles missing archive file gracefully

- **Verifies:** AC3
- **Precondition:** Active file exists, archive file does not
- **Action:** Call merge function
- **Expected result:** Returns active features only, no error thrown
- **Edge case:** Yes — first-run scenario before any features are archived

### T8 — Archive file is accessible for signal recording

- **Verifies:** AC4
- **Precondition:** Feature with benefitMetrics block archived into archive file
- **Action:** Look up feature by slug in archive, update a metric field
- **Expected result:** Feature found in archive, metric updated, archive file written back
- **Edge case:** No

### T9 — Top-level archive field present in active file

- **Verifies:** AC6
- **Precondition:** Active file after archive
- **Action:** Parse JSON, check for `archive` field
- **Expected result:** `archive` field exists and equals `.github/pipeline-state-archive.json`
- **Edge case:** No

### T10 — Partial feature archive: in-flight feature keeps only active stories

- **Verifies:** AC7
- **Precondition:** Phase 3 fixture with 26 stories: 16 at stage definition-of-done, 10 at other stages
- **Action:** Run archive
- **Expected result:** Active file Phase 3 feature block contains 10 stories (in-flight only). Archive file contains a Phase 3 entry with `completedStories` array of 16 stories.
- **Edge case:** No

### T11 — Partial archive preserves in-flight story data

- **Verifies:** AC7
- **Precondition:** Same as T10
- **Action:** Run archive, inspect remaining stories
- **Expected result:** Each remaining story in active file is byte-identical to its original in the fixture (no field loss from archiving siblings)
- **Edge case:** No

---

## Integration Tests

### T12 — npm test passes on archived state

- **Verifies:** AC5
- **Precondition:** Run archive on real pipeline-state.json
- **Action:** Execute `npm test`
- **Expected result:** All governance checks pass — no test assumes archived features exist in active file
- **Edge case:** No — this is the critical integration test

---

## NFR Tests

### T-NFR1 — Archive file is valid parseable JSON

- **NFR addressed:** Data integrity
- **Measurement method:** `JSON.parse()` on archive file contents
- **Pass threshold:** No parse error
- **Tool:** Jest / Node.js built-in

### T-NFR2 — Active file is valid parseable JSON after archive

- **NFR addressed:** Data integrity
- **Measurement method:** `JSON.parse()` on active file contents
- **Pass threshold:** No parse error
- **Tool:** Jest / Node.js built-in

---

## Out of Scope for This Test Plan

- Performance benchmarks for archive parsing (file is <200 KB — parsing speed is not a concern at this scale)
- Testing automatic archive triggers (out of scope per story)
- Fleet aggregator compatibility (fleet reads from squad repos, not this file)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Viz merge tested in isolation, not in browser | pipeline-viz.html is a single-file tool with no test harness beyond the existing viz-behaviour tests | T6/T7 test the merge function directly; existing viz-behaviour tests cover normalizeData which will consume merged output |
| AC4 signal recording tested as a lookup pattern, not as a full `/record-signal` run | `/record-signal` is a skill, not a script — testing the skill requires an agent session | T8 verifies the archive is readable and writable; skill behaviour is covered by skill contracts |

---

## AC Verification Script (Human-Readable)

For post-merge smoke testing by the operator:

1. **AC1 check:** Open `.github/pipeline-state-archive.json` — confirm Phase 1 and Phase 2 features are present with all their stories/epics intact.
2. **AC2 check:** Open `.github/pipeline-state.json` — confirm only Phase 3 (active stories), Dashboard v2, and any other in-flight features remain. File size should be ~15–20 KB.
3. **AC3 check:** Open `dashboards/pipeline-viz.html` in a browser, load the active `pipeline-state.json` — confirm all features (including archived Phase 1/2) appear in the dashboard.
4. **AC4 check:** Manually edit a metric field in the archive file, save, reload viz — confirm the updated metric appears.
5. **AC5 check:** Run `npm test` — all checks green.
6. **AC6 check:** Open `.github/pipeline-state.json` — confirm top-level `"archive"` field exists.
7. **AC7 check:** In the active file, Phase 3 should have ~10 stories. In the archive, Phase 3 should have 16 `completedStories`.
