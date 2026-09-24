# Review Report: Backfill person_identities on login so existing real memberships become resolvable — Run 1

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Date:** 2026-09-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** C — AC1 bundles 4 distinct login call sites (GitHub OAuth, Google OAuth, email sign-in, email sign-up) into a single AC. Each is structurally identical (same backfill logic, different provider value) so this is defensible as one AC, but it risks under-testing at `/test-plan` if read as "one test covers this AC" rather than "one test per call site, same assertion shape."
  Fix: at `/test-plan`, explicitly write 4 separate test cases for AC1 (one per real call site), not one test with a single provider value standing in for all four — name this explicitly in the test plan's AC coverage table rather than leaving it implicit.

- **[1-L2]** D — The Audit NFR is left conditionally unresolved ("if not directly feasible... RISK-ACCEPT at DoR"), correctly flagged as a real open decision rather than a blank field, but it means Completeness can't fully close until DoR time.
  Fix: no action needed now — this is exactly what DoR's W1/W3 warning path exists for; just don't let it get silently dropped between here and DoR.

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome:** PASS

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Epic/discovery/benefit-metric all referenced; benefit linkage cites the exact live-verified gap (wuce-staging, 2026-09-24) as its mechanism — about as concrete as a benefit-linkage sentence gets.
**Scope integrity (5):** This story's central risk was apparent scope overlap with the epic's own "no auto-creating team_memberships on raw login" exclusion. The story handles this directly and correctly: AC4 is a dedicated negative-case AC proving no new person/membership is ever created, and the Architecture Constraints section states the boundary explicitly rather than leaving it implicit. This is the single strongest part of the story.
**AC quality (4):** All 5 ACs are Given/When/Then, testable, reference real code paths by name (`team_memberships.tenant_id` fallback, `resolveRoleForPerson`'s own AC4 convention) rather than vague behaviour — minus 1 point for AC1's 4-call-site bundling (see LOW finding).
**Completeness (4):** All template fields populated with real content, not placeholders — minus 1 point for the Audit NFR's explicitly-conditional resolution (a defensible, clearly-flagged deferral, not a blank, but still incomplete as written).
**Architecture compliance (5):** ADR-026 correctly cited (reuses `person_identities`, no new table). No D37 adapter needed and the story correctly states why. No MC-SEC or rendering-related guardrail applies (no UI, no innerHTML). Provider-value handling at each of the 4 real call sites is correctly identified as a real constraint, not glossed over.
