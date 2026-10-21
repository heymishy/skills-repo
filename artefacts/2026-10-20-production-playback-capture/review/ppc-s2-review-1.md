# Review Report: Extend to full-feature capture loop with timing validation — Run 1

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md`
**Date:** 2026-10-21
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** AC quality — Inherited from `ppc-s1-review-1.md` finding `1-H1`. AC1 ("the system sequentially captures a screenshot for every AC using the same session-reuse mechanism from `ppc-s1`") depends entirely on `ppc-s1`'s AC2 resolving an AC to a target URL/selector — a mechanism confirmed not to generalise from the existing `rpca` implementation to an arbitrary external tenant's own repo (see `ppc-s1-review-1.md` for the full finding). This story cannot be meaningfully implemented or tested until that upstream gap is resolved.
  Fix: Resolve `ppc-s1`'s `1-H1` first. No independent fix needed in `ppc-s2` itself beyond re-checking this story's ACs once the upstream mechanism is redefined (the loop/timing/failure-handling logic in AC2–AC5 should be largely unaffected by how the target-screen problem is ultimately solved).

---

## MEDIUM findings — resolve or acknowledge in /decisions

<!-- None independent of 1-H1. -->

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — AC4's SCOPE-note trigger ("if measured capture time exceeds 60 seconds... log a SCOPE note") is a good self-correcting mechanism, but the story doesn't say who is responsible for acting on that SCOPE note (re-running `/definition` for a new async story, vs. just noting it and shipping anyway). Minor — doesn't block anything, worth a one-line clarification when this story reaches DoR.

---

## Summary

1 HIGH (inherited), 0 MEDIUM, 1 LOW across this story.
**Outcome:** FAIL

---

## Category E detail (architecture compliance)

| Check | Result |
|---|---|
| Architecture Constraints field populated | ✓ |
| Implementation path doesn't violate a named approved pattern | ✓ (no new pattern introduced beyond `ppc-s1`'s, whose own gap is tracked there) |
| Implementation path doesn't use a listed anti-pattern | ✓ |
| Applicable repo-level ADRs referenced/respected | ✓ — correctly defers to `ppc-s1`'s own ADR-018/ADR-025 compliance rather than restating it |
| Story NFRs align with mandatory constraints in guardrails | ✓ (not applicable — registry's mandatory constraints are viz-scoped) |
