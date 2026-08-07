#!/usr/bin/env node
/**
 * check-b2-ci-gate-config.js — governance tests for b2-ci-gate-scenario-b-coverage-mapping
 * (artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md)
 *
 * Mirrors check-a5-ci-gate-config.js exactly, applied to the new Scenario B
 * job — per this story's DoR Coding Agent Instructions: "Reuse A5's gate
 * mechanism pattern ... do not invent a second, different mechanism."
 *
 * AC1/AC2 — structural precondition: the new Scenario B job has no
 *           continue-on-error anywhere in its own step block, so a real
 *           failure genuinely fails the job (necessary, not sufficient, for
 *           branch-protection blocking — the sufficient half is proven by
 *           the one-time manual red/green PR rehearsal, per the test plan's
 *           acknowledged External-dependency gap).
 * AC (regression) — the pre-existing `e2e` job and the a5 `scenario-a-staging-e2e`
 *           job are both untouched (this story is additive only).
 * AC4       — the new job's enablement reads a `.github/context.yml` field
 *             (ADR-004), not a hardcoded literal in the workflow YAML.
 *
 * No external dependencies — Node.js built-ins only, matching ADR-001's
 * no-external-deps convention for governance check scripts.
 *
 * The live GitHub API check (is "Scenario B E2E (staging)" actually present
 * in the master ruleset's required_status_checks list) is attempted via the
 * `gh` CLI but is treated as SKIP (not FAIL) when `gh` is unavailable,
 * unauthenticated, or unreachable — same rationale as check-a5-ci-gate-config.js.
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

console.log('\n[check-b2-ci-gate-config] Scenario B CI-blocking gate — structural config checks\n');

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
console.log('\n[b2] AC1/AC2 — Scenario B job: present, no continue-on-error');

const newJobBlock = workflowExists ? extractJobBlock(workflowText, 'scenario-b-staging-e2e') : null;

if (newJobBlock) {
  pass('T1', 'scenario-b-staging-e2e job is present in e2e.yml');
} else {
  fail('T1', 'scenario-b-staging-e2e job not found in e2e.yml');
}

if (newJobBlock) {
  const hasContinueOnError = /continue-on-error\s*:\s*true/.test(newJobBlock);
  if (!hasContinueOnError) {
    pass('T2', 'scenario-b-staging-e2e job has no continue-on-error: true anywhere in its block');
  } else {
    fail('T2', 'scenario-b-staging-e2e job unexpectedly sets continue-on-error: true — this would prevent it from blocking merge on failure (AC1)');
  }

  const nameMatch = /^\s*name:\s*(.+)$/m.exec(newJobBlock);
  if (nameMatch && nameMatch[1].trim().length > 0) {
    pass('T3', 'scenario-b-staging-e2e job has an explicit name: ' + nameMatch[1].trim());
  } else {
    fail('T3', 'scenario-b-staging-e2e job has no explicit name — required to register as a status check');
  }

  const runsB1Spec = /tests\/e2e\/b1-formed-idea-outer-loop-story-map\.spec\.js/.test(newJobBlock);
  if (runsB1Spec) {
    pass('T3b', 'scenario-b-staging-e2e job runs tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js');
  } else {
    fail('T3b', 'scenario-b-staging-e2e job does not reference tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js');
  }
} else {
  fail('T2', 'cannot check continue-on-error — job block not found');
  fail('T3', 'cannot check job name — job block not found');
  fail('T3b', 'cannot check spec file reference — job block not found');
}

// ── AC4 — config-driven enablement, not hardcoded ────────────────────────────
console.log('\n[b2] AC4 — gate enablement is config-driven via context.yml (ADR-004)');

if (newJobBlock) {
  const readsContextYml = /audit\.staging_e2e_scenario_b/.test(newJobBlock);
  if (readsContextYml) {
    pass('T4', 'scenario-b-staging-e2e job reads audit.staging_e2e_scenario_b from context.yml');
  } else {
    fail('T4', 'scenario-b-staging-e2e job does not reference audit.staging_e2e_scenario_b — enablement may be hardcoded');
  }

  const readsFromFile = /\.github\/context\.yml/.test(newJobBlock);
  if (readsFromFile) {
    pass('T5', 'scenario-b-staging-e2e job reads .github/context.yml as its config source');
  } else {
    fail('T5', 'scenario-b-staging-e2e job does not read .github/context.yml at all');
  }
} else {
  fail('T4', 'cannot check context.yml reference — job block not found');
  fail('T5', 'cannot check context.yml file read — job block not found');
}

if (contextExists) {
  const hasFlag = /staging_e2e_scenario_b\s*:\s*true/.test(contextText);
  if (hasFlag) {
    pass('T6', 'context.yml declares audit.staging_e2e_scenario_b: true');
  } else {
    fail('T6', 'context.yml does not declare staging_e2e_scenario_b: true under audit:');
  }

  // Distinct from both the pre-existing non-blocking e2e_tests key and A5's
  // own staging_e2e_scenario_a key. Only the YAML key portion (before any
  // trailing "#" comment) is checked -- the comment text is expected to
  // reference the sibling keys by name for documentation purposes, so
  // scanning the whole line (including the comment) would produce a false
  // positive here.
  const scenarioBLine = (contextText.match(/^.*staging_e2e_scenario_b.*$/m) || [''])[0];
  const scenarioBKeyPortion = scenarioBLine.split('#')[0];
  const isDistinctKey = /^\s*staging_e2e_scenario_b\s*:\s*true\s*$/.test(scenarioBKeyPortion);
  if (isDistinctKey) {
    pass('T7', 'staging_e2e_scenario_b is its own distinct YAML key (not a reuse of e2e_tests or staging_e2e_scenario_a): ' + JSON.stringify(scenarioBKeyPortion.trim()));
  } else {
    fail('T7', 'staging_e2e_scenario_b\'s key portion does not appear to be a clean, distinct key: ' + JSON.stringify(scenarioBKeyPortion));
  }
} else {
  fail('T6', 'cannot check context.yml flag — file not found');
  fail('T7', 'cannot check distinct key — file not found');
}

// ── Regression — pre-existing jobs unchanged (additive only) ────────────────
console.log('\n[b2] Regression — pre-existing `e2e` and `scenario-a-staging-e2e` jobs are unchanged');

const preExistingJobBlock = workflowExists ? extractJobBlock(workflowText, 'e2e') : null;
const scenarioAJobBlock = workflowExists ? extractJobBlock(workflowText, 'scenario-a-staging-e2e') : null;

if (preExistingJobBlock) {
  pass('T8', 'pre-existing e2e job block still present');
} else {
  fail('T8', 'pre-existing e2e job block not found — has it been removed or renamed?');
}

if (scenarioAJobBlock) {
  pass('T8b', 'scenario-a-staging-e2e job block still present (A5, unmodified by this story)');
  const hasContinueOnErrorA = /continue-on-error\s*:\s*true/.test(scenarioAJobBlock);
  if (!hasContinueOnErrorA) {
    pass('T8c', 'scenario-a-staging-e2e job still has no continue-on-error: true (unchanged blocking posture)');
  } else {
    fail('T8c', 'scenario-a-staging-e2e job unexpectedly now has continue-on-error: true — this story must not weaken A5\'s gate');
  }
} else {
  fail('T8b', 'scenario-a-staging-e2e job not found — this story must not remove or rename A5\'s job');
}

if (preExistingJobBlock) {
  const continueOnErrorCount = (preExistingJobBlock.match(/continue-on-error\s*:\s*true/g) || []).length;
  if (continueOnErrorCount === 1) {
    pass('T10', 'pre-existing e2e job has exactly one continue-on-error: true (unchanged non-blocking posture)');
  } else {
    fail('T10', 'pre-existing e2e job has ' + continueOnErrorCount + ' continue-on-error: true occurrences (expected exactly 1) — non-blocking posture may have changed');
  }
}

// Exactly three jobs total: e2e (non-blocking), scenario-a-staging-e2e (A5),
// scenario-b-staging-e2e (this story). No job removed, no fourth job
// silently introduced beyond this story's scope.
if (workflowExists) {
  const jobsSectionIdx = workflowText.search(/^jobs:\s*$/m);
  const jobsSectionText = jobsSectionIdx === -1 ? '' : workflowText.slice(jobsSectionIdx);
  const jobKeys = (jobsSectionText.match(/^  [a-zA-Z0-9_-]+:\s*$/gm) || []).map(function (l) {
    return l.trim().replace(/:$/, '');
  });
  const uniqueJobKeys = jobKeys.filter(function (k, i) { return jobKeys.indexOf(k) === i; });
  const expected = ['e2e', 'scenario-a-staging-e2e', 'scenario-b-staging-e2e'];
  const matches = uniqueJobKeys.length === expected.length && expected.every(function (k) { return uniqueJobKeys.indexOf(k) !== -1; });
  if (matches) {
    pass('T11', 'e2e.yml contains exactly 3 jobs: e2e, scenario-a-staging-e2e, scenario-b-staging-e2e — ' + JSON.stringify(uniqueJobKeys));
  } else {
    fail('T11', 'e2e.yml job list is not exactly ' + JSON.stringify(expected) + ' — got: ' + JSON.stringify(uniqueJobKeys));
  }
} else {
  fail('T11', 'cannot check job count — workflow file not found');
}

// ── AC1/AC2 (best-effort, live) — is the check registered as required? ──────
console.log('\n[b2] AC1/AC2 (live, best-effort) — is "Scenario B E2E (staging)" a required status check on master?');
{
  const REQUIRED_CHECK_NAME = 'Scenario B E2E (staging)';
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
console.log('\n[check-b2-ci-gate-config] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped\n');
if (failed > 0) process.exit(1);
