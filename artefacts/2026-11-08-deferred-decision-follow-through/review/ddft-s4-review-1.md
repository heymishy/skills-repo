# Review Report: Self-registration at the moment of deferral — Run 1

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Date:** 2026-11-09
**Categories run:** A, B, C, D, E, F, G, H
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Traceability / AC quality (Categories A and C) — AC3 names `/benefit-metric`'s "State update — mandatory final step" section as the hook point, but its trigger condition is "a Tier 1 or Tier 2 metric is left with `signal: 'not-yet-measured'` at the point the feature later reaches DoD." These two things cannot both be true: `/benefit-metric`'s State-update section runs once, when the benefit-metric artefact is first authored and activated — at that moment, every metric is *always* `not-yet-measured` by construction (no feature has reached DoD yet when metrics are first defined). The section the AC names has no way to know, at its own run time, whether the feature will *still* have an unmeasured metric once it later reaches DoD — that fact can only be known at `/definition-of-done` time, a different skill entirely, one the discovery's own MVP scope does not name among its three hook points (`/discovery`, `/decisions`, `/benefit-metric`). As written, this AC describes a condition its own named hook point structurally cannot detect — it is not independently testable, because no test can make `/benefit-metric`'s State-update section observe a DoD-time fact.
  Fix: Either (a) retarget AC3's hook point to `/definition-of-done`'s own completion flow (which does know, at that moment, whether each metric is still unmeasured) and add it as a 4th hook — correcting the discovery's own MVP scope to name 4 skills, not 3, with a corresponding decisions.md entry and a 4th governed-file PR; or (b) redesign AC3 around something `/benefit-metric`'s own State-update section genuinely can observe at its own run time (e.g., a metric defined with no baseline and no measurement plan at all, a real gap distinct from "not yet measured because it's too early to be measured"). Option (a) better matches the story's own stated intent ("still-unmeasured metrics at DoD"); option (b) keeps the discovery's 3-hook scope but measures something narrower. This is a design decision for /definition to resolve, not something /review should silently pick.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 5 | PASS |
| Architecture compliance (E) | 4 | PASS |
| Journey.js fixture hygiene (F) | N/A | — |
| skills.js fixture hygiene (G) | N/A | — |
| journeys.js fixture hygiene (H) | N/A | — |

**Justifications:**
- Traceability: 3, not 5 — AC1 and AC2's hook points (`/discovery`'s and `/decisions`' State-update sections) are correctly matched to their trigger conditions (both are conditions genuinely knowable at those skills' own run time); only AC3 has the mismatch in 1-H1, which is why this isn't scored lower — two of three hooks are sound.
- Scope integrity: correctly excludes changing the three skills' conversational flow and retroactive registration.
- AC quality: 2 — see 1-H1; AC1, AC2, AC4, and AC5 are each independently clear and testable.
- Completeness: full as a document; the defect is substantive, not a missing field.
- Architecture compliance: 4 — correctly identifies the 3-separate-PRs requirement and the real, verified hook-point line numbers for `/discovery` and `/decisions`; the citation for `/benefit-metric`'s hook point is accurate as a *file location* (the section exists exactly where claimed) but the AC built on top of it describes a condition that section can't observe, which is the root of 1-H1.

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL — AC quality scored 2, below the pass threshold of 3.
