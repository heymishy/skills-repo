# Review Report: Add a timezone and date-format preference to Settings — Run 2

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Date:** 2026-08-17
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ 1-H1 — Story specified extending the legacy `users` table instead of the real session-identity-linked `people`/`person_identities` entity — RESOLVED. Architecture Constraints, AC2/AC3/AC4, and the data-model diagram now all target `people`, resolved via `resolvePersonForIdentity(pool, identityKey)` reusing `handleGetSettings`'s own already-computed `identityKey` variable (verified against real code at `src/web-ui/routes/settings.js` line ~480 and `src/web-ui/modules/identity-links.js`/`user-roles.js`'s real schema).

### New findings this run
🆕 None.

### Carried forward unchanged
⏳ None — 1-L1 (AC4 error message vagueness) was also tightened in the same pass (AC4 now specifies a 400 response and a field-naming message) even though it was not required to resolve the HIGH finding.

### Progress summary
Run 1: 1 HIGH, 0 MEDIUM, 1 LOW
Run 2: 0 HIGH, 0 MEDIUM, 0 LOW
Change: HIGH [-1], MEDIUM [0], LOW [-1]

**IMPROVED**

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None. The fix also added a new AC5 (identity-resolution failure edge case — `resolvePersonForIdentity` returning `null`), which is a genuine improvement: the original story had no explicit handling for that state.

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS — 6 ACs, Given/When/Then, testable, includes the new identity-resolution-failure edge case as its own AC |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS — 1-H1 resolved; reuse target now verified against real, live-wired code rather than a plausible-looking guess |

**Verdict:** PASS — all criteria scored 3 or above.
