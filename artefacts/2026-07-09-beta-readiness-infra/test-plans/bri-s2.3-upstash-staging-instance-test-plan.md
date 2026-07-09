# Test Plan: Provision an Upstash staging instance for Redis

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `wuce-staging` connects using distinct staging `UPSTASH_REDIS_REST_URL`/`TOKEN`, not prod's | 2 tests | — | — | 1 scenario | External-dependency | 🟡 |
| AC2 | A staging Redis write never appears in prod Redis | 1 test (wiring guard) | — | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Staging Redis usage after a week of CI cadence stays within the 500K commands/month free-tier | — | — | — | 1 scenario | External-dependency | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's Node suite | Handling |
|-----|----|----------|--------------------------------------------|---------|
| Actual live isolation between two Upstash Redis instances | AC2 | External-dependency | Requires two real Upstash REST endpoints and credentials — no live Upstash access in the automated suite | Manual scenario — see AC verification script Scenario 2 🟡 |
| Actual monthly command count against the free-tier ceiling | AC3 | External-dependency | Usage is only observable via the Upstash dashboard after a real week of CI traffic — nothing in-repo to assert against | Manual scenario, scheduled ~1 week after CI is running against staging — see AC verification script Scenario 3 🔴 (highest risk of the three: free-tier overage would be a real cost/availability surprise, and it can only be caught by watching the dashboard, not by a test) |

---

## Test Data Strategy

**Source:** Mocked / Synthetic — the existing `@upstash/redis` client factories in `session-redis.js` and `skill-session-redis.js` are inspected via static source analysis; no real Upstash network calls are made in the automated suite.
**PCI/sensitivity in scope:** No
**Availability:** Available now for the static/wiring checks. The live-instance checks (AC2's real isolation, AC3's usage ceiling) are a genuine External-dependency gap — see Coverage gaps.
**Owner:** Self-contained (wiring checks) / Manual (live-instance checks, owner: Hamish)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `session-redis.js`, `skill-session-redis.js` source text | Repo files (static read) | None | Both already read exclusively from `process.env.UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` today — this test plan verifies that pattern holds, not that it's newly built |
| AC2 | Same source files, scanned for hardcoded Upstash URLs/tokens | Repo files (static read) | None | Proves no accidental hardcoded fallback exists |
| AC3 | Upstash dashboard usage figures | Live dashboard (manual only) | None | No synthetic substitute is meaningful here — real CI cadence over real time is what the AC actually asks about |

### PCI / sensitivity constraints

None.

### Gaps

None in test data availability for the static portion. The live-instance portion is out of reach of this repo's test suite by design.

---

## Unit Tests

### T1 — Redis client factories derive credentials exclusively from environment variables

- **Verifies:** AC1
- **Precondition:** `session-redis.js` and `skill-session-redis.js` exist (both already do today)
- **Action:** Read both files' source text. Confirm the `Redis` client constructor call uses `url: process.env.UPSTASH_REDIS_REST_URL` and `token: process.env.UPSTASH_REDIS_REST_TOKEN` with no hardcoded literal fallback (e.g. no `|| 'https://...upstash.io'` default).
- **Expected result:** Both files construct their client exclusively from the two env vars, with no literal URL/token fallback present in either file
- **Edge case:** No
- **Fails before implementation:** No — this already holds true in the codebase today (confirmed by reading both files). This is a protective regression guard for the distinctness this story requires, not new behaviour. Flagged in Test Gaps below.

---

### T2 — No hardcoded Upstash connection literal exists anywhere in tracked source

- **Verifies:** AC1, AC2
- **Precondition:** None
- **Action:** Recursively scan tracked source files under `src/` (excluding `node_modules`, `.git`) for a literal string matching an Upstash REST URL pattern (`https://[a-z0-9-]+\.upstash\.io`) or a token-shaped literal assigned directly (not via `process.env`).
- **Expected result:** Zero matches outside of `process.env.UPSTASH_REDIS_REST_URL`/`TOKEN` references
- **Edge case:** No
- **Fails before implementation:** No — protective regression guard, already true today. Flagged in Test Gaps below.

---

### T3 — The module-level Redis client singleton is not shared across differing credential configurations within a single process

- **Verifies:** AC2 (wiring guard — proves the app doesn't accidentally cache a client built from one config and reuse it after env vars change)
- **Precondition:** `session-redis.js`'s `_client` module-level variable and `_getClient()` function
- **Action:** In a test harness, set `process.env.UPSTASH_REDIS_REST_URL`/`TOKEN` to config A, call `_getClient()` (mocking the `@upstash/redis` `Redis` constructor to record what it was called with), then reset the module (`delete require.cache[...]`) and reload with config B, call `_getClient()` again.
- **Expected result:** The client constructed under config A is built with config A's URL/token, and after a module reload under config B, a *new* client is built with config B's URL/token — no bleed-through between the two.
- **Edge case:** Yes — this test exercises the module-reload-based test pattern already used elsewhere in this repo's suite (see `tests/check-arl-s4-admin-billing-bypass.js`'s `require.cache` manipulation)
- **Fails before implementation:** Not applicable in the strict TDD-red sense — the module's existing lazy-singleton pattern already supports this correctly when reloaded. This test guards against a future regression (e.g. someone introducing a process-wide cache keyed only by "the" Redis client, ignoring which env config built it).

---

## Integration Tests

None. There is no in-repo integration seam beyond the client-factory wiring covered by the unit tests above — actual cross-instance isolation is a live-infrastructure concern (see Coverage gaps).

---

## NFR Tests

### NFR1 — Performance

- **NFR addressed:** Performance — "None beyond Upstash's standard free-tier latency characteristics" (per story)
- **Measurement method:** Not applicable
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

### NFR2 — Security (credentials never committed)

- **NFR addressed:** Security — staging Upstash credentials set via Fly secrets, never committed to the repo
- **Measurement method:** T2 above (static scan for hardcoded Upstash URL/token literals)
- **Pass threshold:** Zero matches
- **Tool:** Node.js `fs` + regex

---

### NFR3 — Accessibility

- **NFR addressed:** Not applicable (per story)
- **Measurement method:** N/A
- **Pass threshold:** N/A
- **Tool:** N/A

---

### NFR4 — Audit

- **NFR addressed:** "None identified beyond Upstash's own usage dashboard" (per story)
- **Measurement method:** N/A — no custom logging to test
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Live cross-instance isolation verification (see Coverage gaps)
- Live monthly usage tracking against the free-tier ceiling (see Coverage gaps)
- Redis persistence/backup configuration — explicitly out of scope per story
- A shared Redis instance across staging/future preview environments — explicitly out of scope per story (this story provisions exactly one staging instance)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| T1/T2/T3 may not be in TDD red state | The existing codebase's env-var-only client factory pattern already satisfies these guards today | Acceptable — these are protective regression guards for a property (credential distinctness) that the current architecture already supports; the actual new work in this story is the Upstash-side provisioning and Fly secret assignment, not new application code |
| AC2's live isolation and AC3's usage-ceiling checks are entirely manual | No live Upstash access from the automated Node suite | Manual scenarios in the AC verification script; AC3 in particular is flagged 🔴 (highest risk) since free-tier overage is a real cost/availability risk only caught by watching the dashboard over time, not by any test |
| AC3 has no automatable substitute at all | "Usage after a week of normal CI cadence" is inherently a real-time, real-traffic observation | Schedule the manual dashboard check ~1 week after CI first starts deploying to and testing against `wuce-staging`; add a recurring reminder if usage trends near the ceiling |
