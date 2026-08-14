# Review Report: Invite acceptance is blocked if the tenant is at its member-count cap — Run 1

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Date:** 2026-08-15
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** A (Traceability) — Same gap as `wsi-s3`'s [1-M1]: `benefit-metric.md`'s Metric Coverage Matrix does not list `wsi-s4` even though this story's own Benefit Linkage claims an indirect connection to "Share of new teammates added via self-serve invite" (as a guardrail preventing an unbounded side effect).
  Risk if proceeding: Same as `wsi-s3`'s finding — under-represented coverage matrix, likely caught later by `/trace` instead of now.
  To acknowledge: run /decisions, category RISK-ACCEPT — or update the coverage matrix (can be done in the same pass as `wsi-s3`'s fix).

---

## LOW findings — note for retrospective

- **[1-L1]** C (AC quality) — AC3's assertion ("a materially higher cap applies than the trial plan's own cap") is somewhat subjective as worded — "materially higher" has no crisp threshold, so two different testers could reasonably disagree on whether a given implementation satisfies it (e.g. is a cap of 4 vs. 3 "materially higher"? Debatable). The story's own Architecture Constraints correctly and intentionally leave the exact numbers as an implementation decision — that part is fine — but the AC's own assertion could be tightened to something unambiguous (e.g. "the paid cap is strictly greater than the trial cap" or "at least double") without re-fixing the actual numbers.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Justification |
|-----------|-------|----------------|
| Traceability | 4 | Epic/discovery/benefit-metric referenced, honest "indirect" framing in Benefit Linkage — but see 1-M1 (coverage matrix gap, same pattern as `wsi-s3`). |
| Scope integrity | 5 | 4 explicit out-of-scope items, each specific and well-reasoned (notably explicit about NOT counting pending invites toward the cap, closing an ambiguity proactively rather than leaving it implicit). |
| AC quality | 4 | 4 ACs, Given/When/Then, testable, cover the blocked case, the unaffected-below-cap case, the tier-differentiation requirement, and the inclusive-boundary edge case (AC4 is a genuinely good catch — an easy off-by-one to miss). Minor deduction for 1-L1 (AC3's subjective wording). |
| Completeness | 5 | All fields populated; Architecture Constraints are unusually explicit about what this story is NOT (not full Stripe billing) as well as what it is — reduces ambiguity for the implementer. |

**Verdict:** PASS — all criteria scored 3 or above.

---

## Category E: Architecture compliance

- Architecture Constraints field populated: ✓ — explicitly scoped as new prerequisite work, not integration with pre-existing infrastructure (correctly reflects the /definition-time correction logged in `decisions.md`).
- Implementation path doesn't violate a named approved pattern: ✓ — reuses `tenant-plan.js`'s existing `getPlanState` rather than inventing a second plan-state read path.
- No listed anti-pattern used: ✓
- Applicable repo-level ADRs referenced: ✓ — ADR-025 correctly cited in the NFR Security row (count query scoped by the invite's own stored tenant_id).
- Story NFRs align with mandatory constraints: ✓

No Category E findings.
