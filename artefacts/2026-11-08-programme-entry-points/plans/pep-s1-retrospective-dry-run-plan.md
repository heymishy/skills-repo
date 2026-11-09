## Implementation Plan: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
**DoR reference:** artefacts/2026-11-08-programme-entry-points/dor/pep-s1-retrospective-dry-run-dor.md
**Test plan reference:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s1-retrospective-dry-run-test-plan.md

---

## File map

| File | Purpose |
|------|---------|
| `src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js` | Core dry-run module: reads the real phase4 fixture, scores Step 0, walks Steps 1-6, generates the write-up |
| `tests/check-pep-s1-dry-run.js` | Unit + integration tests, AC1-AC4 |
| `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` | Generated output artefact (AC4) — not hand-written, produced by running the module |

Directory name `pep-s1-retrospective-dry-run` under `src/` deliberately mirrors the real DoR artefact's filename slug so `tests/check-artefact-coverage.js` (ADR-011) resolves it without a manual exemption entry.

---

## Task 1 — Compute phase4's real profile without hand-typing (AC1)

**Files:** `src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js` (new), `tests/check-pep-s1-dry-run.js` (new)

Failing test written first: `computes 1 operator from phase4's real git history`, `Step 0 dry-run reads phase4's real timeline from the fixture's own Date fields`.

Implementation: `computeOperatorCount` (git log authors on the fixture dir), `computeTimelineSpanDays` (regex over internal `Date:` fields across the fixture — not git log, which only reflects the single archival commit), `assessStep0QualitativeSignals` (evidenced judgement citing exact discovery.md phrases).

**Finding during this task:** the real full span is 3 days (2026-04-19 through DoD completions 2026-04-21), not the "2-day span" repeated elsewhere in this tranche's artefacts (which only looked at discovery/epic dates). Test asserts the real, verified value.

Run: `node tests/check-pep-s1-dry-run.js` — expected: operator + timeline tests pass.

---

## Task 2 — Score Step 0 and walk Steps 1-6 (AC1, AC2, AC3)

**Files:** `src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js`

Implementation: `scoreStep0` (per-signal breakdown, verdict `fail`); `walkStep1` through `walkStep6`, each consuming the shared `profile` object (not inventing its own input), classified `satisfied` / `adapted` / `gap` / `scoping-mismatch`.

Real finding: Step 3 (workstream registration) is a genuine `gap` — the step's schema has no representation for "same operator, multiple epics." Step 5 (consumer registry) is a `scoping-mismatch`, not a gap — phase4's best-fit type (3, New platform build) doesn't trigger Step 5's type-2-only condition, despite surface "consumer"/"migration" keyword overlap in e2-distribution-model.md.

Run: `node tests/check-pep-s1-dry-run.js` — expected: Step 0 verdict, Step 5 classification, and sequential-walk tests pass.

---

## Task 3 — Generate the write-up artefact (AC4)

**Files:** `src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js` (`generateWriteUp`, `require.main === module` entry point)

Run: `node src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js` — expected output: `Wrote .../artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md`.

Run: `node tests/check-pep-s1-dry-run.js` — expected: all 9 tests pass, including the write-up structure/content assertions.

---

## Task 4 — Fix the artefact-coverage gap found during full-suite verification

**Files:** `src/pep-s1-retrospective-dry-run/` (renamed from an initial `src/programme-dry-run/`)

Full-suite run surfaced a real, change-caused failure: `tests/check-artefact-coverage.js` could not resolve the new `src/` module to its DoR artefact because the initial directory name (`programme-dry-run`) didn't match any committed artefact filename as a substring. Fixed by renaming to match the real DoR artefact's slug exactly, rather than adding an exemption entry for a module that already has a proper DoR.

Run: `node tests/check-artefact-coverage.js` — expected: 0 uncovered.

---

## Commit messages (imperative mood)

1. `feat(pep-s1): compute phase4's real profile from git + internal Date fields, not hand-typed`
2. `feat(pep-s1): score Step 0 and walk Steps 1-6 against phase4's real history`
3. `feat(pep-s1): generate dry-run write-up artefact; fix artefact-coverage slug match`
