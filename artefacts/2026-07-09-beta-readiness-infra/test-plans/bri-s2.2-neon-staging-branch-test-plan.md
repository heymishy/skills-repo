# Test Plan: Provision a Neon staging branch for Postgres

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Copy-on-write Neon branch — all prod tables present and structurally identical in staging | 1 test (regression guard) | — | — | 1 scenario | External-dependency | 🟡 |
| AC2 | Write isolation — a staging write never appears in prod | 1 test (wiring guard) | — | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Cold-start reconnection succeeds within 10 seconds after 5-min autosuspend | — | 2 tests (mocked timing) | — | 1 scenario (real-world timing) | External-dependency (partial) | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's Node suite | Handling |
|-----|----|----------|--------------------------------------------|---------|
| Actual table-for-table schema identity across two live Neon databases | AC1 | External-dependency | Requires two live Neon connection strings and an `information_schema` query against each — no live Neon access in the automated suite | Manual scenario — query both databases and diff, see AC verification script Scenario 1 🟡 |
| Actual write isolation across two live Neon projects/branches | AC2 | External-dependency | Requires writing to a real staging DB and inspecting a real prod DB — no live DB access in the automated suite | Manual scenario — see AC verification script Scenario 2 🟡 |
| Real-world cold-start latency against the actual Neon staging branch | AC3 | External-dependency | The 10-second budget is grounded in Neon's published benchmarks, not something this repo can reproduce without a real autosuspended branch | Manual scenario after 5+ minutes of staging idle, see AC verification script Scenario 3. The mocked integration tests below cover the *application's* handling of a slow/delayed connection, not Neon's actual latency. |

---

## Test Data Strategy

**Source:** Mixed — Mocked (for AC3's connection-timing logic) and Synthetic/static-analysis (for AC1/AC2's wiring guards). No real Neon connections are used in the automated test suite, per the confirmed test data strategy for this epic.
**PCI/sensitivity in scope:** No
**Availability:** Available now for the mocked/static parts. The live-database parts (AC1, AC2, and the real-world portion of AC3) are a genuine External-dependency gap, not a data availability problem — see Coverage gaps.
**Owner:** Self-contained (mocked parts) / Manual (live-DB parts, owner: Hamish)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `server.js` source text, scanned for environment-conditional schema branching | Repo file (static read) | None | Proves the app doesn't maintain a forked staging-only schema path in code — does not prove live schema identity (see gap) |
| AC2 | `journey-store-pg.js`, `server.js` source text, scanned for hardcoded connection strings | Repo files (static read) | None | Proves the app has no accidental hardcoded fallback to a specific database — does not prove live isolation (see gap) |
| AC3 | A mocked `pg`-shaped connect function with configurable artificial delay | In-memory stub, no real network/DB | None | Simulates Neon's cold-start delay without needing a real autosuspended branch |

### PCI / sensitivity constraints

None — no real tenant data is used or referenced by these tests.

### Gaps

None in test data availability for the mocked/static portion. Live-database verification is out of reach of this repo's test suite by design (see Coverage gaps) — this is an infrastructure-provisioning limitation, not a missing fixture.

---

## Unit Tests

### T1 — Schema initialization code is not forked per environment

- **Verifies:** AC1 (partial — code-level regression guard, not live schema proof)
- **Precondition:** `server.js` exists and contains the app's `CREATE TABLE IF NOT EXISTS` migration statements (confirmed present today for `github_first_login`, `users`, etc.)
- **Action:** Read `server.js` source text. Search for any conditional schema-creation branch keyed on an environment variable (e.g. `if (process.env.NODE_ENV === 'staging') { ...different CREATE TABLE... }` or a similarly named staging-only schema file being required).
- **Expected result:** No such environment-conditional schema branch exists — the same `CREATE TABLE IF NOT EXISTS` statements run unconditionally regardless of which database `DATABASE_URL` points at, so staging and prod are structurally guaranteed to share a schema definition in code (the live identity itself still depends on the Neon branch being taken as a true copy-on-write branch — see gap).
- **Edge case:** No
- **Fails before implementation:** Not applicable in the traditional TDD-red sense — this is a regression guard against a schema-forking anti-pattern that doesn't exist today. It should already pass. Flagged in Test Gaps below.

---

### T2 — No hardcoded Postgres connection string exists in tracked source

- **Verifies:** AC2 (partial — code-level wiring guard, not live isolation proof)
- **Precondition:** None
- **Action:** Recursively scan tracked source files under `src/` (excluding `node_modules`, `.git`) for a literal string matching `postgres://` or `postgresql://` followed by non-placeholder-looking credentials (i.e. not inside a comment or `.env.example`-style placeholder).
- **Expected result:** Zero matches — every Postgres connection in the app derives from `process.env.DATABASE_URL` at runtime (confirmed today in `journey-store-pg.js` and `server.js`), so staging and prod are wired via distinct env values, never a shared hardcoded string.
- **Edge case:** No
- **Fails before implementation:** No — this should already pass today (the codebase already follows this pattern). This is a protective regression guard, not a red-before-green test. Flagged in Test Gaps below.

---

## Integration Tests

### IT1 — A delayed connection within the 10-second budget succeeds

- **Verifies:** AC3
- **Components involved:** A connection-readiness helper (assumed new — see note below), a mocked `pg`-shaped `connect()` function
- **Precondition:** A stub `connect()` function is configured to resolve successfully after an artificial 8-second delay (simulating a Neon cold start well within budget)
- **Action:** Call the connection-readiness helper with the stub connect function and a 10-second timeout budget
- **Expected result:** The helper resolves successfully; elapsed time is ~8 seconds, well under the 10-second cap
- **Note:** This test assumes the implementation introduces a connection-readiness/retry helper (e.g. `waitForDbReady(timeoutMs)`), since the current `pg.Pool`-based connection code (`journey-store-pg.js`) has no built-in cold-start retry or explicit timeout budget — it just calls `pg`'s own defaults. If the implementation instead relies purely on `pg`'s default connection timeout with no new helper, this test's target module name will need to be adjusted at implementation time. Flagged as an assumption, not a rigid contract, in Test Gaps below.
- **Fails before implementation:** Yes — the helper does not exist yet

---

### IT2 — A delayed connection exceeding the 10-second budget surfaces a clear, bounded error

- **Verifies:** AC3
- **Components involved:** Same connection-readiness helper, a mocked `connect()` configured to never resolve (or resolve after 15 seconds)
- **Precondition:** Stub `connect()` never resolves within the test's patience window
- **Action:** Call the connection-readiness helper with a 10-second timeout budget
- **Expected result:** The helper rejects/throws a clear, named error (e.g. `DB_CONNECT_TIMEOUT`) at or shortly after the 10-second mark — it does not hang indefinitely and does not throw an unrelated/opaque error
- **Edge case:** Yes — boundary condition for the NFR's own timeout enforcement
- **Fails before implementation:** Yes — the helper does not exist yet

---

## NFR Tests

### NFR1 — Performance (cold-start budget)

- **NFR addressed:** Performance — Neon autosuspend cold-start must resolve within 10 seconds (grounded in Neon's published latency benchmarks: typical 500ms–800ms, 95th percentile 2.6s, worst case 3.1s across a 200-sample benchmark; source: neon.com/docs/guides/benchmarking-latency, verified 2026-07-09)
- **Measurement method:** IT1/IT2 above (mocked timing). Real-world confirmation is a manual gap — see Coverage gaps.
- **Pass threshold:** Mocked: resolves within 10000ms when the underlying connect delay is ≤10s; bounded rejection at ~10000ms otherwise. Real-world (manual): actual reconnection after 5-min idle completes within 10 seconds.
- **Tool:** Node.js `Date.now()` / mocked timers for IT1/IT2; manual stopwatch for the real-world scenario

---

### NFR2 — Security (connection string never committed)

- **NFR addressed:** Security — staging Neon connection string is set via Fly secrets, never committed to the repo
- **Measurement method:** Static scan of tracked source files for a literal Neon connection string pattern (`neon.tech` combined with a `postgres://`/`postgresql://` prefix and non-placeholder credentials)
- **Pass threshold:** Zero matches outside of documented `.env.example`-style placeholders
- **Tool:** Node.js `fs` + regex

---

### NFR3 — Accessibility

- **NFR addressed:** Not applicable (per story)
- **Measurement method:** N/A
- **Pass threshold:** N/A
- **Tool:** N/A

---

### NFR4 — Audit

- **NFR addressed:** Neon's own branch/query history is sufficient; no additional custom audit logging needed (per story)
- **Measurement method:** N/A — no custom logging to test
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Live schema comparison between two real Neon databases (see Coverage gaps)
- Live write-isolation verification between two real Neon projects/branches (see Coverage gaps)
- Automatic nightly re-branching from prod — explicitly out of scope per story
- Migrating dev/local Postgres data into the staging branch — explicitly out of scope per story (S2.4's seed script covers staging data instead)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live schema/data-isolation verification (AC1, AC2) | Requires two real Neon connection strings; not available to the automated Node suite | Manual scenarios in the AC verification script; treated as a genuine infrastructure-provisioning gap, not a fabricated automated test |
| IT1/IT2 assume a connection-readiness helper that doesn't exist in the codebase today | Current `journey-store-pg.js` has no explicit cold-start retry/timeout logic — it relies on `pg`'s own defaults | If implementation takes a different approach (e.g. configuring `pg.Pool`'s `connectionTimeoutMillis` directly rather than a custom helper), retarget IT1/IT2 at that configuration instead — the intent (bounded, non-hanging behaviour within 10s) is the contract, not the specific helper name |
| T1/T2 may not be in TDD red state | Both are protective regression guards against patterns that don't exist in the codebase today | Acceptable — these guard against future regressions (e.g. someone hardcoding a fallback DB string), not proving new AC1/AC2 behaviour that doesn't exist yet |
| Real-world Neon cold-start timing is outside this repo's control | Neon's actual latency depends on their infrastructure, not this app's code | The 10-second budget is a generous margin above Neon's own published 95th-percentile (2.6s) and worst-case (3.1s) figures — low risk of false failure, but confirm with the manual scenario after the branch is live |
