# Definition of Done: psh-s5 — Product context injection into skill sessions

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s5.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s5-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s5-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (5 named context sections injected in order before SKILL.md) | ✅ | T1–T3: system prompt includes all 5 Product Context sections in correct order; content matches Postgres record | `tests/check-psh-s5-context-injection.js` T1–T3 — automated test, CI pass | None |
| AC2 (DB canonicity — getProductContext adapter is sole source, not session state) | ✅ | T4: system prompt content verified to come from adapter call, not session.artefactContent or session.productContext | `tests/check-psh-s5-context-injection.js` T4 — automated test, CI pass | None |
| AC3 (no-product graceful fallback — product_id NULL proceeds with no error) | ✅ | T5: session for NULL product_id proceeds normally; no product context sections injected; no error | `tests/check-psh-s5-context-injection.js` T5 — automated test, CI pass | None |
| AC4 (D37 stub-throws — getProductContext throws when adapter not wired) | ✅ | T6: direct call to getProductContext before wiring throws 'Adapter not wired: productContext' | `tests/check-psh-s5-context-injection.js` T6 — automated test, CI pass | None |
| AC5 (D37 production wiring — setProductContextAdapter called in server.js before HTTP start) | ✅ | T7: wiring test confirms setProductContextAdapter wired with real Postgres implementation; no stub-throw on session init | `tests/check-psh-s5-context-injection.js` T7 — automated test, CI pass | None |
| AC6 (concurrent session safety — no cross-session contamination) | ✅ | T8–T9: concurrent sessions for product A and product B resolve separate context; no contamination | `tests/check-psh-s5-context-injection.js` T8–T9 — automated test, CI pass | None |

**6 / 6 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: 5 Product Context sections present | ✅ | ✅ | |
| T2: Section order correct (before SKILL.md) | ✅ | ✅ | |
| T3: Section content matches Postgres record | ✅ | ✅ | |
| T4: DB canonicity — not from session state | ✅ | ✅ | |
| T5: NULL product_id graceful fallback | ✅ | ✅ | |
| T6: D37 stub-throws | ✅ | ✅ | |
| T7: D37 production wiring | ✅ | ✅ | |
| T8: Concurrent session — product A context | ✅ | ✅ | |
| T9: Concurrent session — product B context | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: ≤ 1 Postgres round-trip per session init | ✅ | Adapter performs single DB query; no fan-out |
| Correctness: DB query failure propagates — no silent fallback | ✅ | Adapter throws on error; session does not proceed with empty context |
| D37: productContext stub throws, not null/empty | ✅ | T6 confirms stub throw message |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2: Product context injection rate | ✅ | Immediately post-deploy | CI test (T1–T3) asserts 100% injection for product-associated sessions on every deploy |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. During delivery a cross-isolation bug was found and fixed: psh-s10's extension of `buildSystemPromptWithProductContext` caused psh-s5 tests to fail because `getBsp()` helper in `tests/check-psh-s5-context-injection.js` did not isolate the standards adapter from the module cache. Fixed by clearing the standards adapter require cache and wiring a no-op standards adapter in `getBsp()`. This was a test isolation issue, not a functional defect. /improve candidate: document the module cache isolation pattern for multi-adapter test helpers.
