# Technical Test Plan: pla-s1 — Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support

**Story reference:** artefacts/2026-07-04-posthog-llm-analytics/stories/pla-s1.md
**Review:** PASS — artefacts/2026-07-04-posthog-llm-analytics/review/pla-s1-review-1.md (0 HIGH, 1 MEDIUM)
**Date:** 2026-07-04
**Test runner:** `node tests/check-pla-s1-posthog-module.js` (added to `npm test` script in package.json)
**Framework:** Vanilla Node.js `assert` module, custom `test()` harness (same pattern as all other check scripts in this repo)

---

## Test Data Strategy

**Strategy:** Synthetic — all HTTP calls intercepted at the Node.js require cache level; no real PostHog network calls are made in any test. `process.env.POSTHOG_KEY` is set to a synthetic value `'test-key-pla-s1'` for tests that require a key; explicitly unset (`delete process.env.POSTHOG_KEY`) for no-op tests (AC7). `process.env.POSTHOG_PRIVACY_MODE` is controlled per test group.

**Test data is:** Self-contained — tests generate their own data in setup/teardown.

**Sensitive data:** None. No PCI scope, no real credentials, no real user data. The synthetic key value `'test-key-pla-s1'` has no meaning outside the test.

**Mocking approach:** The `https` module is intercepted via require cache injection before each test group that requires it. Pattern:

```js
var capturedRequests = [];
require.cache[require.resolve('https')] = {
  id: require.resolve('https'), filename: require.resolve('https'), loaded: true,
  exports: {
    request: function(_opts, _cb) {
      var chunks = [];
      var fakeReq = {
        on: function(ev, fn) { if (ev === 'error') fakeReq._errFn = fn; return fakeReq; },
        write: function(data) { chunks.push(data); },
        end: function() { capturedRequests.push(JSON.parse(chunks.join(''))); }
      };
      return fakeReq;
    }
  }
};
```

After injecting the https mock, fresh-require `posthog-server.js` to pick up the mock:

```js
function freshRequirePosthog() {
  delete require.cache[require.resolve('../src/web-ui/modules/posthog-server')];
  return require('../src/web-ui/modules/posthog-server');
}
```

Reset `capturedRequests = []` at the start of each test case.

---

## AC Coverage Table

| AC | Description | Test type | Tests |
|----|-------------|-----------|-------|
| AC1 | identify() → HTTP POST with $identify event and $set | Unit | A1, A2 |
| AC2 | groupIdentify() → HTTP POST with $groupidentify event and group fields | Unit | B1, B2 |
| AC3 | captureException() → HTTP POST with $exception event, stack trace, extra props | Unit | C1, C2, C3 |
| AC4 | capture() with groups param → body includes $groups | Unit | D1 |
| AC5 | capture() without groups param → no $groups in body | Unit | E1 |
| AC6 | POSTHOG_PRIVACY_MODE='true' → PRIVACY_MODE constant is truthy | Unit | F1, F2 |
| AC7 | POSTHOG_KEY absent → all 4 methods no-op silently | Unit | G1, G2, G3, G4 |
| NFR-PERF | Fire-and-forget: https error does not throw to caller | NFR | N1 |
| NFR-SEC | POSTHOG_KEY not present in any log output on error | NFR | N2 |
| NFR-COMPAT | Existing 3-arg capture() callers unaffected by 4th groups param | NFR | Covered by E1 |

---

## Unit Tests

### Group A — identify() (AC1)

**A1 — identify sends HTTP POST to correct endpoint**
- **Given:** `process.env.POSTHOG_KEY = 'test-key-pla-s1'`; https mock installed; posthog-server.js fresh-required
- **When:** `posthog.identify('alice', { $set: { login: 'alice', tenantId: 'acme', role: 'admin' } })` is called
- **Then:** `capturedRequests` has exactly 1 entry; the parsed body has `api_key: 'test-key-pla-s1'`; `distinct_id: 'alice'`; `event: '$identify'`
- **Edge case:** None

**A2 — identify body has correct $set payload**
- **Given:** Same as A1
- **When:** identify is called with `{ $set: { login: 'alice', tenantId: 'acme', role: 'admin' } }`
- **Then:** `capturedRequests[0].properties.$set` deep-equals `{ login: 'alice', tenantId: 'acme', role: 'admin' }`
- **Edge case:** None

---

### Group B — groupIdentify() (AC2)

**B1 — groupIdentify sends $groupidentify event**
- **Given:** `POSTHOG_KEY` set; https mock installed; fresh posthog-server.js
- **When:** `posthog.groupIdentify('company', 'acme', { name: 'acme' })` is called
- **Then:** `capturedRequests[0].event === '$groupidentify'`
- **Edge case:** None

**B2 — groupIdentify body has correct group fields**
- **Given:** Same as B1
- **When:** `posthog.groupIdentify('company', 'acme', { name: 'acme' })` is called
- **Then:** `capturedRequests[0].properties.$group_type === 'company'`; `properties.$group_key === 'acme'`; `properties.$group_set` deep-equals `{ name: 'acme' }`
- **Edge case:** None

---

### Group C — captureException() (AC3)

**C1 — captureException sends $exception event**
- **Given:** `POSTHOG_KEY` set; https mock; fresh posthog-server.js; `var err = new Error('test error')`
- **When:** `posthog.captureException(err, 'alice', { skillName: 'discovery' })` is called
- **Then:** `capturedRequests[0].event === '$exception'`; `distinct_id === 'alice'`
- **Edge case:** None

**C2 — captureException body has correct exception shape**
- **Given:** Same as C1
- **When:** `captureException` is called with `new Error('test error')`
- **Then:** `properties.$exception_type === 'Error'`; `properties.$exception_message === 'test error'`; `typeof properties.$exception_stack_trace_raw === 'string'`; `$exception_stack_trace_raw` includes `'Error: test error'`
- **Edge case:** Verify stack string is non-empty

**C3 — captureException merges additional properties**
- **Given:** Same as C1; additional props `{ skillName: 'discovery', sessionId: 'sess-1' }`
- **When:** `captureException` is called with the additional props object
- **Then:** `capturedRequests[0].properties.skillName === 'discovery'`; `properties.sessionId === 'sess-1'`
- **Edge case:** Additional props do not overwrite `$exception_type` or `$exception_message`

---

### Group D — capture() with groups (AC4)

**D1 — capture with groups param includes $groups in body**
- **Given:** `POSTHOG_KEY` set; https mock; fresh posthog-server.js
- **When:** `posthog.capture('alice', 'stage_completed', { costUsd: 0.05 }, { company: 'acme' })` is called with the 4th groups argument
- **Then:** `capturedRequests[0].properties.$groups` deep-equals `{ company: 'acme' }`
- **Edge case:** The original `properties` object passed in is not mutated (check `{ costUsd: 0.05 }` still has no `$groups` key)

---

### Group E — capture() backward compatibility (AC5)

**E1 — capture without groups param produces no $groups key**
- **Given:** `POSTHOG_KEY` set; https mock; fresh posthog-server.js
- **When:** `posthog.capture('alice', 'stage_completed', { costUsd: 0.05 })` is called with 3 arguments only
- **Then:** `'$groups' in capturedRequests[0].properties === false`
- **Edge case:** None — this is the backward-compat guard; a failure here would be a regression

---

### Group F — PRIVACY_MODE constant (AC6)

**F1 — PRIVACY_MODE is truthy when env var is 'true'**
- **Given:** `process.env.POSTHOG_PRIVACY_MODE = 'true'`; https mock; fresh posthog-server.js
- **When:** the module is required
- **Then:** `posthog.PRIVACY_MODE` is truthy (boolean `true` or string `'true'` — either passes as truthy)
- **Edge case:** None

**F2 — PRIVACY_MODE is falsy when env var is absent**
- **Given:** `delete process.env.POSTHOG_PRIVACY_MODE`; fresh posthog-server.js
- **When:** the module is required
- **Then:** `!posthog.PRIVACY_MODE` is truthy (PRIVACY_MODE is falsy)
- **Edge case:** Check POSTHOG_PRIVACY_MODE='false' also produces a falsy value

---

### Group G — no-op when POSTHOG_KEY absent (AC7)

**G1 — identify no-ops silently when key absent**
- **Given:** `delete process.env.POSTHOG_KEY`; https mock; fresh posthog-server.js
- **When:** `posthog.identify('alice', { $set: { login: 'alice', tenantId: 'acme', role: 'admin' } })` is called
- **Then:** `capturedRequests.length === 0`; no exception is thrown
- **Edge case:** None

**G2 — groupIdentify no-ops silently when key absent**
- **Given:** `delete process.env.POSTHOG_KEY`; https mock; fresh posthog-server.js
- **When:** `posthog.groupIdentify('company', 'acme', { name: 'acme' })` is called
- **Then:** `capturedRequests.length === 0`; no exception is thrown

**G3 — captureException no-ops silently when key absent**
- **Given:** `delete process.env.POSTHOG_KEY`; https mock; fresh posthog-server.js
- **When:** `posthog.captureException(new Error('err'), 'alice', {})` is called
- **Then:** `capturedRequests.length === 0`; no exception is thrown

**G4 — existing capture() no-ops silently when key absent (existing behavior preserved)**
- **Given:** `delete process.env.POSTHOG_KEY`; https mock; fresh posthog-server.js
- **When:** `posthog.capture('alice', 'stage_completed', {})` is called
- **Then:** `capturedRequests.length === 0`; no exception is thrown

---

## Integration Tests

None. `posthog-server.js` is a self-contained utility module with no integration seams. All behaviour is verifiable via unit tests at the module level.

---

## NFR Tests

**N1 — Fire-and-forget: https error does not propagate (NFR-PERF)**
- **Given:** https mock where `fakeReq.end()` calls `fakeReq._errFn(new Error('connection refused'))` after capture, simulating an https error event
- **When:** `posthog.capture('alice', 'test_event', {})` is called
- **Then:** No exception is thrown to the caller; execution continues normally
- **NFR scope:** Performance / reliability — confirms fire-and-forget. No functional assertions (AC-level assertions belong in Group D/E).

**N2 — POSTHOG_KEY value does not appear in any pino log output on error (NFR-SEC)**
- **Given:** `POSTHOG_KEY = 'super-secret-key'`; a mock pino logger injected (if posthog-server.js uses pino for `warn` on error); https mock that fires the error event; fresh posthog-server.js
- **When:** `posthog.capture('alice', 'test_event', {})` is called and the https error fires
- **Then:** No captured log message string contains `'super-secret-key'`
- **NFR scope:** Security — confirms credential is not logged. If posthog-server.js does not import pino, this test confirms no log calls at all occur from the module (trivially passes, still required as a guard against future additions).

---

## Gap Table

No gaps. All ACs are testable at the unit level. No browser layout dependency. No test data dependency on external systems.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit | 14 |
| Integration | 0 |
| NFR | 2 |
| **Total** | **16** |

---

## Test file location

`tests/check-pla-s1-posthog-module.js` — to be created by the coding agent.
Add to `npm test` in `package.json`: append `&& node tests/check-pla-s1-posthog-module.js` to the test chain.
