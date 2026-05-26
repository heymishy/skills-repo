# Definition of Ready — wfp.13 Bottleneck analysis view

**Story:** wfp.13
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Oversight level:** Low (inherited from epic)

---

## Hard blocks

| Check | Status | Notes |
|-------|--------|-------|
| H1 — AC clarity: all ACs testable with clear pass/fail | ✅ PASS | 7 ACs, all measurable. NFR: 300ms JSON, 2s render. |
| H2 — No open HIGH review findings | ✅ PASS | Review artefact: wfp.13-review.md. Zero HIGH findings. |
| H3 — Test plan exists and is approved | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.13-test-plan.md |
| H4 — AC verification script exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.13-verification.md |
| H5 — Story has a single owner | ✅ PASS | Coding agent; Hamish King (operator) |
| H6 — Dependencies resolved or contracted | ✅ PASS | Dependency: intelligence server (wfp.11) — DoD-complete. wfp.12 `computeHeatMapData` must be DoD-complete before this story (prerequisite listed in story). |
| H7 — Story fits in one iteration | ✅ PASS | 1 route pair + 1 pure function + 1 test file. Bounded. |
| H8 — No external API contracts blocked | ✅ PASS | Internal only. Reads local JSON files. |
| H8-ext — Schema dependencies resolved | ✅ PASS | No upstream schema dependencies declared — schema check not required. `schemaDepends: []` |
| H9 — Discovery approval traceable | ✅ PASS | Approved By: Hamish King — 2026-05-26. See discovery artefact. |
| H-GOV — Governance gate passed | ✅ PASS | Discovery approval found. |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/nfr-profile.md |
| H-NFR2 — Regulatory NFRs addressed | ✅ PASS | Data classification: Internal/Private. No regulatory clauses apply. |
| H-NFR3 — NFR test coverage mapped | ✅ PASS | Test plan includes NFR-PERF (300ms JSON, 2s render) and NFR-SEC (authGuard) sections. |
| H-E2E — E2E test strategy agreed | ✅ PASS | CSS-layout-dependent expand animations: RISK-ACCEPT in decisions.md + manual scenario. 1280px compat: RISK-ACCEPT. All other ACs: automated. |

---

## Warnings

| Check | Status | Notes |
|-------|--------|-------|
| W1 — Story sized appropriately | ✅ OK | 7 ACs, 1 route pair. |
| W2 — No gold-plating risk | ✅ OK | Bounded to bottleneck view only. |
| W3 — MEDIUM review findings reviewed | ✅ OK | No MEDIUM findings in review artefact. |
| W4 — Test data available | ✅ OK | Synthetic fixtures; `TEAM_BOTTLENECK_THRESHOLD = 3` constant established. |
| W5 — CSS-layout-dependent ACs classified | ✅ OK | AC4 expand animations and NFR-COMPAT: RISK-ACCEPT in decisions.md. |

---

## Coding Agent Instructions

**Proceed: Yes**

### Context summary

Implement `GET /api/intelligence/bottlenecks-data` (JSON) and `GET /intelligence/bottlenecks` (HTML) on the intelligence server at `src/workforce-ui/server.js`. Export `computeBottlenecksData(teams, roster, initiativeMap, portfolioFiles)` as a pure function.

### Acceptance criteria (full list)

- AC1: GET /api/intelligence/bottlenecks-data returns 200 JSON with bottleneck list.
- AC2: Each bottleneck item: `{ skillTag, teamsAffected: number, membersTotal: number, initiatives: [] }`.
- AC3: A skill is a bottleneck when fewer than `TEAM_BOTTLENECK_THRESHOLD` (= 3) teams in the roster have at least 1 member with that skill.
- AC4: `computeBottlenecksData` is exported and deterministic.
- AC5: Tag universe = union of `requiredTags` from portfolio files (NOT roster skills).
- AC6: GET /intelligence/bottlenecks returns 200 HTML with expandable bottleneck list. Expand/collapse via vanilla JS.
- AC7: Teams not allocated to any initiative are excluded from bottleneck skill concentration calculation.

### Security requirements

- Both routes require `authGuard` middleware.

### Test file

`tests/workforce/check-wfp13-bottlenecks.js`

### Verification script

`artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.13-verification.md`

### Out-of-scope

- `workforce/*.json` data files — read-only, do not modify.
- Any other route handlers outside bottleneck endpoints.
- CDN, npm runtime dependencies.
