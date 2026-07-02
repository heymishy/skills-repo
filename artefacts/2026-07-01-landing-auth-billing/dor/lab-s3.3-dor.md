# Definition of Ready — lab-s3.3 — Credit enforcement — 402 turn guard

**Story:** lab-s3.3
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 9 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s3.3-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC7 explicitly asserts Anthropic adapter invocation count = 0 (not just "no error was thrown"). AC5 enforcement-before-side-effects is validated structurally by test setup — the credits-guard middleware is mounted first, so any test that would call the Anthropic adapter before the guard would fail AC7. The 402 JSON body shape is exact (AC1 asserts both `error` and `topUpUrl` fields).

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As the platform operator…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.1, IT1, NFR1 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 4 explicit exclusions |
| H5 | Benefit linkage references a named metric | PASS | M2 — credits enforcement |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | No gaps |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared; field in schema |
| H9 | Architecture Constraints populated | PASS | D37 (credits.js already injectable from s3.1), ADR-011, enforcement before side effects, no grace period |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | credits.js adapter already wired from lab-s3.1 (AC6 of s3.1); this story uses existing wiring. No new setX() function introduced. |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — Performance (1 Postgres query per turn), no accessToken in 402 body or logs |
| W2 | Scope stability declared | PASS — Stable |
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

## ✅ Definition of Ready: PROCEED — lab-s3.3

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s3.1 must be signed-off before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s3.3 — Credit enforcement — 402 turn guard
**Complexity:** 2 | **Oversight:** Low
**Entry gate:** lab-s3.1 DoR signed-off (credits.js with injectable adapter in place).

### What to build

**`src/web-ui/middleware/credits-guard.js`** — Express middleware (or equivalent):
```js
async function creditsGuard(req, res, next) {
  const tenantId = req.session.tenantId;
  const balance = await getBalance(tenantId);
  if (balance <= 0) {
    _logger.info('credits_balance_check', { tenantId, balance, result: 'blocked' });
    return res.status(402).json({ error: 'Insufficient credits', topUpUrl: '/settings/billing' });
  }
  next();
}
```

After the turn completes (in the turn handler, not the middleware), call `adjustBalance(tenantId, -(process.env.TURN_CREDIT_COST || 1))`.

Mount `creditsGuard` on the turn route in `server.js` or the route file — it must appear BEFORE the Anthropic API adapter call in the middleware chain.

### Required touchpoints

- `src/web-ui/middleware/credits-guard.js` — CREATE
- `src/web-ui/routes/` (turn route file) — MODIFY (mount credits-guard, add adjustBalance call after Anthropic response)
- `src/web-ui/server.js` — MODIFY (verify guard is in correct position in route chain)

### MUST NOT touch

- `src/web-ui/modules/credits.js` (lab-s3.1 module — use as-is)
- `src/web-ui/routes/billing.js` (lab-s3.2 scope)
- Auth routes or OAuth adapter files

### Test runner

`node tests/check-lab-s3.3-credit-enforcement.js`

### Task order (implementation plan)

**Task 1:** Create `src/web-ui/middleware/credits-guard.js` — balance check, 402 on ≤ 0, audit log, next() on > 0
**Task 2:** Mount credits-guard on turn route — BEFORE Anthropic adapter call; add `adjustBalance(-TURN_CREDIT_COST)` after successful turn response
**Task 3:** Verify middleware ordering in `server.js` — credits-guard first in turn route chain
**Task 4:** Run test suite — 0 failures

### Architecture constraints

- Credits check is the FIRST operation after session auth — no journey state creation, no Anthropic call before the check
- 402 response body MUST be exactly `{ "error": "Insufficient credits", "topUpUrl": "/settings/billing" }` — no extra fields, no `accessToken` in body or logs
- `TURN_CREDIT_COST` read at request time via `process.env.TURN_CREDIT_COST` — not cached at module load time
- `adjustBalance` delta MUST be negative for credit deduction (e.g., `adjustBalance(tenantId, -1)`)
- No grace period: ANY balance ≤ 0 blocks the turn — this is not configurable

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 4 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s3.3-credit-enforcement.js` 0 failures
5. /branch-complete
