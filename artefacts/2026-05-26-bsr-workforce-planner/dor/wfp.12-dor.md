# Definition of Ready — wfp.12 Heat map view

**Story:** wfp.12
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Oversight level:** Low (inherited from epic)

---

## Hard blocks

| Check | Status | Notes |
|-------|--------|-------|
| H1 — AC clarity: all ACs testable with clear pass/fail | ✅ PASS | 6 ACs, all measurable. NFR: 500ms JSON, 3s render. |
| H2 — No open HIGH review findings | ✅ PASS | Review artefact: wfp.12-review.md. Zero HIGH findings. |
| H3 — Test plan exists and is approved | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.12-test-plan.md |
| H4 — AC verification script exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.12-verification.md |
| H5 — Story has a single owner | ✅ PASS | Coding agent; Hamish King (operator) |
| H6 — Dependencies resolved or contracted | ✅ PASS | Dependency: intelligence server (wfp.11) — DoD-complete. `computeHeatMapData` export declared in story. |
| H7 — Story fits in one iteration | ✅ PASS | 1 route pair + 1 pure function + 1 test file. Bounded. |
| H8 — No external API contracts blocked | ✅ PASS | Internal only. Reads local JSON files. |
| H8-ext — Schema dependencies resolved | ✅ PASS | No upstream schema dependencies declared — schema check not required. `schemaDepends: []` |
| H9 — Discovery approval traceable | ✅ PASS | Approved By: Hamish King — 2026-05-26. See discovery artefact. |
| H-GOV — Governance gate passed | ✅ PASS | Discovery approval found. |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/nfr-profile.md |
| H-NFR2 — Regulatory NFRs addressed | ✅ PASS | Data classification: Internal/Private. No regulatory clauses apply. |
| H-NFR3 — NFR test coverage mapped | ✅ PASS | Test plan includes NFR-PERF (500ms JSON, 3s render) and NFR-SEC (authGuard) sections. |
| H-E2E — E2E test strategy agreed | ✅ PASS | CSS-layout-dependent visual rendering: RISK-ACCEPT in decisions.md + manual verification scenario. 1280px compat: RISK-ACCEPT. All other ACs: automated. |

---

## Warnings

| Check | Status | Notes |
|-------|--------|-------|
| W1 — Story sized appropriately | ✅ OK | 6 ACs, 1 route pair. |
| W2 — No gold-plating risk | ✅ OK | Scope bounded to heat map view + data endpoint. |
| W3 — MEDIUM review findings reviewed | ⚠️ ACK | 2 MEDIUM findings from review: M2 (cascade scenario coverage) and M3 (initiative filter edge case). Acknowledged — test plan covers both. No code changes required. |
| W4 — Test data available | ✅ OK | Synthetic fixtures in test setup. |
| W5 — CSS-layout-dependent ACs classified | ✅ OK | AC2 visual colour and NFR-COMPAT 1280px: RISK-ACCEPT logged in decisions.md; manual verification scenarios documented. |

---

## Coding Agent Instructions

**Proceed: Yes**

### Context summary

Implement `GET /api/intelligence/heat-map-data` (JSON) and `GET /intelligence/heat-map` (HTML) on the intelligence server at `src/workforce-ui/server.js`. Export `computeHeatMapData(teams, roster, initiativeMap, portfolioFiles)` as a pure function.

### Acceptance criteria (full list)

- AC1: GET /api/intelligence/heat-map-data returns 200 JSON with heat map matrix. Each cell: `{ skillTag, initiativeSlug, covered: bool, memberCount: number }`.
- AC2: GET /intelligence/heat-map returns 200 HTML with inline table or grid. Visual colour encoding (green/amber/red) — CSS only, no CDN. Cell click drill-down shows member names (vanilla JS).
- AC3: `computeHeatMapData(teams, roster, initiativeMap, portfolioFiles)` is exported and deterministic (same inputs → same output).
- AC4: tag universe derived from `requiredTags` in portfolio files, NOT roster skills.
- AC5: Graceful fallback when `initiative-map.json` absent — returns partial data with a flag.
- AC6: `missingPortfolioFile: true` in response when any portfolio file absent.

### Security requirements

- Both routes require `authGuard` middleware.
- Portfolio file slugs: allowlist `/^[a-z0-9-]+$/` before file path construction (path traversal guard).

### Test file

`tests/workforce/check-wfp12-heat-map.js`

### Verification script

`artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.12-verification.md`

### Out-of-scope

- `workforce/*.json` data files — read-only, do not modify.
- Any other route handlers outside heat-map endpoints.
- CDN, npm runtime dependencies.
