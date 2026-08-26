'use strict';

// tests/check-pncg-s1-nav-coverage-structural.js — pncg-s1
// Structural coverage check for all 22 confirmed call sites fixed by this
// story (see artefacts/2026-08-26-products-nav-coverage-gap/). Every real
// site was re-read from source before writing this manifest -- the story's
// own test-plan manifest table ("Structural Test" section) was treated as a
// starting point only, since the real implementation diverged from it in
// several rows (see decisions.md / story notes).
//
// Two verification categories, per how each site was actually fixed:
//
// Category A -- the handler itself makes a direct call whose text contains
// the substring "renderShellWithNav(" (either the literal function name, or
// journey.js's local `_renderShellWithNav` alias imported from products.js --
// substring matching intentionally catches both). Checked by extracting the
// exact function body (brace-depth counting, not a fixed line offset) and
// asserting an exact occurrence count, plus that `pool` is reachable (a
// direct parameter, or -- team-management.js's two functions only -- via the
// enclosing createTeamManagementHandlers(pool) factory closure).
//
// Category B -- the handler fetches getProductsNavSummary(...) itself and
// threads the result into a separate pure render-helper function, which
// threads it into ITS OWN _htmlShell.renderShell(...) call. No
// renderShellWithNav( call exists anywhere in this category -- that is
// expected and correct, not a gap. Checked by asserting the handler's body
// contains a getProductsNavSummary( call, and the render-helper's body
// contains both `products:` and `noProductJourneyCount:` inside its own
// _htmlShell.renderShell( call.

var fs = require('fs');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var ROUTES_DIR = path.resolve(__dirname, '../src/web-ui/routes');

var _sourceCache = {};
function readSource(file) {
  if (!_sourceCache[file]) {
    _sourceCache[file] = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');
  }
  return _sourceCache[file];
}

/**
 * Locate a top-level function declaration named `name` (optionally preceded
 * by `async`) and return its full extent via brace-depth counting -- not a
 * fixed line offset, since several target functions (e.g. journey.js's
 * handleGetWizard) are hundreds of lines long with many internal nested
 * braces. Strings (single/double/template) and comments are tracked so a
 * brace character inside a string literal or comment never perturbs the
 * depth count. Template-literal ${...} interpolations are treated as opaque
 * (their internal braces are never counted) -- safe for this purpose because
 * we only need the OUTER function boundary, and this codebase's template
 * literals never contain a literal backtick inside an interpolation.
 * @param {string} source
 * @param {string} name
 * @returns {{signature: string, body: string, start: number, end: number}}
 */
function extractFunction(source, name) {
  var declRe = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(');
  var m = declRe.exec(source);
  if (!m) {
    throw new Error('could not find declaration of function ' + name);
  }
  var declStart = m.index;
  var parenStart = source.indexOf('(', declStart);

  // Walk the parameter list to its matching close-paren.
  var pDepth = 0;
  var i = parenStart;
  for (; i < source.length; i++) {
    if (source[i] === '(') pDepth++;
    else if (source[i] === ')') {
      pDepth--;
      if (pDepth === 0) { i++; break; }
    }
  }
  var signature = source.slice(declStart, i);

  var braceStart = source.indexOf('{', i);
  if (braceStart === -1) {
    throw new Error('could not find opening brace for function ' + name);
  }

  var depth = 0;
  var inSingle = false, inDouble = false, inTemplate = false;
  var inLineComment = false, inBlockComment = false;
  var end = -1;

  for (var idx = braceStart; idx < source.length; idx++) {
    var ch = source[idx];
    var prevCh = source[idx - 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '/' && prevCh === '*') inBlockComment = false;
      continue;
    }
    if (inSingle) {
      if (ch === '\\') { idx++; continue; }
      if (ch === '\'') inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '\\') { idx++; continue; }
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '\\') { idx++; continue; }
      if (ch === '`') inTemplate = false;
      continue;
    }

    if (ch === '/' && source[idx + 1] === '/') { inLineComment = true; continue; }
    if (ch === '/' && source[idx + 1] === '*') { inBlockComment = true; continue; }
    if (ch === '\'') { inSingle = true; continue; }
    if (ch === '"') { inDouble = true; continue; }
    if (ch === '`') { inTemplate = true; continue; }

    if (ch === '{') { depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0) { end = idx; break; }
      continue;
    }
  }

  if (end === -1) {
    throw new Error('could not find matching closing brace for function ' + name);
  }

  return {
    signature: signature,
    body: source.slice(braceStart, end + 1),
    start: declStart,
    end: end
  };
}

function countOccurrences(haystack, needle) {
  var count = 0;
  var idx = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) break;
    count++;
    idx += needle.length;
  }
  return count;
}

// ── Manifest ────────────────────────────────────────────────────────────────
// Every row below was verified against the real, current source (not the
// story's original test-plan table) before being written here.

var CATEGORY_A = [
  // products.js -- 2 renderShellWithNav( call sites, both with `pool` as a direct param.
  { file: 'products.js', fn: 'handleGetOrgKanban', expectedCount: 1, poolAccess: 'param' },
  { file: 'products.js', fn: 'handleGetProductKanban', expectedCount: 1, poolAccess: 'param' },

  // journey.js -- 6 functions / 8 call sites. All 6 take `pool` as a direct
  // param. The call text is `_renderShellWithNav(` (a local alias imported
  // from products.js's renderShellWithNav) -- substring matching on
  // "renderShellWithNav(" intentionally still catches this.
  { file: 'journey.js', fn: 'handleGetStageReview', expectedCount: 1, poolAccess: 'param' },
  { file: 'journey.js', fn: 'handleGetReferenceModal', expectedCount: 1, poolAccess: 'param' },
  { file: 'journey.js', fn: 'handleGetReference', expectedCount: 1, poolAccess: 'param' },
  { file: 'journey.js', fn: 'handleGetStories', expectedCount: 1, poolAccess: 'param' },
  { file: 'journey.js', fn: 'handleGetJourneyById', expectedCount: 1, poolAccess: 'param' },
  { file: 'journey.js', fn: 'handleGetWizard', expectedCount: 3, poolAccess: 'param' },

  // team-management.js -- 2 functions, neither takes `pool` directly; both
  // are declared inside createTeamManagementHandlers(pool)'s closure.
  { file: 'team-management.js', fn: 'handleGetTeamMembers', expectedCount: 1, poolAccess: 'factory', factoryFn: 'createTeamManagementHandlers' },
  { file: 'team-management.js', fn: 'handleGetCreateInviteForm', expectedCount: 1, poolAccess: 'factory', factoryFn: 'createTeamManagementHandlers' },

  { file: 'admin-credits.js', fn: 'adminCreditsGet', expectedCount: 1, poolAccess: 'param' },
  { file: 'admin-mock-gateway.js', fn: 'adminMockGatewayGet', expectedCount: 1, poolAccess: 'param' },

  // artefact.js -- handleArtefactRoute has 2 renderShellWithNav( calls (the
  // GitHub-sourced success branch and the Postgres-fallback success branch).
  // The same function also has 2 unrelated plain renderShell( calls (404 and
  // 503 error branches) which must NOT be converted and must NOT count here
  // -- countOccurrences only matches the literal "renderShellWithNav("
  // substring, so the plain renderShell( calls are correctly excluded.
  { file: 'artefact.js', fn: 'handleArtefactRoute', expectedCount: 2, poolAccess: 'param' },

  { file: 'billing.js', fn: 'handleGetBillingSuccess', expectedCount: 1, poolAccess: 'param' },

  // features.js -- handleGetFeatureArtefacts has exactly 1 renderShellWithNav(
  // call in its HTML-rendering branch; a separate JSON-response branch in the
  // same function is untouched and irrelevant to this check.
  { file: 'features.js', fn: 'handleGetFeatureArtefacts', expectedCount: 1, poolAccess: 'param' }
];

var CATEGORY_B = [
  { file: 'products.js', handlerFn: 'handleGetProductNew', renderFn: '_renderProductNew' },
  { file: 'products.js', handlerFn: 'handleGetProductRoadmap', renderFn: '_renderRoadmapTab' },
  { file: 'products.js', handlerFn: 'handleGetGuardrailsForm', renderFn: '_renderGuardrailsForm' },
  { file: 'settings.js', handlerFn: 'handleGetSettings', renderFn: 'renderSettingsPage' }
];

(function() {
  // Sanity: 15 Category A functions (18 call sites) + 4 Category B functions
  // (19 total functions) = matches the story's confirmed 22 call sites
  // (18 renderShellWithNav( calls + 4 getProductsNavSummary(-into-render-helper
  // call sites).
  assertTrue(CATEGORY_A.length + CATEGORY_B.length === 19, 'expected 19 total functions in the manifest');
  var totalCatACalls = CATEGORY_A.reduce(function(sum, e) { return sum + e.expectedCount; }, 0);
  assertTrue(totalCatACalls === 18, 'expected 18 total Category A renderShellWithNav( call sites, got ' + totalCatACalls);
})();

(async function() {
  for (var a = 0; a < CATEGORY_A.length; a++) {
    await (function(entry) {
      return test(entry.file + '::' + entry.fn + ' -- Category A structural check', function() {
        var source = readSource(entry.file);
        var extracted = extractFunction(source, entry.fn);

        var actualCount = countOccurrences(extracted.body, 'renderShellWithNav(');
        assertTrue(
          actualCount === entry.expectedCount,
          'expected exactly ' + entry.expectedCount + ' renderShellWithNav( call(s) in ' + entry.fn + ', found ' + actualCount
        );

        if (entry.poolAccess === 'param') {
          assertTrue(/\bpool\b/.test(extracted.signature), entry.fn + ' must take `pool` as a direct parameter');
        } else if (entry.poolAccess === 'factory') {
          var factory = extractFunction(source, entry.factoryFn);
          assertTrue(/\bpool\b/.test(factory.signature), entry.factoryFn + ' must take `pool` as a direct parameter');
          assertTrue(
            extracted.start >= factory.start && extracted.end <= factory.end,
            entry.fn + ' must be declared inside ' + entry.factoryFn + '\'s closure'
          );
        } else {
          throw new Error('unknown poolAccess mode: ' + entry.poolAccess);
        }
      });
    })(CATEGORY_A[a]);
  }

  for (var b = 0; b < CATEGORY_B.length; b++) {
    await (function(entry) {
      return test(entry.file + '::' + entry.handlerFn + ' / ' + entry.renderFn + ' -- Category B structural check', function() {
        var source = readSource(entry.file);

        var handler = extractFunction(source, entry.handlerFn);
        assertTrue(
          handler.body.indexOf('getProductsNavSummary(') !== -1,
          entry.handlerFn + ' must call getProductsNavSummary( itself'
        );

        var renderHelper = extractFunction(source, entry.renderFn);
        var shellCallIdx = renderHelper.body.indexOf('_htmlShell.renderShell(');
        assertTrue(shellCallIdx !== -1, entry.renderFn + ' must call _htmlShell.renderShell( itself');
        var shellCallOnward = renderHelper.body.slice(shellCallIdx);
        assertTrue(shellCallOnward.indexOf('products:') !== -1, entry.renderFn + '\'s _htmlShell.renderShell( call must pass a `products:` key');
        assertTrue(shellCallOnward.indexOf('noProductJourneyCount:') !== -1, entry.renderFn + '\'s _htmlShell.renderShell( call must pass a `noProductJourneyCount:` key');

        // Category B is defined by the ABSENCE of any renderShellWithNav( call
        // in the handler -- confirm that invariant holds, so a future edit
        // that silently re-adds one (making this row's classification stale)
        // is caught rather than silently ignored.
        assertTrue(
          handler.body.indexOf('renderShellWithNav(') === -1,
          entry.handlerFn + ' is classified Category B (no renderShellWithNav( call expected) -- found one; the manifest classification may now be stale'
        );
      });
    })(CATEGORY_B[b]);
  }

  console.log('\n[pncg-s1] Structural coverage results (' + (CATEGORY_A.length + CATEGORY_B.length) + ' sites checked): ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
