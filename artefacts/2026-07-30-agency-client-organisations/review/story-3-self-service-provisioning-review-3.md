# Review Report: Self-service Agency-to-Client provisioning — Run 3

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Date:** 2026-07-31
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Findings carried from Run 2

- **[1-H2] Traceability — RESOLVED.** AC3 now specifies that the invited user's account is created with a `team_memberships` row of `role = 'admin'` for the new Client org's own `tenant_id` — reusing the existing per-(person, tenant) role model (`modules/user-roles.js`/`team-management.js`, ADR-026-compliant) rather than a bespoke "read-only role." The prior AC3 wording conflated two independent axes: the invited user's own org-level privilege (`team_memberships.role`) and Story 2's separate, unconditional read-only enforcement on Agency-shared resources — the corrected AC3 states both explicitly and clarifies they are not in tension. This satisfies Story 6's AC1 precondition (a Client-org user with `role = 'admin'`), closing the cross-story gap from both sides (see Story 6 review run 2).
- **[1-L1]** (carried from Run 1/2, unchanged) — AC3 still doesn't specify an expiry for unused invitation records. Remains a LOW note for /test-plan, not a blocker.

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

None.

## LOW findings — note for retrospective

- **[1-L1]** (unchanged) — invitation-record expiry (distinct from the magic-link's own expiry) not specified. Worth a one-line note before /test-plan writes the invitation-record tests.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5, up from 3):** 1-H2 closed — AC3's output (a `team_memberships` row with `role = 'admin'`) now connects forward correctly to Story 6's AC1 precondition. Both stories were corrected together from the same decision entry, per the Run 1/2 recommendation not to resolve the shared gap twice independently.

**Scope integrity (4):** Unchanged from Run 2.

**AC quality (4):** Unchanged — 1-L1 (invitation expiry) is the only remaining minor gap.

**Completeness (5):** Unchanged from Run 2 — both Run 1 HIGH findings are now closed.

**Architecture compliance (5):** ADR-026 is now explicitly satisfied for both the email/token mechanism (Run 2) and the role model (this run) — no new entity introduced for either.

**Verdict:** PASS — all HIGH findings from Runs 1 and 2 are resolved. Clear to proceed to /test-plan alongside Story 4 and Story 6.
