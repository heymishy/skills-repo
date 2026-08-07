'use strict';
// check-mgfd-s1-dockerfile-fixture-copy.js -- AC verification tests for mgfd-s1
// (Fix production Dockerfile silently shipping a structurally-active but
// fixture-less mock-LLM-gateway to wuce-staging).
//
// No local Docker daemon is available in this sandbox (`docker version` shows
// a client but no reachable engine) -- these are STATIC assertions against the
// real Dockerfile/.dockerignore content, not a built-image inspection. Real
// container verification (the authoritative check) was performed separately
// via `flyctl ssh console --app wuce-staging` against a real deploy; see
// artefacts/2026-07-23-mock-gateway-fixtures-deploy-fix/decisions.md and the
// PR description for that evidence.
//
// Tests: UT1 (AC1), UT2 (AC2), UT3 (AC1/AC2 consistency)

var fs   = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

var dockerfileContent    = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
var dockerignoreContent  = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8');

// ---------------------------------------------------------------------------
// UT1 (AC1): Dockerfile's production stage COPYs the fixture directory, and
// only that directory, from tests/ -- no broader tests/ COPY exists.
// ---------------------------------------------------------------------------

var copyLines = dockerfileContent
  .split('\n')
  .map(function(l) { return l.trim(); })
  .filter(function(l) { return /^COPY\b/i.test(l); });

var testsCopyLines = copyLines.filter(function(l) { return /\btests\//.test(l); });

check(
  'UT1 (AC1): exactly one COPY line references a tests/ path',
  testsCopyLines.length === 1
);

check(
  'UT1 (AC1): the tests/ COPY line targets tests/e2e/fixtures/llm-gateway/ specifically',
  testsCopyLines.length === 1 &&
  /tests\/e2e\/fixtures\/llm-gateway\//.test(testsCopyLines[0])
);

check(
  'UT1 (AC1): the tests/ COPY line does not copy the bare tests/ root or any other subpath',
  testsCopyLines.length === 1 &&
  !/COPY\s+(--chown=\S+\s+)?tests\/\s/.test(testsCopyLines[0]) &&
  !/tests\/check-/.test(testsCopyLines[0])
);

check(
  'UT1 (AC1): the destination resolves under WORKDIR (/app) to ./tests/e2e/fixtures/llm-gateway/, matching mock-llm-gateway.js\'s FIXTURE_DIR',
  testsCopyLines.length === 1 &&
  /\.\/tests\/e2e\/fixtures\/llm-gateway\/?\s*$/.test(testsCopyLines[0])
);

check(
  'UT1 (AC1): the fixture COPY is in the production stage (appears after "FROM node:20-alpine AS production")',
  (function() {
    var prodIdx = dockerfileContent.indexOf('FROM node:20-alpine AS production');
    var copyIdx = dockerfileContent.indexOf('tests/e2e/fixtures/llm-gateway/');
    return prodIdx !== -1 && copyIdx !== -1 && copyIdx > prodIdx;
  })()
);

// ---------------------------------------------------------------------------
// UT2 (AC2): .dockerignore re-includes only tests/e2e/fixtures/llm-gateway/
// under the excluded tests/ tree. Implements the specific, minimal
// dockerignore-pattern semantics this fix relies on: ordered patterns,
// trailing-slash directory matches, and step-wise `!` re-inclusion (an
// ancestor directory that is itself excluded is not resurrected by negating
// only the final nested path -- each intermediate level must be explicitly
// un-excluded in turn). This is NOT a general-purpose dockerignore parser;
// it is scoped to the specific pattern shapes used in this repo's
// .dockerignore. Cross-checked against the real, live wuce-staging container
// (flyctl ssh console) as the authoritative ground truth -- see decisions.md.
// ---------------------------------------------------------------------------

/**
 * Parse .dockerignore content into an ordered list of {negate, pattern} rules,
 * skipping blank lines and comments.
 */
function parseDockerignore(content) {
  return content
    .split('\n')
    .map(function(l) { return l.trim(); })
    .filter(function(l) { return l.length > 0 && l[0] !== '#'; })
    .map(function(l) {
      var negate = l[0] === '!';
      var pattern = negate ? l.slice(1) : l;
      return { negate: negate, pattern: pattern };
    });
}

/**
 * Does `pattern` match `filePath` under the specific semantics this repo's
 * .dockerignore uses?
 *  - A pattern ending in '/' matches that directory and everything beneath it.
 *  - A pattern ending in '/*' matches only DIRECT children of that directory
 *    (one path segment below it) -- not deeper descendants.
 *  - A bare pattern (no trailing slash, no wildcard) matches that exact path
 *    and, if it names a directory, everything beneath it (dir-exclude form).
 */
function patternMatches(pattern, filePath) {
  if (pattern.endsWith('/*')) {
    var dir = pattern.slice(0, -2).replace(/\/$/, '');
    if (!filePath.startsWith(dir + '/')) return false;
    var rest = filePath.slice(dir.length + 1);
    return rest.length > 0 && rest.indexOf('/') === -1;
  }
  if (pattern.endsWith('/')) {
    var dirBare = pattern.slice(0, -1);
    return filePath === dirBare || filePath.startsWith(dirBare + '/');
  }
  // bare pattern: exact match or directory-prefix match
  return filePath === pattern || filePath.startsWith(pattern + '/');
}

/**
 * Evaluate the ordered rule list against filePath: the LAST matching rule
 * wins (standard gitignore/dockerignore precedence). Returns true if
 * filePath is excluded.
 */
function isExcluded(rules, filePath) {
  var excluded = false;
  rules.forEach(function(rule) {
    if (patternMatches(rule.pattern, filePath)) {
      excluded = !rule.negate;
    }
  });
  return excluded;
}

var rules = parseDockerignore(dockerignoreContent);

// Real fixture files (16 expected per mgfd-s1 story / bri-s3.1's fixture matrix).
var fixtureDir = path.join(ROOT, 'tests', 'e2e', 'fixtures', 'llm-gateway');
var realFixtureFiles = fs.existsSync(fixtureDir)
  ? fs.readdirSync(fixtureDir)
      .filter(function(f) { return f.endsWith('.json'); })
      .map(function(f) { return 'tests/e2e/fixtures/llm-gateway/' + f; })
  : [];

check(
  'UT2 setup: at least one real fixture file exists under tests/e2e/fixtures/llm-gateway/',
  realFixtureFiles.length > 0
);

var allFixturesIncluded = realFixtureFiles.length > 0 && realFixtureFiles.every(function(f) {
  return !isExcluded(rules, f);
});

check(
  'UT2 (AC2): every real file under tests/e2e/fixtures/llm-gateway/ is INCLUDED by .dockerignore',
  allFixturesIncluded
);

var controlPaths = [
  'tests/check-cuf-s1-credits-upsert-fix.js',
  'tests/e2e/a3-product-feature-ideate-canvas.spec.js',
  'tests/e2e/fixtures/admin-credits-topup.js'
];

controlPaths.forEach(function(p) {
  check(
    'UT2 (AC2): sibling path "' + p + '" remains EXCLUDED by .dockerignore (fix is scoped, not a blanket tests/ re-inclusion)',
    isExcluded(rules, p)
  );
});

// ---------------------------------------------------------------------------
// UT3 (AC1/AC2 consistency): mock-llm-gateway.js's own inventoryFixtures()
// file list is fully covered by the .dockerignore inclusion set -- nothing
// the running module expects to find at runtime is left behind.
// ---------------------------------------------------------------------------

var mockGateway = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'mock-llm-gateway'));
var inventory = mockGateway.inventoryFixtures();
var inventoryFiles = [];
Object.keys(inventory.byStage).forEach(function(stage) {
  inventory.byStage[stage].files.forEach(function(f) {
    inventoryFiles.push('tests/e2e/fixtures/llm-gateway/' + f);
  });
});

check(
  'UT3 setup: inventoryFixtures() reports at least one file',
  inventoryFiles.length > 0
);

var allInventoryIncluded = inventoryFiles.length > 0 && inventoryFiles.every(function(f) {
  return !isExcluded(rules, f);
});

check(
  'UT3 (AC1/AC2 consistency): every file inventoryFixtures() reports is INCLUDED by the .dockerignore fix',
  allInventoryIncluded
);

console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
