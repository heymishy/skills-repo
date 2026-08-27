# Review Report: Suggest whether a stage revision is material to downstream stages — Run 1

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Date:** 2026-08-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** AC quality / Architecture compliance — AC1 requires comparing "the new artefact content against the pre-revision content," but as sequenced this comparison is not possible. This story's own Dependencies field states "Upstream: res-s2 (there must be an overwritten artefact to judge)" — i.e. materiality judgment runs *after* res-s2's overwrite completes. res-s2's AC1 is explicit that the overwrite is in-place with "no new file or dated copy" retained, and both res-s2's Out of Scope and the parent epic's Out of Scope explicitly exclude any versioning/diffing mechanism. By the time AC1's comparison is meant to run, the pre-revision content no longer exists anywhere the story names — not on disk, not in a retained copy, not in session state per any AC in either story. Architecture Constraints compounds this: it says "None identified beyond ADR-023," which doesn't name *any* mechanism for accessing the pre-revision state this AC depends on.
  Fix: Pick one mechanism and name it explicitly in both stories:
  (a) Have res-s2 capture the pre-revision content in memory *before* performing the disk write (within the same turn-handling flow) and pass it forward directly to the materiality check — update res-s2's own ACs/Downstream note to describe this handoff, since res-s2 currently describes the write as a bare overwrite with no forwarding step; or
  (b) Source the "before" state from git history instead (the artefact file is still tracked in git even after the working-tree overwrite, so `git show HEAD:<path>` — or the disk-content-at-last-commit — could serve as "pre-revision" up to the granularity of the last commit). Note this only works if the previous revision was already committed, which may not hold for rapid successive revisions in one session — call this out as a known limitation if chosen.
  Whichever is chosen, add it to res-s3's Architecture Constraints and rephrase AC1 to name where "pre-revision content" actually comes from, rather than treating it as freely available.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Traceability — The "So that..." clause ("I can decide whether downstream stages need attention without manually re-reading and comparing every later artefact myself") captures the intent behind the materiality-suggestion metric but doesn't use its name directly. Benefit Linkage section does name the metric correctly. Consistency nit only, matching 1-L1 on res-s2.

---

## Summary

1 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** FAIL — 1-H1 must be resolved before /test-plan.

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 5 | PASS |
| Architecture compliance | 3 | PASS |

**Traceability (4):** All references present, coverage matrix lists this story against M2; docked for 1-L1.
**Scope integrity (5):** Correctly excludes acting on the suggestion (res-s4's job) and downstream regeneration (never in scope).
**AC quality (2):** FAIL. AC1 is not implementable as sequenced — see 1-H1. AC2/AC3/AC4 are individually fine (testable, Given/When/Then, no "should" language) but all depend on AC1's comparison mechanism existing, so the whole set is blocked on the same gap.
**Completeness (5):** All template fields populated, named persona, complexity and scope stability rated.
**Architecture compliance (3):** Architecture Constraints is populated but doesn't name any mechanism for the actual central architectural question this story raises (where "pre-revision content" comes from) — directly contributes to 1-H1. Not scored lower because the gap is addressable by a constraint amendment plus AC reword, not a full story rework.
