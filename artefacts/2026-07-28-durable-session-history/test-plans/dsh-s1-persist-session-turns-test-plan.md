# Test Plan: Persist a stage's session turns to Postgres on completion

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Completion write inserts a row with correct fields | 1 | — | — | — | — | 🟢 |
| AC2 | Re-completion upserts, doesn't duplicate | 1 | — | — | — | — | 🟢 |
| AC3 | Write failure doesn't block completion flow | 1 | — | — | — | — | 🟢 |
| AC4 | Unwired adapter throws | 1 | — | — | — | — | 🟢 |
| AC5 | Real Postgres wiring, two tenants, no cross-contamination | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — an in-memory fake db (per-table row storage, matching `check-alrf-s11-purge-e2e-tenants.js`'s `makeFakeDb` pattern) for unit tests; a real `pg` client against a test/dev Postgres connection string for the AC5 wiring test.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1-AC4 | A fake db double matching `session_turns`' insert/update surface | Inline fixture | None | |
| AC5 | Two synthetic sessions for two distinct tenant IDs, a real `pg.Pool` | Test setup, `DATABASE_URL` from environment | None | Matches the wiring-test convention already used by `check-jsvr-s1-wire-stage-view-route.js` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Completion write inserts a row with journey_id, tenant_id, skill_name, and full turns array

- **Verifies:** AC1
- **Precondition:** A skill session reaches `done: true`, linked to a journey with a known `tenantId`
- **Action:** Fire the completion write path
- **Expected result:** The fake db records exactly one insert into `session_turns` with `journey_id`, `tenant_id`, `skill_name`, and `turns` matching the session's own `turns` array content
- **Edge case:** No

### Re-completing the same stage upserts, does not duplicate

- **Verifies:** AC2
- **Precondition:** A `session_turns` row already exists for `(journey_id, skill_name)`
- **Action:** Fire the completion write path a second time for the same stage
- **Expected result:** Exactly one row still exists for that `(journey_id, skill_name)` pair, with updated `turns` content — not two rows
- **Edge case:** Yes — re-run/re-completion scenario

### A failed Postgres write does not block the rest of the completion flow

- **Verifies:** AC3
- **Precondition:** The fake db's insert call is configured to throw
- **Action:** Fire the completion write path
- **Expected result:** The artefact save, Redis delete, and client response all still complete successfully; the Postgres failure is logged but swallowed
- **Edge case:** Yes

### Unwired adapter throws instead of silently no-op'ing

- **Verifies:** AC4
- **Precondition:** `setSessionTurnsStore()` has never been called in this test's module instance
- **Action:** Attempt to persist turns via the write path
- **Expected result:** Throws exactly `Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.`
- **Edge case:** No

---

## Integration Tests

### Real Postgres wiring: two tenants' turns are stored and read back without cross-contamination

- **Verifies:** AC5
- **Components involved:** The real Postgres adapter wired via `setSessionTurnsStore()`, a live `pg.Pool` against a test/dev database
- **Precondition:** Two synthetic sessions exist for two distinct tenant IDs, each with distinct turn content
- **Action:** Complete both stages through the real wired adapter; read both rows back directly via `pg`
- **Expected result:** Each tenant's row contains exactly its own turns content; no row's `turns` field matches the other tenant's content — asserting real behavioural correctness (CLAUDE.md D37), not just that a function reference was assigned

---

## NFR Tests

### Completion write does not add more than ~100ms to the response path

- **NFR addressed:** Performance
- **Measurement method:** Time the completion handler's total execution with the Postgres write present vs. a stubbed no-op write; assert the delta is under ~100ms
- **Pass threshold:** <100ms added latency
- **Tool:** Node `process.hrtime` / manual timing in the test

### Every session_turns row carries tenant_id; turns content never includes accessToken

- **NFR addressed:** Security
- **Measurement method:** Assert the fake db never receives an insert with a null/undefined `tenant_id`; assert the `turns` JSONB payload for a session whose in-memory object includes an `accessToken` field never contains that field in the written payload
- **Pass threshold:** Zero rows without `tenant_id`; zero occurrences of `accessToken` in written `turns` content
- **Tool:** Node `assert`

---

## Out of Scope for This Test Plan

- Reading turns back — covered by dsh-s2's own test plan.
- Archive/rehydrate behaviour — covered by dsh-s5/dsh-s6's own test plans.
- Any Playwright/E2E coverage — this story has no distinct browser-rendering behaviour to confirm beyond what unit/integration tests already prove.

---

## Test Gaps and Risks

None.
