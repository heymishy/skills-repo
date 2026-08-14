# Review Report: Invitee accepts the invite and joins the tenant with the assigned role — Run 1

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Date:** 2026-08-15
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

- **[1-L1]** C (AC quality) — AC5 ("a regression test confirms this, not just informal confidence") prescribes a verification METHOD rather than purely describing observable behaviour. The underlying behaviour ("the existing two dispatcher cases continue working unchanged") is fine as an AC; the "a regression test confirms" clause is implementation-method language that belongs more naturally in the NFR/testing-approach section than embedded in the AC's own Then clause.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Justification |
|-----------|-------|----------------|
| Traceability | 5 | Epic/discovery/benefit-metric referenced; Benefit Linkage names both metrics this story moves and explains the mechanism for each precisely (completes the round-trip; is the source of the second metric's own timestamp). |
| Scope integrity | 5 | 3 explicit out-of-scope items, each with a clear reason; correctly excludes invite creation (wsi-s1's job) and a new onboarding UI. |
| AC quality | 4 | 5 ACs, all Given/When/Then, testable, cover the core success path, both existing-person and new-person cases, double-redemption, and dispatcher-regression safety. Minor deduction for 1-L1 (AC5's method-prescriptive phrasing) — not severe enough to fail the criterion. |
| Completeness | 5 | All fields populated with specific, grounded content; NFRs cover all 4 categories including an explicit regression-safety NFR; data-model diagram correctly shows the redemption relationship across `team_invitations`, `team_memberships`, and `people`. |

**Verdict:** PASS — all criteria scored 3 or above.

---

## Category E: Architecture compliance

- Architecture Constraints field populated: ✓ — 5 substantive bullets grounded in real code (`_combinedMagicLinkVerify`, `setVerifyCallback`, `createClientOrgUserAndAdminMembership`, `markInvitationRedeemed`).
- Implementation path doesn't violate a named approved pattern: ✓ — explicitly follows the documented "never re-register the shared strategy, extend via `setVerifyCallback`" rule established by `story-4-dual-path-authentication`.
- No listed anti-pattern used: ✓
- Applicable repo-level ADRs referenced: ✓ — ADR-025 cited with an accurate mechanism (tenant_id sourced from the invite record, not the accept-time request — closing a real tamper vector).
- Story NFRs align with mandatory constraints: ✓

No Category E findings.
