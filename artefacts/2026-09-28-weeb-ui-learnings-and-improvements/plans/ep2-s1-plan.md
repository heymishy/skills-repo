## Implementation Plan: Signals panel — render real signals in a web UI page

**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**DoR:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s1-dor.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md

**Real architecture grounding (confirmed by direct code read, not assumed):**
- `getSignals(repoPath)` — `src/web-ui/modules/signals-aggregator.js:34` — synchronous, plain function, the same one `ep1-s2`'s `handleGetSignals` already calls. `Signal` shape: `{id, source, type, text, timestamp, cta: {label, skill}}`.
- `renderShell(opts)` — `src/web-ui/utils/html-shell.js:384` — `opts.title`, `opts.bodyContent`, `opts.user`, `opts.active`, `opts.products`/`activeProductId`/`noProductJourneyCount`.
- `_getSkillsNavContext(req, sessionId)` — exported from `src/web-ui/routes/skills.js` (confirmed in its own `module.exports`) — reused directly for nav context, not duplicated.
- `_csrf.csrfField(csrfToken)` / `_csrf.generateCsrfToken(req)` — `src/web-ui/middleware/csrf.js`.
- `authGuard(req, res, cb)` registration pattern — `server.js:2996` (`/skills` GET) — identical pattern used for `/signals`.
- Each signal's CTA renders a real `<form method="POST" action="/api/skills/{skill}/sessions">` with hidden fields for `source`/`type`/`text`/`timestamp` — confirmed safe with the operator (pre-`ep2-s2` endpoint ignores unrecognized fields).
- Parse-error distinction uses an inline style + a `data-signal-type` attribute (not a new shared CSS class) — avoids touching `html-shell.js`'s shared stylesheet, matching `ep1-s3`'s own established low-risk technique (inline styles for story-specific visual treatment, per `architecture-guardrails.md`'s Anti-Pattern on shared-surface-module changes).

---

## File map

| File | Change | Mirrors |
|------|--------|---------|
| `src/web-ui/views/signals-panel-view.js` | New — pure render function | `src/web-ui/skill-launcher.js` |
| `src/web-ui/routes/signals-panel.js` | New — route handler | `src/web-ui/routes/signals.js` (repo-path helper), `handleGetSkillsHtml` (nav/auth pattern) |
| `src/web-ui/server.js` | Modified — route registration (~4 lines) | `/skills` GET registration (line ~2996) |
| `tests/check-ep2-s1-signals-panel.js` | New — unit + integration tests | `tests/check-ep1-s3-skill-launcher.js` |
| `tests/e2e/ep2-s1-signals-panel.spec.js` | New — E2E accessibility test | `tests/e2e/ep1-s3-launcher-layout.spec.js` |

---

## Task 1 — Write failing unit tests for the render function (AC1–AC4) [RED]

**File:** `tests/check-ep2-s1-signals-panel.js` (new)

```javascript
#!/usr/bin/env node
/**
 * check-ep2-s1-signals-panel.js -- AC verification for ep2-s1
 * (signals panel: render real signals in a web UI page).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
 *
 * Run: node tests/check-ep2-s1-signals-panel.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const assert = require('assert');
const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

const FIXTURE_SIGNALS = [
  { id: 's1', source: 'capture-log', type: 'decision', text: 'Use flat stories array', timestamp: '2026-09-30', cta: { label: 'Review', skill: '/improve' } },
  { id: 's2', source: 'pipeline-state', type: 'feature-status', text: 'ep2 -- stage: definition', timestamp: '2026-10-01', cta: { label: 'Open feature', skill: '/workflow' } },
];

const PARSE_ERROR_FIXTURE = { id: 's3', source: 'parse-error', type: 'parse-error', text: 'learnings.md: unexpected token', timestamp: '2026-10-01T00:00:00.000Z', cta: { label: 'Review', skill: '/improve' } };

(async function main() {

  await test('AC1: every real signal field (text/source/type) renders', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    FIXTURE_SIGNALS.forEach(function(s) {
      assert.ok(html.includes(s.text), 'expected signal text "' + s.text + '" in output');
      assert.ok(html.includes(s.source), 'expected signal source "' + s.source + '" in output');
      assert.ok(html.includes(s.type), 'expected signal type "' + s.type + '" in output');
    });
  });

  await test('AC2: each signal\'s own cta.label renders, not a hardcoded string', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    assert.ok(html.includes('>Review<'), 'expected default cta label "Review"');
    assert.ok(html.includes('>Open feature<'), 'expected non-default cta label "Open feature" (not hardcoded to "Review")');
    assert.ok(html.includes('action="/api/skills/improve/sessions"'), 'expected form action targeting the default cta.skill');
    assert.ok(html.includes('action="/api/skills/workflow/sessions"'), 'expected form action targeting the non-default cta.skill (real call site value, not invented)');
  });

  await test('AC2: hidden fields carry the signal\'s own full content for ep2-s2\'s own seeding bridge', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    assert.ok(html.includes('name="signalSource" value="capture-log"'));
    assert.ok(html.includes('name="signalType" value="decision"'));
    assert.ok(html.includes('name="signalText" value="Use flat stories array"'));
    assert.ok(html.includes('name="signalTimestamp" value="2026-09-30"'));
  });

  await test('AC3: empty signal list shows a clear empty state, not a blank page', function() {
    const html = renderSignalsPanel([], 'csrf-abc');
    assert.ok(html.includes('No signals yet'), 'expected empty-state message');
    assert.ok(!html.includes('<form'), 'expected no list-item/form markup when there are no signals');
  });

  await test('AC4: parse-error signals carry a distinguishing marker; normal signals do not', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS.concat([PARSE_ERROR_FIXTURE]), 'csrf-abc');
    assert.ok(html.includes('data-signal-type="parse-error"'), 'expected the parse-error item to carry its own distinguishing data attribute');
    const normalSignalBlock = html.split('data-signal-type="parse-error"')[0];
    assert.ok(!normalSignalBlock.includes('border-left:3px solid'), 'expected the parse-error-only inline style to not appear before the parse-error item itself');
  });

  await test('Security: signal text is escaped via escHtml (no raw HTML injection)', function() {
    const malicious = [{ id: 's4', source: 'test', type: 'note', text: '<script>alert(1)</script>', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    const html = renderSignalsPanel(malicious, 'csrf-abc');
    assert.ok(!html.includes('<script>alert(1)</script>'), 'expected signal text to be HTML-escaped, not injected raw');
    assert.ok(html.includes('&lt;script&gt;'), 'expected the escaped form to be present');
  });

  console.log('\n[ep2-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s1] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
```

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** `Cannot find module '../src/web-ui/views/signals-panel-view'` (module does not exist yet — this is the RED state).

**Commit message:** `test(ep2-s1): add failing unit tests for the signals panel render function`

---

## Task 2 — Implement the render function to make Task 1's tests pass [GREEN]

**File:** `src/web-ui/views/signals-panel-view.js` (new)

```javascript
'use strict';
// signals-panel-view.js -- ep2-s1: renders real signals (from ep1-s1's real
// getSignals(), the same function ep1-s2's /api/signals handler already
// calls) as a web UI list. Each signal's CTA is a real, submittable form --
// ep2-s2 is what makes that form's target endpoint seed-aware; until then it
// behaves exactly like a normal, non-seeded skill launch (ep1-s3's own
// convention), which is expected, not a bug.
const { escHtml } = require('../utils/html-shell');
const _csrf = require('../middleware/csrf');

function _hiddenField(name, value) {
  return '<input type="hidden" name="' + name + '" value="' + escHtml(value == null ? '' : String(value)) + '">';
}

function _signalItem(signal, csrfToken) {
  const safeText = escHtml(signal.text || '');
  const safeSource = escHtml(signal.source || '');
  const safeType = escHtml(signal.type || '');
  const cta = signal.cta || { label: 'Review', skill: '/improve' };
  const safeCtaLabel = escHtml(cta.label || 'Review');
  const skillName = (cta.skill || '/improve').replace(/^\//, '');
  const safeSkillName = escHtml(skillName);
  const isParseError = signal.type === 'parse-error';
  const itemStyle = 'display:flex;align-items:flex-start;justify-content:space-between;gap:16px' +
    (isParseError ? ';border-left:3px solid #b45309;background:rgba(180,83,9,0.08);padding-left:12px' : '');

  return [
    '<div class="sw-card signal-item" data-signal-type="' + safeType + '" style="' + itemStyle + '">',
    '  <div>',
    '    <div class="signal-source">' + safeSource + '</div>',
    '    <div class="signal-type">' + safeType + '</div>',
    '    <div class="signal-text">' + safeText + '</div>',
    '  </div>',
    '  <form method="POST" action="/api/skills/' + safeSkillName + '/sessions" style="flex-shrink:0">',
    '    ' + _csrf.csrfField(csrfToken),
    '    ' + _hiddenField('signalSource', signal.source),
    '    ' + _hiddenField('signalType', signal.type),
    '    ' + _hiddenField('signalText', signal.text),
    '    ' + _hiddenField('signalTimestamp', signal.timestamp),
    '    <button type="submit" class="sw-btn sw-btn--primary">' + safeCtaLabel + '</button>',
    '  </form>',
    '</div>'
  ].join('\n');
}

/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals
 * @param {string} csrfToken
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken) {
  if (!signals || signals.length === 0) {
    return '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>';
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>'
  ].join('\n');
}

module.exports = { renderSignalsPanel };
```

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** `[ep2-s1] Results: 6 passed, 0 failed`

**Commit message:** `feat(ep2-s1): add signals panel render function (AC1-AC4)`

---

## Task 3 — Write failing integration tests for the route handler (AC1 behavioural, AC5) [RED]

**File:** append to `tests/check-ep2-s1-signals-panel.js`, before the final `console.log('\n[ep2-s1] Results...')` line:

```javascript
  await test('Integration: handleGetSignalsPanelHtml renders real signals via the panel view, authenticated', async function() {
    const routes = require('../src/web-ui/routes/signals-panel');
    routes.setSignalsSource(function() { return FIXTURE_SIGNALS; });
    const req = { session: { accessToken: 't', login: 'alice' }, sessionId: 'sid', query: {}, headers: {}, method: 'GET', url: '/signals' };
    const res = { statusCode: null, headers: null, body: null, writeHead: function(c, h) { this.statusCode = c; this.headers = h; }, end: function(b) { this.body = b; } };
    await routes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('Use flat stories array'));
    assert.ok(res.body.includes('Open feature'));
  });

  await test('AC5: unauthenticated request redirects to sign-in', async function() {
    const routes = require('../src/web-ui/routes/signals-panel');
    const req = { session: null, sessionId: 'sid2', query: {}, headers: {}, method: 'GET', url: '/signals' };
    const res = { statusCode: null, headers: null, body: null, writeHead: function(c, h) { this.statusCode = c; this.headers = h; }, end: function(b) { this.body = b; } };
    await routes.handleGetSignalsPanelHtml(req, res);
    assert.strictEqual(res.statusCode, 302);
    assert.ok(res.headers.Location.includes('/auth/github'), 'expected redirect to the real sign-in path, matching every other authenticated page');
  });
```

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** `Cannot find module '../src/web-ui/routes/signals-panel'` (RED — route module does not exist yet).

**Commit message:** `test(ep2-s1): add failing integration tests for the signals panel route handler`

---

## Task 4 — Implement the route handler and wire it into server.js [GREEN]

**File:** `src/web-ui/routes/signals-panel.js` (new)

```javascript
'use strict';
// signals-panel.js -- ep2-s1: GET /signals route handler. Calls
// signals-aggregator.js's real getSignals() directly (the same function
// ep1-s2's handleGetSignals already calls) -- not a re-implementation, not a
// new HTTP round-trip to /api/signals from within this same process.
const path = require('path');
const { renderShell } = require('../utils/html-shell');
const { renderSignalsPanel } = require('../views/signals-panel-view');
const _csrf = require('../middleware/csrf');
const { _getSkillsNavContext } = require('./skills');

let _signalsSourceOverride = null;
function setSignalsSource(fn) { _signalsSourceOverride = fn; }
function _resetSignalsSourceForTesting() { _signalsSourceOverride = null; }

function _getRepoPath() {
  return process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

async function handleGetSignalsPanelHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const getSignals = _signalsSourceOverride || require('../modules/signals-aggregator').getSignals;
  const signals = getSignals(_getRepoPath());
  const csrfToken = await _csrf.generateCsrfToken(req);
  const _nav = await _getSkillsNavContext(req, null);
  const html = renderShell({
    title: 'Improvement Signals',
    bodyContent: renderSignalsPanel(signals, csrfToken),
    user: { login: req.session.login || '' },
    active: 'signals',
    products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = { handleGetSignalsPanelHtml, setSignalsSource, _resetSignalsSourceForTesting };
```

**File:** `src/web-ui/server.js` — add near the existing `/skills` GET registration (~line 2996):

Add to the require block (near where `handleGetSignals` is required, ~line 110):
```javascript
const { handleGetSignalsPanelHtml }                                  = require('./routes/signals-panel');      // ep2-s1
```

Add a new `else if` branch immediately after the `/skills` GET branch (~line 2999, after its closing `});`):
```javascript
  } else if (pathname === '/signals' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetSignalsPanelHtml(req, res);
    });

```

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** `[ep2-s1] Results: 8 passed, 0 failed`

**Commit message:** `feat(ep2-s1): add signals panel route handler, wire GET /signals`

---

## Task 5 — Real Playwright E2E test for the Accessibility NFR

**File:** `tests/e2e/ep2-s1-signals-panel.spec.js` (new)

```javascript
// ep2-s1-signals-panel.spec.js -- E2E coverage for ep2-s1's Accessibility NFR
// (keyboard Tab-order across signal CTAs), classified CSS-layout-dependent
// by analogy to ep1-s3's own precedent (jsdom cannot reproduce real
// sequential Tab-order focus movement) -- see test-plan Step 3a note.
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/ep2-s1-signals-panel.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('NFR-Accessibility: every signal CTA has a non-empty accessible name and is Tab-reachable', async ({ page }) => {
  await page.goto('/signals');
  await page.waitForLoadState('networkidle');

  const ctaButtons = page.locator('.signal-item .sw-btn--primary');
  const count = await ctaButtons.count();
  expect(count).toBeGreaterThan(0); // real signals must be present -- confirm WIRE_SKILL_ADAPTERS-equivalent real data path is wired before trusting this test (ep1-s3's own DoD lesson)

  for (let i = 0; i < count; i++) {
    const name = await ctaButtons.nth(i).evaluate((el) => el.textContent.trim());
    expect(name.length).toBeGreaterThan(0);
  }

  await page.locator('body').evaluate((el) => el.focus());
  let seen = 0;
  for (let i = 0; i < 100 && seen < count; i++) {
    await page.keyboard.press('Tab');
    const inCta = await page.evaluate(() => {
      const active = document.activeElement;
      return !!(active && active.closest('.signal-item'));
    });
    if (inCta) seen++;
  }
  expect(seen).toBe(count); // Tab order reaches every rendered CTA button
});
```

**Run:** `NODE_ENV=test npx playwright test tests/e2e/ep2-s1-signals-panel.spec.js`
**Expected output:** `1 passed`. Confirmed by direct code read (`grep -n "NODE_ENV" src/web-ui/modules/signals-aggregator.js src/web-ui/routes/signals.js` → no matches): `getSignals()` has no adapter-wiring gate like `listSkills` did (no `WIRE_SKILL_ADAPTERS`-equivalent needed) — it reads real workspace files unconditionally under any `NODE_ENV`. This story's own `signals-panel.js` route calls it directly with no override, so the E2E webServer renders real signal data without any `playwright.config.js` change.

**Commit message:** `test(ep2-s1): add real Playwright E2E test for Accessibility NFR`

---

## Task 6 — Full regression + verification pass

**Run:** `npm test`
**Expected output:** No new failures beyond the 3 already-acknowledged pre-existing/flaky ones (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`, `check-pla-s2-posthog-wiring.js` — see `decisions.md` 2026-10-01 branch-setup entry).

**Run:** `node tests/check-ep1-s3-skill-launcher.js` and `NODE_ENV=test npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js`
**Expected output:** All still pass unmodified — confirms this story's new route registration did not regress the existing `/skills` page or server.js routing table.

**Commit message:** `chore(ep2-s1): final regression pass`
