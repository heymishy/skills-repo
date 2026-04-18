# Definition of Ready: psa.1 — Archive completed features from pipeline-state.json

**Story:** artefacts/2026-04-18-pipeline-state-archive/stories/psa.1-archive-completed-features.md
**Review:** PASS — Run 1, 2026-04-18 (0 HIGH, 1 MEDIUM acknowledged, 2 LOW)
**Test plan:** artefacts/2026-04-18-pipeline-state-archive/test-plans/psa.1-archive-completed-features-test-plan.md (14 tests, 7 ACs)
**Verification script:** artefacts/2026-04-18-pipeline-state-archive/verification-scripts/psa.1-archive-completed-features-verification.md (7 scenarios)
**Date:** 2026-04-18
**Outcome:** PROCEED

---

## Hard Block Results

| # | Check | Result |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (7 ACs) |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope populated | ✅ PASS (5 exclusions) |
| H5 | Benefit linkage references named metric | ✅ PASS |
| H6 | Complexity rated | ✅ PASS (2) |
| H7 | No unresolved HIGH findings | ✅ PASS |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS (no upstream deps) |
| H9 | Architecture Constraints + no Cat E HIGH | ✅ PASS (ADR-003, ADR-001 cited) |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS (none) |
| H-NFR | NFR profile or explicit | ✅ PASS (inline NFRs) |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (n/a) |
| H-NFR3 | Data classification | ✅ PASS (no sensitive data) |
| H-NFR-profile | NFR profile existence | ✅ PASS (short-track) |

**15/15 hard blocks passed.**

---

## Warning Acknowledgements

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ 3 NFRs declared |
| W2 | Scope stability | ✅ "Stable" |
| W3 | MEDIUM findings acknowledged | ⚠️ RISK-ACCEPT: 1-M1 (short-track traceability — D8 learning reference via workspace/learnings.md instead of formal discovery artefact) — acceptable for short-track |
| W4 | Verification script domain review | ⚠️ Acknowledged: operator is the domain expert on this story |
| W5 | No UNCERTAIN test plan items | ✅ None |

---

## Oversight Level

**Low** — short-track, solo operator, no sign-off required.

---

## Coding Agent Instructions

### Scope

Implement an archive mechanism that moves completed features from `.github/pipeline-state.json` to `.github/pipeline-state-archive.json`, reducing the active file from ~105 KB to ~15–20 KB.

### Files to create

1. **`scripts/archive-completed-features.js`** — Node.js script (no external deps) that:
   - Reads `.github/pipeline-state.json`
   - Identifies features with `stage: "definition-of-done"` AND `health: "green"`
   - Moves them to `.github/pipeline-state-archive.json` (creates if absent)
   - For Phase 3 (in-flight feature with mixed story states): moves DoD-complete stories to a `completedStories` array on the feature in the archive, keeps in-flight stories in active
   - Adds top-level `"archive": ".github/pipeline-state-archive.json"` field to active file
   - Validates both output files are valid JSON before writing
   - Is idempotent — running twice produces no change

2. **`tests/check-archive.js`** — Governance check script (no external deps, Node.js built-ins only) covering T1–T11 from the test plan

### Files to modify

3. **`.github/pipeline-state.schema.json`** — Add `"archive"` field to the top-level schema (string, optional)

4. **`dashboards/pipeline-viz.html`** — Update `loadState()` to:
   - Check for `archive` field in loaded state
   - If present, fetch the archive file
   - Merge archived features with active features before rendering
   - Handle missing archive gracefully (render active-only)

### Files NOT to touch

- No file under `artefacts/`
- No file under `.github/skills/` or `.github/templates/`
- No changes to `copilot-instructions.md`
- No changes to existing skill write paths — skills continue writing to `.github/pipeline-state.json` as-is

### Test approach

- Write failing tests first (T1–T11 unit, T12 integration, T-NFR1–2)
- Tests use synthetic JSON fixtures, not the live pipeline-state.json
- T12 (integration) runs `npm test` post-archive on real file
- After all tests pass, run the archive script on real data and verify AC verification script scenarios

### Architecture constraints

- **ADR-003:** Add `archive` field to `pipeline-state.schema.json` in the same commit as implementation
- **ADR-001:** `pipeline-viz.html` remains a single self-contained file — merge logic is inline JS, no external module
- Skill write paths unchanged — archive is transparent to skills writing in-flight features

### AC reference (complete)

- **AC1:** DoD features → archive file, removed from active
- **AC2:** Active file = in-flight only, measurable size reduction
- **AC3:** Viz merges archive + active for complete dashboard
- **AC4:** Signal recording works against archived features
- **AC5:** `npm test` passes post-archive
- **AC6:** Top-level `"archive"` field in active file
- **AC7:** Phase 3 partial: 10 in-flight active, 16 DoD-complete archived
