## Test Plan: The four pod browser specs run against a seeded team roster and join the browser suite

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s4-pods-browser-specs-seeded-roster.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-lpw-s4-seed-team-member.js`. The browser specs are run with `npx playwright test <file>` and by the core job.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Seed route creates a member the roster returns, idempotently | - | 3 (T1a to T1c, real test server) | the four specs | - | - | 🟢 |
| AC2 | 404 outside test mode; invalid identity 400, nothing written | 1 (T2a, server source guard) | 2 (T2b, T2c, real test server) | - | - | - | 🟢 |
| AC3 | Four specs seed and select by seeded names, alone and in core order | - | - | 4 specs, run alone and in core order | - | - | 🟡 |
| AC4 | Matrix lanes and guards | 2 (T4a, T4b) | - | - | - | - | 🟢 |
| AC5 | No product code changed | 1 (T5) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| The route's guard outside test mode cannot be exercised by booting a second server in a unit test cheaply | AC2 | Partial | T2a asserts the route's source carries the same inline `NODE_ENV === 'test'` condition as its sibling seed routes; T2b boots the server with `NODE_ENV` unset in a child process |

## Tests

- **T1a (AC1).** Boot the test server (child process, fake db, port from the environment as the other lpw tests do); `POST /test/seed-team-member {identity:'Hamish', role:'member'}` as the e2e session; then `GET /api/team/members` returns an entry with `identity: 'Hamish'` and `role: 'member'`.
- **T1b (AC1).** Seeding two different identities returns both, in insertion order, with their roles.
- **T1c (AC1).** Seeding the same identity twice returns exactly one entry for it.
- **T2a (AC2).** `src/web-ui/server.js` contains the route guarded by `process.env.NODE_ENV === 'test'`, matching the neighbouring seed routes.
- **T2b (AC2).** A server started without `NODE_ENV=test` answers 404 to the route (no member appears).
- **T2c (AC2).** Empty, over-long, and non-login strings (containing spaces, `<`, `/`) are refused 400 and the roster is unchanged.
- **T4a (AC4).** The four spec files are not `quarantined` in `tests/e2e/capability-matrix.json`, carry no `reason`, and at least one pods spec has lane `core`.
- **T4b (AC4).** The existing matrix guards still pass (`check-lpw-s2-*`, `check-lpw-s3-matrix-reason`), run unchanged.
- **T5 (AC5).** `git diff --name-only <base>` contains nothing under `src/web-ui/public/`, `src/web-ui/modules/` or `src/web-ui/routes/`.
- **E2E (AC3).** Each of the four specs passes alone; then the core job passes with a pods spec in it; run twice to show no order dependence.

## Out of scope for this plan

Model sessions, the live-feature rewrites, #1042, any change to the real team-management flow.
