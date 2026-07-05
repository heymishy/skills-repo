# Definition of Done: psh-s10 — Standards injection into skill sessions

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s10.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s10-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s10-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (## Standards and Patterns section + ### per standard, injected after product context before SKILL.md) | ✅ | T1–T2: system prompt includes Standards and Patterns section with named sub-sections; injected after Product Context and before SKILL.md | `tests/check-psh-s10-standards-injection.js` T1–T2 — automated test, CI pass | None |
| AC2 (opted-out org standard absent from section) | ✅ | T3: standard with opt-out row excluded from Standards and Patterns section | `tests/check-psh-s10-standards-injection.js` T3 — automated test, CI pass | None |
| AC3 (no standards → section omitted entirely) | ✅ | T4: product with no active standards has no ## Standards and Patterns section in system prompt | `tests/check-psh-s10-standards-injection.js` T4 — automated test, CI pass | None |
| AC4 (D37 stub-throws — getActiveStandards throws when adapter not wired) | ✅ | T5: direct call to getActiveStandards before wiring throws 'Adapter not wired: standards' | `tests/check-psh-s10-standards-injection.js` T5 — automated test, CI pass | None |
| AC5 (D37 production wiring — setStandardsAdapter called in server.js before HTTP start) | ✅ | T6: wiring test confirms setStandardsAdapter wired with real Postgres implementation in server.js | `tests/check-psh-s10-standards-injection.js` T6 — automated test, CI pass | None |
| AC6 (injection ordering — Product Context → Standards → SKILL.md) | ✅ | T7–T8: system prompt section order verified; standards always after product context, before SKILL.md content | `tests/check-psh-s10-standards-injection.js` T7–T8 — automated test, CI pass | None |

**6 / 6 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: Standards and Patterns section present | ✅ | ✅ | |
| T2: Named sub-sections per standard | ✅ | ✅ | |
| T3: Opted-out standard absent | ✅ | ✅ | |
| T4: No standards → section omitted | ✅ | ✅ | |
| T5: D37 stub-throws | ✅ | ✅ | |
| T6: D37 production wiring | ✅ | ✅ | |
| T7: Section order — after Product Context | ✅ | ✅ | |
| T8: Section order — before SKILL.md | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: ≤ 1 Postgres round-trip per session init | ✅ | getActiveStandards single query (product-level + org-level minus opt-outs) |
| Correctness: DB query failure propagates — no silent omission | ✅ | Adapter throws on error; session does not proceed without an error signal |
| D37: standards stub throws, not null/empty | ✅ | T5 confirms stub throw message |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M4b: Standards injection rate | ✅ | Immediately post-deploy | CI test (T1–T2) asserts 100% injection for product sessions with active standards on every deploy |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. psh-s10's extension of `buildSystemPromptWithProductContext` introduced a cross-isolation issue in `tests/check-psh-s5-context-injection.js`: the psh-s5 test helper's `getBsp()` did not isolate the standards adapter from the require cache, causing 5 of 9 psh-s5 tests to fail. Fixed by clearing the standards adapter cache entry and wiring a no-op adapter in the psh-s5 test helper. The fix was committed to the feature branch before verify-completion. Logged in psh-s5 DoD as well. /improve candidate: document the multi-adapter cache isolation pattern for test helpers that exercise `buildSystemPromptWithProductContext`.
