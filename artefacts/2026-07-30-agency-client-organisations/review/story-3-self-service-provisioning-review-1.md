# Review Report: Self-service Agency-to-Client provisioning — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Date:** 2026-07-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Completeness/Scope — AC3 requires "the invited email receives an invitation (link or code)," but no transactional email-sending mechanism exists anywhere in this codebase today. Confirmed by direct search: no `nodemailer`/`sendgrid`/`mailgun`/equivalent dependency in `package.json`, and no `sendEmail`-shaped function anywhere in `src/web-ui/`. This story's Architecture Constraints, Dependencies, and NFRs do not name a provider, a new adapter, or even acknowledge that this infrastructure needs to be built from scratch — AC3 is currently unimplementable as written without an undocumented, unscoped addition.
  Fix: either (a) add an explicit Architecture Constraint naming the email-sending mechanism to be introduced (provider choice, new adapter module, D37 wiring per this codebase's own injectable-adapter convention) and re-rate Complexity accordingly (currently "2 — well understood," which does not hold if new third-party email infrastructure must be integrated from zero), or (b) descope AC3 to generate an in-app invitation code/link only for MVP (no email delivery), deferring actual email transport to a follow-up story. This same gap also affects Story 4 (see that story's own review) — resolve both together, since they'd likely share the same underlying mechanism.

- **[1-H2]** Traceability — AC3 states the invited user's account is created "with a read-only role," and no other AC in this story (or anywhere in the epic) ever creates, upgrades, or grants a more-privileged Client-org role. Story 6's AC1 explicitly requires "a Client-org user with appropriate permissions" (not "any Client-org read-only viewer," per Story 6's own NFR) to trigger org conversion — a role this story never provisions. As written, no Client-org user created by this epic could ever satisfy Story 6's AC1 precondition.
  Fix: either add an AC or a field to Story 3 (or a small follow-up) establishing how a Client-org user becomes the "appropriate permission" holder Story 6 requires (e.g. the first invited user is implicitly an org-admin-equivalent even while functionally read-only elsewhere, or a distinct role field is set), or clarify in Story 6 exactly which existing role satisfies its own AC1 and correct the "not just any read-only viewer" NFR wording to match. This is a cross-story consistency gap, not a Story 3-only defect — see Story 6's review for the mirrored finding.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None beyond what's captured in the HIGH findings above.

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — AC3 says "an invitation record is created" but doesn't specify an expiry for unused invitations (distinct from Story 4's magic-link expiry, which is about the login mechanism, not the invitation record itself). Worth a one-line note on whether stale, never-redeemed invitations expire or persist indefinitely.

---

## Summary

2 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** FAIL

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 2 | FAIL |
| Scope integrity | 3 | PASS |
| AC quality | 4 | PASS |
| Completeness | 2 | FAIL |
| Architecture compliance | 3 | PASS |

**Traceability (2 — FAIL):** 1-H2 above — AC3's own output (a read-only role) does not connect forward to Story 6's stated dependency on a "user with appropriate permissions." The chain from "this story provisions the user" to "that user can later do everything the epic needs them to do" is broken at a specific, quotable line (AC3 vs. Story 6 AC1/NFR).

**Scope integrity (3):** Out of scope section correctly excludes the auth mechanism itself (Story 4) and broader user management — no overlap with sibling stories. Scored 3, not higher, because the email-sending gap (1-H1) reveals an unstated scope item (build email infrastructure) that isn't named as in-scope, out-of-scope, or deferred anywhere.

**AC quality (4):** 4 ACs, Given/When/Then, testable, specific (references `handlePostProductNew`'s existing validation pattern by name for AC4). Not a 5 only because AC3 depends on unaddressed infrastructure (1-H1), which affects testability in practice even though the AC's prose is well-formed.

**Completeness (2 — FAIL):** 1-H1 above — a required piece of infrastructure (email delivery) is silently assumed rather than named, scoped, or deferred anywhere in this story.

**Architecture compliance (3):** Correctly cites ADR-027 (ordinary app code) and the existing `handlePostProductNew` pattern precedent. Scored 3, not higher, because ADR-026 (reuse before introducing new entities) is directly relevant to the email-infrastructure gap and isn't discussed — if no reusable email mechanism exists, that itself is exactly the kind of "genuinely new entity" decision ADR-026 asks to be made explicitly, not silently assumed.

**Verdict:** FAIL — 2 HIGH findings (unaddressed email-sending dependency; a role-model gap with Story 6) must be resolved before /test-plan can write meaningful tests for AC3.
