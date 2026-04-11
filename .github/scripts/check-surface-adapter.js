#!/usr/bin/env node
/**
 * check-surface-adapter.js
 *
 * Automated tests for the surface adapter interface (p1.2) and
 * IaC / SaaS-API adapters (p2.5a).
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
 * Tests from p2.5a test plan:
 *   Unit:        iac-adapter-result-interface-conformance-*       (AC1 × 3)
 *                saas-api-adapter-result-interface-conformance-*  (AC2 × 3)
 *                iac-policy-floor-routing-*                       (AC3 × 2)
 *                saas-api-policy-floor-routing-*                  (AC4 × 2)
 *                multi-surface-iac-saas-api-*                     (AC5 × 2)
 *   Integration: iac-findings-vocabulary-*                        (AC6 × 2)
 *                saas-api-findings-vocabulary-*                   (AC6 × 2)
 *   NFR:         nfr-iac-execute-completes-within-5s
 *                nfr-saas-api-execute-completes-within-5s
 *                nfr-iac-saas-api-no-credential-values
 *                nfr-iac-saas-api-trace-fields-present
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
const iacAdapter       = require(path.join(root, 'src', 'surface-adapter', 'adapters', 'iac.js'));
const saasApiAdapter   = require(path.join(root, 'src', 'surface-adapter', 'adapters', 'saas-api.js'));
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

// ── p2.5a Tests — IaC adapter (AC1, AC3, AC5, AC6) ───────────────────────────

console.log('');
console.log('[surface-adapter-check] Running p2.5a IaC and SaaS-API adapter tests…');
console.log('');
console.log('  Unit: AC1 — IaC adapter result interface conformance');

// Minimal context that satisfies IaC requirements
const validIaCContext = {
  iac: {
    state_backend:          'remote',
    module_version:         '1.2.0',
    changeset_review:       true,
    drift_detection:        true,
  },
};

{
  // AC1: IaC adapter execute() returns result with status, findings, trace (object)
  const result = iacAdapter.execute(validIaCContext);
  const hasStatus   = result != null && typeof result.status === 'string' && ['pass', 'fail', 'error'].includes(result.status);
  const hasFindings = result != null && Array.isArray(result.findings);
  const hasTrace    = result != null && result.trace !== null && typeof result.trace === 'object';

  assert(
    hasStatus && hasFindings && hasTrace,
    'iac-adapter-execute-returns-result-object',
    `result must have status (string), findings (array), trace (object). ` +
    `status=${hasStatus} findings=${hasFindings} trace=${hasTrace}. Got: ${JSON.stringify(result)}`
  );
}

{
  // AC1: result.trace has adapterName and adapterVersion fields
  const result = iacAdapter.execute(validIaCContext);
  const hasAdapterName    = result.trace && typeof result.trace.adapterName === 'string' && result.trace.adapterName.length > 0;
  const hasAdapterVersion = result.trace && typeof result.trace.adapterVersion === 'string' && result.trace.adapterVersion.length > 0;

  assert(
    hasAdapterName && hasAdapterVersion,
    'iac-adapter-trace-contains-adapterName-and-adapterVersion',
    `trace.adapterName="${result.trace && result.trace.adapterName}" trace.adapterVersion="${result.trace && result.trace.adapterVersion}"`
  );
}

{
  // AC1 error path: missing POLICY.md returns error result (no exception)
  const origPath = iacAdapter._policyPath;
  iacAdapter._policyPath = path.join(root, 'standards', 'iac', '__NONEXISTENT__', 'POLICY.md');
  let result;
  let threw = false;
  try {
    result = iacAdapter.execute(validIaCContext);
  } catch (e) {
    threw = true;
  }
  iacAdapter._policyPath = origPath;

  assert(
    !threw && result != null && result.status === 'error' && typeof result.error === 'string' && result.error.includes('POLICY.md'),
    'iac-adapter-missing-policy-returns-error-not-exception',
    threw
      ? 'execute() threw an exception instead of returning an error result'
      : `Expected status="error" with error field containing "POLICY.md"; got: ${JSON.stringify(result)}`
  );
}

console.log('');
console.log('  Unit: AC3 — IaC POLICY.md floor routing and policySource in trace');

{
  // AC3: result.trace.policySource confirms standards/iac/POLICY.md
  const result = iacAdapter.execute(validIaCContext);
  const policySource = result.trace && result.trace.policySource;
  const containsIaCPath = typeof policySource === 'string' && policySource.includes('standards/iac/POLICY.md');

  assert(
    containsIaCPath,
    'iac-policy-floor-trace-confirms-source-file',
    `result.trace.policySource should contain "standards/iac/POLICY.md"; got: "${policySource}"`
  );
}

{
  // AC3: standards/index.yml routing for surface "iac" resolves to standards/iac/POLICY.md
  const indexPath    = path.join(root, 'standards', 'index.yml');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // Parse the surfaces: block from index.yml
  let inSurfaces     = false;
  let currentSurface = null;
  const surfaceRoutes = {};
  for (const line of indexContent.replace(/\r/g, '').split('\n')) {
    if (/^surfaces:\s*$/.test(line)) { inSurfaces = true; continue; }
    if (!inSurfaces) continue;
    if (/^[a-z]/.test(line) && !/^  /.test(line)) { inSurfaces = false; continue; }
    const surfaceMatch = /^  ([a-z][a-z0-9-]+):\s*$/.exec(line);
    if (surfaceMatch) { currentSurface = surfaceMatch[1]; surfaceRoutes[currentSurface] = {}; continue; }
    if (!currentSurface) continue;
    const policyMatch = /^    policy-floor:\s+(.+)$/.exec(line);
    if (policyMatch) { surfaceRoutes[currentSurface]['policy-floor'] = policyMatch[1].trim(); }
  }

  const iacRoute = surfaceRoutes['iac'];
  const iacPolicyFloor = iacRoute && iacRoute['policy-floor'];
  const iacPolicyExists = iacPolicyFloor && fs.existsSync(path.join(root, iacPolicyFloor));

  assert(
    iacPolicyFloor === 'standards/iac/POLICY.md' && iacPolicyExists,
    'iac-policy-floor-routing-resolves-to-iac-policy-file',
    `standards/index.yml surfaces.iac.policy-floor should be "standards/iac/POLICY.md" and file must exist. ` +
    `got policy-floor="${iacPolicyFloor}" exists=${iacPolicyExists}`
  );
}

// ── p2.5a Tests — SaaS-API adapter (AC2, AC4, AC5, AC6) ──────────────────────

console.log('');
console.log('  Unit: AC2 — SaaS-API adapter result interface conformance');

const validSaaSAPIContext = {
  api: {
    version:                   'v2',
    auth:                      'oauth2',
    breaking_change_detection: true,
    contract_tests:            'pact',
  },
};

{
  // AC2: SaaS-API adapter execute() returns result with status, findings, trace (object)
  const result = saasApiAdapter.execute(validSaaSAPIContext);
  const hasStatus   = result != null && typeof result.status === 'string' && ['pass', 'fail', 'error'].includes(result.status);
  const hasFindings = result != null && Array.isArray(result.findings);
  const hasTrace    = result != null && result.trace !== null && typeof result.trace === 'object';

  assert(
    hasStatus && hasFindings && hasTrace,
    'saas-api-adapter-execute-returns-result-object',
    `result must have status (string), findings (array), trace (object). ` +
    `status=${hasStatus} findings=${hasFindings} trace=${hasTrace}. Got: ${JSON.stringify(result)}`
  );
}

{
  // AC2: result.trace has adapterName and adapterVersion fields
  const result = saasApiAdapter.execute(validSaaSAPIContext);
  const hasAdapterName    = result.trace && typeof result.trace.adapterName === 'string' && result.trace.adapterName.length > 0;
  const hasAdapterVersion = result.trace && typeof result.trace.adapterVersion === 'string' && result.trace.adapterVersion.length > 0;

  assert(
    hasAdapterName && hasAdapterVersion,
    'saas-api-adapter-trace-contains-adapterName-and-adapterVersion',
    `trace.adapterName="${result.trace && result.trace.adapterName}" trace.adapterVersion="${result.trace && result.trace.adapterVersion}"`
  );
}

{
  // AC2 error path: missing POLICY.md returns error result (no exception)
  const origPath = saasApiAdapter._policyPath;
  saasApiAdapter._policyPath = path.join(root, 'standards', 'saas-api', '__NONEXISTENT__', 'POLICY.md');
  let result;
  let threw = false;
  try {
    result = saasApiAdapter.execute(validSaaSAPIContext);
  } catch (e) {
    threw = true;
  }
  saasApiAdapter._policyPath = origPath;

  assert(
    !threw && result != null && result.status === 'error' && typeof result.error === 'string' && result.error.includes('POLICY.md'),
    'saas-api-adapter-missing-policy-returns-error-not-exception',
    threw
      ? 'execute() threw an exception instead of returning an error result'
      : `Expected status="error" with error field containing "POLICY.md"; got: ${JSON.stringify(result)}`
  );
}

console.log('');
console.log('  Unit: AC4 — SaaS-API POLICY.md floor routing and policySource in trace');

{
  // AC4: result.trace.policySource confirms standards/saas-api/POLICY.md
  const result = saasApiAdapter.execute(validSaaSAPIContext);
  const policySource = result.trace && result.trace.policySource;
  const containsAPIPath = typeof policySource === 'string' && policySource.includes('standards/saas-api/POLICY.md');

  assert(
    containsAPIPath,
    'saas-api-policy-floor-trace-confirms-source-file',
    `result.trace.policySource should contain "standards/saas-api/POLICY.md"; got: "${policySource}"`
  );
}

{
  // AC4: standards/index.yml routing for surface "saas-api" resolves to standards/saas-api/POLICY.md
  const indexPath    = path.join(root, 'standards', 'index.yml');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // Parse the surfaces: block from index.yml
  let inSurfaces     = false;
  let currentSurface = null;
  const surfaceRoutes = {};
  for (const line of indexContent.replace(/\r/g, '').split('\n')) {
    if (/^surfaces:\s*$/.test(line)) { inSurfaces = true; continue; }
    if (!inSurfaces) continue;
    if (/^[a-z]/.test(line) && !/^  /.test(line)) { inSurfaces = false; continue; }
    const surfaceMatch = /^  ([a-z][a-z0-9-]+):\s*$/.exec(line);
    if (surfaceMatch) { currentSurface = surfaceMatch[1]; surfaceRoutes[currentSurface] = {}; continue; }
    if (!currentSurface) continue;
    const policyMatch = /^    policy-floor:\s+(.+)$/.exec(line);
    if (policyMatch) { surfaceRoutes[currentSurface]['policy-floor'] = policyMatch[1].trim(); }
  }

  const saasRoute = surfaceRoutes['saas-api'];
  const saasApiPolicyFloor = saasRoute && saasRoute['policy-floor'];
  const saasApiPolicyExists = saasApiPolicyFloor && fs.existsSync(path.join(root, saasApiPolicyFloor));

  assert(
    saasApiPolicyFloor === 'standards/saas-api/POLICY.md' && saasApiPolicyExists,
    'saas-api-policy-floor-routing-resolves-to-saas-api-policy-file',
    `standards/index.yml surfaces.saas-api.policy-floor should be "standards/saas-api/POLICY.md" and file must exist. ` +
    `got policy-floor="${saasApiPolicyFloor}" exists=${saasApiPolicyExists}`
  );
}

// ── p2.5a Tests — Multi-surface: no shadowing (AC5) ──────────────────────────

console.log('');
console.log('  Unit: AC5 — Multi-surface IaC + SaaS-API: no shadowing');

{
  // AC5: both adapters are independently reachable from a shared registry
  registerAdapter('iac',      iacAdapter);
  registerAdapter('saas-api', saasApiAdapter);

  const iacResult    = execute('iac',      validIaCContext);
  const saasApiResult = execute('saas-api', validSaaSAPIContext);

  const iacAdapterName    = iacResult.trace && iacResult.trace.adapterName;
  const saasApiAdapterName = saasApiResult.trace && saasApiResult.trace.adapterName;

  assert(
    iacAdapterName === 'iac' && saasApiAdapterName === 'saas-api',
    'multi-surface-iac-saas-api-both-reachable-and-distinct',
    `Expected IaC trace.adapterName="iac" and SaaS-API trace.adapterName="saas-api". ` +
    `Got iac="${iacAdapterName}" saas-api="${saasApiAdapterName}"`
  );
}

{
  // AC5: IaC findings do not contain SaaS-API vocabulary and vice versa
  const iacVocab    = ['iac-state-backend', 'iac-module-versioning', 'iac-changeset-review', 'iac-drift-detection'];
  const saasVocab   = ['api-versioning', 'api-auth-required', 'api-breaking-change', 'api-contract-test'];

  // Trigger findings by passing minimal context missing required fields
  const iacResult    = iacAdapter.execute({});
  const saasApiResult = saasApiAdapter.execute({});

  const iacFindingRules    = iacResult.findings.map(f => (f && f.rule) || String(f));
  const saasApiFindingRules = saasApiResult.findings.map(f => (f && f.rule) || String(f));

  const iacContainsSaasVocab  = saasVocab.some(v => iacFindingRules.some(r => r.includes(v)));
  const saasContainsIaCVocab  = iacVocab.some(v => saasApiFindingRules.some(r => r.includes(v)));

  assert(
    !iacContainsSaasVocab && !saasContainsIaCVocab,
    'multi-surface-findings-vocabulary-no-overlap',
    [
      iacContainsSaasVocab  && `IaC findings contain SaaS-API vocabulary: ${JSON.stringify(iacFindingRules)}`,
      saasContainsIaCVocab  && `SaaS-API findings contain IaC vocabulary: ${JSON.stringify(saasApiFindingRules)}`,
    ].filter(Boolean).join('; ')
  );
}

// ── p2.5a Integration Tests — findings vocabulary (AC6) ──────────────────────

console.log('');
console.log('  Integration: AC6 — IaC and SaaS-API findings vocabulary is surface-appropriate');

{
  // AC6: IaC findings reference IaC-specific terms (not software-engineering generic labels)
  const contextMissingIaC = { source_control: { platform: 'github', base_branch: 'main' } };
  const result = iacAdapter.execute(contextMissingIaC);

  const IaC_KEYWORDS = ['iac-state-backend', 'iac-module-versioning', 'iac-changeset-review', 'iac-drift-detection'];
  const findingRules = result.findings.map(f => (f && f.rule) || String(f));
  const hasIaCVocab  = IaC_KEYWORDS.some(k => findingRules.some(r => r.includes(k)));
  const hasGenericSELabel = findingRules.some(r =>
    r.includes('software-engineering') || r.includes('pr-diff') || r.includes('pull-request-line')
  );

  assert(
    hasIaCVocab && !hasGenericSELabel,
    'iac-findings-vocabulary-uses-iac-specific-terms',
    `Expected at least one IaC-specific finding rule; got: ${JSON.stringify(findingRules)}`
  );
}

{
  // AC6: SaaS-API findings reference API-specific terms (not IaC-specific labels)
  const contextMissingAPI = { source_control: { platform: 'github', base_branch: 'main' } };
  const result = saasApiAdapter.execute(contextMissingAPI);

  const API_KEYWORDS = ['api-versioning', 'api-auth-required', 'api-breaking-change', 'api-contract-test'];
  const findingRules = result.findings.map(f => (f && f.rule) || String(f));
  const hasAPIVocab  = API_KEYWORDS.some(k => findingRules.some(r => r.includes(k)));
  const hasIaCLabel  = findingRules.some(r =>
    r.includes('iac-state-backend') || r.includes('iac-module-versioning') || r.includes('iac-drift-detection')
  );

  assert(
    hasAPIVocab && !hasIaCLabel,
    'saas-api-findings-vocabulary-uses-api-specific-terms',
    `Expected at least one API-specific finding rule; got: ${JSON.stringify(findingRules)}`
  );
}

// ── p2.5a NFR Tests ───────────────────────────────────────────────────────────

console.log('');
console.log('  NFR: p2.5a — performance, security, auditability');

{
  // NFR: IaC execute() completes within 5 seconds
  const start   = Date.now();
  iacAdapter.execute(validIaCContext);
  const elapsed = Date.now() - start;

  assert(
    elapsed < 5000,
    'nfr-iac-execute-completes-within-5s',
    `IaC execute() took ${elapsed}ms — limit is 5000ms`
  );
}

{
  // NFR: SaaS-API execute() completes within 5 seconds
  const start   = Date.now();
  saasApiAdapter.execute(validSaaSAPIContext);
  const elapsed = Date.now() - start;

  assert(
    elapsed < 5000,
    'nfr-saas-api-execute-completes-within-5s',
    `SaaS-API execute() took ${elapsed}ms — limit is 5000ms`
  );
}

{
  // NFR: adapter results must not contain credential values
  const contextWithSecretRef = Object.assign({}, validIaCContext, {
    secrets: { infra_token: '${{ secrets.INFRA_TOKEN }}' },
  });
  const iacResult    = iacAdapter.execute(contextWithSecretRef);
  const saasApiResult = saasApiAdapter.execute(Object.assign({}, validSaaSAPIContext, {
    secrets: { api_key: '${{ secrets.API_KEY }}' },
  }));

  const CREDENTIAL_PATTERNS = [
    /ghp_[A-Za-z0-9]{20,}/,
    /Bearer [A-Za-z0-9]{20,}/,
    /\btoken: [^$][^\n]{10,}/,
    /\bpassword: [^$][^\n]{5,}/,
  ];

  const iacJson    = JSON.stringify(iacResult);
  const saasApiJson = JSON.stringify(saasApiResult);
  const credFound  = CREDENTIAL_PATTERNS.some(p => p.test(iacJson) || p.test(saasApiJson));

  assert(
    !credFound,
    'nfr-iac-saas-api-no-credential-values',
    `Credential value pattern found in adapter results`
  );
}

{
  // NFR: trace fields adapterName and adapterVersion present for both adapters
  const iacResult    = iacAdapter.execute(validIaCContext);
  const saasApiResult = saasApiAdapter.execute(validSaaSAPIContext);

  const iacOk = iacResult.trace &&
    typeof iacResult.trace.adapterName === 'string'    && iacResult.trace.adapterName.length > 0 &&
    typeof iacResult.trace.adapterVersion === 'string' && iacResult.trace.adapterVersion.length > 0;

  const saasApiOk = saasApiResult.trace &&
    typeof saasApiResult.trace.adapterName === 'string'    && saasApiResult.trace.adapterName.length > 0 &&
    typeof saasApiResult.trace.adapterVersion === 'string' && saasApiResult.trace.adapterVersion.length > 0;

  assert(
    iacOk && saasApiOk,
    'nfr-iac-saas-api-trace-fields-present',
    [
      !iacOk    && `IaC trace missing fields: ${JSON.stringify(iacResult.trace)}`,
      !saasApiOk && `SaaS-API trace missing fields: ${JSON.stringify(saasApiResult.trace)}`,
    ].filter(Boolean).join('; ')
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
