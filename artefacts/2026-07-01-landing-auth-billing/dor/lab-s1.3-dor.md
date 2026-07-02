# Definition of Ready — lab-s1.3 — Multi-provider auth registry (GitHub primary)

**Story:** lab-s1.3
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 11 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s1.3-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. The contract correctly lists `server.js` as a required touchpoint (CLAUDE.md B1/D1 rule: contract must not exclude files the test plan requires). AC6 wiring is verified by a dedicated unit test. AC7 regression is an explicit test-runner invocation, not a "checked manually" assertion.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T2.1–T6.1, IT1.1/IT1.2, R7.1 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 4 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M1, M2 |
| H6 | Complexity rated | PASS | Complexity: 3 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | All ACs covered; no UNCERTAIN gaps |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared in contract; `dorStatus` present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | PASS | sec-perf, D37, canonical field, B1/D1 note, CJS-only, ADR-011 |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | Provider adapter D37: stub throws (AC5), production wiring in server.js (AC6) |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — 3 NFRs: no accessToken in Redis, no credentials committed, session rotation test suite passes |
| W2 | Scope stability declared | PASS — Stable (approach depends on spike; ACs are approach-agnostic) |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s1.3

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s1.1 must be signed-off (spike complete, ARCH-002 updated) before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s1.3 — Multi-provider auth registry (GitHub primary)
**Complexity:** 3 | **Oversight:** Low
**Entry gate:** lab-s1.1 DoR signed-off (spike outcome + ARCH-002 updated). Read `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` before writing any code — the chosen path determines implementation approach.

### What to build

Refactor `src/web-ui/auth/oauth-adapter.js` (or replace it) to introduce a provider registry pattern that supports multiple providers while keeping GitHub OAuth working. Key requirements:

1. Injectable provider adapter (`setProviderAdapter(impl)`) — D37: default stub must throw, not return null
2. `authGuard` reads ONLY `req.session.accessToken` — T4.2 asserts `req.session.token` alone is rejected
3. `rotateSessionId` called after every successful provider callback
4. Startup wiring in `server.js`: real provider implementation wired, log "provider registry initialised"

### Required touchpoints

- `src/web-ui/auth/oauth-adapter.js` — MODIFY or REPLACE (provider registry, injectable setter)
- `src/web-ui/routes/auth.js` — MODIFY (callback uses registry, rotateSessionId confirmed present)
- `src/web-ui/server.js` — MODIFY (wire real provider implementation, separate task from registry task)

### MUST NOT touch

- `src/web-ui/routes/public.js` (lab-s1.2 scope — landing page)
- `src/web-ui/templates/` (no template changes in this story)
- Google or email/password handler code (out of scope)

### Test runner

`node tests/check-lab-s1.3-provider-registry.js`

Regression: `node tests/check-wuce1-oauth-flow.js` — must show 0 failures (AC7)

### Task order (implementation plan)

**Task 1:** Refactor `oauth-adapter.js` — introduce `setProviderAdapter()` with throwing stub default. Implement provider registry pattern per spike outcome path.
**Task 2:** Update `routes/auth.js` callback — call registry adapter, verify `rotateSessionId` is called, verify `req.session.accessToken` is set (not `req.session.token`).
**Task 3 (separate, D37 requirement):** Wire real provider implementation in `server.js` — call `setProviderAdapter(realGitHubImpl)` on startup; add startup log "provider registry initialised".
**Task 4:** Run test suite + regression: `node tests/check-lab-s1.3-provider-registry.js` and `node tests/check-wuce1-oauth-flow.js` — 0 failures each.

### Architecture constraints

- D37: `setProviderAdapter` default stub MUST throw `Error('Adapter not wired: providerAdapter. Call setProviderAdapter() before use.')` — not return null or empty object
- CLAUDE.md canonical field: `authGuard` MUST read `req.session.accessToken` — verify with grep: `grep -rn "req\.session\.token[^A]" src/web-ui/` must return 0 results
- ARCH-003: forced re-auth on deploy — pre-deploy sessions are deliberately rejected by updated authGuard
- B1/D1: `server.js` is in the required touchpoints — the DoR contract does NOT exclude it

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 4 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — both test files must show 0 failures
5. /branch-complete
