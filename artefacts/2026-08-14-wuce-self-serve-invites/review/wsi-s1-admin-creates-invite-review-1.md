# Review Report: Admin creates a per-person team invite, which sends the invite email — Run 1

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
**Date:** 2026-08-15
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** C (AC quality) — No AC addresses what happens if an admin invites the same email address for the same tenant a second time while a first invite is still pending (unexpired, unredeemed). Does the second submission create a second `team_invitations` row (two live invites for the same person), silently supersede the first, or get rejected as a duplicate? AC1 only covers the single-invite-creation case.
  Risk if proceeding: The implementer will pick a behavior arbitrarily during coding, and it may not match what the admin or invitee actually expects (e.g. two separate invite emails arriving, or a confusing "already invited" error with no defined message).
  To acknowledge: run /decisions, category RISK-ACCEPT — or add an AC before /test-plan.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Justification |
|-----------|-------|----------------|
| Traceability | 5 | Epic/discovery/benefit-metric all referenced; "So that" ties directly to a real, cited codebase constraint (`UnknownIdentityError`); Benefit Linkage names the exact metric and mechanism. |
| Scope integrity | 5 | 4 explicit out-of-scope items, all specific and reasoned; no epic/discovery out-of-scope violation found. |
| AC quality | 4 | 5 ACs, all Given/When/Then, testable, no "should" language, edge cases (role validation, send-failure) each have their own AC. One real scenario gap (1-M1: duplicate invite handling) not covered by any AC — not severe enough to fail the criterion outright given the rest of the set is strong. |
| Completeness | 5 | All template fields populated with real, specific content (not placeholder text); NFRs cover all 4 categories; complexity and scope stability rated; data-model diagram marker present and matches the Architecture Constraints' own described schema. |

**Verdict:** PASS — all criteria scored 3 or above.

---

## Category E: Architecture compliance

- Architecture Constraints field populated: ✓ — 5 substantive bullets, all grounded in real, cited code (`team-management.js`, `invitation-email.js`, `client-invitations.js`, `_combinedMagicLinkVerify`).
- Implementation path doesn't violate a named approved pattern: ✓ — explicitly follows ADR-026 (reuse before introducing a new entity) for both the email adapter and the invitations-table shape.
- No listed anti-pattern used: ✓
- Applicable repo-level ADRs referenced: ✓ — ADR-025 (tenant scoping) and ADR-026 (reuse) both explicitly cited with accurate mechanism descriptions.
- Story NFRs align with mandatory constraints: ✓ — Security NFR matches `client-invitations.js`'s own established never-log-the-token convention.

No Category E findings.
