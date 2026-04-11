#!/usr/bin/env node
/**
 * check-assembly.js
 *
 * Automated tests for the assembled copilot-instructions.md output.
 * Validates the progressive disclosure structure, three-layer composition,
 * and M1 acceptance test record fields.
 *
 * Tests from p1.1 test plan:
 *   Unit:  progressive-disclosure-outer-loop-skills-only-at-discovery     (AC3)
 *          progressive-disclosure-inner-loop-absent-at-outer-phase        (AC3)
 *          assembled-file-has-three-layer-composition                     (AC5)
 *          assembled-file-composition-order-documented                    (AC5)
 *          m1-acceptance-test-record-contains-all-fields                  (AC6)
 *   NFR:   nfr-assembled-file-under-8000-tokens
 *          nfr-no-credential-values-in-distribution-config
 *          nfr-assembled-file-header-contains-version-info
 *
 * Run:  node .github/scripts/check-assembly.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const root         = path.join(__dirname, '..', '..');
const fixtureFile  = path.join(root, 'tests', 'fixtures', 'assembled-copilot-instructions.md');
const benefitFile  = path.join(root, 'artefacts', '2026-04-09-skills-platform-phase1', 'benefit-metric.md');
const assembleScript = path.join(root, 'scripts', 'assemble-copilot-instructions.sh');

// On Windows, WSL bash may be absent or broken; prefer Git Bash when available.
const bashBin = (() => {
  if (process.platform !== 'win32') return 'bash';
  const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
  if (fs.existsSync(gitBash)) return gitBash;
  return 'bash'; // fall back to system bash (WSL)
})();

// p2.4 fixtures
const contextGithubFixture    = path.join(root, 'tests', 'fixtures', 'context-github.yml');
const contextBitbucketFixture = path.join(root, 'tests', 'fixtures', 'context-bitbucket.yml');

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

// ── Read files ────────────────────────────────────────────────────────────────

if (!fs.existsSync(fixtureFile)) {
  console.error(`[assembly-check] ERROR: fixture not found: ${fixtureFile}`);
  console.error('  Run: bash scripts/assemble-copilot-instructions.sh --output tests/fixtures/assembled-copilot-instructions.md');
  process.exit(1);
}

if (!fs.existsSync(benefitFile)) {
  console.error(`[assembly-check] ERROR: benefit-metric.md not found: ${benefitFile}`);
  process.exit(1);
}

const assembled = fs.readFileSync(fixtureFile, 'utf8');
const benefitMetric = fs.readFileSync(benefitFile, 'utf8');

// ── Constants ─────────────────────────────────────────────────────────────────

const OUTER_LOOP_SKILLS = [
  'discovery',
  'benefit-metric',
  'definition',
  'review',
  'test-plan',
  'definition-of-ready',
];

// workflow and decisions are also outer loop but the test plan specifies these 6 for AC3
const OUTER_LOOP_AC3 = [
  'discovery',
  'benefit-metric',
  'definition',
  'review',
  'test-plan',
  'definition-of-ready',
];

const INNER_LOOP_SKILLS = [
  'tdd',
  'implementation-plan',
  'subagent-execution',
  'verify-completion',
  'branch-setup',
  'branch-complete',
];

const M1_REQUIRED_FIELDS = [
  'changeReference',
  'distributionMechanism',
  'elapsedTime',
  'changePresentInAssembledContext',
  'squadMergeActionRequired',
];

// Credential value patterns — must not appear in any distribution config file
const CREDENTIAL_PATTERNS = [
  /ghp_[A-Za-z0-9]{20,}/,                // GitHub PAT
  /Bearer [A-Za-z0-9]{20,}/,             // Bearer token value
  /\btoken: [^$][^\n]{10,}/,             // inline token value (not a variable reference)
  /\bpassword: [^$][^\n]{5,}/,           // inline password value
];

// Approximate token count: rough GPT tokenizer proxy (~4 chars per token for English)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Extract the composition header (HTML comment at top of file)
function getHeader(text) {
  const match = text.match(/<!--([\s\S]*?)-->/);
  return match ? match[1] : '';
}

// ── Test suite ────────────────────────────────────────────────────────────────

console.log('[assembly-check] Running p1.1 assembly tests…');
console.log('');

// ── AC3: Progressive disclosure — outer loop skills present at session start ──
console.log('  AC3: Progressive skill disclosure — outer loop');

const missingOuter = OUTER_LOOP_AC3.filter(skill => {
  // The skill name should appear in the assembled file (in the outer loop section)
  // Allow for /skill-name or just skill-name forms
  return !assembled.includes(`/${skill}`) && !assembled.includes(`**${skill}**`);
});

if (missingOuter.length === 0) {
  pass('progressive-disclosure-outer-loop-skills-only-at-discovery');
} else {
  fail('progressive-disclosure-outer-loop-skills-only-at-discovery',
    `Missing outer loop skills in assembled file: ${missingOuter.join(', ')}`);
}

// ── AC3: Inner loop skills absent from outer phase context ───────────────────

const innerPatternFound = INNER_LOOP_SKILLS.filter(skill => {
  // Check for patterns that would indicate the skill is loaded (not just listed as deferred)
  return assembled.includes(`/${skill}`) || assembled.includes(`${skill}/SKILL.md`);
});

if (innerPatternFound.length === 0) {
  pass('progressive-disclosure-inner-loop-absent-at-outer-phase');
} else {
  fail('progressive-disclosure-inner-loop-absent-at-outer-phase',
    `Inner loop skills found with path pattern (should be deferred only): ${innerPatternFound.map(s => `/${s}`).join(', ')}`);
}

// ── AC5: Three-layer composition header ──────────────────────────────────────
console.log('');
console.log('  AC5: Three-layer composition structure');

const header = getHeader(assembled);
const first50Lines = assembled.split('\n').slice(0, 50).join('\n');

const hasCoreLayer   = /core-platform/i.test(first50Lines);
const hasDomainLayer = /\bdomain\b/i.test(first50Lines);
const hasSquadLayer  = /\bsquad\b/i.test(first50Lines);
const hasAbsentMarker = /\[absent\]/i.test(assembled);

if (hasCoreLayer && hasDomainLayer && hasSquadLayer) {
  pass('assembled-file-has-three-layer-composition');
} else {
  const missing = [
    !hasCoreLayer   && 'core-platform',
    !hasDomainLayer && 'domain',
    !hasSquadLayer  && 'squad',
  ].filter(Boolean);
  fail('assembled-file-has-three-layer-composition',
    `Missing layer references in header: ${missing.join(', ')}`);
}

// Verify absent-marker is present when domain/squad layers are absent
if (hasAbsentMarker) {
  pass('assembled-file-absent-marker-present-when-layers-missing');
} else {
  fail('assembled-file-absent-marker-present-when-layers-missing',
    'No [absent] marker found in file — optional absent layers must be marked explicitly');
}

// ── AC5: Composition order documented ────────────────────────────────────────

const hasLayerOrder     = /Layer composition \(in order\)/i.test(header) ||
                           /layer.*order/i.test(header);
const hasPlatformVersion = /platform-version:/i.test(header) ||
                            /assembled.*@[0-9a-f]{6}/i.test(header) ||
                            /core-platform.*@/i.test(header);

if (hasLayerOrder && hasPlatformVersion) {
  pass('assembled-file-composition-order-documented');
} else {
  const missing = [
    !hasLayerOrder      && 'layer composition order',
    !hasPlatformVersion && 'platform version reference',
  ].filter(Boolean);
  fail('assembled-file-composition-order-documented',
    `Missing from composition header: ${missing.join(', ')}`);
}

// ── AC6: M1 acceptance test record fields ────────────────────────────────────
console.log('');
console.log('  AC6: M1 acceptance test record structure');

const missingM1Fields = M1_REQUIRED_FIELDS.filter(field => !benefitMetric.includes(field));

if (missingM1Fields.length === 0) {
  pass('m1-acceptance-test-record-contains-all-fields');
} else {
  fail('m1-acceptance-test-record-contains-all-fields',
    `Missing M1 fields in benefit-metric.md: ${missingM1Fields.join(', ')}`);
}

// ── NFR: Token count ≤ 8000 at session start ─────────────────────────────────
console.log('');
console.log('  NFR: Performance, security, audit');

const tokenCount = estimateTokens(assembled);
if (tokenCount <= 8000) {
  pass(`nfr-assembled-file-under-8000-tokens (estimated ~${tokenCount} tokens)`);
} else {
  fail('nfr-assembled-file-under-8000-tokens',
    `Estimated token count ${tokenCount} exceeds 8,000 token limit`);
}

// ── NFR: No credential values in distribution config ─────────────────────────

// Check the assembly script and the assembled file for credential value patterns
const filesToScan = [assembleScript, fixtureFile].filter(f => fs.existsSync(f));
let credentialFound = false;
const credentialMatches = [];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(root, file);
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(content)) {
      credentialFound = true;
      credentialMatches.push(`${relPath}: matches ${pattern}`);
    }
  }
}

if (!credentialFound) {
  pass('nfr-no-credential-values-in-distribution-config');
} else {
  fail('nfr-no-credential-values-in-distribution-config',
    `Credential value patterns found:\n    ${credentialMatches.join('\n    ')}`);
}

// ── NFR: Version info in assembled file header ────────────────────────────────

const hasVersionInHeader = /platform-version:\s+[^\s\[]/i.test(header);

if (hasVersionInHeader) {
  pass('nfr-assembled-file-header-contains-version-info');
} else {
  fail('nfr-assembled-file-header-contains-version-info',
    'No non-empty platform-version field found in assembly header');
}

// ── Assemble script exists ────────────────────────────────────────────────────
console.log('');
console.log('  Infrastructure: assembly script');

if (fs.existsSync(assembleScript)) {
  pass('assembly-script-exists (scripts/assemble-copilot-instructions.sh)');
} else {
  fail('assembly-script-exists', `Assembly script not found: ${assembleScript}`);
}

// ── p2.4: AGENTS.md adapter — vcs.agent_instructions.format / vcs.type tests ─

/**
 * Run the assembly script in a fresh temp directory.
 * Returns the spawnSync result plus paths to expected output files.
 */
function runAssemblyInTmpDir(contextFile, extraArgs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-assembly-p24-'));
  const args = [
    assembleScript,
    '--skills-repo-path', root,
    '--ref', 'test-p24',
    '--context', contextFile,
  ].concat(extraArgs || []);

  const result = spawnSync(bashBin, args, {
    cwd: tmpDir,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { NO_COLOR: '1' }),
  });

  return {
    result,
    tmpDir,
    githubOut: path.join(tmpDir, '.github', 'copilot-instructions.md'),
    agentsMd:  path.join(tmpDir, 'AGENTS.md'),
  };
}

/**
 * Write a temporary context.yml string to a temp file; return its path.
 */
function writeTmpContext(content) {
  const tmpFile = path.join(os.tmpdir(), `ctx-p24-${Date.now()}.yml`);
  fs.writeFileSync(tmpFile, content, 'utf8');
  return tmpFile;
}

console.log('');
console.log('  p2.4: AGENTS.md adapter — vcs.agent_instructions.format / vcs.type branching');

// ── AC1: GitHub vcs.type → .github/copilot-instructions.md ───────────────────
{
  const { result, tmpDir, githubOut, agentsMd } = runAssemblyInTmpDir(contextGithubFixture);
  try {
    if (result.status !== 0) {
      fail('check-assembly-github-default-copilot-instructions',
        `Script exited ${result.status}: ${result.stderr}`);
    } else if (!fs.existsSync(githubOut)) {
      fail('check-assembly-github-default-copilot-instructions',
        `.github/copilot-instructions.md not created for vcs.type: github`);
    } else {
      pass('check-assembly-github-default-copilot-instructions');
    }

    if (!fs.existsSync(agentsMd)) {
      pass('check-assembly-github-no-agents-md');
    } else {
      fail('check-assembly-github-no-agents-md',
        `AGENTS.md was unexpectedly created for vcs.type: github`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── AC2: Non-GitHub vcs.type (bitbucket) → AGENTS.md at root ─────────────────
{
  const { result, tmpDir, githubOut, agentsMd } = runAssemblyInTmpDir(contextBitbucketFixture);
  try {
    if (result.status !== 0) {
      fail('check-assembly-bitbucket-outputs-agents-md',
        `Script exited ${result.status}: ${result.stderr}`);
    } else if (!fs.existsSync(agentsMd)) {
      fail('check-assembly-bitbucket-outputs-agents-md',
        `AGENTS.md not created for vcs.type: bitbucket`);
    } else {
      pass('check-assembly-bitbucket-outputs-agents-md');
    }

    if (!fs.existsSync(githubOut)) {
      pass('check-assembly-non-github-no-copilot-instructions');
    } else {
      fail('check-assembly-non-github-no-copilot-instructions',
        `.github/copilot-instructions.md was unexpectedly created for vcs.type: bitbucket`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── AC3a: Explicit vcs.agent_instructions.format: agents-md overrides vcs.type: github
{
  const ctxFile = writeTmpContext([
    'vcs:',
    '  type: github',
    '  agent_instructions:',
    '    format: agents-md',
  ].join('\n') + '\n');
  const { result, tmpDir, githubOut, agentsMd } = runAssemblyInTmpDir(ctxFile);
  try {
    if (result.status !== 0) {
      fail('check-assembly-explicit-agents-md-override',
        `Script exited ${result.status}: ${result.stderr}`);
    } else if (!fs.existsSync(agentsMd)) {
      fail('check-assembly-explicit-agents-md-override',
        `AGENTS.md not created when vcs.agent_instructions.format: agents-md (vcs.type: github)`);
    } else {
      pass('check-assembly-explicit-agents-md-override');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    try { fs.unlinkSync(ctxFile); } catch (_) {}
  }
}

// ── AC3b: Invalid vcs.agent_instructions.format → assembly-time error ─────────
{
  const ctxFile = writeTmpContext([
    'vcs:',
    '  type: github',
    '  agent_instructions:',
    '    format: unsupported-value',
  ].join('\n') + '\n');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-assembly-p24-invalid-'));
  const result = spawnSync(bashBin, [
    assembleScript,
    '--skills-repo-path', root,
    '--ref', 'test-p24',
    '--context', ctxFile,
  ], { cwd: tmpDir, encoding: 'utf8' });
  try {
    if (result.status !== 0) {
      pass('check-assembly-invalid-format-value-errors');
    } else {
      fail('check-assembly-invalid-format-value-errors',
        `Script should have errored on unsupported format value but exited 0`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    try { fs.unlinkSync(ctxFile); } catch (_) {}
  }
}

// ── AC4: Content parity — assembled content identical for github and bitbucket ─
{
  const tmpGithub    = fs.mkdtempSync(path.join(os.tmpdir(), 'check-assembly-p24-gh-'));
  const tmpBitbucket = fs.mkdtempSync(path.join(os.tmpdir(), 'check-assembly-p24-bb-'));
  const r1 = spawnSync(bashBin, [
    assembleScript, '--skills-repo-path', root, '--ref', 'test-parity', '--context', contextGithubFixture,
  ], { cwd: tmpGithub, encoding: 'utf8' });
  const r2 = spawnSync(bashBin, [
    assembleScript, '--skills-repo-path', root, '--ref', 'test-parity', '--context', contextBitbucketFixture,
  ], { cwd: tmpBitbucket, encoding: 'utf8' });
  try {
    const ghFile = path.join(tmpGithub,    '.github', 'copilot-instructions.md');
    const bbFile = path.join(tmpBitbucket, 'AGENTS.md');
    if (r1.status !== 0 || r2.status !== 0) {
      fail('check-assembly-content-parity',
        `One or both assembly runs failed (github=${r1.status}, bitbucket=${r2.status})`);
    } else if (!fs.existsSync(ghFile) || !fs.existsSync(bbFile)) {
      fail('check-assembly-content-parity',
        `Expected output files not found (github=${fs.existsSync(ghFile)}, bitbucket=${fs.existsSync(bbFile)})`);
    } else {
      // Strip the assembled-at timestamp before comparing: timestamps differ between runs
      // but are not format-specific content (AC4 verifies no format-based transformation).
      const normalise = c => c.replace(/assembled-at:\s+[^\n]+/, 'assembled-at: [normalised]');
      const ghContent = normalise(fs.readFileSync(ghFile, 'utf8'));
      const bbContent = normalise(fs.readFileSync(bbFile, 'utf8'));
      if (ghContent === bbContent) {
        pass('check-assembly-content-parity');
      } else {
        fail('check-assembly-content-parity',
          `Assembled content differs between github and bitbucket output paths`);
      }
    }
  } finally {
    fs.rmSync(tmpGithub,    { recursive: true, force: true });
    fs.rmSync(tmpBitbucket, { recursive: true, force: true });
  }
}

// ── AC5: Unconfigured context → defaults to .github/copilot-instructions.md ───
{
  const ctxFile = writeTmpContext('# empty context — no vcs block\nmeta:\n  name: "unconfigured"\n');
  const { result, tmpDir, githubOut, agentsMd } = runAssemblyInTmpDir(ctxFile);
  try {
    if (result.status !== 0) {
      fail('check-assembly-unconfigured-default',
        `Script exited ${result.status}: ${result.stderr}`);
    } else if (!fs.existsSync(githubOut)) {
      fail('check-assembly-unconfigured-default',
        `.github/copilot-instructions.md not created for unconfigured context (expected default)`);
    } else if (fs.existsSync(agentsMd)) {
      fail('check-assembly-unconfigured-default',
        `AGENTS.md was unexpectedly created for unconfigured context`);
    } else {
      pass('check-assembly-unconfigured-default');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    try { fs.unlinkSync(ctxFile); } catch (_) {}
  }
}

// ── AC6: Integration — check-assembly.js covers both output paths ─────────────
{
  // GitHub integration test
  const { result: r1, tmpDir: d1, githubOut: go1, agentsMd: am1 } = runAssemblyInTmpDir(contextGithubFixture);
  try {
    if (r1.status === 0 && fs.existsSync(go1) && !fs.existsSync(am1)) {
      pass('check-assembly-github-integration');
    } else if (r1.status !== 0) {
      fail('check-assembly-github-integration', `Script exited ${r1.status}: ${r1.stderr}`);
    } else if (!fs.existsSync(go1)) {
      fail('check-assembly-github-integration', `.github/copilot-instructions.md not created`);
    } else {
      fail('check-assembly-github-integration', `AGENTS.md was unexpectedly created`);
    }
  } finally {
    fs.rmSync(d1, { recursive: true, force: true });
  }
}
{
  // Bitbucket integration test
  const { result: r2, tmpDir: d2, githubOut: go2, agentsMd: am2 } = runAssemblyInTmpDir(contextBitbucketFixture);
  try {
    if (r2.status === 0 && fs.existsSync(am2) && !fs.existsSync(go2)) {
      pass('check-assembly-bitbucket-integration');
    } else if (r2.status !== 0) {
      fail('check-assembly-bitbucket-integration', `Script exited ${r2.status}: ${r2.stderr}`);
    } else if (!fs.existsSync(am2)) {
      fail('check-assembly-bitbucket-integration', `AGENTS.md not created`);
    } else {
      fail('check-assembly-bitbucket-integration', `.github/copilot-instructions.md was unexpectedly created`);
    }
  } finally {
    fs.rmSync(d2, { recursive: true, force: true });
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`[assembly-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
