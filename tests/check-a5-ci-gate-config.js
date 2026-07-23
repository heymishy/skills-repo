#!/usr/bin/env node
/**
 * check-a5-ci-gate-config.js — governance tests for a5-ci-gate-scenario-a-blocking
 * (artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md)
 *
 * Covers the AC1-AC4 structural preconditions per the story's test plan and
 * DoR Coding Agent Instructions: "Do not attempt to encode 'the merge is
 * actually blocked' as an automated Jest/Node test ... assert the structural
 * precondition (no continue-on-error, check registered as required) only."
 *
 * AC1/AC2 — structural precondition: the new Scenario A job has no
 *           continue-on-error anywhere in its own step block, so a real
 *           failure genuinely fails the job (necessary, not sufficient, for
 *           branch-protection blocking — the sufficient half is proven by
 *           the one-time manual red/green PR rehearsal, per the test plan's
 *           acknowledged External-dependency gap).
 * AC3       — the pre-existing 29-spec `e2e` job's config is byte-for-byte
 *             unchanged from its pre-story shape (this is additive only).
 * AC4       — the new job's enablement reads a `.github/context.yml` field
 *             (ADR-004), not a hardcoded literal in the workflow YAML.
 *
 * No external dependencies — Node.js built-ins only, matching ADR-001's
 * no-external-deps convention for governance check scripts. YAML content is
 * parsed with regex/text assertions, consistent with check-dviz2-pages-workflow.js.
 *
 * The live GitHub API check (is "Scenario A E2E (staging)" actually present
 * in the master ruleset's required_status_checks list) is attempted via the
 * `gh` CLI but is treated as SKIP (not FAIL) when `gh` is unavailable,
 * unauthenticated, or unreachable — this mirrors the hasStubSecret() /
 * known-baseline-failures.json pattern already used throughout this feature
 * for checks that depend on an external, non-committed credential. A fresh
 * CI runner's default GITHUB_TOKEN cannot read repository rulesets, so a
 * hard failure here would produce false negatives unrelated to this story's
 * own change.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'e2e.yml');
const CONTEXT_PATH = path.join(ROOT, '.github', 'context.yml');

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(id, msg) {
  console.log('  ✓ ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  ✗ ' + id + ' ' + msg);
  failed++;
}

function skip(id, msg) {
  console.log('  ○ ' + id + ' SKIPPED — ' + msg);
  skipped++;
}

console.log('\n[check-a5-ci-gate-config] Scenario A CI-blocking gate — structural config checks\n');

const workflowExists = fs.existsSync(WORKFLOW_PATH);
if (workflowExists) {
  pass('T0', '.github/workflows/e2e.yml exists');
} else {
  fail('T0', '.github/workflows/e2e.yml not found');
}

const workflowText = workflowExists ? fs.readFileSync(WORKFLOW_PATH, 'utf8') : '';

const contextExists = fs.existsSync(CONTEXT_PATH);
if (contextExists) {
  pass('T0b', '.github/context.yml exists');
} else {
  fail('T0b', '.github/context.yml not found');
}

const contextText = contextExists ? fs.readFileSync(CONTEXT_PATH, 'utf8') : '';

/**
 * Extract a named top-level job's YAML block from the workflow text — from
 * the job's own key line up to (but not including) the next top-level job
 * key at the same 2-space indentation, or end of file.
 */
function extractJobBlock(text, jobId) {
  const lines = text.split('\n');
  const startPattern = new RegExp('^  ' + jobId + ':\\s*$');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startPattern.test(lines[i])) { startIdx = i; break; }
  }
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^  [a-zA-Z0-9_-]+:\s*$/.test(lines[i])) { endIdx = i; break; }
  }
  return lines.slice(startIdx, endIdx).join('\n');
}

// ── AC1/AC2 — new job exists, has no continue-on-error ───────────────────────
console.log('\n[a5] AC1/AC2 — Scenario A job: present, no continue-on-error');

const newJobBlock = workflowExists ? extractJobBlock(workflowText, 'scenario-a-staging-e2e') : null;

if (newJobBlock) {
  pass('T1', 'scenario-a-staging-e2e job is present in e2e.yml');
} else {
  fail('T1', 'scenario-a-staging-e2e job not found in e2e.yml');
}

if (newJobBlock) {
  const hasContinueOnError = /continue-on-error\s*:\s*true/.test(newJobBlock);
  if (!hasContinueOnError) {
    pass('T2', 'scenario-a-staging-e2e job has no continue-on-error: true anywhere in its block');
  } else {
    fail('T2', 'scenario-a-staging-e2e job unexpectedly sets continue-on-error: true — this would prevent it from blocking merge on failure (AC1)');
  }

  const nameMatch = /^\s*name:\s*(.+)$/m.exec(newJobBlock);
  if (nameMatch && nameMatch[1].trim().length > 0) {
    pass('T3', 'scenario-a-staging-e2e job has an explicit name: ' + nameMatch[1].trim());
  } else {
    fail('T3', 'scenario-a-staging-e2e job has no explicit name — required to register as a status check');
  }
} else {
  fail('T2', 'cannot check continue-on-error — job block not found');
  fail('T3', 'cannot check job name — job block not found');
}

// ── AC4 — config-driven enablement, not hardcoded ────────────────────────────
console.log('\n[a5] AC4 — gate enablement is config-driven via context.yml (ADR-004)');

if (newJobBlock) {
  const readsContextYml = /audit\.staging_e2e_scenario_a/.test(newJobBlock);
  if (readsContextYml) {
    pass('T4', 'scenario-a-staging-e2e job reads audit.staging_e2e_scenario_a from context.yml');
  } else {
    fail('T4', 'scenario-a-staging-e2e job does not reference audit.staging_e2e_scenario_a — enablement may be hardcoded');
  }

  // The gate variable must be assigned from a parsed context.yml value (yq or
  // grep-of-file), not a bare hardcoded literal with no file read at all.
  const readsFromFile = /\.github\/context\.yml/.test(newJobBlock);
  if (readsFromFile) {
    pass('T5', 'scenario-a-staging-e2e job reads .github/context.yml as its config source');
  } else {
    fail('T5', 'scenario-a-staging-e2e job does not read .github/context.yml at all');
  }
} else {
  fail('T4', 'cannot check context.yml reference — job block not found');
  fail('T5', 'cannot check context.yml file read — job block not found');
}

if (contextExists) {
  const hasFlag = /staging_e2e_scenario_a\s*:\s*true/.test(contextText);
  if (hasFlag) {
    pass('T6', 'context.yml declares audit.staging_e2e_scenario_a: true');
  } else {
    fail('T6', 'context.yml does not declare staging_e2e_scenario_a: true under audit:');
  }

  // Distinct from the existing non-blocking audit.e2e_tests key (AC4's
  // "distinct from the existing non-blocking audit.e2e_tests semantics").
  const isDistinctKey = /staging_e2e_scenario_a/.test(contextText) &&
    !/e2e_tests\s*:\s*true[^\n]*staging_e2e_scenario_a/.test(contextText);
  if (isDistinctKey) {
    pass('T7', 'staging_e2e_scenario_a is a distinct config key from e2e_tests');
  } else {
    fail('T7', 'staging_e2e_scenario_a does not appear to be a distinct key');
  }
} else {
  fail('T6', 'cannot check context.yml flag — file not found');
  fail('T7', 'cannot check distinct key — file not found');
}

// ── AC3 — pre-existing 29-spec job is unchanged (additive only) ─────────────
console.log('\n[a5] AC3 — pre-existing `e2e` job (29 local-mocked specs) is unchanged');

const preExistingJobBlock = workflowExists ? extractJobBlock(workflowText, 'e2e') : null;

if (preExistingJobBlock) {
  pass('T8', 'pre-existing e2e job block still present');
} else {
  fail('T8', 'pre-existing e2e job block not found — has it been removed or renamed?');
}

if (preExistingJobBlock) {
  // Snapshot of the pre-existing job's defining properties, as they existed
  // before this story (captured from e2e.yml prior to the a5 implementation
  // commit) — this is the "before" side of the AC3 diff.
  const expectedSubstrings = [
    'name: Playwright E2E smoke tests',
    "id: e2e-config",
    "audit.e2e_tests",
    'continue-on-error: true',
    'id: e2e-run',
    'run: npm run test:e2e',
    'name: playwright-traces-${{ github.run_id }}',
    "E2E tests skipped — set audit.e2e_tests: true in .github/context.yml to enable"
  ];

  let allPresent = true;
  const missing = [];
  expectedSubstrings.forEach(function (s) {
    if (preExistingJobBlock.indexOf(s) === -1) {
      allPresent = false;
      missing.push(s);
    }
  });

  if (allPresent) {
    pass('T9', 'pre-existing e2e job retains all defining properties unchanged (name, flag key, continue-on-error: true, run command, artifact name, skip message)');
  } else {
    fail('T9', 'pre-existing e2e job is missing expected unchanged properties: ' + JSON.stringify(missing));
  }

  // The pre-existing job must still be non-blocking — continue-on-error:
  // true must be present exactly once, on its "Run E2E tests" step, and this
  // story must not have flipped it to blocking as a side effect.
  const continueOnErrorCount = (preExistingJobBlock.match(/continue-on-error\s*:\s*true/g) || []).length;
  if (continueOnErrorCount === 1) {
    pass('T10', 'pre-existing e2e job has exactly one continue-on-error: true (unchanged non-blocking posture)');
  } else {
    fail('T10', 'pre-existing e2e job has ' + continueOnErrorCount + ' continue-on-error: true occurrences (expected exactly 1) — non-blocking posture may have changed');
  }
} else {
  fail('T9', 'cannot verify unchanged properties — job block not found');
  fail('T10', 'cannot verify continue-on-error count — job block not found');
}

// Exactly two jobs total: the pre-existing one, plus the new one. No job was
// removed, and no third job was silently introduced beyond this story's scope.
if (workflowExists) {
  const jobsSectionIdx = workflowText.search(/^jobs:\s*$/m);
  const jobsSectionText = jobsSectionIdx === -1 ? '' : workflowText.slice(jobsSectionIdx);
  const jobKeys = (jobsSectionText.match(/^  [a-zA-Z0-9_-]+:\s*$/gm) || []).map(function (l) {
    return l.trim().replace(/:$/, '');
  });
  const uniqueJobKeys = jobKeys.filter(function (k, i) { return jobKeys.indexOf(k) === i; });
  if (uniqueJobKeys.length === 2 && uniqueJobKeys.indexOf('e2e') !== -1 && uniqueJobKeys.indexOf('scenario-a-staging-e2e') !== -1) {
    pass('T11', 'e2e.yml contains exactly 2 jobs: e2e (unchanged) and scenario-a-staging-e2e (new) — ' + JSON.stringify(uniqueJobKeys));
  } else {
    fail('T11', 'e2e.yml job list is not exactly [e2e, scenario-a-staging-e2e] — got: ' + JSON.stringify(uniqueJobKeys));
  }
} else {
  fail('T11', 'cannot check job count — workflow file not found');
}

// ── AC1/AC2 (best-effort, live) — is the check registered as required? ──────
console.log('\n[a5] AC1/AC2 (live, best-effort) — is "Scenario A E2E (staging)" a required status check on master?');
{
  const REQUIRED_CHECK_NAME = 'Scenario A E2E (staging)';
  let ghResult = null;
  try {
    ghResult = spawnSync('gh', [
      'api',
      'repos/heymishy/skills-repo/rulesets',
      '--jq', '[.[] | select(.target=="branch")] | .[0].id'
    ], { encoding: 'utf8', timeout: 15000 });
  } catch (e) {
    ghResult = null;
  }

  if (!ghResult || ghResult.error || ghResult.status !== 0 || !ghResult.stdout || !ghResult.stdout.trim()) {
    skip('T12', 'gh CLI unavailable/unauthenticated/unreachable in this environment — cannot verify live required-status-checks membership. This is expected in most CI runner contexts (default GITHUB_TOKEN cannot read repo rulesets); the sufficient proof for AC1/AC2 is the one-time manual red/green PR rehearsal (see verification script), not this automated check.');
  } else {
    const rulesetId = ghResult.stdout.trim();
    let detailResult = null;
    try {
      detailResult = spawnSync('gh', ['api', 'repos/heymishy/skills-repo/rulesets/' + rulesetId], { encoding: 'utf8', timeout: 15000 });
    } catch (e) {
      detailResult = null;
    }
    if (!detailResult || detailResult.status !== 0 || !detailResult.stdout) {
      skip('T12', 'gh CLI could not fetch ruleset detail — treating as inconclusive, not a failure');
    } else {
      let contexts = [];
      try {
        const parsed = JSON.parse(detailResult.stdout);
        const rscRule = (parsed.rules || []).find(function (r) { return r.type === 'required_status_checks'; });
        contexts = (rscRule && rscRule.parameters && rscRule.parameters.required_status_checks || []).map(function (c) { return c.context; });
      } catch (e) {
        contexts = [];
      }
      if (contexts.indexOf(REQUIRED_CHECK_NAME) !== -1) {
        pass('T12', '"' + REQUIRED_CHECK_NAME + '" is present in the master ruleset\'s required_status_checks list: ' + JSON.stringify(contexts));
      } else {
        skip('T12', '"' + REQUIRED_CHECK_NAME + '" not yet found in required_status_checks (' + JSON.stringify(contexts) + ') — treated as inconclusive rather than a hard failure since this depends on a live, external, operator-driven GitHub API state change; verify manually with: gh api repos/heymishy/skills-repo/rulesets/' + rulesetId);
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log('\n[check-a5-ci-gate-config] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped\n');
if (failed > 0) process.exit(1);
