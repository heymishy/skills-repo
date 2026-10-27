# ppc-s6 — Dashboard-shell UX/CX parity and scope/benefit summary — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Wrap the Playback Evidence page in the shared dashboard shell, add a tenant-scoped Scope/Benefit summary and an at-a-glance coverage line, reusing `/playback`'s own already-proven building blocks — composition, not new mechanisms.
**Branch:** `feature/ppc-s6`
**Worktree:** `.worktrees/ppc-s6`
**Test command:** `node scripts/run-all-tests.js` (full suite); existing coverage: `tests/check-ppc-s1-ui-layer.js`, `tests/check-ppc-s1-playback-evidence-route.js`, `tests/check-ppc-s4-pipeline-state-dod-fallback.js`

---

## File map

```
Modify:
  src/web-ui/routes/playback-evidence.js  — wrap handleGetPlaybackEvidence's HTML
                                              branch in renderShellWithNav; fetch
                                              discovery.md/benefit-metric.md via the
                                              existing _fetchArtefact/_resolveOwnerRepo
                                              helpers; add Scope/Benefit + coverage-line
                                              rendering to _renderPlaybackEvidenceHtml

Create:
  tests/check-ppc-s6-dashboard-shell-parity.js — AC1-AC6 coverage
```

**Reused, unmodified:** `renderShellWithNav` (`products.js`), `extractMarkdownSection`/`renderCoverageSummaryHtml`/`computeAcCoverageSummary` (`playback.js`), `parseBenefitMetricTargets` (`utils/dod-parsing.js`), `_fetchArtefact`/`_resolveOwnerRepo`/`escHtml` (already imported in `playback-evidence.js`), `ArtefactNotFoundError` (`adapters/artefact-fetcher.js`).

---

## Task 1: Wrap the page in the dashboard shell (AC1, AC5)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s6-dashboard-shell-parity.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  var result;
  try { result = fn(); } catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve(); }
  if (result && typeof result.then === 'function') {
    return result.then(function() { passed++; console.log('  PASS: ' + name); }, function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); });
  }
  passed++; console.log('  PASS: ' + name); return Promise.resolve();
}
var queue = [];

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; } };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
var _n = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _n++;
  return Object.assign({ session: { tenantId: tenantId, userId: 'ppc-s6-user-' + _n, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId, params: { productId: productId, featureSlug: featureSlug }, headers: { accept: 'text/html' } }, extra || {});
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s6-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|', '| AC1 — Shows the dashboard | Yes | screenshot |'].join('\n');
  store.setPgAdapterForTesting({ saveJourney: async function() {}, getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; } });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function makeMockPool() { return { query: async function() { return { rows: [] }; } }; }

console.log('\n[ppc-s6] AC1/AC5: dashboard shell wrap');

queue.push(function() {
  return test('T1 (AC1): HTML response is wrapped in the dashboard shell (nav sidebar markup present), not a bare <!DOCTYPE> fragment', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.strictEqual(res._status, 200);
      assert.ok(res._body.indexOf('sw-app') !== -1, 'must contain the shared shell wrapper markup (sw-app), confirming renderShellWithNav was used');
      assert.ok(res._body.indexOf('sw-sidebar') !== -1 || res._body.indexOf('Products') !== -1, 'must contain the Products-nav sidebar, not a direct renderShell() call that would omit it');
    });
  });
});

queue.push(function() {
  return test('T2 (AC5): the existing capture-target form still submits correctly inside the shell wrap', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('<form') !== -1, 'the existing plain <form> elements must still be present, unchanged, inside the shell wrap');
      assert.ok(res._body.indexOf('method="POST"') !== -1);
    });
  });
});

console.log('\n[ppc-s6] Results');
(async function() { for (var i = 0; i < queue.length; i++) { await queue[i](); } console.log('\n' + passed + ' passed, ' + failed + ' failed'); if (failed > 0) process.exitCode = 1; })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `FAIL: T1 ... must contain the shared shell wrapper markup (sw-app)` (the page currently returns a bare `<!DOCTYPE html>` fragment).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add the import near the existing `getRepoRoot`/`ensureRepoFresh` imports:

```javascript
const { renderShellWithNav } = require('./products');
```

In `handleGetPlaybackEvidence`'s HTML branch (currently `var html = _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress); res.writeHead(200, ...); res.end(html);`), replace with:

```javascript
if (_wantsHtml(req)) {
  var csrfToken = await _csrf.generateCsrfToken(req);
  var progress = captureAllLock.getLockState(journey.journeyId);
  var bodyContent = _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
  var html = await renderShellWithNav(pool, req.session.tenantId, {
    title: 'Playback evidence — ' + journey.featureSlug,
    bodyContent: bodyContent,
    user: { login: req.session.login || '' },
    active: 'journey',
    activeProductId: journey.productId
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
  return;
}
```

`_renderPlaybackEvidenceHtml` itself stays synchronous for now — change its own final `return` from a full `<!DOCTYPE html>...` document to just the body fragment (drop the `<!DOCTYPE html><html><head>...</head><body>` wrapper and the closing `</body></html>`, keep everything in between):

```javascript
return '<h1>' + _escapeHtml(journey.featureSlug) + '</h1>' +
  progressHtml +
  captureAllFormHtml +
  '<ul style="list-style:none;padding:0">' + rows + '</ul>';
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `PASS: T1 ...`, `PASS: T2 ...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing. **Known risk:** `tests/check-ppc-s1-ui-layer.js`'s existing HTML-mode tests assert on the OLD bare-document structure (e.g. may check for `<html>`/`<body>` tags directly) — if any fail, update their assertions to check for content presence (e.g. `<form>`, AC text) rather than full-document structure, since the shell wrap is this story's own explicit, intended change (AC1), not a regression to work around.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s6-dashboard-shell-parity.js
git commit -m "feat(ppc-s6): wrap Playback Evidence page in the dashboard shell (AC1, AC5)"
```

---

## Task 2: Scope/Benefit summary, tenant-scoped via fetchArtefact (AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s6-dashboard-shell-parity.js` (append)

- [ ] **Step 1: Write the failing test**

Append before the `console.log('\n[ppc-s6] Results')` line:

```javascript
console.log('\n[ppc-s6] AC2/AC4: Scope/Benefit summary');

queue.push(function() {
  return test('T3 (AC2): Scope and Benefit sections render from discovery.md/benefit-metric.md via fetchArtefact, escaped', function() {
    var fetcher = require('../src/web-ui/adapters/artefact-fetcher');
    var original = fetcher.fetchArtefact;
    fetcher.fetchArtefact = async function(featureSlug, artefactType) {
      if (artefactType === 'discovery') return '## Problem statement\n\nTenants cannot <see> their own evidence.';
      if (artefactType === 'benefit-metric') return '## Metrics\n\n- Adoption: 50%';
      return original.apply(this, arguments);
    };
    delete require.cache[require.resolve('../src/web-ui/routes/playback-evidence')];
    var pe2 = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    pe2.setJourneyStoreModule(store);
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe2.handleGetPlaybackEvidence(req, res, null, { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }).then(function() {
      fetcher.fetchArtefact = original;
      assert.ok(res._body.indexOf('Tenants cannot') !== -1, 'Scope section must show the fetched Problem statement content');
      assert.ok(res._body.indexOf('&lt;see&gt;') !== -1, 'fetched content must be HTML-escaped (XSS guard)');
      assert.ok(res._body.indexOf('<see>') === -1, 'must never render unescaped tenant-authored content as literal HTML');
    }, function(err) { fetcher.fetchArtefact = original; throw err; });
  });
});

queue.push(function() {
  return test('T4 (AC4): a missing discovery.md shows a "not available" state naming the specific artefact, rest of page unaffected', function() {
    var fetcher = require('../src/web-ui/adapters/artefact-fetcher');
    var original = fetcher.fetchArtefact;
    fetcher.fetchArtefact = async function(featureSlug, artefactType) {
      if (artefactType === 'discovery') throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
      if (artefactType === 'benefit-metric') return '## Metrics\n\n- Adoption: 50%';
      return original.apply(this, arguments);
    };
    delete require.cache[require.resolve('../src/web-ui/routes/playback-evidence')];
    var pe2 = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    pe2.setJourneyStoreModule(store);
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe2.handleGetPlaybackEvidence(req, res, null, { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }).then(function() {
      fetcher.fetchArtefact = original;
      assert.strictEqual(res._status, 200, 'page must still render fully, not 404/500');
      assert.ok(res._body.indexOf('discovery.md') !== -1 && res._body.indexOf('not found') !== -1, 'must name the specific missing artefact (discovery.md), not a generic message');
      assert.ok(res._body.indexOf('<form') !== -1, 'AC list / capture forms must still render unaffected');
    }, function(err) { fetcher.fetchArtefact = original; throw err; });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `FAIL: T3 ... Scope section must show the fetched Problem statement content` and `FAIL: T4 ...` (no Scope/Benefit section exists yet).

- [ ] **Step 3: Write minimal implementation**

Add imports near the top of `playback-evidence.js`:

```javascript
const { extractMarkdownSection, renderCoverageSummaryHtml, computeAcCoverageSummary } = require('./playback');
const { parseBenefitMetricTargets } = require('../../utils/dod-parsing');
const { ArtefactNotFoundError } = require('../adapters/artefact-fetcher');
```

Add a helper near `_getDodAcList`:

```javascript
// ppc-s6 (AC2, AC4): fetches discovery.md/benefit-metric.md tenant-scoped via the
// same _fetchArtefact/_resolveOwnerRepo path ppc-s4 already uses for DoD content --
// each fetch is independent so one missing artefact doesn't blank the other.
async function _fetchSummaryContent(journey, req, pool) {
  var accessToken = req.session && req.session.accessToken;
  var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
  var result = { problemStatement: null, metricTargets: {}, missing: [] };
  if (!ownerRepo || !accessToken) { result.missing.push('discovery.md', 'benefit-metric.md'); return result; }
  try {
    var discoveryContent = await _fetchArtefact(journey.featureSlug, 'discovery', accessToken, ownerRepo);
    result.problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
  } catch (e) {
    if (e instanceof ArtefactNotFoundError) result.missing.push('discovery.md');
  }
  try {
    var benefitContent = await _fetchArtefact(journey.featureSlug, 'benefit-metric', accessToken, ownerRepo);
    result.metricTargets = parseBenefitMetricTargets(benefitContent);
  } catch (e) {
    if (e instanceof ArtefactNotFoundError) result.missing.push('benefit-metric.md');
  }
  return result;
}

function _renderSummaryHtml(summary) {
  var scopeHtml = summary.missing.indexOf('discovery.md') !== -1
    ? '<p class="playback-ac__empty">discovery.md not found in the connected repo.</p>'
    : '<p>' + _escapeHtml(summary.problemStatement || 'No problem statement on file.') + '</p>';
  var benefitHtml = summary.missing.indexOf('benefit-metric.md') !== -1
    ? '<p class="playback-ac__empty">benefit-metric.md not found in the connected repo.</p>'
    : '<ul class="sw-list">' + Object.keys(summary.metricTargets || {}).map(function(name) {
        return '<li>' + _escapeHtml(name) + ': ' + _escapeHtml(summary.metricTargets[name]) + '</li>';
      }).join('') + '</ul>';
  return '<div class="sw-card playback-summary"><h2 class="sw-section-title">Scope</h2>' + scopeHtml +
    '<h2 class="sw-section-title">Benefit</h2>' + benefitHtml + '</div>';
}
```

Wire into `handleGetPlaybackEvidence`'s HTML branch (before building `bodyContent`):

```javascript
var summary = await _fetchSummaryContent(journey, req, pool);
var summaryHtml = _renderSummaryHtml(summary);
var bodyContent = summaryHtml + _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `PASS: T3 ...`, `PASS: T4 ...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s6-dashboard-shell-parity.js
git commit -m "feat(ppc-s6): add tenant-scoped Scope/Benefit summary (AC2, AC4)"
```

---

## Task 3: At-a-glance coverage line (AC3)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s6-dashboard-shell-parity.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
console.log('\n[ppc-s6] AC3: coverage summary line');

queue.push(function() {
  return test('T5 (AC3): coverage line shows "Full coverage" when every AC has evidence, reusing renderCoverageSummaryHtml as-is', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('Full coverage') !== -1, 'single AC, single screenshot captured -> full coverage, reusing the exact wording renderCoverageSummaryHtml already uses');
      assert.ok(res._body.indexOf('playback-coverage-summary--full') !== -1, 'must reuse the existing text-distinct CSS class, not a new one');
    });
  });
});

queue.push(function() {
  return test('T6 (AC3): coverage line shows "0 of N" when nothing is captured', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('0 of 1 ACs have captured evidence yet') !== -1);
    });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `FAIL: T5 ...` / `FAIL: T6 ...` (no coverage line exists yet).

- [ ] **Step 3: Write minimal implementation**

Add a small adapter (ppc's own `acs` array → `computeAcCoverageSummary`'s expected `{stories:[{acRows:[...]}]}` shape, reusing both functions exactly as AC3 specifies, no change to either):

```javascript
function _coverageSummaryHtmlForAcs(acs) {
  var structure = { stories: [{ acRows: acs.map(function(ac) {
    return { acId: ac.acId, media: { screenshotPath: ac.screenshotPath, videoPath: ac.videoPath } };
  }) }] };
  return renderCoverageSummaryHtml(computeAcCoverageSummary(structure));
}
```

Wire into `handleGetPlaybackEvidence`'s HTML branch, right after `summaryHtml`:

```javascript
var coverageSummaryHtml = _coverageSummaryHtmlForAcs(acs);
var bodyContent = summaryHtml + coverageSummaryHtml + _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `PASS: T5 ...`, `PASS: T6 ...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s6-dashboard-shell-parity.js
git commit -m "feat(ppc-s6): add at-a-glance coverage line, reusing renderCoverageSummaryHtml (AC3)"
```

---

## Task 4: Responsive single-column stack below 768px (AC6)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s6-dashboard-shell-parity.js` (append)

- [ ] **Step 1: Write the failing test**

```javascript
console.log('\n[ppc-s6] AC6: responsive Scope/Benefit layout');

queue.push(function() {
  return test('T7 (AC6): Scope/Benefit summary declares an explicit @media (max-width: 768px) single-column override', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('@media (max-width: 768px)') !== -1 || res._body.indexOf('@media(max-width:768px)') !== -1,
        'DESIGN.md requires an explicit breakpoint override when Scope/Benefit render as multi-column — "not specified is not a valid shipped state"');
    });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `FAIL: T7 ...` (no `@media` rule exists yet — Scope/Benefit currently renders as a single stacked `.sw-card`, not an explicit multi-column grid with a documented override).

- [ ] **Step 3: Write minimal implementation**

Update `_renderSummaryHtml` to lay out Scope and Benefit as a 2-column grid at desktop width with an explicit single-column override below 768px, reusing `DESIGN.md`'s token-based card styling (no new inline colors):

```javascript
function _renderSummaryHtml(summary) {
  var scopeHtml = /* unchanged from Task 2 */;
  var benefitHtml = /* unchanged from Task 2 */;
  return '<style>.ppc-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}' +
    '@media (max-width: 768px){.ppc-summary-grid{grid-template-columns:1fr}}</style>' +
    '<div class="ppc-summary-grid">' +
      '<div class="sw-card playback-summary"><h2 class="sw-section-title">Scope</h2>' + scopeHtml + '</div>' +
      '<div class="sw-card playback-summary"><h2 class="sw-section-title">Benefit</h2>' + benefitHtml + '</div>' +
    '</div>';
}
```

(Only the wrapping grid/media-query structure is new; the Scope/Benefit inner content from Task 2 is unchanged — split across two cards instead of one, per AC6's own "side by side... stack to a single column" wording.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s6-dashboard-shell-parity.js
```

Expected output: `PASS: T7 ...`

- [ ] **Step 5: Run full suite — no regressions, plus H-DESIGN self-check**

```bash
node scripts/run-all-tests.js
node scripts/check-design-tokens.js src/web-ui/routes/playback-evidence.js --design-md artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md
```

Expected output: all tests passing; design-token scan finds no non-token colors (the grid/media-query CSS added here introduces no new color values at all, only layout).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s6-dashboard-shell-parity.js
git commit -m "feat(ppc-s6): responsive single-column Scope/Benefit layout below 768px (AC6)"
```

---

**After all 4 tasks:** run `/verify-completion` to confirm all 6 ACs end-to-end (including a walkthrough of `verification-scripts/ppc-s6-verification.md` if one exists, or the story's own AC list directly), then `/branch-complete` to open the draft PR.
