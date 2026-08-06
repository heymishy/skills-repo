# Review Report: Show the Products sidebar during skill chat sessions — Run 1

**Story reference:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Date:** 2026-08-06
**Categories run:** A, B, C, D, E
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — The story's Architecture Constraints claim this "reuses the exact... `getProductsNavSummary(pool, tenantId)` helper already proven in the 3 wired call sites," implying trivial reuse. Confirmed directly: none of the 13 target `skills.js` handlers (`handleGetSkillsHtml`, `handlePostSkillSessionHtml`, `handleGetChatHtml`, etc.) currently receive a `pool` parameter or hold any module-level Postgres reference — unlike `journey.js`'s `handleGetJourney(req, res, _next, pool)`, which receives `pool` explicitly from `server.js`'s dispatch call. `skills.js`'s only existing Postgres touchpoints are lazy inline `require()`s of `journey-store-pg`/`session-turns-pg` (which manage their own pool internally), not a `pool` parameter pattern. This is real, previously-unnamed plumbing work, not a drop-in reuse.
  Risk if proceeding: a coding agent could either (a) thread `pool` through all 13 of `server.js`'s dispatch call sites for these routes (a real, non-trivial signature change touching a second file this story doesn't currently name), or (b) improvise a second, inconsistent pool-access pattern under time pressure. Either way, guessing this mid-implementation is worse than deciding it now.
  To acknowledge: run /decisions, category RISK-ACCEPT — or resolve now by adding an explicit Architecture Constraint naming the chosen wiring approach.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** FAIL

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 3 | FAIL |

**Verdict:** FAIL — Architecture compliance scored 3 (issues present but addressable without full story rework). The story's own claim of "trivial reuse" doesn't hold for the pool-access plumbing specifically; this needs a named resolution before /test-plan, not a silent implementation-time discovery.
