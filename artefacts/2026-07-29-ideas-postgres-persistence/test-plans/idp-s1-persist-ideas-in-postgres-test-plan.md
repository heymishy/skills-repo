## Test Plan: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file

**Story reference:** artefacts/2026-07-29-ideas-postgres-persistence/stories/idp-s1-persist-ideas-in-postgres.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Idea creation writes to Postgres when DATABASE_URL set | 2 | 1 | — | — | — | 🟢 |
| AC2 | Idea survives a process restart (real durability) | — | 1 | — | — | — | 🟢 |
| AC3 | Delete removes the row from Postgres | 1 | 1 | — | — | — | 🟢 |
| AC4 | No-DB case behaviour byte-for-byte unchanged | 3 | — | — | — | — | 🟢 |
| AC5 | Wired handler round-trips two distinct real ideas correctly | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None — all 5 ACs are fully unit/integration testable. AC2 (real durability across a process restart) is verified via a real Postgres integration test (create via one pool connection, then read back via a freshly-created second pool connection, simulating what a server restart would see) rather than an actual process kill/restart, consistent with this repo's established testing conventions for durability claims.

---

## Test Data Strategy

**Source:** Fake pool doubles for unit tests (matching `journey-store-pg.js`'s own testing convention); real `wuce-staging` Postgres for integration tests (this repo's established pattern for durability claims — see `check-dfr-s1-fix-delete-feature-redirect.js`'s AC2 integration test for precedent).
**PCI/sensitivity in scope:** No.
**Availability:** Real Postgres available via `wuce-staging`'s `DATABASE_URL` (retrieved via the established safe `flyctl ssh console` pattern, never persisted).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake pool double asserting the real SQL text and params | Fixture | None | |
| AC2 | Real Postgres — create via one pool, read via a second pool instance | Real DB | None | |
| AC3 | Fake pool double + real Postgres round-trip | Fixture + Real DB | None | |
| AC4 | Temp directory with its own `workspace/ideas.json`-equivalent fixture | Fixture | None | |
| AC5 | Real Postgres — two distinct ideas created and listed back | Real DB | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — createIdea(pool, fields) issues the correct INSERT and returns the created row (AC1)

- **Verifies:** AC1
- **Precondition:** Fake pool double capturing the SQL/params passed to `query()`
- **Action:** Call `ideas-store-pg.js`'s `createIdea(fakePool, { title: 'Test idea', notes: 'Some notes' })`
- **Expected result:** The captured SQL text contains `INSERT INTO ideas`; the returned object has `id`, `title`, `notes`, `createdAt`
- **Edge case:** No

### U2 — listIdeas(pool) issues a SELECT and returns all rows (AC1)

- **Verifies:** AC1
- **Precondition:** Fake pool double returning 2 fixture rows
- **Action:** Call `listIdeas(fakePool)`
- **Expected result:** Returns both rows, correctly shaped (`{ ideas: [...] }` matching the existing `_readIdeas()` return shape for handler compatibility)
- **Edge case:** No

### U3 — deleteIdea(pool, id) issues a DELETE scoped to the given id (AC3)

- **Verifies:** AC3
- **Precondition:** Fake pool double
- **Action:** Call `deleteIdea(fakePool, 'idea-123')`
- **Expected result:** Captured SQL contains `DELETE FROM ideas` and the id is passed as a parameter (not string-interpolated — SQL injection guard)
- **Edge case:** Yes

### U4 — no-DB case: handlePostIdea still writes to workspace/ideas.json unchanged (AC4)

- **Verifies:** AC4
- **Precondition:** `setIdeasStore()` not called (default adapter active); a temp `ideas.json`-equivalent fixture path
- **Action:** Call the real `handlePostIdea` via a request-like fixture (matching this repo's existing route-handler test convention)
- **Expected result:** A new idea appears in the file-based store, response shape unchanged from before this story
- **Edge case:** No

### U5 — no-DB case: handleGetIdeas still reads workspace/ideas.json unchanged (AC4)

- **Verifies:** AC4
- **Precondition:** Same as U4
- **Action:** Call `handleGetIdeas`
- **Expected result:** Response body is byte-for-byte the same shape as before this story (`{ ideas: [...] }`)
- **Edge case:** Yes

### U6 — no-DB case: handleDeleteIdea still removes from workspace/ideas.json unchanged (AC4)

- **Verifies:** AC4
- **Precondition:** Same as U4, with an existing idea in the file
- **Action:** Call `handleDeleteIdea`
- **Expected result:** The idea is removed from the file; 404 returned for an unknown id, matching existing behaviour exactly
- **Edge case:** Yes

---

## Integration Tests

### IT1 — real Postgres round-trip: create then list (AC1)

- **Verifies:** AC1
- **Components involved:** `ideas-store-pg.js`, real `wuce-staging` Postgres
- **Precondition:** Real `DATABASE_URL` retrieved via the established safe-credential pattern
- **Action:** `createIdea(pool, {...})`, then `listIdeas(pool)`
- **Expected result:** The created idea appears in the list with matching `title`/`notes`; cleanup deletes the row afterward

### IT2 — real durability across a fresh pool instance, simulating a restart (AC2)

- **Verifies:** AC2
- **Components involved:** `ideas-store-pg.js`, real Postgres, two separate `Pool` instances
- **Precondition:** Real `DATABASE_URL`
- **Action:** Create an idea via pool instance A; close pool A; open a fresh pool instance B (simulating a new server process); call `listIdeas(poolB)`
- **Expected result:** The idea created via pool A is visible via pool B — proving real cross-connection, cross-process-equivalent durability, not just in-memory caching within one pool instance

### IT3 — real Postgres delete round-trip (AC3)

- **Verifies:** AC3
- **Components involved:** `ideas-store-pg.js`, real Postgres
- **Precondition:** An idea created via IT1's real pool
- **Action:** `deleteIdea(pool, id)`, then `listIdeas(pool)`
- **Expected result:** The deleted idea no longer appears

### IT4 — wired handler round-trips two distinct real ideas correctly (AC5, D37 wiring correctness)

- **Verifies:** AC5
- **Components involved:** `routes/features.js`'s real `handlePostIdea`/`handleGetIdeas`, `setIdeasStore()` wired to the real Postgres-backed implementation, real Postgres
- **Precondition:** `setIdeasStore()` called with the real production wiring (mirroring what `server.js` does at startup)
- **Action:** Call the real `handlePostIdea` twice with two different titles ("Idea A", "Idea B"), then call the real `handleGetIdeas`
- **Expected result:** Both "Idea A" and "Idea B" are present and individually correct in the response — not just "some function got assigned," per D37's mandatory point 4 (assert an observable, differentiating outcome, not merely that wiring occurred)

---

## NFR Tests

None beyond the story's own stated NFRs — no new NFR-specific test needed.

---

## Out of Scope for This Test Plan

- Load/performance testing — NFR states performance impact is negligible; no SLA to test against.
- Testing an actual `flyctl deploy`/container restart — IT2's fresh-pool-instance approach is the established, precedented way this repo verifies durability claims without a real infrastructure event (see `dfr-s1`'s own AC2 integration test for the same pattern).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot prove an idea survives an actual `flyctl deploy` in an automated test | Would require a real deploy cycle inside a test run | IT2's fresh-pool-instance test is the established proxy for this claim (same approach used by `dfr-s1`'s own durability test); real confirmation is the absence of a repeat data-loss report going forward |
