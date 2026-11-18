# dfp-s1 Definition of Done

Date: 2026-11-18. Story: the in-memory test database and real Postgres give the same answers for the users and products queries the browser suite relies on. Pull request #1154 (draft at the time of writing; merge recorded after merge).

## Result: COMPLETE, pending merge of #1154

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (every scenario step gives the same rows, columns, values or error code on both databases) | ✅ | CI run 44249274286 (head `d99337627`): `11 steps, 0 difference(s)`, every step `agrees` | live (CI, real Postgres 16) | none |
| AC2 (generated ids normalised to one placeholder, non-empty required on each side) | ✅ | T2 in `tests/check-dfp-s1-fake-db-differential.js`: `fake-product-3` and a uuid both map to `<id>`; an empty string stays empty | automated | none |
| AC3 (schema copy statements appear in their sources) | ✅ | T3: the committed copy passes against its sources; a planted statement is reported by name | automated | the check compares after whitespace collapse, not verbatim (the story said "verbatim"; the sources are multi-line, so collapse is the only workable comparison) |
| AC4 (local skip prints a reason and exits 0; required-but-missing exits non-zero) | ✅ | T4a and T4b. Local run printed `skipped: DIFF_DATABASE_URL is not set...` and exited 0 | automated | none |
| AC5 (CI job runs the real leg; a divergence fails the job) | ✅ | Red: CI run 44248973216 (head `80d8ccd13`) failed with `11 steps, 2 difference(s)` on a real divergence (below), exit code 1. Green: run 44249274286 after the fix | live (CI) | the red state was a real divergence, not a planted one; no planted run was needed |
| AC6 (each divergence recorded with statement, both results and a decision) | ✅ | Divergence record below | manual | none |

## Divergence record (AC6)

- **Statement:** `SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC` for two products created in the same millisecond.
- **Fake result:** `Alpha` then `Beta` (insertion order on a tie).
- **Postgres result:** `Beta` then `Alpha` (the later insert first, by Postgres's own microsecond timestamp).
- **Decision:** fix now. The fake sorted on a millisecond timestamp and kept insertion order on a tie. It now records an insertion sequence on each product and breaks a tie on it, newest first. This is a four-line change in `src/web-ui/adapters/fake-test-db.js`, larger than the one line the story allowed. It is recorded in the story's `decisions.md`.
- **Regression test:** T6 in `tests/check-dfp-s1-fake-db-differential.js` freezes the clock so two inserts share one millisecond, and fails on the old behaviour (observed red locally, then green).
- **Other tests:** all 20 existing test files that load the fake were run after the change: all exit 0.

## Observations and follow-ups

- **Eleven steps cover users and products only.** The fake supports about ninety query shapes; journeys, session turns, pods, personas and the rest are not compared. Recorded as dfp-s2 in the story's Dependencies.
- **Scenario list is reviewed, not measured** (the story's W5). A coverage measure of statements the browser suite issues would be a separate piece of work.
- **Not required.** The job is not a required check. The operator adds it to the ruleset after it has been green on real pull requests.
- **Schema is copied.** The drift check guards it; the app's own modules are not imported, because importing them re-boots the server.

## Scope Deviations

- AC3 compares after whitespace collapse, not verbatim (see the AC table).
- The fake fix is four lines, not one (see the divergence record).
