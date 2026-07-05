# Definition of Ready — psh-s2: Existing journey migration to Default product

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s2.md (migration-story.md template)
**Review:** PASS — Run 1, 2026-07-05 (1 LOW)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s2-test-plan.md — 7 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s2-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 — As/Want/So with persona | ✅ PASS (template exception) | migration-story.md template per CLAUDE.md; Migration Purpose section populated |
| H2 — ≥3 ACs in Given/When/Then | ✅ PASS | AC1–AC5 all in Given/When/Then |
| H3 — every AC has ≥1 test | ✅ PASS | 7 tests covering AC1–AC5 |
| H4 — Out of Scope populated | ✅ PASS | |
| H5 — Benefit linkage references named metric | ✅ PASS | M1 (prerequisite), M2 (empty context acceptable) |
| H6 — Complexity rated | ✅ PASS | Rating 2, Stable |
| H7 — no unresolved HIGH findings | ✅ PASS | 0 HIGH |
| H8 — no uncovered ACs | ✅ PASS | |
| H8-ext — schemaDepends check | ✅ PASS | Upstream psh-s1 declared; schemaDepends: [] — DB-only dependency, no pipeline-state.json fields |
| H9 — Architecture Constraints populated | ✅ PASS | ADR-011, Node.js CommonJS, no npm deps, idempotency required |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | No adapters |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | hasMigrationTrack not set |

**Result: 19/19 PASS**

---

## Warnings

All clear. 1 LOW finding (1-L1: metric label) — LOWs do not trigger W3.

---

## Oversight Level

**Medium** (psh-e1 parent epic). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s2

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s2 — Existing journey migration to Default product
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s2-dor-contract.md
**Test file:** `tests/check-psh-s2-migration.js` (write failing first)
**Verification:** `node tests/check-psh-s2-migration.js`

### Acceptance Criteria to implement

- AC1: One Default product per tenant; all NULL-product_id journeys assigned
- AC2: Idempotent — second run creates no duplicates
- AC3: No Default for tenant with no unassigned journeys
- AC4: Already-assigned journeys not overwritten
- AC5: Completion summary log on exit

### Implementation task order

1. Write failing test `tests/check-psh-s2-migration.js` (7 tests)
2. Implement `scripts/migrate-default-product.js`:
   - Query distinct tenant_ids with NULL product_id journeys
   - For each: SELECT or INSERT Default product
   - UPDATE journeys SET product_id = <default_id> WHERE product_id IS NULL AND tenant_id = $1
   - Log summary and exit 0
3. Run tests — all 7 must pass
4. Verify: `node tests/check-psh-s2-migration.js`

### Architecture guardrails (enforced)

- Idempotency: check-before-insert for Default product; only update NULL product_id journeys
- No data loss: existing journey stage/turn data untouched
- Node.js CommonJS, no new npm dependencies
- Script is a one-shot migration, not a server-start hook

### Prerequisite

psh-s1 must be complete and schema deployed before running this script.
