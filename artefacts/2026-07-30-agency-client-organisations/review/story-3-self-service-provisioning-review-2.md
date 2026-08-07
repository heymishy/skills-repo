# Review Report: Self-service Agency-to-Client provisioning — Run 2

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Date:** 2026-07-31
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## Findings carried from Run 1

- **[1-H1] Completeness/Scope — RESOLVED.** The story now names the actual mechanism: Passport.js + `passport-magic-login` (shared with Story 4's login mechanism, per `decisions.md` 2026-07-31 ARCH entry) issues and verifies the invitation link, and Resend sends the invitation email (`RESEND_API_KEY`). Complexity Rating is re-affirmed at 2 with an explicit note that the prior unknowns are now a named, bounded decision rather than an unstated assumption. This is no longer an unimplementable AC.
- **[1-H2] Traceability — STILL OPEN, not addressed by this change.** This decision only resolved the email/token mechanism (1-H1). It does not touch the separate role-model gap: AC3 still only ever creates a Client-org user "with a read-only role," and no story anywhere provisions the "appropriate permissions" role Story 6's AC1 requires. This finding is unchanged from Run 1 and mirrored in Story 6's own review — it needs its own resolution (a role-provisioning mechanism, or an explicit statement of which invited user counts as privileged) before this story can pass.

## HIGH findings — must resolve before /test-plan

- **[1-H2]** (carried from Run 1, unchanged) — Traceability. AC3 states the invited user's account is created "with a read-only role," and no other AC in this story or epic ever creates, upgrades, or grants a more-privileged Client-org role, leaving Story 6's AC1 precondition unsatisfiable by anything this epic builds. See Run 1 and Story 6's review for full detail. Not in scope of the 2026-07-31 email/token decision — requires a separate resolution.

## MEDIUM findings — resolve or acknowledge in /decisions

None beyond what's captured in the HIGH finding above.

## LOW findings — note for retrospective

- **[1-L1]** (carried from Run 1, unchanged) — AC3 still doesn't specify an expiry for unused (never-redeemed) invitation records, distinct from the magic-link's own expiry. Worth a one-line note before /test-plan.

---

## Summary

1 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** FAIL

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | FAIL |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (3, up from 2 — still FAIL):** 1-H1's mechanism gap is closed, which removes one of the two traceability breaks. 1-H2 (the role-model gap with Story 6) remains and is the sole reason this criterion still fails.

**Scope integrity (4, up from 3):** The previously-unstated "build email infrastructure" scope item is now named and decided (ARCH entry in `decisions.md`), closing the gap that held this score down in Run 1.

**AC quality (4):** Unchanged — ACs are well-formed; AC3 is now actually implementable given the named mechanism, but scoring is unchanged since AC quality itself (prose, testability) was never the issue.

**Completeness (5, up from 2):** 1-H1 fully resolved — the mechanism is named, not silently assumed.

**Architecture compliance (5, up from 3):** ADR-026's reuse-before-new-entity question is now explicitly answered for the email/token mechanism.

**Verdict:** FAIL — 1-H1 is resolved by the 2026-07-31 ARCH decision, but 1-H2 (the cross-story Client-org privileged-role gap, shared with Story 6) is untouched by this change and still blocks /test-plan. Recommend resolving 1-H2 as its own follow-up before re-running review a third time.
