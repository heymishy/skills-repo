# Definition of Ready — wfp.16 Workforce chat interface

**Story:** wfp.16
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**Oversight level:** Low (inherited from epic)

---

## Hard blocks

| Check | Status | Notes |
|-------|--------|-------|
| H1 — AC clarity: all ACs testable with clear pass/fail | ✅ PASS | 10 ACs, all measurable. NFR: 128KB body limit, 30s non-streaming, 5s first SSE chunk. |
| H2 — No open HIGH review findings | ✅ PASS | All HIGH/MEDIUM findings resolved in commit 7458b0d. Review artefact: wfp.16-review.md. |
| H3 — Test plan exists and is approved | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.16-test-plan.md |
| H4 — AC verification script exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.16-verification.md |
| H5 — Story has a single owner | ✅ PASS | Coding agent; Hamish King (operator) |
| H6 — Dependencies resolved or contracted | ✅ PASS | Dependency: intelligence server (wfp.11) DoD-complete. wfp.12–wfp.15 DoD-complete (nav links added to all 4 HTML pages). |
| H7 — Story fits in one iteration | ✅ PASS | 3 routes + 2 adapter setters + context assembly + 1 test file. Bounded. |
| H8 — No external API contracts blocked | ✅ PASS | LLM backend abstracted via injectable adapters. No hardcoded external URL. |
| H8-ext — Schema dependencies resolved | ✅ PASS | No upstream schema dependencies declared — schema check not required. `schemaDepends: []` |
| H9 — Discovery approval traceable | ✅ PASS | Approved By: Hamish King — 2026-05-26. See discovery artefact. |
| H-GOV — Governance gate passed | ✅ PASS | Discovery approval found. |
| H-NFR — NFR profile exists | ✅ PASS | artefacts/2026-05-26-bsr-workforce-planner/nfr-profile.md |
| H-NFR2 — Regulatory NFRs addressed | ✅ PASS | Data classification: Internal/Private. No regulatory clauses apply. |
| H-NFR3 — NFR test coverage mapped | ✅ PASS | Test plan includes NFR-SEC (authGuard, 128KB body limit, 413), NFR-PII (summarised roster, no startDate/status in T1 context), NFR-PERF (30s non-streaming, 5s first SSE chunk). |
| H-ADAPTER — D37 compliance | ✅ PASS | Both adapters wired: `setWorkforceQueryExecutorAdapter` and `setWorkforceQueryExecutorStreamAdapter`. (a) Stub defaults MUST throw per D37. (b) AC5 is the explicit wiring AC (`__getAdapters()` export verifies non-stub). (c) Implementation plan names wiring as separate task from handler task. |
| H-E2E — E2E test strategy agreed | ✅ PASS | Visual chat layout: manual scenario 1b. 1280px compat: RISK-ACCEPT. All other ACs: automated. |

---

## Warnings

| Check | Status | Notes |
|-------|--------|-------|
| W1 — Story sized appropriately | ✅ OK | 10 ACs, 3 routes. Within bounds. |
| W2 — No gold-plating risk | ✅ OK | Adapter pattern future-proofs LLM backend without over-building. |
| W3 — MEDIUM review findings reviewed | ✅ OK | AC2 body shape, AC5 wiring AC, AC7 silent omission — all fixed in 7458b0d. |
| W4 — Test data available | ✅ OK | Adapter stubs injectable via setters. `__getAdapters()` in NODE_ENV=test mode. |
| W5 — CSS-layout-dependent ACs classified | ✅ OK | Chat layout: manual scenario 1b. 1280px compat: RISK-ACCEPT in decisions.md. |

---

## Coding Agent Instructions

**Proceed: Yes**

### Context summary

Implement `GET /workforce-chat` (HTML), `POST /api/workforce-chat/turn` (non-streaming JSON), and `POST /api/workforce-chat/turn-stream` (SSE) on the intelligence server. Assemble a 3-tier context window (T1/T2/T3) from workforce data files and pass to an injectable adapter.

### Acceptance criteria (full list)

- AC1: GET /workforce-chat → 200 HTML with chat interface, T2/T3 tier toggle controls, and nav link `<a href="/workforce-chat">Ask a question</a>`.
- AC2: POST /api/workforce-chat/turn body: `{ "message": "...", "history": [...], "includeFullRoster": false, "includeTier2": false }` → assemble T1 + conditional T2/T3 context, call `_workforceQueryExecutor`, return `{ response, tiersUsed }`.
- AC3: POST /api/workforce-chat/turn-stream → SSE stream with `Content-Type: text/event-stream` and `Cache-Control: no-cache`.
- AC4: In test mode, `_workforceQueryExecutor` stub not wired → throws `"Adapter not wired: workforceQueryExecutor. Call setWorkforceQueryExecutorAdapter() with a real implementation before use."` No silent null/empty return.
- AC5: `__getAdapters()` exported when `NODE_ENV=test`. After `setWorkforceQueryExecutorAdapter(fn)` is called, `__getAdapters().workforceQueryExecutor === fn` (non-stub).
- AC6: T1 always included in every request: full `teams.json` + summarised roster (fields: `name`, `teamId`, `skills` only — no `startDate`, `endDate`, `status`).
- AC7: T2 included when message contains any of 14 keywords (e.g. "initiative", "allocation", "portfolio") OR `includeTier2: true`. T2 includes `initiative-map.json` (with note if absent) + `allocation-input.json` (silently omitted if absent). `tiersUsed` includes `"T2"`.
- AC8: T3 included when `includeFullRoster: true`. T3 = full `roster.json` (all fields). `tiersUsed` includes `"T3"`.
- AC9: Bearer token assembled using `req.session.accessToken`. Must not use `req.session.token`.
- AC10: Nav link `<a href="/workforce-chat">Ask a question</a>` present on all 4 intelligence HTML pages: `/intelligence/heat-map`, `/intelligence/bottlenecks`, `/intelligence/temporal-risk`, `/intelligence/scenarios`.

### Security requirements

- All 3 routes require `authGuard` middleware.
- Body size limit: 128KB; return 413 on oversize.
- T1 summarised roster: must NOT include `startDate`, `endDate`, `status` in context string (PII safeguard).
- Use `req.session.accessToken` only — zero occurrences of `req.session.token` (without `Access`) in server source.

### D37 adapter wiring (mandatory — 2 separate implementation tasks)

**Task 1 — Handler + adapter setters:**
- Implement route handler
- Export `setWorkforceQueryExecutorAdapter(fn)` and `setWorkforceQueryExecutorStreamAdapter(fn)`
- Default stubs throw `"Adapter not wired: <name>. Call set<Name>() with a real implementation before use."`
- Export `__getAdapters()` when `NODE_ENV=test`

**Task 2 — Production wiring in server.js (separate task):**
- Wire both adapters to real LLM implementations in `src/workforce-ui/server.js`
- `__getAdapters()` must return non-stub after this wiring
- AC5 test verifies this

### Test file

`tests/workforce/check-wfp16-workforce-chat.js`

### Verification script

`artefacts/2026-05-26-bsr-workforce-planner/verification-scripts/wfp.16-verification.md`

### Out-of-scope

- `workforce/*.json` data files — read-only, do not modify.
- Any other route handlers outside workforce-chat endpoints.
- CDN, npm runtime dependencies.
- LLM model selection or prompt engineering — adapter abstraction handles this.
