# Definition of Done: Drift-comparator recognizes labeled and multi-target edges

**PR:** https://github.com/heymishy/skills-repo/pull/786 | **Merged:** 2026-08-29 (`6487162ec0ade9dc85e8d20ce2d0e76659de61bf`)
**Story:** artefacts/2026-08-29-diagram-validation-and-types/stories/s3-drift-comparator-labeled-multi-target-edges.md
**Test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s3-drift-comparator-labeled-multi-target-edges-test-plan.md
**DoR artefact:** artefacts/2026-08-29-diagram-validation-and-types/dor/s3-drift-comparator-labeled-multi-target-edges-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Labeled edge (`A -->|creates| B`) captures `label` as an independent field; a label-only difference against an unlabeled equivalent still resolves MATCHED | `tests/check-s3-drift-comparator-labeled-multi-target-edges.js`, re-run against merged `master` (5/5 passing) | None |
| AC2 | ✅ | `A --> B & C` expands into 2 separate edge objects (`A->B`, `A->C`) | Same test file, re-run against merged `master` | None |
| AC3 | ✅ | As-designed multi-target edge vs. as-built two-line equivalent → MATCHED | Same test file, re-run against merged `master` | None |
| AC4 | ✅ | Plain single-target edges unchanged; no `label` field added where none exists; full suite unaffected | Same test file + full suite (568/568), re-run against merged `master` | None |

---

## Scope Deviations

None. `parseErDiagramMermaid` and subgraph handling were not touched, matching the story's own Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing in CI:** 5/5 story tests (full repo suite: 568/568 files, 0 failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit ×2 (label capture + MATCHED) | ✅ | ✅ | |
| AC2 unit | ✅ | ✅ | |
| AC3 integration | ✅ | ✅ | |
| AC4 regression | ✅ | ✅ | plus `check-csd-s6-drift-signal.js` (18/18) and `check-csd-s7-as-built-system-architecture-diagram.js` (9/9) spot-checked directly |

**Mutation-testing discipline (this story's own Architecture Constraint):** Verified. Reverting `EDGE_RE` alone (leaving the edge-building change in place) failed all 5 tests — 2 via a clean assertion mismatch (0 edges), 3 via a crash reading an undefined capture group. Both are valid kill signals; the crash is arguably stronger evidence of genuine coupling, not weaker. The implementation plan's own prediction (4 tests failing cleanly) was corrected in the plan artefact to match the actual, stronger result — logged as a plan-accuracy note, not a defect.

**Gaps (tests not implemented):** None.

**Layout gap audit:** N/A — no CSS-layout-dependent scenarios in this story (pure parsing logic, no UI).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — synchronous parsing, no added model/network calls | ✅ | No async code introduced; confirmed by code review of the diff (regex + string split only) |
| Security — N/A | ✅ | Confirmed N/A per story's own NFR statement (no user-facing surface, no DOM insertion) |
| Accessibility — N/A | ✅ | Confirmed N/A per story's own NFR statement |
| Audit — N/A (parsing correctness verified by test, not runtime event) | ✅ | Confirmed — no logging/audit mechanism exists or is needed for this pure-function change |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Drift-comparator parsing accuracy | ✅ (0 — no test fixtures exercised labeled/multi-target edges before this story) | Yes — measurable now | Signal: `on-track`. Unlike S1/S2's metric (which needs real production usage before it can be scored), M2's target ("dedicated passing fixtures for labeled edges, multi-target edges, and subgraphs, for both parser functions") is directly, immediately measurable from this story's own test suite: 2 of the 3 named parsing gaps (labeled edges, multi-target edges) now have dedicated, passing fixtures. The third (subgraphs) is S4's scope — not yet closed. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. S4 (subgraphs, depends on S3 being merged — now satisfied) is next in the epic and will close the remaining third of M2's target.

---

## DoD Observations

1. **A subagent correctly refused to force a plan's predicted output to match reality** — worth citing as a positive example in `/improve`: the implementation plan predicted the mutation-check step would fail exactly 4 tests for a clean reason; the dispatched subagent found the actual result was 5 failures (3 via a crash) and reported the true behaviour rather than adjusting its run to match the plan's prediction, or silently declaring success. This is exactly the discipline `/verify-completion`'s own red-flag list ("Trusting a subagent's self-report without independent verification") exists to protect against from the other direction — here the subagent itself modeled the right behaviour unprompted.
2. `tests/check-p3.5-validate-trace.js` did NOT flake in S3's own implementation-plan or verify-completion runs (passed cleanly both times) — the 7th RISK-ACCEPT logged in `decisions.md` was specifically for S3's `/branch-setup` baseline run. Still not yet actioned as a dedicated root-cause story across 4 features/stories now.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Drift-comparator recognizes labeled and multi-target edges (S3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
