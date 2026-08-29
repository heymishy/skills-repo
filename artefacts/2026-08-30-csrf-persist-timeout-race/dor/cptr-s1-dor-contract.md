# Contract Proposal: Increase the session-persist timeout to close the suspend race

**Story reference:** artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- In `src/web-ui/middleware/session.js`: change `const _PERSIST_TIMEOUT_MS = 500;` to `const _PERSIST_TIMEOUT_MS = 8000;`, and update the surrounding comment to reflect its corrected purpose — a last-resort circuit breaker for a genuinely broken/hung Redis, not a routine race target (since a `SIGTERM`-based approach was found to be a no-op under `fly.toml`'s `auto_stop_machines = 'suspend'` configuration — see decisions.md).
- In `tests/check-cpr-s1-csrf-persist-race.js`: update the existing `AC4b` test's bound assertion (`elapsedMs < 2000`) to a bound consistent with the new 8000ms cap (e.g. `elapsedMs < 9000`) — a declared, necessary consequence of this fix, not a silently-discovered regression.
- Add one new test proving the actual race this story closes: a write with an injected delay between the old (500ms) and new (8000ms) bounds resolves via the real write, not a timeout.

## What will NOT be built

- No `SIGTERM` handler, no pending-writes registry, no change to `server.js` — the previously-planned approach for this story, abandoned before implementation after confirming Fly's `'suspend'` mode never sends `SIGTERM` (see decisions.md, superseding entry).
- No change to `fly.toml`.
- No change to `csrfGuard`'s validation logic.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 2000ms injected delay; assert `persistSession` resolves via the real write, data present in store | Unit |
| AC2 | Already covered by `cpr-s1`'s existing `AC3` test — re-run only | Integration (existing) |
| AC3 | Already covered by `cpr-s1`'s existing `AC4a` test — re-run only | Integration (existing) |
| AC4 | Hung write; assert bounded resolution consistent with the new 8000ms cap (updated `AC4b` test) | Unit |
| AC5 | Full existing suite re-run, including the one updated assertion | Integration (existing) |

## Assumptions

- 8000ms is chosen as the new bound: generous enough to cover realistic real-world Upstash latency spikes (well above any normal p99), while remaining a genuinely bounded circuit breaker rather than an unbounded wait. If real-world data later shows writes routinely approaching this bound under non-degraded conditions, the value should be revisited (see decisions.md revisit trigger) — not silently raised further without evidence.

## Estimated touch points

Files: `src/web-ui/middleware/session.js` (one constant + comment), `tests/check-cpr-s1-csrf-persist-race.js` (one assertion updated, one new test added). Services: none. APIs: none.
