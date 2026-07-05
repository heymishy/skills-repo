# Definition of Ready — psh-s10: Standards injection into skill sessions

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s10.md
**Review:** PASS — Run 1, 2026-07-05 (0 findings)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s10-test-plan.md — 8 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s10-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | As/Want/So with developer/engineer persona |
| H2 | ✅ PASS | AC1–AC6 in Given/When/Then |
| H3 | ✅ PASS | 8 tests (6 unit + 2 NFR) covering all 6 ACs |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M4b (standards injection rate — sole driver) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s5, psh-s9; schemaDepends: [] |
| H9 | ✅ PASS | ADR-022, ADR-023, D37, ADR-011, ordering constraint, Node.js CommonJS |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | `getActiveStandards` adapter: AC5 scopes production wiring in server.js ✅; stub-throws with exact error string in Architecture Constraints ✅; wiring named as separate task in contract ✅ |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

---

## Warnings

All clear.

---

## Oversight Level

**Medium** (psh-e5). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s10

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s10 — Standards injection into skill sessions
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s10-dor-contract.md
**Test file:** `tests/check-psh-s10-standards-injection.js` (8 tests — write failing first)
**Verification:** `node tests/check-psh-s10-standards-injection.js`

### Acceptance Criteria to implement

- AC1: `## Standards and Patterns` section with `### [name]` subsections injected after product context sections
- AC2: Opted-out standard absent from section (handled by adapter's SQL — not by buildSystemPrompt filtering)
- AC3: Section entirely absent when adapter returns []
- AC4: D37 stub throws with exact message
- AC5: D37 production wiring — server.js calls setStandardsAdapter before app.listen
- AC6: Ordering — Product Context sections → Standards section → SKILL.md content

### Implementation task order

1. Write failing tests `tests/check-psh-s10-standards-injection.js` (8 tests)
2. Create `src/web-ui/standards-adapter.js` — stub-throws + setter
3. Extend `buildSystemPrompt` to call `getActiveStandards(productId, tenantId)` and append Standards section after product context, before skill content
4. Implement empty-result guard: if `[]` returned, do NOT write `## Standards and Patterns` section
5. **Separate task:** Wire `setStandardsAdapter(realDbFn)` in `server.js` before `app.listen`. Real implementation SQL: `SELECT name, content FROM standards WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2)) AND standard_id NOT IN (SELECT standard_id FROM standard_product_optouts WHERE product_id = $1)`
6. Run tests

### Architecture guardrails (enforced)

- D37: Stub must throw `Error('Adapter not wired: standards. Call setStandardsAdapter() before use.')` — NOT return null/empty
- ADR-023 (B-iii): Standards content retrieved from Postgres via adapter — never from session state
- ADR-022: Standards injected at session init only (each call is fresh)
- Ordering: product context sections MUST precede standards section which MUST precede SKILL.md content
- Error propagation: if adapter throws (DB error), propagate the error — do NOT silently omit the Standards section
- No new npm dependencies

### Performance NFR

Standards DB query adds at most one Postgres round-trip per session init (may be combined with product context query if architecturally natural).
