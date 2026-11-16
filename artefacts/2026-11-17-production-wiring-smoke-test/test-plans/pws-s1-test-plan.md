## Test Plan: A production-wiring smoke test in the unit chain that fails when an adapter is unwired or a route answers a hostile request with a 5xx

**Story reference:** artefacts/2026-11-17-production-wiring-smoke-test/stories/pws-s1-production-wiring-smoke-test.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New files: `tests/check-pws-s1-production-wiring-smoke.js` (the assertions), `tests/helpers/pws-boot-probe.js` (the child process that boots `server.js`, records setter calls and runs the requests, printing one JSON line), and `scripts/check-production-wiring.js` (the pure comparison functions, so AC5's negative control can call them with made-up input).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Every stub's setter is called at boot or allow-listed | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | A stale allow-list entry fails | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Skill-session routes answer 404/410 for an unknown session | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | No 5xx for any route pattern x hostile value x GET/POST | - | 1 (T4) | - | - | - | 🟡 |
| AC5 | Negative control: an unwired, un-allow-listed stub is reported | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | In the unit chain, under 60 s, leaves the repo clean | - | 1 (T6) | - | - | - | 🟢 |

## Coverage gaps
None. AC4 is rated 🟡 because its first real run may find genuine 5xx answers that need a decision (fix or allow-list with a follow-up story).

## Tests (new file `tests/check-pws-s1-production-wiring-smoke.js`)

- **T1 (AC1).** Run the boot probe once (child process, `NODE_ENV=test`, `WIRE_SKILL_ADAPTERS=true`). `scanStubSetters` over the two source files returns the stub setter names; `findUnwired(stubs, called, allow)` returns an empty list. Red first: with the allow-list empty, the run reports the deliberately-unwired adapters (`setSubmitAnswer`, `setNextQuestionExecutor`, `setSectionDraftExecutor` and whatever else the first run finds), proving the check sees real stubs.
- **T2 (AC2).** `findUnwired` with an allow-list entry for a setter that is in `called`, and one for a name no stub uses, returns two stale-entry findings. The real allow-list produces none.
- **T3 (AC3).** From the probe result: for `state`, `next question`, `commit` page, `commit/result`, `resume` and `/answer` with an unknown session id, status is 404 or 410, and no body contains `Adapter not wired`.
- **T4 (AC4).** From the probe result: pattern count at least 60; every (pattern, value, method) answer is below 500; the failure message lists the first few offending requests.
- **T5 (AC5).** `findUnwired` on made-up input `{stubs: ['setGetCommitResult', 'setX'], called: ['setX'], allow: {}}` reports exactly `setGetCommitResult`. This is the original scr-s1 defect shape.
- **T6 (AC6).** The file is picked up by `scripts/run-all-tests.js` discovery; the probe finishes in under 60 s (timed); `git status --short` and `HEAD` are unchanged around the run.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Wiring only under real production env | `NODE_ENV=test` skips those blocks | Stated in the story; the route sweep and behaviour probes still run against the real route table |
| The boot probe could differ from production wiring order | Test mode also wires some stubs | The probe records setter calls, not values; the behaviour probes (T3) assert real answers |

**Total automated tests:** 6 (T1 to T6).
