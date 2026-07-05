# Definition of Ready — psh-s1: Products and standards Postgres tables and schema

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**Review:** PASS — Run 1, 2026-07-05 (1 MEDIUM resolved at DoR: AC5 guard moved to Architecture Constraints)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s1-test-plan.md — 10 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s1-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 — As/Want/So with persona | ✅ PASS | |
| H2 — ≥3 ACs in Given/When/Then | ✅ PASS | 4 valid ACs (AC5 guard note removed from ACs, moved to Architecture Constraints) |
| H3 — every AC has ≥1 test | ✅ PASS | 10 tests covering AC1–AC4 |
| H4 — Out of Scope populated | ✅ PASS | |
| H5 — Benefit linkage references named metric | ✅ PASS | M1 (prerequisite), M2 (prerequisite) |
| H6 — Complexity rated | ✅ PASS | Rating 2, Scope Stable |
| H7 — no unresolved HIGH findings | ✅ PASS | 0 HIGH findings |
| H8 — no uncovered ACs | ✅ PASS | |
| H8-ext — schemaDepends check | ✅ PASS | No upstream dependencies — foundation story; schemaDepends not required |
| H9 — Architecture Constraints populated, no Cat-E HIGH | ✅ PASS | ADR-003, ADR-011, Node.js CommonJS, additive-only, D37 guard |
| H-E2E — CSS-layout-dependent AC check | ✅ PASS | No CSS-layout ACs |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-07-05-product-stds-hierarchy/nfr-profile.md |
| H-NFR2 — compliance NFR sign-off | ✅ PASS | No compliance clauses |
| H-NFR3 — data classification not blank | ✅ PASS | Internal |
| H-NFR-profile — profile presence | ✅ PASS | NFR section populated; profile exists |
| H-GOV — Approved By in discovery | ✅ PASS | Hamish King — Platform operator / product owner, 2026-07-05 |
| H-ADAPTER — injectable adapter wiring | ✅ PASS | No adapters introduced; D37 guard noted in Architecture Constraints |
| H-INF — infra-plan gate | ✅ N/A | hasInfraTrack not set |
| H-MIG — migration-review gate | ✅ N/A | hasMigrationTrack not set |

**Result: 19/19 PASS**

---

## Warnings

| Warning | Result |
|---------|--------|
| W1 — NFRs populated | ✅ Clear |
| W2 — Scope stability declared | ✅ Stable |
| W3 — MEDIUM findings acknowledged | ✅ Resolved (1-M1: AC5 planning note removed; guard moved to Architecture Constraints) |
| W4 — Verification script reviewed by domain expert | ⚠️ Solo project — self-acknowledged |
| W5 — No UNCERTAIN items in test plan | ✅ Clear |

---

## Oversight Level

**Medium** (psh-e1 parent epic). Share the DoR artefact with the tech lead before assigning to the coding agent.

On this solo project, the operator (Hamish King) serves as both author and tech lead — self-confirmation on record.

---

## ✅ Definition of ready: PROCEED — psh-s1

Hard blocks: 19/19 passed | Warnings: 1 acknowledged (W4 solo) | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s1 — Products and standards Postgres tables and schema
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor-contract.md
**Test file:** `tests/check-psh-s1-schema.js` (write in RED state — failing — before implementing)
**Verification:** `node tests/check-psh-s1-schema.js`

### Acceptance Criteria to implement

- AC1: `products` table with 7 specified columns — idempotent
- AC2: `standards` table with visibility CHECK constraint — idempotent
- AC3: `journeys.product_id` FK column — idempotent; existing rows `product_id = NULL`
- AC4: Tenant isolation — `tenant_id` / `org_id` scope all query paths

### Implementation task order

1. Write failing test file `tests/check-psh-s1-schema.js` covering AC1–AC4 (10 tests)
2. Add migration block to `src/web-ui/server.js`:
   - `CREATE TABLE IF NOT EXISTS products (...)`
   - `CREATE TABLE IF NOT EXISTS standards (...)`
   - `ALTER TABLE journeys ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`
3. Run tests — all 10 must pass
4. Verify: `node tests/check-psh-s1-schema.js`

### Architecture guardrails (enforced)

- All DDL uses `IF NOT EXISTS` — server restart must not error
- No `DROP`, no column renames — additive only
- `tenant_id` on `products`, `org_id` on `standards` — every query includes a tenant/org predicate
- Node.js CommonJS only — use `require('pg')` pool pattern
- No new npm dependencies

### Definition of done check

Run `node tests/check-psh-s1-schema.js` — all 10 tests pass.
Run `node src/web-ui/server.js` twice — second start emits no migration errors.
