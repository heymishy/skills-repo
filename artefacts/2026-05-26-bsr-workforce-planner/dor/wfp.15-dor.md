# Definition of Ready — wfp.15 Scenario modelling

**Story:** wfp.15
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Oversight level:** Low (inherited from epic)

---

## Hard blocks

| Check | Status | Notes |
|-------|--------|-------|
| H1 — AC clarity: all ACs testable with clear pass/fail | ✅ PASS | H1 was a finding in review; fixed in commit 7458b0d. All 8 ACs now measurable. NFR: 1s single scenario, 64KB body limit. |
| H2 — No open HIGH review findings | ✅ PASS | H1 finding resolved. Review artefact: wfp.15-review.md. Zero remaining HIGH findings. |
| H3 — Test plan exists and is approved | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.15-test-plan.md |
| H4 — AC verification script exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.15-verification.md |
| H5 — Story has a single owner | ✅ PASS | Coding agent; Hamish King (operator) |
| H6 — Dependencies resolved or contracted | ✅ PASS | Prerequisite: wfp.12, wfp.13, wfp.14 all DoD-complete (computeHeatMapData, computeBottlenecksData, computeTemporalRiskData exports must exist before this story). |
| H7 — Story fits in one iteration | ✅ PASS | 1 route pair + overlay engine + 1 test file. Bounded. |
| H8 — No external API contracts blocked | ✅ PASS | Internal only. Reads local JSON files. No writes. |
| H8-ext — Schema dependencies resolved | ✅ PASS | No upstream schema dependencies declared — schema check not required. `schemaDepends: []` |
| H9 — Discovery approval traceable | ✅ PASS | Approved By: Hamish King — 2026-05-26. See discovery artefact. |
| H-GOV — Governance gate passed | ✅ PASS | Discovery approval found. |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/nfr-profile.md |
| H-NFR2 — Regulatory NFRs addressed | ✅ PASS | Data classification: Internal/Private. No regulatory clauses apply. |
| H-NFR3 — NFR test coverage mapped | ✅ PASS | Test plan includes NFR-SEC (authGuard, body limit, no file paths in errors), NFR-PERF (1s scale test), NFR-WRITE (no file writes). |
| H-E2E — E2E test strategy agreed | ✅ PASS | 1280px compat: RISK-ACCEPT in decisions.md. All other ACs: automated. |

---

## Warnings

| Check | Status | Notes |
|-------|--------|-------|
| W1 — Story sized appropriately | ✅ OK | 8 ACs, 1 route pair. |
| W2 — No gold-plating risk | ✅ OK | Bounded to scenario overlay only. No persistence. |
| W3 — MEDIUM review findings reviewed | ✅ OK | H1 (HIGH) fixed. One M2 (complexity rationale) resolved in review. |
| W4 — Test data available | ✅ OK | Synthetic fixtures; 200/40/40 scale test data generated in test setup. |
| W5 — CSS-layout-dependent ACs classified | ✅ OK | No CSS-layout AC for scenarios page beyond 1280px compat (RISK-ACCEPT). |

---

## Coding Agent Instructions

**Proceed: Yes**

### Context summary

Implement `GET /intelligence/scenarios` (HTML form) and `POST /api/intelligence/scenario` (JSON overlay endpoint) on the intelligence server. The POST endpoint applies each scenario overlay independently against a FRESH COPY of the on-disk baseline — overlays must NOT be chained.

### Acceptance criteria (full list)

- AC1: GET /intelligence/scenarios returns 200 HTML with scenario form. 4 types: `hire`, `departure`, `new-team`, `reallocation`. Unknown type → 400.
- AC2: POST with `type: "hire"`, `teamId`, and `member` fields applies hire to the in-memory copy; returns heat-map + bottleneck + temporal-risk for the modified state.
- AC3: POST with `type: "departure"`, `teamId`, `memberId` removes the member. Non-existent member → 422 with member ID in error message.
- AC4: POST with `type: "new-team"`, `team` object adds the team. Duplicate teamId → 422.
- AC5: POST with `type: "reallocation"`, `memberId`, `fromTeamId`, `toTeamId` moves the member. Mismatch → 422.
- AC6: HTML form includes type selector and appropriate input fields. No CDN. Nav link to `/workforce-chat` present.
- AC7: `scenarios[]` array: each overlay in the array applied independently against fresh on-disk baseline (NOT chained). Results returned as `{ scenarios: [...] }`.
- AC8: POST endpoint is read-only — no file writes to `workforce/*.json`.

### Security requirements

- Both routes require `authGuard` middleware.
- Body size limit: 64KB; return 413 on oversize.
- Error messages must not contain filesystem paths.

### Test file

`tests/workforce/check-wfp15-scenarios.js`

### Verification script

`artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.15-verification.md`

### Critical implementation constraint

**Independent overlays invariant:** Each element of `scenarios[]` must be computed from a deep clone of the on-disk baseline state. The result of applying scenarios[0] must NOT affect the input to scenarios[1]. Failure to implement this correctly is the highest-risk defect for this story. Scenario 7 in the verification script tests this explicitly.

### Out-of-scope

- `workforce/*.json` data files — read-only, do not modify.
- Persistence of scenario results — all ephemeral.
- CDN, npm runtime dependencies.
