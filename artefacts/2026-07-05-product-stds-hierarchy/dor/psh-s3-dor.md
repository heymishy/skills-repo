# Definition of Ready — psh-s3: Product creation flow (hybrid form + AI draft + review)

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s3.md
**Review:** PASS — Run 1, 2026-07-05 (2 MEDIUM resolved at DoR)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s3-test-plan.md — 11 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s3-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | As/Want/So with "product owner/operator" persona |
| H2 | ✅ PASS | AC1–AC8 in Given/When/Then (8 ACs) |
| H3 | ✅ PASS | 11 tests covering all 8 ACs |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M1 (product_created event) |
| H6 | ✅ PASS | Rating 3, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s1, psh-s2; schemaDepends: [] |
| H9 | ✅ PASS | ADR-011, D37, MC-SEC-01, ougl path traversal, CLAUDE.md accessToken, no npm |
| H-E2E | ✅ PASS | No CSS-layout-dependent ACs in test plan |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | `generateProductDraft` adapter: AC8 scopes production wiring ✅; Architecture Constraints specifies stub-throws with exact error string ✅; wiring named as separate task in contract ✅ |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

---

## Warnings

| Warning | Result |
|---------|--------|
| W3 — MEDIUM findings acknowledged | ✅ Resolved inline: 1-M2 (AC1 tightened — form fields enumerated: name required, techStack/constraints optional); 1-M3 (ADR-020 reference replaced with CLAUDE.md (req.session.accessToken canonical)) |
| W4 | ⚠️ Solo self-acknowledged |
| Others | ✅ Clear |

---

## Oversight Level

**Medium** (psh-e2). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s3

Hard blocks: 19/19 | Warnings: 0 (MEDIUMs resolved) | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s3 — Product creation flow (hybrid form + AI draft + review)
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s3-dor-contract.md
**Test file:** `tests/check-psh-s3-product-creation.js` (11 tests — write failing first)
**Verification:** `node tests/check-psh-s3-product-creation.js`

### Acceptance Criteria to implement

- AC1: Form with name (required) + techStack/constraints (optional) → AI draft call → 5 file contents returned
- AC2: 5 editable review panels rendered
- AC3: Confirm → INSERT into products, HTTP 201, PostHog `product_created`
- AC4: Solo plan enforcement — HTTP 403 + `{ reason: 'plan_limit', upgradeRequired: true }` when plan = personal and product count ≥ 1
- AC5: Team/enterprise plan — no limit, HTTP 201 on any product count
- AC6: XSS: name sanitised before DOM insertion
- AC7: Path traversal guard — HTTP 400 if resolved path does not start with repoRoot
- AC8: D37 production wiring smoke check

### Implementation task order

1. Write failing tests `tests/check-psh-s3-product-creation.js` (11 tests)
2. Create `src/web-ui/product-draft-adapter.js` — `generateProductDraft` stub-throws + `setGenerateProductDraft`
3. Create `src/web-ui/routes/products.js` with `GET /products/new`, `POST /products/new/draft`, `POST /products/confirm`
4. Create product creation view template with 5 editable panels
5. Add solo plan enforcement to confirm route
6. Add path traversal guard to any disk write path
7. **Separate task:** Wire `setGenerateProductDraft(realFn)` in `server.js` before `app.listen`
8. Run tests

### Architecture guardrails (enforced)

- D37: `generateProductDraft` stub must throw `Error('Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.')` — NOT return null/empty
- D37: Wiring must happen in `server.js` BEFORE `app.listen` — verify with startup smoke check
- ougl path traversal guard: `path.resolve(inputPath).startsWith(repoRoot + path.sep)` — HTTP 400 on failure; do not log raw path in production
- MC-SEC-01: No raw innerHTML — use textContent or server-side HTML escaping
- CLAUDE.md: `req.session.accessToken` — never `req.session.token`
- No new npm dependencies
- Node.js CommonJS only

### Performance NFR

AI draft generation must complete in < 30 seconds. If Anthropic call times out, return graceful error without losing form data.
