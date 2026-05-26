# Review: wfp.8 — Multi-team initiative scope decomposition and rollup view

**Run:** 1
**Date:** 2026-05-26
**Reviewer:** Copilot /review skill
**Story artefact:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.8.md

---

## FINDINGS

None.

---

## SCORES

| Category | Score | Notes |
|----------|-------|-------|
| A — User story clarity | 5 | Actor, want, and benefit are specific. "multi-team budget" and "rolled-up FTE and cost totals alongside individual team contributions" are concrete and unambiguous. |
| B — Scope and out-of-scope | 5 | Out-of-scope block explicitly rules out nested rollup hierarchies, browser editing, drag-and-drop, and export — all the obvious over-engineering candidates. Phase 1 boundary is clear. |
| C — AC completeness | 5 | Six ACs cover: rollup aggregation logic (AC1), backwards compatibility (AC2), single-scope-item edge case (AC3), dashboard render (AC4), delta colour coding (AC5), and empty state (AC6). Covering AC2 and AC3 explicitly removes two common implementation ambiguities. |
| D — Architecture compatibility | 5 | Extends allocation-input.json with two optional fields and adds one new tab to workforce.html — both consistent with the existing architecture. No new external dependencies. Reuses delta-negative/delta-ok CSS classes from wfp.6. The "scope items do NOT appear as top-level entries" constraint prevents double-counting, a real risk that is correctly guarded in the architecture constraints. |
| E — Standard consistency | 5 | Plain Node.js CommonJS, no external deps, fetch() for data load, relative paths only, static HTML — fully consistent with architecture-guardrails.md and the pattern established in wfp.3–wfp.7. |

**Overall score: 5.0**

---

## VERDICT: PASS

No findings. Story is ready for /test-plan.

**Notes for /test-plan:**
- The backwards-compatibility guarantee in AC2 should be exercised with an explicit fixture: an allocation-input.json that mixes entries with and without `parentSlug`, verifying that the standalone entries in initiative-map.json are identical regardless of the presence of sibling rollup entries.
- The "no top-level entries for scope items" constraint in AC1 is testable: assert that `initiative-map.json` does NOT contain any entry with a `slug` matching a scope item's `slug` at the top level when that entry has a `parentSlug`.
- AC3 (single scope item) should have its own test fixture separate from the multi-item case.
