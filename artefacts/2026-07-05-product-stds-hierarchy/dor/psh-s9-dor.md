# Definition of Ready — psh-s9: Org-level standard promotion and per-product opt-out

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**Review:** PASS — Run 1, 2026-07-05 (2 LOW)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s9-test-plan.md — 8 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s9-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | As/Want/So with "product owner/operator" persona |
| H2 | ✅ PASS | AC1–AC6 in Given/When/Then |
| H3 | ✅ PASS | 8 tests (6 + 2 NFR) covering all 6 ACs |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M4a secondary signal (promotion makes standards more valuable) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s1, psh-s8; schemaDepends: [] |
| H9 | ✅ PASS | ADR-003, Phase 2 visibility guard, MC-SEC-01, Node.js CommonJS |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | No adapters |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

---

## Warnings

All clear. 2 LOW findings (1-L1: metric label; 1-L4: ADR-011 reference) — LOWs do not trigger W3.

---

## Oversight Level

**Medium** (psh-e5). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s9

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s9 — Org-level standard promotion and per-product opt-out
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s9-dor-contract.md
**Test file:** `tests/check-psh-s9-standard-promotion.js` (8 tests — write failing first)
**Verification:** `node tests/check-psh-s9-standard-promotion.js`

### Acceptance Criteria to implement

- AC1: Promote standard — visibility → 'org'; idempotent if already org-level
- AC2: Org standard appears in all products' standards lists with orgBadge
- AC3: Opt-out — INSERT row into standard_product_optouts; standard excluded from active list
- AC4: Opt-out reversal — DELETE row; standard active again
- AC5: visibility='public' blocked — HTTP 400 + `{ reason: 'public_visibility_not_available' }`
- AC6: standard_product_optouts table schema — correct columns + UNIQUE constraint

### Implementation task order

1. Write failing tests `tests/check-psh-s9-standard-promotion.js` (8 tests)
2. Extend `src/web-ui/routes/standards.js`: add PUT /standards/:id/promote, POST/DELETE opt-out routes
3. Update GET /products/:productId/standards to include org-level standards minus opt-outs
4. Add visibility='public' guard to all standards write endpoints
5. Add `CREATE TABLE IF NOT EXISTS standard_product_optouts (...)` migration to `server.js`
6. Run tests

### Architecture guardrails (enforced)

- `req.session.tenantId` is sole authority — promotion only for standards owned by tenantId; opt-out only for products owned by tenantId
- `visibility = 'public'` guard: must return HTTP 400 + body — never set in DB; phase 2 guard preserves upgrade path
- ADR-003: standard_product_optouts schema is migration-based (idempotent IF NOT EXISTS)
- No new npm dependencies

### NFR: Idempotency

`PUT /standards/:id/promote` on an already-org-level standard must return HTTP 200 (or 204) with no error — no duplicate state, no throw.
