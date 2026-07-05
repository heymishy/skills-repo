# Definition of Ready — psh-s5: Product context injection into skill sessions

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s5.md
**Review:** PASS — Run 1, 2026-07-05 (0 findings)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s5-test-plan.md — 9 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s5-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | As/Want/So with developer/engineer persona |
| H2 | ✅ PASS | AC1–AC6 in Given/When/Then |
| H3 | ✅ PASS | 9 tests covering all 6 ACs |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M2 (context injection rate — sole driver) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s1, psh-s4; schemaDepends: [] |
| H9 | ✅ PASS | ADR-022, ADR-023, D37, ADR-011, ADR-024, Node.js CommonJS |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | `getProductContext` adapter: AC5 scopes production wiring in server.js ✅; stub-throws with exact error message in Architecture Constraints ✅; wiring named as separate task in contract ✅ |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

---

## Warnings

All clear.

---

## Oversight Level

**Medium** (psh-e3). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s5

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s5 — Product context injection into skill sessions
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s5-dor-contract.md
**Test file:** `tests/check-psh-s5-context-injection.js` (9 tests — write failing first)
**Verification:** `node tests/check-psh-s5-context-injection.js`

### Acceptance Criteria to implement

- AC1: 5 context sections injected before SKILL.md content when product has context
- AC2: Content sourced from adapter (DB canonical), not from session object
- AC3: NULL product_id — no sections injected, no error
- AC4: D37 stub throws with exact message
- AC5: D37 production wiring — server.js calls setProductContextAdapter before app.listen
- AC6: Concurrent session isolation — no cross-product contamination

### Implementation task order

1. Write failing tests `tests/check-psh-s5-context-injection.js` (9 tests)
2. Create `src/web-ui/product-context-adapter.js` — stub-throws + setter
3. Extend `buildSystemPrompt` module to call `getProductContext` and prepend 5 named sections
4. Handle AC3: if productId is null, skip injection entirely
5. **Separate task:** Wire `setProductContextAdapter(realDbFn)` in `server.js` before `app.listen`
6. Run tests

### Architecture guardrails (enforced)

- D37: Stub must throw `Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.')` — NOT return null/empty
- ADR-023 (B-iii DB canonicity): Content retrieved via adapter from Postgres — never from `session.artefactContent` or any in-memory cache
- ADR-022 (Option B): Context injected at session init only — not persisted across sessions
- Section ordering: Mission, Tech Stack, Constraints, Roadmap, Architecture Guardrails (in this order) before SKILL.md
- No new npm dependencies; Node.js CommonJS only

### Performance NFR

Product context DB lookup must add at most one Postgres round-trip per session init. No caching required in MVP.
