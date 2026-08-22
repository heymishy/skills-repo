# Review Report: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes — Run 1

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md`
**Date:** 2026-08-22
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E — Architecture Constraints states "the new gate ... should reuse the *same* live-role-resolution call, not duplicate it" — but `src/web-ui/middleware/require-admin.js`'s current exports are exactly `{ requireAdmin, setLogger, setGetCurrentRole }`. There is no separately exported role-resolution function to reuse; the live-role lookup (`_getCurrentRole`) is a private module-level variable only invoked inside `requireAdmin` itself. Achieving the stated constraint as written requires either (a) refactoring `require-admin.js` to export a reusable resolver function both gates call, or (b) accepting a scoped duplication of the session-role-read + live-check logic in the new gate file. The story does not name this refactor as a required sub-task, so an implementer following the story literally could either silently duplicate the logic (contradicting the constraint) or stall on how to satisfy it.
  Risk if proceeding: The implementation plan may either introduce duplicated role-resolution logic (a real drift risk — the two gates could diverge over time, e.g. one gets a security fix the other doesn't) or block on an unplanned refactor mid-story.
  To acknowledge: run /decisions, category ARCH — record which approach (export a shared resolver vs. accept duplication) is chosen before `/implementation-plan`.

- **[1-M2]** Category C — AC1 and AC2 each bundle ~10 distinct routes under a single Given/When/Then assertion (e.g. AC1: "`/products/confirm` (or any Products-group write route: `/products/new`, `/products/:id/sync`, ... `/api/board/journey/:id/advance`)"). The route list is enumerated inline so `/test-plan` has enough information to test each one, but the AC's own phrasing ("or any... route") does not make explicit that ALL listed routes require their own test — a literal reading could be satisfied by testing just one representative route. Given this session's own repeated pattern of AC-bundling producing false confidence in test coverage (see `jatg-s1`'s fixture-completeness findings, `rbg-s1`'s weak-assertion finding, both from this same repo this session), this is worth tightening before `/test-plan` rather than trusting the parenthetical list to be read as mandatory.
  Risk if proceeding: `/test-plan` could reasonably interpret AC1/AC2 as satisfied by testing 1 of ~10 routes each, leaving the rest silently ungated despite the story's own stated intent.
  To acknowledge: run /decisions, category ASSUMPTION — or simplest fix, have `/test-plan` explicitly enumerate one test per listed route rather than one test per AC.

---

## LOW findings — note for retrospective

- **[1-L1]** Category E — ADR-025 (multi-tenancy enforced at the application layer via `tenant_id` scoping) is directly relevant to this story's mechanism (the reused live-role check resolves role via `tenantId`), but is not explicitly cited in the Architecture Constraints field. `require-admin.js` itself doesn't cite it either, so this is a pre-existing pattern gap, not one this story introduces — noting for completeness rather than as a blocking issue.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS
