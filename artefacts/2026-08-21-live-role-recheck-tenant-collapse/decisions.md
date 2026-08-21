# Decision Log: live-role-recheck-tenant-collapse

**Feature:** live-role-recheck-tenant-collapse
**Discovery reference:** None — short-track (security bug fix)
**Last updated:** 2026-08-21

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-21 | RISK-ACCEPT | branch-complete (PR #750)**
**Decision:** Accept PR #750's failing `/trace` `test_plan_coverage` check as a pre-existing, unrelated gap rather than blocking this story's merge on it.
**Alternatives considered:** (1) Block this PR until the full traceability gate passes. (2) Fold the entire backfill into this story's own scope.
**Rationale:** Investigation traced the CI failure to two causes, neither introduced by this story: (a) 10 false positives from a `pipeline-state.json` bookkeeping gap on unrelated stories — already fixed directly on master (commit `3348c3d2`), confirmed in CI to cut the failure count from 21 to 11. (b) 11 genuinely-missing test-plan artefacts on 4 already-shipped, unrelated features (`alrf-*`, `r-canvas-render-and-story-extraction-fix`) — logged as its own finding (F13) with a dedicated follow-up story (`tpbg-s1`, `artefacts/2026-08-21-test-plan-backfill-gap/`) rather than folded into this story, since the backfill scope (11 items, each needing individual review of whether real test coverage exists to reconstruct from) is far larger than and unrelated to this story's own 3 ACs. This story's own artefact chain is complete and correctly detected by the checker.
**Made by:** Hamish King (operator), via explicit AskUserQuestion response during PR review.
**Revisit trigger:** Once `tpbg-s1` closes all 11 remaining gaps, `/trace`'s `test_plan_coverage` check should pass cleanly on this and every other PR without further action here.
---

---

## Architecture Decision Records

None for this feature.
