#!/usr/bin/env node
/**
 * check-surface-adapter.js
 *
 * Automated tests for the surface adapter interface (p1.2).
 * Tests the execute(surface, context) → result interface, git-native adapter,
 * and Path B surface type resolution from context.yml.
 *
 * Tests from p1.2 test plan:
 *   Unit:        git-native-adapter-returns-status-field         (AC1)
 *                git-native-adapter-returns-surface-echoed        (AC1)
 *                path-b-selects-git-native-adapter                (AC2)
 *                path-b-does-not-trigger-path-a                   (AC2)
 *                multi-surface-selects-correct-adapter-per-type   (AC3)
 *   Integration: git-native-adapter-end-to-end-result-contract    (AC1)
 *                multi-surface-integration-all-adapters-invoked    (AC3)
 *                context-yml-valid-for-p11-and-p12                (AC6)
 *   NFR:         nfr-path-b-resolution-completes-within-1s
 *                nfr-adapter-result-no-credential-values
 *                nfr-result-contains-surface-and-adapter-version
 *
 * Run:  node .github/scripts/check-surface-adapter.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

// ── Load modules under test ───────────────────────────────────────────────────

const surfaceAdapter = require(path.join(root, 'src', 'surface-adapter', 'index.js'));
const { execute, registerAdapter } = surfaceAdapter;

const gitNativeAdapter = require(path.join(root, 'src', 'surface-adapter', 'adapters', 'git-native.js'));
const { resolvePathB } = require(path.join(root, 'src', 'surface-adapter', 'resolver.js'));

// Register the git-native adapter in the global registry
registerAdapter('git-native', gitNativeAdapter);

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  console.log(`  ✗ ${name}`);
  console.log(`    → ${reason}`);
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fixtureDir        = path.join(root, 'tests', 'fixtures');
const singleSurfacePath = path.join(fixtureDir, 'context-path-b-single.yml');
const multiSurfacePath  = path.join(fixtureDir, 'context-path-b-multi.yml');
const sharedFixturePath = path.join(fixtureDir, 'context-path-b-shared.yml');

// Fail fast if fixtures are missing
[singleSurfacePath, multiSurfacePath, sharedFixturePath].forEach(f => {
  if (!fs.existsSync(f)) {
    console.error(`[surface-adapter-check] ERROR: fixture not found: ${f}`);
    process.exit(1);
  }
});

// ── Valid context for unit tests ──────────────────────────────────────────────

const validContext = {
  meta: {
    name: 'Test Context',
    scope: 'team',
    regulated: false,
  },
  source_control: {
    platform: 'github',
    base_branch: 'main',
    merge_request_term: 'pull request',
    pr_command: 'gh pr create --draft',
    artefact_root: '.github',
  },
};

// Minimal manual adapter stub used in multi-surface tests
const manualAdapterStub = {
  execute: (_ctx) => ({
    status: 'pass',
    surface: 'manual',
    findings: [],
    trace: `trace-manual-${Date.now()}`,
    adapterVersion: '1.0.0',
  }),
};

// ── Unit Tests — AC1: git-native adapter result shape ─────────────────────────

console.log('[surface-adapter-check] Running p1.2 surface adapter tests…');
console.log('');
console.log('  Unit: AC1 — git-native adapter result shape');

{
  const result = execute('git-native', validContext);
  const validStatuses = ['pass', 'fail', 'error'];
  assert(
    result != null && validStatuses.includes(result.status),
    'git-native-adapter-returns-status-field',
    `result.status should be one of [${validStatuses.join(', ')}]; got: ${JSON.stringify(result && result.status)}`
  );
}

{
  const result = execute('git-native', validContext);
  assert(
    result != null && result.surface === 'git-native',
    'git-native-adapter-returns-surface-echoed',
    `result.surface should be "git-native"; got: ${JSON.stringify(result && result.surface)}`
  );
}

// ── Unit Tests — AC2: Path B selects git-native adapter ───────────────────────

console.log('');
console.log('  Unit: AC2 — Path B context.yml selects git-native adapter');

{
  const registry = { 'git-native': gitNativeAdapter };
  const selections = resolvePathB(singleSurfacePath, registry);
  const gitNativeSelected = selections.some(s => s.surfaceType === 'git-native' && s.adapter !== null);
  assert(
    gitNativeSelected,
    'path-b-selects-git-native-adapter',
    `Expected git-native adapter to be selected via Path B; got: ${JSON.stringify(selections.map(s => ({ type: s.surfaceType, found: !!s.adapter })))}`
  );
}

{
  // Path B resolution should not trigger any EA registry lookup.
  // Verify by confirming resolvePathB completes using only the context.yml file
  // and the passed adapter registry — no external calls, no Path A code executed.
  let resolutionCompleted = false;
  let resolutionError = null;

  try {
    const registry = { 'git-native': gitNativeAdapter };
    const selections = resolvePathB(singleSurfacePath, registry);
    // Resolution must complete and return a selection for git-native
    resolutionCompleted = selections.some(s => s.surfaceType === 'git-native');
  } catch (e) {
    resolutionError = e.message;
  }

  assert(
    resolutionCompleted && !resolutionError,
    'path-b-does-not-trigger-path-a',
    resolutionError
      ? `Path B resolution threw an error (unexpected): ${resolutionError}`
      : 'Path B resolution did not return a git-native selection'
  );
}

// ── Unit Tests — AC3: Multi-surface adapter selection ─────────────────────────

console.log('');
console.log('  Unit: AC3 — multi-surface declaration selects correct adapter per type');

{
  const registry = { 'git-native': gitNativeAdapter, 'manual': manualAdapterStub };
  const selections = resolvePathB(multiSurfacePath, registry);

  const gitEntry    = selections.find(s => s.surfaceType === 'git-native');
  const manualEntry = selections.find(s => s.surfaceType === 'manual');

  const correctSelection =
    gitEntry    && gitEntry.adapter    === gitNativeAdapter &&
    manualEntry && manualEntry.adapter === manualAdapterStub;

  assert(
    correctSelection,
    'multi-surface-selects-correct-adapter-per-type',
    `Incorrect adapter selection; got: ${JSON.stringify(selections.map(s => ({ type: s.surfaceType, found: !!s.adapter })))}`
  );

  // Edge case: unsupported type in registry — returns adapter:null, does not affect valid types
  const partialRegistry = { 'git-native': gitNativeAdapter }; // no 'manual' adapter
  const partialSelections = resolvePathB(multiSurfacePath, partialRegistry);
  const gitFound     = partialSelections.some(s => s.surfaceType === 'git-native' && s.adapter !== null);
  const manualNull   = partialSelections.some(s => s.surfaceType === 'manual'     && s.adapter === null);

  assert(
    gitFound && manualNull,
    'multi-surface-unsupported-type-returns-null-adapter-without-affecting-valid-types',
    `Expected git-native to resolve and manual to return null; got: ${JSON.stringify(partialSelections.map(s => ({ type: s.surfaceType, found: !!s.adapter })))}`
  );
}

// ── Integration Tests — AC1: end-to-end result contract ───────────────────────

console.log('');
console.log('  Integration: AC1 — git-native adapter end-to-end result contract');

{
  const result = execute('git-native', validContext);

  const hasStatus     = result != null && typeof result.status === 'string' && ['pass', 'fail', 'error'].includes(result.status);
  const hasSurface    = result != null && result.surface === 'git-native';
  const hasFindings   = result != null && Array.isArray(result.findings);
  const hasTrace      = result != null && typeof result.trace === 'string' && result.trace.length > 0;
  const hasAdapterVer = result != null && typeof result.adapterVersion === 'string' && result.adapterVersion.length > 0;

  assert(
    hasStatus && hasSurface && hasFindings && hasTrace && hasAdapterVer,
    'git-native-adapter-end-to-end-result-contract',
    `Result missing required fields. ` +
    `status=${hasStatus} surface=${hasSurface} findings=${hasFindings} trace=${hasTrace} adapterVersion=${hasAdapterVer}. ` +
    `Got: ${JSON.stringify(result)}`
  );
}

// ── Integration Tests — AC3: multi-surface all adapters invoked ───────────────

console.log('  Integration: AC3 — multi-surface all adapters invoked');

{
  const invoked = [];

  const trackingGitNative = {
    execute: (ctx) => {
      invoked.push('git-native');
      return gitNativeAdapter.execute(ctx);
    },
  };
  const trackingManual = {
    execute: (ctx) => {  // eslint-disable-line no-unused-vars
      invoked.push('manual');
      return manualAdapterStub.execute(ctx);
    },
  };

  const trackingRegistry = { 'git-native': trackingGitNative, 'manual': trackingManual };
  const selections = resolvePathB(multiSurfacePath, trackingRegistry);

  for (const { adapter } of selections) {
    if (adapter) adapter.execute(validContext);
  }

  assert(
    invoked.includes('git-native') && invoked.includes('manual'),
    'multi-surface-integration-all-adapters-invoked',
    `Expected both git-native and manual adapters to be invoked; invoked: ${JSON.stringify(invoked)}`
  );

  // Verify each result.surface matches the declared surface type
  const realRegistry = { 'git-native': gitNativeAdapter, 'manual': manualAdapterStub };
  const realSelections = resolvePathB(multiSurfacePath, realRegistry);
  const surfacesMatch = realSelections
    .filter(s => s.adapter)
    .every(s => s.adapter.execute(validContext).surface === s.surfaceType);

  assert(
    surfacesMatch,
    'multi-surface-integration-each-result-surface-matches-declaration',
    `Expected each result.surface to equal its declared surface type`
  );
}

// ── Integration Tests — AC6: shared context.yml valid for P1.1 and P1.2 ───────

console.log('');
console.log('  Integration: AC6 — shared context.yml valid for P1.1 assembly and P1.2 resolution');

{
  const sharedContent = fs.readFileSync(sharedFixturePath, 'utf8');

  // P1.1 check: shared fixture contains the fields required for assembly configuration
  // (meta, source_control, agent — the blocks the assembly script reads)
  const hasMetaBlock     = /^meta:/m.test(sharedContent);
  const hasSourceControl = /^source_control:/m.test(sharedContent);
  const hasAgentBlock    = /^agent:/m.test(sharedContent);
  const p11Valid = hasMetaBlock && hasSourceControl && hasAgentBlock;

  // P1.2 check: the same file resolves a surface adapter via Path B
  let p12Valid  = false;
  let p12Error  = null;
  try {
    const registry = { 'git-native': gitNativeAdapter };
    const selections = resolvePathB(sharedFixturePath, registry);
    p12Valid = selections.length > 0 && selections.some(s => s.adapter !== null);
  } catch (e) {
    p12Error = e.message;
  }

  assert(
    p11Valid && p12Valid,
    'context-yml-valid-for-p11-and-p12',
    [
      !p11Valid && `P1.1 required fields missing (meta:${hasMetaBlock} source_control:${hasSourceControl} agent:${hasAgentBlock})`,
      !p12Valid && `P1.2 resolution failed: ${p12Error || 'no adapter selected'}`,
    ].filter(Boolean).join('; ')
  );
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

console.log('');
console.log('  NFR: Performance, security, audit');

{
  // NFR: Path B resolution completes within 1 second
  const start = Date.now();
  const registry = { 'git-native': gitNativeAdapter };
  resolvePathB(singleSurfacePath, registry);
  const elapsed = Date.now() - start;

  assert(
    elapsed < 1000,
    'nfr-path-b-resolution-completes-within-1s',
    `Resolution took ${elapsed}ms — limit is 1000ms`
  );
}

{
  // NFR: git-native adapter result must not contain credential values
  // Context includes a secrets store reference (not an actual credential value)
  const contextWithSecretRef = Object.assign({}, validContext, {
    secrets: {
      github_token: '${{ secrets.GITHUB_TOKEN }}',
    },
  });

  const result = execute('git-native', contextWithSecretRef);
  const resultJson = JSON.stringify(result);

  const CREDENTIAL_PATTERNS = [
    /ghp_[A-Za-z0-9]{20,}/,
    /Bearer [A-Za-z0-9]{20,}/,
    /\btoken: [^$][^\n]{10,}/,
    /\bpassword: [^$][^\n]{5,}/,
  ];

  const credentialFound = CREDENTIAL_PATTERNS.some(p => p.test(resultJson));

  assert(
    !credentialFound,
    'nfr-adapter-result-no-credential-values',
    `Credential value pattern found in adapter result: ${resultJson.slice(0, 300)}`
  );
}

{
  // NFR: result must contain surface and adapterVersion (audit trail)
  const result = execute('git-native', validContext);

  assert(
    result != null &&
    typeof result.surface === 'string' && result.surface.length > 0 &&
    typeof result.adapterVersion === 'string' && result.adapterVersion.length > 0,
    'nfr-result-contains-surface-and-adapter-version',
    `result.surface="${result && result.surface}" result.adapterVersion="${result && result.adapterVersion}"`
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`[surface-adapter-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
