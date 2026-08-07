# Test Plan: Archive turns older than 60 days out of the hot table

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Old rows moved to archive, deleted from hot | 1 | — | — | — | — | 🟢 |
| AC2 | Recent rows untouched | 1 | — | — | — | — | 🟢 |
| AC3 | Job exits cleanly, no persistent process | 1 | — | — | — | — | 🟢 |
| AC4 | Per-row error doesn't abort the batch | 1 | — | — | — | — | 🟢 |
| AC5 | Zero-eligible-rows run completes cleanly | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — an in-memory fake db with rows at varying `created_at` ages, matching `check-alrf-s11-purge-e2e-tenants.js`'s `makeFakeDb` pattern.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 | A fake db row with `created_at` > 60 days ago | Inline fixture | None | |
| AC2 | A fake db row with `created_at` < 60 days ago | Inline fixture | None | |
| AC3 | The CLI entrypoint invoked as a child process (matching `purge-e2e-tenants.js`'s own test pattern) | Inline test using `execFileSync` | None | |
| AC4 | A fake db where one specific row's move throws | Inline fixture | None | |
| AC5 | An empty fake db | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Rows older than 60 days move to the archive table and are removed from the hot table

- **Verifies:** AC1
- **Precondition:** A `session_turns` row exists with `created_at` 61 days in the past
- **Action:** Run the archive job
- **Expected result:** That row now exists in `session_turns_archive` with identical content, and no longer exists in `session_turns`
- **Edge case:** No

### Rows within 60 days remain untouched

- **Verifies:** AC2
- **Precondition:** A `session_turns` row exists with `created_at` 30 days in the past
- **Action:** Run the archive job
- **Expected result:** That row still exists in `session_turns`, unchanged; nothing added to `session_turns_archive` for it
- **Edge case:** No

### Job exits cleanly — no process remains running after completion

- **Verifies:** AC3
- **Precondition:** None
- **Action:** Spawn the CLI entrypoint as a child process (`execFileSync`, matching `check-alrf-s11-purge-e2e-tenants.js`'s existing pattern for `purge-e2e-tenants.js`'s own CLI tests)
- **Expected result:** The child process exits with code 0 and does not hang; no lingering process remains after the script returns
- **Edge case:** No

### A single row's archival failure doesn't abort the rest of the batch

- **Verifies:** AC4
- **Precondition:** A fake db configured so one specific row's insert-into-archive call throws
- **Action:** Run the archive job with multiple eligible rows, one of which is the failing one
- **Expected result:** The failure is logged; all other eligible rows are still archived successfully
- **Edge case:** Yes

### Zero eligible rows completes successfully with a clear log message

- **Verifies:** AC5
- **Precondition:** No rows in the fake db are older than 60 days
- **Action:** Run the archive job
- **Expected result:** Completes with exit code 0 and logs "0 rows archived" (or equivalent) — not a silent no-op, not an error
- **Edge case:** Yes

---

## Integration Tests

None beyond the unit tests above — this story's CLI-entrypoint shape and non-fatal error handling directly mirror `purge-e2e-tenants.js`, already proven correct at the integration level for that script; no new integration seam is introduced.

---

## NFR Tests

None — confirmed with story owner. Performance (batching, lock avoidance) is addressed structurally in the story's own NFR section but has no separate numeric threshold to test beyond "completes within its scheduled window," which is observed operationally (CI job duration), not unit-tested.

---

## Out of Scope for This Test Plan

- Rehydration of archived rows — dsh-s6's own test plan covers reading from the archive table this story creates.
- Any Playwright/E2E coverage — this is a backend-only scheduled job with no UI surface.

---

## Test Gaps and Risks

None.
