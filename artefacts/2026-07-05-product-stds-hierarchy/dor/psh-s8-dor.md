# Definition of Ready — psh-s8: Standards definition and management per product

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s8.md
**Review:** PASS — Run 1, 2026-07-05 (0 findings)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s8-test-plan.md — 8 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s8-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | As/Want/So with "product owner/operator" persona |
| H2 | ✅ PASS | AC1–AC6 in Given/When/Then |
| H3 | ✅ PASS | 8 tests covering all 6 ACs |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M4a (standard_created event — observation data) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s1; schemaDepends: [] |
| H9 | ✅ PASS | ADR-011, MC-SEC-01, ougl path traversal, ADR-003, Node.js CommonJS |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | No adapters introduced |
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

## ✅ Definition of ready: PROCEED — psh-s8

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s8 — Standards definition and management per product
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s8-dor-contract.md
**Test file:** `tests/check-psh-s8-standards-management.js` (8 tests — write failing first)
**Verification:** `node tests/check-psh-s8-standards-management.js`

### Acceptance Criteria to implement

- AC1: Standard inserted with product_id, org_id from session, visibility='product', HTTP 201
- AC2: standard_created PostHog event with standardId/productId/tenantId/visibility
- AC3: List view shows all product standards with name, visibility badge, creation date
- AC4: Edit updates name/content and refreshes updated_at
- AC5: XSS sanitisation — name with HTML rendered as plain text
- AC6: Path traversal guard — HTTP 400 if derived path escapes repoRoot

### Implementation task order

1. Write failing tests `tests/check-psh-s8-standards-management.js` (8 tests)
2. Create `src/web-ui/routes/standards.js` with GET/POST/PUT endpoints
3. Create standards list view template
4. Add PostHog event emission on create
5. Add path traversal guard to any disk write paths
6. Run tests

### Architecture guardrails (enforced)

- `req.session.tenantId` is the sole authoritative source of `org_id` — never trust `org_id` from request body
- MC-SEC-01: Standard name and content HTML-escaped before DOM insertion; code snippet content rendered via text-safe renderer (e.g. `<pre>` with textContent)
- ougl path traversal guard: `path.resolve(inputPath).startsWith(repoRoot + path.sep)` — HTTP 400 on failure
- No new npm dependencies

### Performance NFR

Standards list loads in < 1 second for products with ≤ 50 standards.
