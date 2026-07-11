# Wire tenant-level flag targeting via PostHog group analytics — Implementation Plan

> **For agent execution:** Executed directly with /tdd discipline per task in this session (no subagent fan-out — story complexity is rated 2, single-session execution is appropriate per /subagent-execution's fallback note, consistent with bri-s1.1/bri-s1.2).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bri-s1.4`
**Worktree:** `.worktrees/bri-s1.4`
**Test command:** `node tests/check-bri-s1.4-tenant-level-targeting.js` (targeted); full `npm test` chain has the same pre-existing environment caveat documented for bri-s1.1/bri-s1.2 — see Notes.

---

## Scope note (read before Task 1)

S1.3 (Bootstrap flags server-side on session start) is still at `definition-of-ready` — it has not been implemented, so there is no real session-bootstrap call site in `journey.js`/`server.js` to invoke `identifyTenantGroup()` from yet. This plan implements the full group-targeting mechanism (group-key derivation on `isEnabled()`, `identifyTenantGroup()`, session-only `tenantId` sourcing) and the D37 real-adapter wiring (`posthog-config.js`), all fully covered by the test plan's mocked-adapter tests. It does **not** invent a new call site inside a live request handler, because no such handler exists yet for this story to hook into, and no test in the test plan requires one. See `decisions.md` for the DESIGN entry recording this scope decision — S1.3, when implemented, is expected to call `identifyTenantGroup(tenantId)` ahead of its own `isEnabled()` calls during bootstrap, using the functions this story exports.

---

## File map

```
Modify:
  src/web-ui/modules/posthog-flags.js   — derive groups.tenant from context.tenantId (AC1/AC2/AC4);
                                           add identifyTenantGroup() (AC3); add
                                           resolveTenantIdFromRequest() (Security NFR)
  src/web-ui/modules/posthog-config.js  — D37 wiring task: wire a real groupIdentify()
                                           implementation onto the adapter alongside evaluateFlag()
  package.json                          — register the new test file in scripts.test

Create:
  tests/check-bri-s1.4-tenant-level-targeting.js   — AC1-AC4 unit + integration + NFR tests
```

---

## Task 1: Derive `groups.tenant` from `context.tenantId` on every `isEnabled()` call (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/modules/posthog-flags.js`
- Test: `tests/check-bri-s1.4-tenant-level-targeting.js`

- [x] **Step 1: Write the failing tests**

```js
// A1 — AC1: two users, same tenant, identical result (keyed off context.tenantId, existing passthrough)
test('A1: isEnabled(flag, {tenantId:"acme", userId:"user-1"}) === isEnabled(flag, {tenantId:"acme", userId:"user-2"})', async function() {
  var flags = freshFlags();
  flags.setPostHogFlagsAdapter({ evaluateFlag: async function(flagKey, context) { return context.tenantId === 'acme'; } });
  var r1 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-1' });
  var r2 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-2' });
  assert.strictEqual(r1, r2, true);
});

// I1 — AC1 integration: the derived groups.tenant key itself drives the identical result
test('I1: adapter receives groups.tenant === "acme" for both users, regardless of userId', async function() {
  var flags = freshFlags();
  var received = [];
  flags.setPostHogFlagsAdapter({ evaluateFlag: async function(flagKey, context) { received.push(context); return context.groups && context.groups.tenant === 'acme'; } });
  await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-1' });
  await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-2' });
  assert.strictEqual(received[0].groups.tenant, 'acme');
  assert.strictEqual(received[1].groups.tenant, 'acme');
});

// I2 — AC2: flag targeted at tenant-x returns true only for tenant-x
test('I2: isEnabled(flag, {tenantId:"tenant-x"}) === true; isEnabled(flag, {tenantId:"tenant-y"}) === false', async function() {
  var flags = freshFlags();
  flags.setPostHogFlagsAdapter({ evaluateFlag: async function(flagKey, context) { return !!(context.groups && context.groups.tenant === 'tenant-x'); } });
  assert.strictEqual(await flags.isEnabled('some-flag', { tenantId: 'tenant-x' }), true);
  assert.strictEqual(await flags.isEnabled('some-flag', { tenantId: 'tenant-y' }), false);
});

// A3 — AC4: solo-tenant uses the identical code path, no special-casing
test('A3: isEnabled(flag, {tenantId:"solo-tenant-1"}) derives groups.tenant via the same code path', async function() {
  var flags = freshFlags();
  var receivedContext = null;
  flags.setPostHogFlagsAdapter({ evaluateFlag: async function(flagKey, context) { receivedContext = context; return true; } });
  await flags.isEnabled('wizard-ui', { tenantId: 'solo-tenant-1' });
  assert.strictEqual(receivedContext.groups.tenant, 'solo-tenant-1');
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `I1`/`I2`/`A3` fail with `Cannot read properties of undefined (reading 'tenant')` — `context.groups` does not exist yet.

- [x] **Step 3: Write minimal implementation**

```js
function _sanitizeContext(context) {
  if (!context || typeof context !== 'object') return context;
  const safe = {};
  for (const key of Object.keys(context)) {
    if (_TOKEN_KEY_PATTERN.test(key)) continue;
    safe[key] = context[key];
  }
  return _withTenantGroup(safe);
}

function _withTenantGroup(context) {
  if (!context || typeof context !== 'object' || context.tenantId == null) return context;
  if (context.groups && context.groups.tenant != null) return context;
  const groups = Object.assign({}, context.groups, { tenant: context.tenantId });
  return Object.assign({}, context, { groups: groups });
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `A1`, `I1`, `I2`, `A3` all `[PASS]`.

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s1.1-isenabled-helper.js && node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `[bri-s1.1] Results: 7 passed, 0 failed` / `[bri-s1.2] Results: 12 passed, 0 failed`

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/posthog-flags.js tests/check-bri-s1.4-tenant-level-targeting.js
git commit -m "feat(bri-s1.4): derive PostHog group-analytics tenant key from context.tenantId on isEnabled()"
```

---

## Task 2: `identifyTenantGroup()` — group registration that never crashes the caller (AC3)

**Files:**
- Modify: `src/web-ui/modules/posthog-flags.js`
- Test: `tests/check-bri-s1.4-tenant-level-targeting.js`

- [x] **Step 1: Write the failing tests**

```js
// A2 — AC3 unit: groupIdentify rejects on first call; identifyTenantGroup() must not throw, isEnabled() still falls back
test('A2: identifyTenantGroup("acme") swallows a rejecting groupIdentify; isEnabled() resolves false', async function() {
  var flags = freshFlags();
  flags.setPostHogFlagsAdapter({
    groupIdentify: function() { return Promise.reject(new Error('group type "tenant" not yet defined')); },
    evaluateFlag: async function() { throw new Error('group state unknown'); }
  });
  await assert.doesNotReject(function() { return flags.identifyTenantGroup('acme'); });
  assert.strictEqual(await flags.isEnabled('wizard-ui', { tenantId: 'acme' }), false);
});

// I3 — AC3 integration: delayed first-time group registration doesn't block a bootstrap-equivalent sequence
test('I3: identifyTenantGroup() then isEnabled() completes promptly for a brand-new tenant with delayed group registration', async function() {
  var flags = freshFlags();
  flags.setPostHogFlagsAdapter({
    groupIdentify: function() { return new Promise(function(resolve, reject) { setTimeout(function() { reject(new Error('registration timed out')); }, 30); }); },
    evaluateFlag: async function() { return false; }
  });
  var start = Date.now();
  await flags.identifyTenantGroup('new-tenant-1');
  var result = await flags.isEnabled('wizard-ui', { tenantId: 'new-tenant-1' });
  assert.strictEqual(result, false);
  assert.ok(Date.now() - start < 1000);
});

// A4 — D37: identifyTenantGroup() inherits isEnabled()'s stub-throw when unwired (no second mechanism)
test('A4: unwired identifyTenantGroup() rejects with the exact same D37 message as isEnabled()', async function() {
  var flags = freshFlags();
  await assert.rejects(function() { return flags.identifyTenantGroup('acme'); }, function(err) {
    assert.strictEqual(err.message, 'Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.');
    return true;
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `TypeError: flags.identifyTenantGroup is not a function`

- [x] **Step 3: Write minimal implementation**

```js
async function identifyTenantGroup(tenantId) {
  const adapter = _requireAdapter(); // D37 — inherited stub-throw when unwired, same as isEnabled()
  if (typeof adapter.groupIdentify !== 'function') return;
  try {
    await adapter.groupIdentify('tenant', tenantId);
  } catch (err) {
    // AC3 — must never crash the caller
  }
}

module.exports = { setPostHogFlagsAdapter, isEnabled, identifyTenantGroup, resolveTenantIdFromRequest };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `A2`, `I3`, `A4` all `[PASS]`.

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s1.1-isenabled-helper.js
```

Expected output: `[bri-s1.1] Results: 7 passed, 0 failed`

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/posthog-flags.js
git commit -m "feat(bri-s1.4): add identifyTenantGroup() -- group registration that never crashes the caller"
```

---

## Task 3: `resolveTenantIdFromRequest()` — session-only tenantId sourcing (Security NFR)

**Files:**
- Modify: `src/web-ui/modules/posthog-flags.js`
- Test: `tests/check-bri-s1.4-tenant-level-targeting.js`

- [x] **Step 1: Write the failing test**

```js
// N1 — Security NFR: tenantId for group targeting is read only from req.session.tenantId
test('N1: resolveTenantIdFromRequest() returns the session value; body/query are never even read', function() {
  var flags = freshFlags();
  var poisonedBody = new Proxy({}, { get: function() { throw new Error('req.body must never be read'); } });
  var poisonedQuery = new Proxy({}, { get: function() { throw new Error('req.query must never be read'); } });
  var fakeReq = { session: { tenantId: 'acme' }, body: poisonedBody, query: poisonedQuery };
  assert.strictEqual(flags.resolveTenantIdFromRequest(fakeReq), 'acme');
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `TypeError: flags.resolveTenantIdFromRequest is not a function`

- [x] **Step 3: Write minimal implementation**

```js
function resolveTenantIdFromRequest(req) {
  return (req && req.session && req.session.tenantId) || null;
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `N1` `[PASS]`

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s1.1-isenabled-helper.js
```

Expected output: `[bri-s1.1] Results: 7 passed, 0 failed`

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/posthog-flags.js
git commit -m "feat(bri-s1.4): add resolveTenantIdFromRequest() -- session-only tenantId sourcing"
```

---

## Task 4: Performance NFR — group identification overhead budget

**Files:**
- Test only: `tests/check-bri-s1.4-tenant-level-targeting.js` (no implementation change — Task 2's `identifyTenantGroup()` already satisfies this; this task adds the measurement test)

- [x] **Step 1: Write the test**

```js
// N2 — Performance NFR: group identification adds no more than 100ms over adapter latency
test('N2: identifyTenantGroup() total duration is within simulated adapter latency + 100ms budget', async function() {
  var flags = freshFlags();
  var simulatedLatencyMs = 30;
  flags.setPostHogFlagsAdapter({ groupIdentify: function() { return new Promise(function(resolve) { setTimeout(resolve, simulatedLatencyMs); }); } });
  var start = Date.now();
  await flags.identifyTenantGroup('acme');
  assert.ok(Date.now() - start <= simulatedLatencyMs + 100);
});
```

- [x] **Step 2: Run — must pass immediately** (Task 2's implementation already satisfies this budget; no new code)

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `N2` `[PASS]`

- [x] **Step 3: Commit**

```bash
git add tests/check-bri-s1.4-tenant-level-targeting.js
git commit -m "test(bri-s1.4): add performance NFR test for identifyTenantGroup() overhead budget"
```

---

## Task 5: D37 wiring — real `groupIdentify()` implementation in `posthog-config.js` (distinct from Task 1-4's core logic)

**Files:**
- Modify: `src/web-ui/modules/posthog-config.js`
- Test: `tests/check-bri-s1.4-tenant-level-targeting.js`

- [x] **Step 1: Write the failing tests**

```js
// I4 — the real startup wiring exposes groupIdentify alongside evaluateFlag
test('I4: setPostHogFlagsAdapter is called with a groupIdentify function alongside evaluateFlag', function() {
  var cfg = freshConfig();
  var setAdapterCalls = [];
  function FakePostHogCtor() {}
  var result = cfg.initPostHogFlagsClient('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging' }, {
    PostHogClient: FakePostHogCtor,
    setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
    logger: { info: function() {}, error: function() {} }
  });
  assert.strictEqual(result.wired, true);
  assert.strictEqual(typeof setAdapterCalls[0].groupIdentify, 'function');
});

// I5 — the wired groupIdentify() calls the real client's groupIdentifyImmediate() with the right args
test('I5: adapter.groupIdentify("tenant", "acme") invokes client.groupIdentifyImmediate({groupType:"tenant", groupKey:"acme"})', async function() {
  var cfg = freshConfig();
  var groupIdentifyCalls = [];
  function FakePostHogCtor() {
    this.groupIdentifyImmediate = function(args) { groupIdentifyCalls.push(args); return Promise.resolve(); };
    this.isFeatureEnabled = function() { return Promise.resolve(true); };
  }
  var setAdapterCalls = [];
  cfg.initPostHogFlagsClient('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging' }, {
    PostHogClient: FakePostHogCtor,
    setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
    logger: { info: function() {}, error: function() {} }
  });
  await setAdapterCalls[0].groupIdentify('tenant', 'acme');
  assert.strictEqual(groupIdentifyCalls[0].groupType, 'tenant');
  assert.strictEqual(groupIdentifyCalls[0].groupKey, 'acme');
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: `I4` fails — `setAdapterCalls[0].groupIdentify` is `undefined`.

- [x] **Step 3: Write minimal implementation**

```js
setAdapter({
  evaluateFlag: function(flagKey, context) {
    var distinctId = (context && context.tenantId) || 'anonymous';
    return client.isFeatureEnabled(flagKey, distinctId, { groups: context && context.groups });
  },
  groupIdentify: function(groupType, groupKey) {
    return client.groupIdentifyImmediate({ groupType: groupType, groupKey: groupKey });
  }
});
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.4-tenant-level-targeting.js
```

Expected output: all 11 tests `[PASS]`, `[bri-s1.4] Results: 11 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s1.1-isenabled-helper.js && node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `7 passed, 0 failed` / `12 passed, 0 failed`

- [x] **Step 6: Register test file + commit**

```bash
# package.json: append "&& node tests/check-bri-s1.4-tenant-level-targeting.js" to scripts.test
git add src/web-ui/modules/posthog-config.js package.json
git commit -m "feat(bri-s1.4): wire real groupIdentify() into posthog-config.js startup (D37 wiring task)"
```

---

## Notes

- Full `npm test` chain: same pre-existing Windows `cmd.exe` command-line length limit and missing `.github/skills/definition/SKILL.md` baseline gap already RISK-ACCEPTed for bri-s1.1/bri-s1.2/bri-s2.2 in `decisions.md` — not re-investigated or re-logged here. Verification for this story runs the targeted test file plus a full command-by-command sweep of the chain (bypassing `cmd.exe`) to confirm no *new* failures beyond the documented baseline.
