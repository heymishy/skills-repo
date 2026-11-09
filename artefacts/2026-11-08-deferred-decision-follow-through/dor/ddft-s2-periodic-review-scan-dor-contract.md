## Contract Proposal — Periodic review scan

**What will be built:**
`scripts/lib/deferred-item-scan.js` (new, triggered/bounded script per `product/constraints.md` #11 — never a standing watcher): reads `workspace/incidents.json` (generalized by `ddft-s1`), filters to `type: "deferred-item"`, and surfaces every record whose status isn't already resolved. Output shows each record's `revisitCondition` prose as-is — no parsing, evaluation, or auto-classification of whether the condition has been met.

**What will NOT be built:**
Any resolution/closing mechanism (surfacing only). Automated trigger-condition evaluation — confirmed infeasible during discovery (every real `revisitCondition` across this repo's history is free-form prose). Ranking or prioritizing surfaced records.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the filter/surface logic with a mixed fixture (resolved + unresolved + non-deferred-item records), integration test confirming no unresolved record is silently skipped | unit + integration |
| AC2 | Integration test running the scan against `ddft-s1`'s 2 real seeded records (`tfhc-s1`, C1-vs-Option-C) and asserting both appear by their real ids — per `product/constraints.md` #13, not just "script runs without throwing" | integration |
| AC3 | Unit tests asserting `revisitCondition` prose is passed through verbatim, never parsed or auto-classified | unit |
| AC4 | Integration test running the scan twice with no new records registered between runs, asserting the same unresolved set reappears both times | integration |

**Assumptions:**
`ddft-s1` has shipped and `workspace/incidents.json` contains the generalized schema with the 2 seeded records before this story's tests can run for real (confirmed dependency, not an assumption to revisit). No resolution/status-update mechanism exists yet, so "already resolved" filtering is tested against a fixture status field, not a live resolution flow.

**Estimated touch points:**
Files: `scripts/lib/deferred-item-scan.js` (new).
Services: none.
APIs: none.
