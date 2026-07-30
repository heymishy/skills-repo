# Review Report: Client-org dual-path authentication — Run 2

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Date:** 2026-07-31
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Findings carried from Run 1

- **[1-H1] Completeness — RESOLVED.** The story now names the actual mechanism: Passport.js + `passport-magic-login` for token issuance/verification (shared with Story 3's invitation link, per `decisions.md` 2026-07-31 ARCH entry), and Resend for email delivery (`RESEND_API_KEY`). The NFR's "if any" hedge is gone — the Performance NFR still references delivery latency but no longer expresses uncertainty about whether a mechanism exists.
- **[1-M1] Completeness/NFR — RESOLVED.** A new Security NFR ("rate-limiting, added 2026-07-31") requires per-IP and per-target-email rate-limiting on the magic-link request endpoint, explicitly mirroring `auth-email.js`'s existing signup rate limiter for the same abuse class. This is a concrete, testable requirement, not just an acknowledgement.

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

None.

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** The metric-linkage doubt noted in Run 1 ("assumes email delivery works") is closed now that delivery is a named, decided mechanism rather than an open question.

**Scope integrity (4):** Unchanged from Run 1 — correctly excludes password auth, MFA, and extending magic-link to other org types.

**AC quality (5):** Unchanged from Run 1 — 4 ACs, Given/When/Then, testable, AC4's single-use rejection is a well-specified edge case.

**Completeness (5, up from 2):** Both Run 1 gaps closed — the email/token mechanism is named (ARCH decision, `decisions.md`) and the rate-limiting NFR is concrete and precedented.

**Architecture compliance (5, up from 4):** ADR-026's reuse-before-new-entity question is now explicitly answered — Passport.js does not own sessions, so the new entry point resolves into the existing session shape exactly as ADR-025 requires, and the mechanism is shared with Story 3 rather than duplicated.

**Verdict:** PASS — both Run 1 findings closed by the 2026-07-31 ARCH decision and story edits. No new findings introduced by the changes themselves.
