## Implementation Plan: Periodic review scan

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s2-periodic-review-scan.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s2-periodic-review-scan-test-plan.md
**DoR reference:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s2-periodic-review-scan-dor.md

---

## File map

| File | Change |
|------|--------|
| `scripts/lib/deferred-item-scan.js` | New triggered/bounded CLI script: `filterUnresolvedDeferredItems`, `formatRecord`, `renderScan`, `scanFile`, and a `main` run when invoked directly; reads via `incident-store.loadRecords` |
| `tests/check-ddft-s2-periodic-review-scan.js` | New test file covering all 4 ACs; every surfacing assertion runs the real script as a child process |

---

## Task 1 -- failing tests first (AC1-AC4)

Write `tests/check-ddft-s2-periodic-review-scan.js`. The AC2 test reads the real committed `workspace/incidents.json` read-only (never writes it) and asserts both seeded record ids and their verbatim `revisitCondition`. Scenario tests use temp fixtures passed via `--file`.

Run: `node tests/check-ddft-s2-periodic-review-scan.js` -- expected: fails (script does not exist).

## Task 2 -- implement the scan

Three-way filter (type is `deferred-item`, status is not `resolved`, missing optional fields never exclude). Print `revisitCondition` verbatim; the module references no date parsing or evaluation. Stateless, so a second run reproduces the first (AC4). `--file` overrides the default path for scenarios.

Run the test file again -- expected: all pass.

## Task 3 -- wiring check

No injectable adapter and no CI workflow are introduced (the DoR contract lists the script only). The real entry point is `node scripts/lib/deferred-item-scan.js`; every exported function is called from `main`. Verify by grep.

## Final commands

`node tests/check-ddft-s2-periodic-review-scan.js` then `npm test` (baseline failures documented in the PR).
