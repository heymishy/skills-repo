# Bootstrap flags server-side on session start to avoid UI flicker — Implementation Plan

> **For agent execution:** Executed directly with /tdd discipline per task in this session (no subagent fan-out — story complexity is rated 2, single-session execution is appropriate, consistent with the bri-s1.2 precedent in this same feature).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bri-s1.3`
**Worktree:** `.worktrees/bri-s1.3`
**Test command:** `node tests/check-bri-s1.3-server-side-bootstrap.js` (targeted); full `npm test` chain has a pre-existing, already-logged environment caveat (Windows `cmd.exe` command-line length limit + `tests/check-definition-skill.js` missing-SKILL.md failure) — see Notes.

---

## File map

```
Create:
  src/web-ui/modules/flag-bootstrap.js              — bootstrapFlags(req, deps): resolves relevant flags once per
                                                        session via S1.1's isEnabled(), caches onto req.session.flags,
                                                        applies its own internal timeout so a slow/hanging PostHog
                                                        call can never block session start beyond budget (AC1, AC2, AC3)
  tests/check-bri-s1.3-server-side-bootstrap.js     — AC1-AC4 unit + integration + NFR tests

Modify:
  src/web-ui/routes/journey.js   — handleGetWizard's default (Step 1) view renders a gated
                                    <div id="wizard-canvas-gated" data-flag="wizard-ui"> marker only when
                                    req.session.flags['wizard-ui'] === true (server-omitted otherwise); adds a
                                    new exported async handleGetWizardBootstrapped(req, res) that awaits
                                    bootstrapFlags(req) then delegates to the existing synchronous handleGetWizard —
                                    this preserves every existing caller of the synchronous handleGetWizard
                                    (check-wucp4-session-wizard.js, check-pmf3-orientation-wizard.js) unchanged,
                                    since neither test populates req.session.flags today and the gate defaults to
                                    "absent" (safe default) when unset.
  package.json                    — register the new test file in scripts.test (append at end of chain)
```

**Design note (ambiguity handled per DoR instruction, not a scope change):** the DoR contract names `handleGetWizard`
as the render target. `handleGetWizard` is exported and still directly exercised by two pre-existing test files
as a synchronous function; converting it to `async` in place would silently break those callers (they assert on
`res.statusCode` immediately after the call, with no `await`). To satisfy the story's AC1-AC4 without regressing
existing, passing tests, the plan keeps `handleGetWizard` synchronous (reads already-resolved `req.session.flags`)
and adds a new async wrapper, `handleGetWizardBootstrapped`, that performs the actual bootstrap-then-render sequence.
This is the function a real route registration would call. A PR comment notes this for operator visibility,
per the DoR's "if you encounter an ambiguity ... add a PR comment" instruction.

---

## Task 1: `bootstrapFlags()` — resolve once per session, cache, and never block (AC1, AC2, AC3, Performance NFR)

**Files:**
- Create: `src/web-ui/modules/flag-bootstrap.js`
- Test: `tests/check-bri-s1.3-server-side-bootstrap.js`

- [ ] **Step 1: Write the failing tests**

```js
// U1 — AC1: bootstrap resolves all relevant flags before returning, attaches to session
test('U1: bootstrapFlags(req) resolves wizard-ui onto req.session.flags before returning', async function() {
  var req = { session: {} };
  var deps = { isEnabled: function() { return Promise.resolve(true); } };
  await flagBootstrap.bootstrapFlags(req, deps);
  assert.strictEqual(req.session.flags['wizard-ui'], true);
});

// U2 — AC3: slow/hanging adapter still resolves promptly with the safe default
test('U2: bootstrapFlags resolves within budget and defaults false when isEnabled hangs', async function() {
  var req = { session: {} };
  var deps = {
    isEnabled: function() { return new Promise(function() { /* never resolves */ }); },
    timeoutMs: 50
  };
  var start = Date.now();
  await flagBootstrap.bootstrapFlags(req, deps);
  var elapsed = Date.now() - start;
  assert.ok(elapsed < 250, 'bootstrapFlags must not hang; took ' + elapsed + 'ms');
  assert.strictEqual(req.session.flags['wizard-ui'], false);
});

// U3 — AC2: a second call within the same session does not re-query isEnabled
test('U3: bootstrapFlags does not re-query isEnabled when req.session.flags already populated', async function() {
  var req = { session: {} };
  var calls = 0;
  var deps = { isEnabled: function() { calls++; return Promise.resolve(true); } };
  await flagBootstrap.bootstrapFlags(req, deps);
  assert.strictEqual(calls, 1);
  await flagBootstrap.bootstrapFlags(req, deps);
  assert.strictEqual(calls, 1, 'second bootstrap call within the same session must not re-invoke isEnabled');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: `Cannot find module '../src/web-ui/modules/flag-bootstrap'` (or equivalent — module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';

// flag-bootstrap.js — bri-s1.3: server-side flag bootstrap at session start.
// Resolves all relevant flags once per session via S1.1's isEnabled(), caches the
// result onto req.session.flags, and applies its own bounded timeout so a
// slow/hanging PostHog call can never block session start beyond the documented
// Performance NFR budget (200ms) — this is in addition to (not a replacement for)
// isEnabled()'s own reject-to-false safe default (S1.1 AC4).

var DEFAULT_TIMEOUT_MS = 200;
var FLAG_KEYS = ['wizard-ui'];

function _withTimeout(promise, ms) {
  return new Promise(function(resolve) {
    var settled = false;
    var timer = setTimeout(function() {
      if (!settled) { settled = true; resolve(false); }
    }, ms);
    Promise.resolve(promise).then(function(val) {
      if (!settled) { settled = true; clearTimeout(timer); resolve(val === true); }
    }, function() {
      if (!settled) { settled = true; clearTimeout(timer); resolve(false); }
    });
  });
}

/**
 * Resolve and cache all relevant flags for this session.
 * AC2: if req.session.flags is already populated, returns it as-is without
 * re-querying isEnabled() — this is the mechanism that makes a mid-session
 * PostHog toggle not apply until the next session start.
 * @param {object} req - must have req.session (a mutable object)
 * @param {object} [deps] - { isEnabled, timeoutMs } injected for testability
 * @returns {Promise<object>} the resolved (or cached) flags map
 */
async function bootstrapFlags(req, deps) {
  deps = deps || {};
  if (!req || !req.session) return {};
  if (req.session.flags && typeof req.session.flags === 'object') {
    return req.session.flags;
  }

  var isEnabledFn = deps.isEnabled || require('./posthog-flags').isEnabled;
  var timeoutMs = deps.timeoutMs || DEFAULT_TIMEOUT_MS;
  var context = { tenantId: req.session.tenantId };

  var flags = {};
  for (var i = 0; i < FLAG_KEYS.length; i++) {
    var key = FLAG_KEYS[i];
    flags[key] = await _withTimeout(isEnabledFn(key, context), timeoutMs);
  }
  req.session.flags = flags;
  return flags;
}

module.exports = { bootstrapFlags: bootstrapFlags, FLAG_KEYS: FLAG_KEYS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: `U1, U2, U3 ... PASS`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/modules/flag-bootstrap.js tests/check-bri-s1.3-server-side-bootstrap.js
git commit -m "feat(bri-s1.3): add bootstrapFlags() session-level flag cache with bounded timeout"
```

---

## Task 2: `handleGetWizard` gated render + `handleGetWizardBootstrapped` wrapper (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-bri-s1.3-server-side-bootstrap.js`

- [ ] **Step 1: Write the failing tests**

```js
// IT1 — AC1, AC4: flag on -> gated element present in the initial HTML
test('IT1: handleGetWizard renders the gated element when req.session.flags["wizard-ui"] is true', function() {
  var req = { session: { flags: { 'wizard-ui': true } } };
  var res = fakeRes();
  routes.handleGetWizard(req, res);
  assert.ok(res.body.indexOf('id="wizard-canvas-gated"') !== -1, 'gated element must be present in initial HTML');
});

// IT2 — AC1, AC4: flag off -> gated element absent from the initial HTML
test('IT2: handleGetWizard omits the gated element when req.session.flags["wizard-ui"] is false', function() {
  var req = { session: { flags: { 'wizard-ui': false } } };
  var res = fakeRes();
  routes.handleGetWizard(req, res);
  assert.ok(res.body.indexOf('id="wizard-canvas-gated"') === -1, 'gated element must be server-omitted, not present');
});

// IT3 — AC1, AC3: no bootstrap yet run (req.session.flags unset) -> safe default, element absent
test('IT3: handleGetWizard omits the gated element when flags have not been bootstrapped yet', function() {
  var req = { session: {} };
  var res = fakeRes();
  routes.handleGetWizard(req, res);
  assert.ok(res.body.indexOf('id="wizard-canvas-gated"') === -1, 'unbootstrapped session must default to gate off');
});

// IT4 — AC1: handleGetWizardBootstrapped resolves flags then renders in one pass, no
// separate client-side fetch call precedes the gated markup
test('IT4: handleGetWizardBootstrapped resolves the flag and renders it in the same initial response', async function() {
  var req = { session: {} };
  var res = fakeRes();
  await routes.handleGetWizardBootstrapped(req, res, { isEnabled: function() { return Promise.resolve(true); } });
  assert.ok(res.body.indexOf('id="wizard-canvas-gated"') !== -1);
  assert.ok(res.body.indexOf("fetch('/api/flags')") === -1, 'no client-side flag fetch may precede the gated markup');
});

// IT5 — AC2: second render within the same session reuses the cached flag, does not re-query
test('IT5: a second handleGetWizardBootstrapped call in the same session does not re-invoke isEnabled', async function() {
  var req = { session: {} };
  var calls = 0;
  var deps = { isEnabled: function() { calls++; return Promise.resolve(true); } };
  await routes.handleGetWizardBootstrapped(req, fakeRes(), deps);
  await routes.handleGetWizardBootstrapped(req, fakeRes(), deps);
  assert.strictEqual(calls, 1, 'a PostHog toggle mid-session must not apply until the next session start');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: `IT1-IT5 FAIL — res.body has no gated element / handleGetWizardBootstrapped is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`:

1. Add near the other module requires (top of file):
```js
var _flagBootstrap = require('../modules/flag-bootstrap'); // bri-s1.3
```

2. In `handleGetWizard`'s "Step 1: default — three option cards" block, insert the gated marker before the existing `body` render (immediately above the `var body = ...` line that builds the three-option-card view):
```js
  // bri-s1.3: flag state must already be resolved on req.session.flags by the time this
  // renders — server-omitted when off/unresolved, never added/removed after the fact.
  var _wizardUiOn = !!(req.session && req.session.flags && req.session.flags['wizard-ui'] === true);
  var _wizardCanvasGate = _wizardUiOn
    ? '<div id="wizard-canvas-gated" data-flag="wizard-ui">Wizard canvas</div>\n'
    : '';
```
   Then prepend `_wizardCanvasGate` to the existing `body` string:
```js
  var body = _wizardCanvasGate + '<h1>What would you like to do?</h1>\n' +
```

3. Add a new exported async wrapper, placed directly above `module.exports`:
```js
/**
 * bri-s1.3: session-start entry point — resolves all relevant flags server-side
 * (via bootstrapFlags) before delegating to the existing synchronous handleGetWizard
 * render. Kept as a separate export so every pre-existing synchronous caller of
 * handleGetWizard (check-wucp4-session-wizard.js, check-pmf3-orientation-wizard.js)
 * is unaffected — this is the function a live route registration should call.
 * @param {object} req
 * @param {object} res
 * @param {object} [deps] - forwarded to bootstrapFlags for testability
 */
async function handleGetWizardBootstrapped(req, res, deps) {
  await _flagBootstrap.bootstrapFlags(req, deps);
  return handleGetWizard(req, res);
}
```

4. Add `handleGetWizardBootstrapped` to `module.exports` alongside `handleGetWizard`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: `IT1-IT5 ... PASS`

- [ ] **Step 5: Run adjacent regression check — no pre-existing caller broken**

```bash
node tests/check-wucp4-session-wizard.js
node tests/check-pmf3-orientation-wizard.js
```

Expected output: both `... 0 failed` (unchanged from baseline: 20 passed / 8 passed)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-bri-s1.3-server-side-bootstrap.js
git commit -m "feat(bri-s1.3): render wizard-canvas gate server-side; add handleGetWizardBootstrapped session-start wrapper"
```

---

## Task 3: NFR — bootstrap adds no more than 200ms over adapter latency

**Files:**
- Test: `tests/check-bri-s1.3-server-side-bootstrap.js`

- [ ] **Step 1: Write the failing test**

```js
// N1 — Performance NFR: bootstrap overhead stays within the 200ms budget over simulated adapter latency
test('N1: bootstrapFlags adds no more than 200ms over a 50ms simulated adapter latency', async function() {
  var req = { session: {} };
  var deps = { isEnabled: function() {
    return new Promise(function(resolve) { setTimeout(function() { resolve(true); }, 50); });
  } };
  var start = Date.now();
  await flagBootstrap.bootstrapFlags(req, deps);
  var elapsed = Date.now() - start;
  assert.ok(elapsed <= 250, 'bootstrap total time must stay within adapter latency (50ms) + 200ms budget; took ' + elapsed + 'ms');
});
```

- [ ] **Step 2: Run test — must fail or pass trivially**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: this test typically already passes against Task 1's implementation (no separate code change needed) — confirms the NFR rather than driving new code. If it fails, tighten `_withTimeout`'s resolution path (should already be minimal).

- [ ] **Step 3: Run full targeted file — confirm final count**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
```

Expected output: `Results: 9 passed, 0 failed` (U1-U3, IT1-IT5, N1)

- [ ] **Step 4: Commit (if any change was needed)**

```bash
git add tests/check-bri-s1.3-server-side-bootstrap.js
git commit -m "test(bri-s1.3): add NFR performance test for bootstrap timeout budget"
```

---

## Task 4: AC4 Playwright spec — descope decision

Per the test plan's own explicit allowance ("this spec is a belt-and-braces addition ... may be descoped ... if judged unnecessary") and the DoR Coding Agent Instructions ("may be descoped with a decisions.md note if the integration tests are judged sufficient"): IT1/IT2 above already prove AC4's observable requirement (initial-HTML presence/absence, not a later DOM mutation) without a live browser. Descope the Playwright spec and add a `decisions.md` entry recording this.

- [ ] **Step 1:** Append a `DESIGN` entry to `artefacts/2026-07-09-beta-readiness-infra/decisions.md` recording the descope decision and rationale (see Task 5).
- [ ] **Step 2:** No commit needed for code (no `tests/e2e/` file created) — the `decisions.md` update is committed as part of Task 5's documentation commit.

---

## Task 5: Documentation — package.json test registration + decisions.md entry

**Files:**
- Modify: `package.json`
- Modify: `artefacts/2026-07-09-beta-readiness-infra/decisions.md`

- [ ] **Step 1:** Append `&& node tests/check-bri-s1.3-server-side-bootstrap.js` to the end of the existing `scripts.test` chain string in `package.json` (do not reformat or reorder existing entries).
- [ ] **Step 2:** Append a `DESIGN` entry to `decisions.md`:
  - Decision: descope the AC4 Playwright spec (`tests/e2e/`), relying on the IT1/IT2 integration tests to satisfy AC4.
  - Rationale: test plan explicitly names this allowance; IT1/IT2 already assert the initial-HTML gated-element presence/absence directly against `handleGetWizard`'s output, which is the same observable AC4 asks for, without live-browser overhead.
- [ ] **Step 3:** Append a `DESIGN` entry noting the `handleGetWizard`/`handleGetWizardBootstrapped` split (see File map design note above) for operator visibility — not a PR-blocking ambiguity, but worth a durable record since it diverges slightly from the DoR contract's literal phrasing ("handleGetWizard renders...").
- [ ] **Step 4: Run full targeted regression**

```bash
node tests/check-bri-s1.3-server-side-bootstrap.js
node tests/check-wucp4-session-wizard.js
node tests/check-pmf3-orientation-wizard.js
node tests/check-bri-s1.1-isenabled-helper.js
node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: all five files report `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add package.json artefacts/2026-07-09-beta-readiness-infra/decisions.md
git commit -m "chore(bri-s1.3): register test file in npm test chain; log AC4 descope + design decisions"
```

---

## Notes

- **Pre-existing baseline gap (already logged, do not re-investigate):** the full `npm test` chain exceeds the
  Windows `cmd.exe` command-line length limit, and (independently) `tests/check-definition-skill.js` fails with
  `.github/skills/definition/SKILL.md not found` on a fresh `origin/master` checkout, before any bri-s1.3 code.
  Both are logged in `decisions.md` under the `RISK-ACCEPT | branch-setup (bri-s1.2)` and
  `RISK-ACCEPT | branch-setup (bri-s2.2)` entries. Verification for this story runs the targeted test files
  listed in Task 5 Step 4 directly, consistent with that established pattern.
