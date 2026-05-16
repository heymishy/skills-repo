# DoR Contract: trw.1 — CI Trace Writer

**Feature:** 2026-05-16-trace-writer-fix
**Story:** trw.1
**Date:** 2026-05-16

---

## Required touchpoints

| File | Action | Reason |
|------|--------|--------|
| `scripts/write-ci-trace.js` | CREATE | New trace-writer script |
| `.github/workflows/trace-commit.yml` | MODIFY — add one step before artifact download | Wire script into push workflow |
| `tests/check-trw1-trace-writer.js` | CREATE | T1–T14 tests as per test plan |

## Out-of-scope constraints — DO NOT TOUCH

| File / Path | Reason |
|------------|--------|
| `.github/workflows/assurance-gate.yml` | Artifact upload logic must remain unchanged (AC6) |
| `.github/workflows/improvement-agent-schedule.yml` | Separate story; P14 primary fix already committed |
| `artefacts/` | Pipeline artefacts — read-only for coding agent |
| `workspace/traces/` | Created at runtime by the script; do not pre-create or commit |
| Any existing test file | Tests are additive; existing test files are not modified |

## Schema dependencies

`schemaDepends: []` — no upstream schema fields declared. H8-ext: not required.

## Commit message convention

`feat(trw.1): add write-ci-trace.js and wire into trace-commit.yml`

## PR requirements

- Draft only — never mark ready for review
- Zero new test failures in `npm test`
- T1–T14 all pass in `tests/check-trw1-trace-writer.js`
- Conflict marker scan clean on all modified files (D40)
