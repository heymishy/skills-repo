# Review Report: Client-org dual-path authentication — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Date:** 2026-07-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Completeness — AC2 requires "a time-limited magic-link is sent to that email," but no transactional email-sending mechanism exists anywhere in this codebase (same gap as Story 3's AC3 — confirmed via the same search: no email-sending dependency in `package.json`, no `sendEmail`-shaped function in `src/web-ui/`). This story's own NFR hedges rather than resolving it: "no new email infrastructure — reuse whatever existing email-sending mechanism, if any" — the "if any" is the review flag itself; it concedes uncertainty about whether the assumption holds, rather than confirming it does.
  Fix: same fix as Story 3's 1-H1 — name the actual email mechanism to be built/integrated (with a Complexity re-rate if it's new), or descope to a code-entry mechanism that doesn't require email delivery for MVP. Resolve alongside Story 3 since both stories almost certainly share the same underlying send path.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness/NFR — the Security NFR thoroughly covers link expiry, single-use, and delivery-address binding, but does not mention rate-limiting the magic-link *request* endpoint itself. This codebase has an established, directly analogous precedent for exactly this abuse class: `routes/auth-email.js`'s existing signup rate limiter (per-IP, time-windowed) exists specifically because an unprotected endpoint that sends an email to an arbitrary address can be used to spam/harass that address. A magic-link request endpoint is the same shape of risk and has no equivalent guard named here.
  Risk if proceeding: an attacker could repeatedly trigger magic-link sends to a real invited user's email (or attempt to enumerate valid invitation emails) with no rate limit, generating unwanted mail volume or aiding enumeration.
  To acknowledge: run /decisions, category RISK-ACCEPT, or add a rate-limiting NFR mirroring `auth-email.js`'s existing pattern before /test-plan.

---

## LOW findings — note for retrospective

None beyond what's already captured above.

---

## Summary

1 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** FAIL

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 5 | PASS |
| Completeness | 2 | FAIL |
| Architecture compliance | 4 | PASS |

**Traceability (4):** Clear mechanism sentence — without this path, "a meaningful share of invited Client-org users could never complete the flow the metric measures." Not a 5 only because the metric linkage assumes email delivery works, which 1-H1 puts in genuine doubt.

**Scope integrity (4):** Correctly excludes password auth, MFA, and extending magic-link to other org types (explicitly named in discovery as out of scope) — clean, no overlap.

**AC quality (5):** 4 ACs, Given/When/Then, testable, and AC4 (single-use link rejection) is exactly the kind of specific security-relevant edge case this template wants as its own AC rather than a sub-bullet.

**Completeness (2 — FAIL):** 1-H1 — the story's own NFR self-identifies the uncertainty ("if any") without resolving it, which is itself evidence the field isn't actually complete despite being populated.

**Architecture compliance (4):** Correctly scopes the new auth entry point to resolve into the existing session shape (ADR-025-consistent — "not a parallel identity system"). Not a 5 because, as in Story 3, ADR-026's reuse-before-new-entity question was never explicitly answered for the underlying email mechanism.

**Verdict:** FAIL — 1 HIGH finding (the same unaddressed email-sending dependency as Story 3) must be resolved before /test-plan; the rate-limiting MEDIUM should also be addressed given this codebase's own established precedent for the identical risk shape.
