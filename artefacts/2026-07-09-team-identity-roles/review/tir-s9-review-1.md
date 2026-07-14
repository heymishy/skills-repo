# Review Report: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId — Run 1

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
**Date:** 2026-07-14
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

- **[1-L1]** Category A (Traceability) — this is the second fix-forward story in this epic to close a gap in a previously "fixed" story (tir-s7 fixed the query logic; this story fixes the caller that feeds that query the wrong argument). Worth a retrospective note on whether the D37 wiring-test correctness rule (added to CLAUDE.md after tir-s1's own weaker wiring test) should also require a check that *every* production call site of a newly extended adapter signature actually supplies the new argument — tir-s7's own tests never drove the real `handleAuthCallback`/`handleAuthGoogleCallback` call sites, only `resolveRoleForPerson` directly, which is why this gap survived tir-s7's review and DoR unnoticed.

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
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Directly connects to Metric 1, with an honest, technically precise explanation of exactly how this reproduces tir-s7's original bug one layer removed — including the specific line (`server.js`'s `resolveRoleForPerson(_userRolesPool, tenantId, tenantId)`) that discards the identityKey argument tir-s7's own corrected function signature expects.
**Scope integrity (5):** Explicitly excludes changing `resolveRoleForPerson`/`resolvePersonForIdentity` (already correct per tir-s7) and explicitly separates out a related-but-distinct finding (Google-authenticated teammates added to a GitHub-org-shared tenant never resolve their role, a silent-loss bug rather than a collision bug) into Out of Scope rather than silently expanding this story's blast radius.
**AC quality (5):** All 5 ACs in Given/When/Then, independently testable; AC1/AC2 are driven through the *real* `handleAuthCallback` OAuth callback (not `resolveRoleForPerson` called directly with hand-picked arguments, as tir-s7's own tests did) — a meaningfully stronger coverage bar than the story it fixes. AC4 is explicitly framed as a documented non-bug finding rather than an implied-but-unproven fix.
**Completeness (5):** All fields populated, including a clearly bounded Out of Scope entry for the related Google/shared-tenant gap, with a note that it will be logged in `decisions.md` as a candidate follow-up rather than dropped.
**Architecture compliance (5):** Correctly reuses the existing `getRoleForTenant`/`setGetRoleForTenant` D37 adapter pair via an additive, backward-compatible optional second parameter rather than introducing a new adapter or breaking `auth-email.js`'s existing single-argument call sites; ADR-025 (tenant remains the isolation boundary; only the identity argument changes) correctly cited; AC5 explicitly requires a behavioural (not just referential) wiring test, directly per CLAUDE.md's post-tir-s1 wiring-test correctness rule.

**Verdict:** PASS — no HIGH or MEDIUM findings; ready for /definition-of-ready.
