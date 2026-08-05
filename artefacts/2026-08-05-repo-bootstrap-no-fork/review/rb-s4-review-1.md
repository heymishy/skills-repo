# Review Report: Bootstrap an existing repo from a DoR-approved SaaS artefact — Run 1

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
**Date:** 2026-08-05
**Categories run:** A, B, C, D, E
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C (AC quality) — AC4 is not a valid acceptance criterion. Quoting it: "Given the SaaS-side export endpoint does not yet exist at the time this story is implemented, When this AC is evaluated, Then the story's own scope includes building the minimal version of that endpoint — this AC is satisfied by the endpoint plus the CLI's consumption of it, not by the CLI alone assuming an endpoint that isn't there." This is a scope clarification (what this story's delivery boundary includes) forced into Given/When/Then grammar — it does not describe an observable system behaviour a test can assert against. "This AC is satisfied by..." is a statement about the AC itself, not about the system under test. This directly violates the story template's own rule: "ACs describe observable behaviour, not implementation approach" — a scope note is neither.
  Fix: Remove AC4 as written. If the intent is to make explicit that building the export endpoint is in scope, state that in the story's Architecture Constraints or a new "Scope note" outside the ACs list (which this story's Architecture Constraints section already partially does via its "Platform-availability note"). Replace AC4 with a genuine observable-behaviour AC for the endpoint itself, e.g.: "Given the export endpoint has been implemented and a feature is DoR-approved, When a request is made with a valid credential for that feature's slug, Then the endpoint returns 200 with the artefact content and pipeline-state entry matching what the SaaS UI shows for that feature." AC1–AC3 already meet the minimum-3 requirement independently, so this fix doesn't block on adding a replacement — but leaving AC4 as-is going into /test-plan risks a test being written against an unfalsifiable assertion.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** E (Architecture compliance) — The Architecture Constraints field's "Platform-availability note" correctly identifies that no export endpoint exists yet and reasons through why the D2-platform gate doesn't require deferring the story (it's within this codebase's own delivery control, not an external vendor dependency) — this reasoning is sound and well-documented. However, the same reasoning isn't reflected in the epic's own Complexity Rating (3) or Scope Stability (Unstable) fields, which already account for this — no actual gap, noting for completeness only. Downgraded to informational; not scored as a deduction.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 1 MEDIUM (informational only, not scored), 0 LOW.
**Outcome:** FAIL

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** FAIL — 1 criterion (AC quality) scored below 3 due to 1-H1. AC1–AC3 are solid, testable, Given/When/Then ACs; only AC4 needs replacement. This is a narrow, well-scoped fix, not a full story rework.
