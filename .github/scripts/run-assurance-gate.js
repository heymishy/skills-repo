#!/usr/bin/env node
/**
 * run-assurance-gate.js
 *
 * Assurance gate runner for CI-triggered governance checks.
 * Implements story p1.3: Deploy assurance agent as automated CI gate on PR open/update.
 *
 * Behaviour:
 *   1. Writes an `inProgress` trace entry to workspace/traces/ BEFORE any evaluation
 *   2. Executes structural and audit checks
 *   3. Writes a `completed` trace entry containing verdict, traceHash, prRef,
 *      commitSha, trigger, startedAt, and completedAt
 *
 * Run:  node .github/scripts/run-assurance-gate.js
 * Used: .github/workflows/assurance-gate.yml
 *
 * Zero external dependencies — plain Node.js (fs, path, crypto).
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DEFAULT_TRACES_DIR = path.join(__dirname, '..', '..', 'workspace', 'traces');
const DEFAULT_ROOT       = path.join(__dirname, '..', '..');

// ── Trace helpers ─────────────────────────────────────────────────────────────

/**
 * Compute a SHA-256 hash of the key trace fields.
 * Returns the first 16 hex chars (64-bit prefix) as the traceHash.
 */
function computeTraceHash(fields) {
  const data = JSON.stringify({
    trigger:     fields.trigger,
    prRef:       fields.prRef,
    commitSha:   fields.commitSha,
    startedAt:   fields.startedAt,
    completedAt: fields.completedAt,
    verdict:     fields.verdict,
  });
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/**
 * Append a single JSON entry (one line) to the trace file for this run.
 * Returns the file path written.
 */
function appendTraceEntry(tracesDir, runId, entry) {
  const filePath = path.join(tracesDir, runId + '.jsonl');
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
  return filePath;
}

/**
 * Build a unique run ID from the current timestamp, trigger, and a random suffix.
 */
function buildRunId(trigger) {
  const ts   = new Date().toISOString().replace(/[:.]/g, '-');
  const rand = crypto.randomBytes(4).toString('hex');
  return ts + '-' + trigger + '-' + rand;
}

// ── Structural and audit checks ───────────────────────────────────────────────

/**
 * Run the built-in structural and audit checks against the repository root.
 * Returns an array of check result objects: { name, passed, reason? }
 */
function runChecks(root) {
  const checks = [];

  // Check 1: workspace/state.json exists and is valid JSON
  const statePath = path.join(root, 'workspace', 'state.json');
  if (fs.existsSync(statePath)) {
    try {
      JSON.parse(fs.readFileSync(statePath, 'utf8'));
      checks.push({ name: 'workspace-state-valid', passed: true });
    } catch (e) {
      checks.push({ name: 'workspace-state-valid', passed: false,
        reason: 'workspace/state.json is not valid JSON: ' + e.message });
    }
  } else {
    checks.push({ name: 'workspace-state-valid', passed: false,
      reason: 'workspace/state.json not found' });
  }

  // Check 2: .github/pipeline-state.json exists and is valid JSON
  const pipelinePath = path.join(root, '.github', 'pipeline-state.json');
  if (fs.existsSync(pipelinePath)) {
    try {
      JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));
      checks.push({ name: 'pipeline-state-valid', passed: true });
    } catch (e) {
      checks.push({ name: 'pipeline-state-valid', passed: false,
        reason: '.github/pipeline-state.json is not valid JSON: ' + e.message });
    }
  } else {
    checks.push({ name: 'pipeline-state-valid', passed: false,
      reason: '.github/pipeline-state.json not found' });
  }

  // Check 3: artefacts directory exists
  const artefactsPath = path.join(root, 'artefacts');
  if (fs.existsSync(artefactsPath)) {
    checks.push({ name: 'artefacts-dir-exists', passed: true });
  } else {
    checks.push({ name: 'artefacts-dir-exists', passed: false,
      reason: 'artefacts/ directory not found' });
  }

  // Check 4: .github/governance-gates.yml exists
  const govGatesPath = path.join(root, '.github', 'governance-gates.yml');
  if (fs.existsSync(govGatesPath)) {
    checks.push({ name: 'governance-gates-exists', passed: true });
  } else {
    checks.push({ name: 'governance-gates-exists', passed: false,
      reason: '.github/governance-gates.yml not found' });
  }

  return checks;
}

// ── Gate runner ───────────────────────────────────────────────────────────────

/**
 * Run the assurance gate.
 *
 * @param {object}   ctx
 * @param {string}   ctx.trigger        'ci' | 'manual'
 * @param {string}   ctx.prRef          e.g. 'refs/pull/42/merge'
 * @param {string}   ctx.commitSha      40-char hex commit SHA
 * @param {string}   [ctx.tracesDir]    path to traces directory (default: workspace/traces)
 * @param {string}   [ctx.root]         repo root (default: two levels up from this script)
 * @param {function} [ctx.checksRunner] override structural checks (testing hook)
 * @param {string}   [ctx.runId]        override run ID (testing hook)
 *
 * @returns {{ verdict, traceHash, runId, tracePath }}
 */
function runGate(ctx) {
  const {
    trigger      = 'manual',
    prRef        = '',
    commitSha    = '',
    tracesDir    = DEFAULT_TRACES_DIR,
    root         = DEFAULT_ROOT,
    checksRunner = null,
    runId        = buildRunId(trigger),
  } = ctx || {};

  const startedAt = new Date().toISOString();

  // Ensure traces directory exists
  if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
  }

  // ── STEP 1: Write inProgress trace entry BEFORE any evaluation ────────────
  const inProgressEntry = {
    status:    'inProgress',
    trigger,
    prRef,
    commitSha,
    startedAt,
  };
  const tracePath = appendTraceEntry(tracesDir, runId, inProgressEntry);

  // ── STEP 2: Execute structural and audit checks ───────────────────────────
  let checks;
  try {
    checks = checksRunner ? checksRunner(root) : runChecks(root);
  } catch (err) {
    checks = [{ name: 'checks-exception', passed: false, reason: err.message }];
  }

  const allPassed = checks.every(function (c) { return c.passed; });
  const verdict   = allPassed ? 'pass' : 'fail';

  // ── STEP 3: Write completed trace entry ───────────────────────────────────
  const completedAt = new Date().toISOString();
  const traceHash   = computeTraceHash({ trigger, prRef, commitSha, startedAt, completedAt, verdict });

  const completedEntry = {
    status:      'completed',
    trigger,
    prRef,
    commitSha,
    startedAt,
    completedAt,
    verdict,
    traceHash,
    checks,
  };
  appendTraceEntry(tracesDir, runId, completedEntry);

  return { verdict, traceHash, runId, tracePath };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { runGate, computeTraceHash, runChecks, appendTraceEntry, buildRunId };

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const trigger   = process.env.TRIGGER    || 'ci';
  const prRef     = process.env.PR_REF     || process.env.GITHUB_REF  || '';
  const commitSha = process.env.COMMIT_SHA || process.env.GITHUB_SHA  || '';

  process.stdout.write(
    '[assurance-gate] Starting (trigger=' + trigger +
    ' prRef=' + prRef +
    ' sha=' + commitSha.slice(0, 8) + ')\n'
  );

  var result;
  try {
    result = runGate({ trigger, prRef, commitSha });
  } catch (err) {
    process.stderr.write('[assurance-gate] Fatal error: ' + err.message + '\n');
    process.exit(1);
  }

  process.stdout.write(
    '[assurance-gate] verdict=' + result.verdict +
    ' traceHash=' + result.traceHash + '\n'
  );
  process.stdout.write('[assurance-gate] Trace: ' + result.tracePath + '\n');

  // Emit step outputs for GitHub Actions verdict-posting step
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'verdict=' + result.verdict + '\n');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'trace_hash=' + result.traceHash + '\n');
  }

  process.exit(result.verdict === 'pass' ? 0 : 1);
}
