# Definition of Ready — wfp.14 Temporal risk view

**Story:** wfp.14
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Oversight level:** Low (inherited from epic)

---

## Hard blocks

| Check | Status | Notes |
|-------|--------|-------|
| H1 — AC clarity: all ACs testable with clear pass/fail | ✅ PASS | 8 ACs, all measurable. NFR: 500ms JSON, deterministic with `_nowOverride`. |
| H2 — No open HIGH review findings | ✅ PASS | Review artefact: wfp.14-review.md. Zero HIGH findings. |
| H3 — Test plan exists and is approved | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.14-test-plan.md |
| H4 — AC verification script exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.14-verification.md |
| H5 — Story has a single owner | ✅ PASS | Coding agent; Hamish King (operator) |
| H6 — Dependencies resolved or contracted | ✅ PASS | Dependency: intelligence server (wfp.11) DoD-complete. wfp.12 `computeHeatMapData` prerequisite listed in story. |
| H7 — Story fits in one iteration | ✅ PASS | 1 route pair + 1 pure function + 1 test file. Bounded. |
| H8 — No external API contracts blocked | ✅ PASS | Internal only. Reads local JSON files. |
| H8-ext — Schema dependencies resolved | ✅ PASS | No upstream schema dependencies declared — schema check not required. `schemaDepends: []` |
| H9 — Discovery approval traceable | ✅ PASS | Approved By: Hamish King — 2026-05-26. See discovery artefact. |
| H-GOV — Governance gate passed | ✅ PASS | Discovery approval found. |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/nfr-profile.md |
| H-NFR2 — Regulatory NFRs addressed | ✅ PASS | Data classification: Internal/Private. No regulatory clauses apply. |
| H-NFR3 — NFR test coverage mapped | ✅ PASS | Test plan includes NFR-DATE (determinism via `_nowOverride`) and NFR-SEC (authGuard) sections. |
| H-E2E — E2E test strategy agreed | ✅ PASS | CSS-layout-dependent expand animations: RISK-ACCEPT. 1280px compat: RISK-ACCEPT. All other ACs: automated with `_nowOverride = 2026-01-01`. |

---

## Warnings

| Check | Status | Notes |
|-------|--------|-------|
| W1 — Story sized appropriately | ✅ OK | 8 ACs, 1 route pair. |
| W2 — No gold-plating risk | ✅ OK | Bounded to temporal risk view. |
| W3 — MEDIUM review findings reviewed | ✅ OK | M2 finding (AC4 pure-fn reference ambiguity) resolved in review artefact — `computeHeatMapData` use confirmed as documentation reference not call dependency. |
| W4 — Test data available | ✅ OK | Synthetic fixtures; all tests pin `_nowOverride = 2026-01-01`. |
| W5 — CSS-layout-dependent ACs classified | ✅ OK | Expand animations and 1280px RISK-ACCEPT in decisions.md; manual scenarios documented. |

---

## Coding Agent Instructions

**Proceed: Yes**

### Context summary

Implement `GET /api/intelligence/temporal-risk-data` (JSON, accepts `_nowOverride` in `NODE_ENV=test` mode) and `GET /intelligence/temporal-risk` (HTML) on the intelligence server. Export `computeTemporalRiskData(teams, roster, initiativeMap, nowDate)` as a pure function.

### Acceptance criteria (full list)

- AC1: GET /api/intelligence/temporal-risk-data returns 200 JSON with 4-quarter risk matrix.
- AC2: Each quarter window starts from current date (or `_nowOverride` in test mode). 4 windows forward.
- AC3: Each row: team × quarter. Each cell: `{ quarter, teamId, membersRollingOff: number, coverageRisk: bool }` where `coverageRisk: true` when post-rolloff coverage drops below `POST_ROLLOFF_COVERAGE_THRESHOLD = 0.5`.
- AC4: `computeTemporalRiskData` exported; deterministic for same `nowDate`. AC4 references `computeHeatMapData` as documentation — temporal risk does not call heat-map directly.
- AC5: Members without `endDate` treated as permanent (no rolloff).
- AC6: Members with `status: "retired"` excluded from all calculations.
- AC7: `_nowOverride` query param accepted only when `NODE_ENV=test`; ignored in production.
- AC8: If `initiative-map.json` absent, omit coverage columns and include a `missingInitiativeMap: true` flag.

### Security requirements

- Both routes require `authGuard` middleware.
- `_nowOverride` param rejected (or ignored) in production.

### Test file

`tests/workforce/check-wfp14-temporal-risk.js`

### Verification script

`artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.14-verification.md`

### Out-of-scope

- `workforce/*.json` data files — read-only, do not modify.
- Any other route handlers outside temporal-risk endpoints.
- CDN, npm runtime dependencies.
