# Definition of Ready — lab-s3.1 — Credits table + plan data model (Postgres)

**Story:** lab-s3.1
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 9 tests covering 7 ACs (AC3 integration — conditional on DATABASE_URL)
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s3.1-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. Atomic `UPDATE` pattern for `adjustBalance` (not read-modify-write) is explicitly required in contract and tested via SQL capture assertion. AC7 (no DATABASE_URL committed) is a static `git grep` check — automated and deterministic.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As the platform operator…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T6.1, IT3.1 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 5 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M2, M3 |
| H6 | Complexity rated | PASS | Complexity: 1 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | AC3 integration: conditional (skips without DATABASE_URL) — acknowledged |
| H8-ext | Cross-story schema dependency check | PASS | No upstream story dependencies — schema check not required |
| H9 | Architecture Constraints populated | PASS | D37, ADR-011, no credentials committed, atomic balance updates, CJS-only |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | `credits.js` D37: stub throws (AC5); production wiring in server.js (AC6 — separate task) |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — No negative balance at DB level (intentional), idempotent migration |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS — AC3 skip behaviour explicitly acknowledged |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s3.1

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low

---

## Coding Agent Instructions

**Story:** lab-s3.1 — Credits table + plan data model (Postgres)
**Complexity:** 1 | **Oversight:** Low

### What to build

**`scripts/migrate-schema-credits.js`** — Connects to `DATABASE_URL`, runs:
```sql
CREATE TABLE IF NOT EXISTS credits (
  tenant_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stripe_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```
Both with `IF NOT EXISTS`. Exit 0 on success. Idempotent — safe to run twice.

**`scripts/smoke-test-credits.js`** — Upsert test tenant balance=100, read back (assert 100), decrement by 10, read back (assert 90), delete test row, exit 0 "Credits smoke test PASSED". Skip gracefully if `DATABASE_URL` not set.

**`src/web-ui/modules/credits.js`** — CJS module:
- `getBalance(tenantId)` — SELECT balance FROM credits WHERE tenant_id = $1 (returns 0 if not found)
- `adjustBalance(tenantId, delta)` — `UPDATE credits SET balance = balance + $1, updated_at = now() WHERE tenant_id = $2` (atomic — no read-modify-write)
- `setCreditsAdapter(impl)` — D37 injectable; default stub throws `Error('Adapter not wired: creditsDb. Call setCreditsAdapter() before use.')`

### Required touchpoints

- `scripts/migrate-schema-credits.js` — CREATE
- `scripts/smoke-test-credits.js` — CREATE
- `src/web-ui/modules/credits.js` — CREATE
- `src/web-ui/server.js` — MODIFY (wire credits DB adapter — separate task; log "Credits DB adapter wired" on startup)

### MUST NOT touch

- Any existing turn handler or route files (lab-s3.3 wires credits guard)
- Stripe-related files (lab-s3.2 / lab-s3.4 scope)
- `users` table or auth-related modules

### Test runner

`node tests/check-lab-s3.1-credits-model.js`

### Task order (implementation plan)

**Task 1:** Create `scripts/migrate-schema-credits.js` — idempotent migration for credits + stripe_events tables
**Task 2:** Create `scripts/smoke-test-credits.js` — round-trip smoke test with graceful skip
**Task 3:** Create `src/web-ui/modules/credits.js` — getBalance, adjustBalance (atomic UPDATE), setCreditsAdapter (throwing stub default)
**Task 4 (separate D37 task):** Wire real Postgres adapter in `server.js` — `setCreditsAdapter(realPgAdapter)`, startup log
**Task 5:** Run test suite — 0 failures

### Architecture constraints

- `adjustBalance` MUST use `UPDATE credits SET balance = balance + $1` — never read-modify-write (race condition risk)
- `credits.js` default stub MUST throw (D37) — not return 0 or null
- `DATABASE_URL` must NEVER appear in any committed file — use `process.env.DATABASE_URL` only
- No negative balance constraint at DB level — application layer (lab-s3.3) handles this intentionally

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 5 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s3.1-credits-model.js` 0 failures
5. /branch-complete
