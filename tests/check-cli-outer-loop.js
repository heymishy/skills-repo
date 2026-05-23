#!/usr/bin/env node
// check-cli-outer-loop.js — test plan verification for cdg.1
// Covers T1–T7b (AC1–AC6), IT1a–IT2b (AC3 integration), NFR1–NFR3
// Tests FAIL until src/enforcement/cli-outer-loop.js and bin/skills are implemented.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const child = require('child_process');

const ROOT       = path.join(__dirname, '..');
const MODULE     = path.join(ROOT, 'src', 'enforcement', 'cli-outer-loop.js');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Fixture setup ─────────────────────────────────────────────────────────────
// Synthetic test data must live INSIDE ROOT so the path-traversal guard passes.
const tmpDir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg1-'));

const cleanArtefactPath = path.join(tmpDir, 'clean-artefact.md');
fs.writeFileSync(cleanArtefactPath, '# Discovery\n\nNo story references.\n', 'utf8');

const violatingArtefactPath = path.join(tmpDir, 'violating-artefact.md');
fs.writeFileSync(
  violatingArtefactPath,
  '## Story slug\n\nRef: artefacts/2026-05-19-cli-deterministic-governance/stories/nonexistent-story-cdg1-test.md\n',
  'utf8'
);

// ── T1 — bin/skills file exists on disk ──────────────────────────────────────
console.log('\n[cli-outer-loop] T1 — bin/skills file exists on disk');
{
  assert(fs.existsSync(BIN_SKILLS), 'T1: bin/skills exists');
}

// ── T2 — cli-outer-loop.js file exists on disk ───────────────────────────────
console.log('\n[cli-outer-loop] T2 — src/enforcement/cli-outer-loop.js exists');
{
  assert(fs.existsSync(MODULE), 'T2: src/enforcement/cli-outer-loop.js exists');
}

// ── T3 — cli-outer-loop.js exports a function named `validate` ───────────────
console.log('\n[cli-outer-loop] T3 — cli-outer-loop.js exports validate');
{
  const mod = loadModule();
  assert(mod !== null, 'T3a: module loads without error');
  assert(mod !== null && typeof mod.validate === 'function', 'T3b: typeof validate === \'function\'');
}

// ── T4 — AC1: exit 0 + "validate OK" for clean artefact ─────────────────────
console.log('\n[cli-outer-loop] T4 — AC1: exit 0 and validate OK message for clean artefact');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.validate(cleanArtefactPath, 'definition-of-ready', ROOT); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T4a: exitCode === 0 for clean artefact');
  assert(result !== null && typeof result.stdout === 'string' && result.stdout.includes('validate OK') && result.stdout.includes('definition-of-ready'), 'T4b: stdout contains "validate OK" and gate name');
  assert(result !== null && typeof result.stdout === 'string' && result.stdout.includes('0 violations'), 'T4c: stdout contains "0 violations"');
}

// ── T5 — AC2: exit 8 + UNSUPPORTED_GATE for unknown gate ─────────────────────
console.log('\n[cli-outer-loop] T5 — AC2: exit 8 and UNSUPPORTED_GATE for unknown gate');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.validate(cleanArtefactPath, 'unknown-gate', ROOT); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T5a: exitCode === 8 for unknown gate');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('UNSUPPORTED_GATE'), 'T5b: stderr contains "UNSUPPORTED_GATE"');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('definition-of-ready'), 'T5c: stderr lists "definition-of-ready" as supported gate');
}

// ── T6 — AC4: exit 1-7 + H1 FAIL for missing story file ─────────────────────
console.log('\n[cli-outer-loop] T6 — AC4: exit 1-7 and H1 FAIL for missing story artefact');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.validate(violatingArtefactPath, 'definition-of-ready', ROOT); } catch (_) {}
  }
  assert(result !== null && result.exitCode >= 1 && result.exitCode <= 7, 'T6a: exitCode in range 1-7 for H1 violation');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('H1 FAIL'), 'T6b: stderr contains "H1 FAIL"');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('nonexistent-story-cdg1-test'), 'T6c: stderr contains the missing story slug');
}

// ── T7 — AC6: exit 8 + no resolved path on path traversal ────────────────────
console.log('\n[cli-outer-loop] T7 — AC6: exit 8 and no raw path logged on path traversal');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.validate('../../etc/passwd', 'definition-of-ready', ROOT); } catch (_) {}
  }
  const resolvedTraversalPath = path.resolve(ROOT, '../../etc/passwd');
  assert(result !== null && result.exitCode === 8, 'T7a: exitCode === 8 for path traversal');
  assert(result !== null && typeof result.stderr === 'string' && !result.stderr.includes(resolvedTraversalPath), 'T7b: stderr does not contain the resolved absolute path');
}

// ── IT1 — AC3: spawn node bin/skills validate (0 args) ───────────────────────
console.log('\n[cli-outer-loop] IT1 — AC3: spawn validate with 0 args exits non-zero with usage');
{
  let spawn = null;
  if (fs.existsSync(BIN_SKILLS)) {
    try {
      spawn = child.spawnSync('node', [BIN_SKILLS, 'validate'], { encoding: 'utf8', timeout: 5000 });
    } catch (_) {}
  }
  assert(spawn !== null && spawn.status !== 0, 'IT1a: exit code non-zero when 0 args');
  assert(spawn !== null && typeof spawn.stderr === 'string' && spawn.stderr.includes('Usage: skills validate'), 'IT1b: stderr contains "Usage: skills validate"');
}

// ── IT2 — AC3: spawn node bin/skills validate <path> (1 arg, no gate) ────────
console.log('\n[cli-outer-loop] IT2 — AC3: spawn validate with 1 arg exits non-zero with usage');
{
  let spawn = null;
  if (fs.existsSync(BIN_SKILLS)) {
    try {
      spawn = child.spawnSync('node', [BIN_SKILLS, 'validate', 'artefacts/x.md'], { encoding: 'utf8', timeout: 5000 });
    } catch (_) {}
  }
  assert(spawn !== null && spawn.status !== 0, 'IT2a: exit code non-zero when only 1 arg');
  assert(spawn !== null && typeof spawn.stderr === 'string' && spawn.stderr.includes('Usage: skills validate'), 'IT2b: stderr contains "Usage: skills validate"');
}

// ── NFR1 — validate completes in under 2000ms ────────────────────────────────
console.log('\n[cli-outer-loop] NFR1 — Performance: validate completes < 2000ms');
{
  const mod = loadModule();
  let elapsed = null;
  if (mod) {
    const start = Date.now();
    try { mod.validate(cleanArtefactPath, 'definition-of-ready', ROOT); } catch (_) {}
    elapsed = Date.now() - start;
  }
  assert(elapsed !== null && elapsed < 2000, `NFR1: validate elapsed ${elapsed}ms < 2000ms`);
}

// ── NFR2 — bin/skills has Unix shebang as first line ─────────────────────────
console.log('\n[cli-outer-loop] NFR2 — Portability: bin/skills first line is #!/usr/bin/env node');
{
  let firstLine = null;
  if (fs.existsSync(BIN_SKILLS)) {
    // Strip trailing \r to handle CRLF line endings on Windows.
    try { firstLine = fs.readFileSync(BIN_SKILLS, 'utf8').split('\n')[0].replace(/\r$/, ''); } catch (_) {}
  }
  assert(firstLine === '#!/usr/bin/env node', `NFR2: first line is "#!/usr/bin/env node" (got: "${firstLine}")`);
}

// ── NFR3 — no new deps in package.json ───────────────────────────────────────
console.log('\n[cli-outer-loop] NFR3 — No new deps: package.json deps unchanged from baseline');
{
  const BASELINE_DEPS     = [];
  const BASELINE_DEV_DEPS = ['@playwright/test', 'jsdom'];
  let pkg = null;
  try { pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')); } catch (_) {}
  const deps    = Object.keys((pkg && pkg.dependencies)    || {});
  const devDeps = Object.keys((pkg && pkg.devDependencies) || {});
  const extraDeps    = deps.filter(k => !BASELINE_DEPS.includes(k));
  const extraDevDeps = devDeps.filter(k => !BASELINE_DEV_DEPS.includes(k));
  assert(extraDeps.length === 0,    `NFR3a: no extra entries in dependencies (found: ${extraDeps.join(', ') || 'none'})`);
  assert(extraDevDeps.length === 0, `NFR3b: no extra entries in devDependencies (found: ${extraDevDeps.join(', ') || 'none'})`);
}

// ── T8 — H2: story with fewer than 3 ACs exits 2 ────────────────────────────
console.log('\n[cli-outer-loop] T8 — H2: story with < 3 ACs → exit 2');
{
  const t8Dir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg2-t8-'));
  try {
    const storyPath = path.join(t8Dir, 'story-h2-few-acs.md');
    fs.writeFileSync(storyPath, [
      '## User Story',
      'As a tester, I want to verify H2, So that the gate catches under-specified stories.',
      '',
      '## Acceptance Criteria',
      '**AC1:** Given a baseline, When the check runs, Then it passes.',
      'Given the baseline. When the check runs. Then it passes.',
      '',
      '**AC2:** Given another baseline, When the check runs, Then it also passes.',
      'Given another baseline. When the check runs. Then it also passes.',
      '',
      '## Out of Scope',
      'N/A',
      '',
      '## Benefit Linkage',
      'M1 — test metric.',
      '',
      '## Complexity Rating',
      '**Rating:** 2',
      '**Scope stability:** Stable',
      '',
      '## Architecture Constraints',
      'ADR-011 — pure function constraint.',
    ].join('\n'), 'utf8');

    const dorPath = path.join(t8Dir, 'dor.md');
    fs.writeFileSync(dorPath, [
      '## Definition of Ready',
      '',
      `**Story reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Test plan reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Review artefact:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
    ].join('\n'), 'utf8');

    const mod = loadModule();
    let result = null;
    if (mod) {
      try { result = mod.validate(dorPath, 'definition-of-ready', ROOT); } catch (_) {}
    }
    assert(result !== null && result.exitCode === 2, 'T8a: exitCode === 2 for story with < 3 ACs');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('H2 FAIL'), 'T8b: stderr contains "H2 FAIL"');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('minimum 3 ACs required'), 'T8c: stderr contains "minimum 3 ACs required"');
  } finally {
    try { fs.rmSync(t8Dir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── T9 — H2: story with 3 ACs but one missing GWT → exit 2 ──────────────────
console.log('\n[cli-outer-loop] T9 — H2: story with AC missing Given/When/Then → exit 2');
{
  const t9Dir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg2-t9-'));
  try {
    const storyPath = path.join(t9Dir, 'story-h2-bad-gwt.md');
    fs.writeFileSync(storyPath, [
      '## User Story',
      'As a tester, I want to verify H2 GWT, So that the gate catches malformed ACs.',
      '',
      '## Acceptance Criteria',
      '**AC1:** Given a baseline, When the check runs, Then it passes.',
      'Given a baseline. When the check runs. Then it passes.',
      '',
      '**AC2:** The system should work correctly.',
      '',
      '**AC3:** Given a third case, When tested, Then it works.',
      'Given a third case. When tested. Then it works.',
      '',
      '## Out of Scope',
      'N/A',
      '',
      '## Benefit Linkage',
      'M1 — test metric.',
      '',
      '## Complexity Rating',
      '**Rating:** 2',
      '**Scope stability:** Stable',
      '',
      '## Architecture Constraints',
      'ADR-011 — pure function constraint.',
    ].join('\n'), 'utf8');

    const dorPath = path.join(t9Dir, 'dor.md');
    fs.writeFileSync(dorPath, [
      '## Definition of Ready',
      '',
      `**Story reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Test plan reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Review artefact:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
    ].join('\n'), 'utf8');

    const mod = loadModule();
    let result = null;
    if (mod) {
      try { result = mod.validate(dorPath, 'definition-of-ready', ROOT); } catch (_) {}
    }
    assert(result !== null && result.exitCode === 2, 'T9a: exitCode === 2 for story with AC2 missing GWT');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('H2 FAIL'), 'T9b: stderr contains "H2 FAIL"');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('fewer than 3'), 'T9c: stderr reports fewer than 3 GWT ACs');
  } finally {
    try { fs.rmSync(t9Dir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── T10 — H5: story with disqualifying phrase in benefit linkage → exit 5 ────
console.log('\n[cli-outer-loop] T10 — H5: disqualifying phrase in benefit linkage → exit 5');
{
  const t10Dir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg2-t10-'));
  try {
    const storyPath = path.join(t10Dir, 'story-h5-disqualify.md');
    fs.writeFileSync(storyPath, [
      '## User Story',
      'As a tester, I want to verify H5, So that disqualifying phrases are caught.',
      '',
      '## Acceptance Criteria',
      '**AC1:** Given a baseline, When the check runs, Then it passes.',
      'Given a baseline. When the check runs. Then it passes.',
      '',
      '**AC2:** Given another case, When tested, Then it works.',
      'Given another case. When tested. Then it works.',
      '',
      '**AC3:** Given a third case, When validated, Then it succeeds.',
      'Given a third case. When validated. Then it succeeds.',
      '',
      '## Out of Scope',
      'This is explicitly out of scope: widget integration.',
      '',
      '## Benefit Linkage',
      'M1 — test metric. This story is needed for the next feature to proceed.',
      '',
      '## Complexity Rating',
      '**Rating:** 2',
      '**Scope stability:** Stable',
      '',
      '## Architecture Constraints',
      'ADR-011 — pure function constraint.',
    ].join('\n'), 'utf8');

    const dorPath = path.join(t10Dir, 'dor.md');
    fs.writeFileSync(dorPath, [
      '## Definition of Ready',
      '',
      `**Story reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Test plan reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Review artefact:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
    ].join('\n'), 'utf8');

    const mod = loadModule();
    let result = null;
    if (mod) {
      try { result = mod.validate(dorPath, 'definition-of-ready', ROOT); } catch (_) {}
    }
    assert(result !== null && result.exitCode === 5, 'T10a: exitCode === 5 for disqualifying phrase in benefit linkage');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('H5 FAIL'), 'T10b: stderr contains "H5 FAIL"');
    assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('technical dependency'), 'T10c: stderr describes the disqualifying phrase type');
  } finally {
    try { fs.rmSync(t10Dir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── T11 — clean DoR with all H-checks passing → exit 0 ──────────────────────
console.log('\n[cli-outer-loop] T11 — clean DoR: all H-checks pass → exit 0');
{
  const t11Dir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg2-t11-'));
  try {
    const storyPath = path.join(t11Dir, 'story-clean.md');
    fs.writeFileSync(storyPath, [
      '## User Story',
      'As a platform maintainer, I want the gate to pass clean stories, So that valid work proceeds.',
      '',
      '## Acceptance Criteria',
      '**AC1:** Given a well-formed story, When the check runs, Then exit 0 is returned.',
      'Given a well-formed story. When the check runs. Then exit 0 is returned.',
      '',
      '**AC2:** Given another AC, When validated, Then it also passes.',
      'Given another AC. When validated. Then it also passes.',
      '',
      '**AC3:** Given a third AC, When the suite runs, Then all checks pass.',
      'Given a third AC. When the suite runs. Then all checks pass.',
      '',
      '## Out of Scope',
      'Widget integration and third-party API wiring are out of scope.',
      '',
      '## Benefit Linkage',
      'M99 — dummy metric for test fixture validation.',
      'This story implements the validation logic directly.',
      '',
      '## Complexity Rating',
      '**Rating:** 2',
      '**Scope stability:** Stable',
      '',
      '## Architecture Constraints',
      'ADR-011 — pure function constraint applies. No state writes permitted.',
    ].join('\n'), 'utf8');

    const testPlanPath = path.join(t11Dir, 'test-plan-stub.md');
    fs.writeFileSync(testPlanPath, [
      '## Test Plan Stub',
      '',
      '## AC Coverage',
      '',
      '| AC | Tests |',
      '|----|-------|',
      '| AC1 | T1a |',
      '| AC2 | T2a |',
      '| AC3 | T3a |',
    ].join('\n'), 'utf8');

    const reviewPath = path.join(t11Dir, 'review-stub.md');
    fs.writeFileSync(reviewPath, [
      '## Review',
      '',
      '| Finding | Severity | Status |',
      '|----|------|--------|',
      '| No findings | LOW | resolved |',
    ].join('\n'), 'utf8');

    const dorPath = path.join(t11Dir, 'dor.md');
    fs.writeFileSync(dorPath, [
      '## Definition of Ready',
      '',
      `**Story reference:** ${path.relative(ROOT, storyPath).replace(/\\/g, '/')}`,
      `**Test plan reference:** ${path.relative(ROOT, testPlanPath).replace(/\\/g, '/')}`,
      `**Review artefact:** ${path.relative(ROOT, reviewPath).replace(/\\/g, '/')}`,
    ].join('\n'), 'utf8');

    const mod = loadModule();
    let result = null;
    if (mod) {
      try { result = mod.validate(dorPath, 'definition-of-ready', ROOT); } catch (_) {}
    }
    assert(result !== null && result.exitCode === 0, 'T11a: exitCode === 0 for well-formed DoR');
  } finally {
    try { fs.rmSync(t11Dir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-cli-outer-loop results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
