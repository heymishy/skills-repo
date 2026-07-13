# Review Report: Login role resolution is scoped by person, not just tenant — Run 1

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Date:** 2026-07-13
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

- **[1-L1]** Category D (Completeness) — AC4's scope was corrected mid-drafting after directly reading `server.js` (confirmed `user_roles` only ever gets a row via the `ADMIN_GITHUB_LOGINS` startup seed, never at ordinary signup) — the story now correctly frames AC4 as a regression check, not new auto-person-creation functionality. Noting this only because the first draft would have been a genuine scope-creep finding had it not been caught before this review; no residual issue in the current text.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Directly connects to Metric 1, with an honest explanation of exactly what was broken and why the schema/write paths (tir-s1, tir-s3) are fine and only the read path is wrong.
**Scope integrity (5):** Explicitly excludes changing the schema, `person_identities`, or `resolvePersonForIdentity` — this story is scoped tightly to the login-time consumer of already-built pieces. AC4's corrected scope (see 1-L1) prevents an unintended auto-person-creation feature from sneaking in as a side effect of a "fix."
**AC quality (5):** All 5 ACs in Given/When/Then, independently testable; AC1/AC2 are a well-chosen pair proving both directions of the bug (not just "the bug is gone" but "each specific person's own role is used").
**Completeness (4):** All fields populated; 1-L1 noted for retrospective only.
**Architecture compliance (5):** Correctly identifies and reuses `resolvePersonForIdentity` (tir-s2) rather than reimplementing identity resolution; ADR-025 and D37 correctly cited, with AC5 explicitly scoping the required `server.js` rewiring.

**Verdict:** PASS — no HIGH or MEDIUM findings; ready for /definition-of-ready.
