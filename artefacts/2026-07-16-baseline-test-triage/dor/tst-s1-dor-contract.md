# DoR Contract: tst-s1 — Triage the pre-existing baseline test failures

**Story:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Test plan:** artefacts/2026-07-16-baseline-test-triage/test-plans/tst-s1-triage-pre-existing-baseline-failures-test-plan.md

## What will be built

1. `artefacts/2026-07-16-baseline-test-triage/triage-report.md` — a per-file categorization of all 69 currently-failing files (per the story's "Current, freshly-verified state" list), each bucketed (a) Fixed / (b) Deferred / (c) Investigated-and-classified (the latter only applies to `tests/check-md-3-adr.js`).
2. `tests/check-tst-s1-baseline-triage.js` — the meta-test file implementing U1-U8 from the test plan.
3. Small, targeted production-code and/or test-file fixes for every file placed in category (a).
4. A refreshed `tests/known-baseline-failures.json`.
5. `decisions.md` RISK-ACCEPT entries for every category (b) file (can be grouped by common root cause where several files share one, e.g. "missing `.github/skills/definition/SKILL.md`" likely affects `check-definition-skill.js` and possibly others).

## Estimated touch points

- `tests/check-tst-s1-baseline-triage.js` (new)
- `tests/known-baseline-failures.json` (modified)
- `artefacts/2026-07-16-baseline-test-triage/triage-report.md` (new)
- Any subset of the 69 named files and/or their corresponding production code, as determined by AC1's investigation — cannot be named exhaustively in advance (this is the nature of a triage story).
- `artefacts/2026-07-16-baseline-test-triage/decisions.md` (new, per-category-(b)-file RISK-ACCEPT entries)

## MUST NOT touch

- `scripts/run-all-tests.js`, `package.json`'s `scripts.test` entry, `.gitattributes` (all pcr-s1 scope, unchanged).
- Any file belonging to a currently-open `bri-*`, `tir-*`, or other in-flight feature's branch/PR.
- `scripts/ci-test-regression-check.js`'s own logic (read-only consumption; this story feeds it a corrected baseline, not new logic).

## Assumptions

- The 69-file list in the story is accurate as of 2026-07-16 and will be the investigation's starting point — if the coding agent's own fresh run at `/branch-setup` differs slightly (e.g. a flaky file), re-verify standalone before trusting the aggregate run for that one file.
- Some category (a) fixes may require reading the actual failure output closely (many of these are likely `SKILL.md` path mismatches, missing env vars in test mode, or stale content-marker assertions per `known-baseline-failures.json`'s own note field) rather than deep architectural investigation — but this cannot be confirmed until each file is actually opened and read.

## Open questions for DoR sign-off

None — this is a short-track story; scope is inherently "investigate and categorize, fix what's small," not a fixed feature spec.
