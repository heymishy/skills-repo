#!/usr/bin/env node
/**
 * check-workspace-state.js
 *
 * Governance test — workspace/state.json schema validation and
 * /checkpoint documentation check.
 *
 * Implements the automatable unit and NFR tests from the test plan for
 * story p1.5 (workspace state + session continuity):
 *
 *   Unit tests:
 *   - state-schema-phase-fields-non-null (AC3b)
 *   - state-schema-no-required-field-missing (AC3b)
 *   - state-written-after-phase-boundary-lastUpdated (AC5)
 *   - state-written-after-phase-boundary-currentPhase (AC5)
 *   - state-written-after-phase-boundary-cycle-block (AC5)
 *   - checkpoint-docs-invoke-before-compaction (AC6)
 *
 *   NFR tests:
 *   - nfr-state-json-no-credentials
 *   - nfr-state-json-audit-lastUpdated-present
 *
 * Run:  node tests/check-workspace-state.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

let failed  = false;
const issues = [];

function fail(testName, message) {
  failed = true;
  issues.push(`  ✗ [${testName}] ${message}`);
}

function pass(testName) {
  // Silent on pass — matches governance script convention.
}

// ── Load workspace/state.json ─────────────────────────────────────────────────

const statePath = path.join(root, 'workspace', 'state.json');

if (!fs.existsSync(statePath)) {
  fail('state-file-exists', 'workspace/state.json does not exist — implementation incomplete');
  report();
  process.exit(1);
}

let state;
let stateRaw;
try {
  stateRaw = fs.readFileSync(statePath, 'utf8');
  state = JSON.parse(stateRaw);
} catch (e) {
  fail('state-json-valid', `workspace/state.json is not valid JSON: ${e.message}`);
  report();
  process.exit(1);
}

// ── state-schema-phase-fields-non-null (AC3b) ─────────────────────────────────
// Parse JSON; assert that currentPhase, lastUpdated, and the cycle block for the
// current phase each have a non-null, non-empty value.

const testName1 = 'state-schema-phase-fields-non-null';
if (!state.currentPhase || typeof state.currentPhase !== 'string' || state.currentPhase.length === 0) {
  fail(testName1, '`currentPhase` is missing, null, or empty string');
} else {
  pass(testName1);
}

if (!state.lastUpdated || typeof state.lastUpdated !== 'string' || state.lastUpdated.length === 0) {
  fail(testName1, '`lastUpdated` is missing, null, or empty string');
} else {
  pass(testName1);
}

if (!state.cycle || typeof state.cycle !== 'object') {
  fail(testName1, '`cycle` block is missing or not an object');
} else {
  pass(testName1);
}

// ── state-schema-no-required-field-missing (AC3b) ────────────────────────────
// Assert that cycle.discovery.completedAt, cycle.discovery.artefact, and
// cycle.discovery.status all exist as keys (not undefined).

const testName2 = 'state-schema-no-required-field-missing';
if (!state.cycle || !state.cycle.discovery) {
  fail(testName2, '`cycle.discovery` block is missing');
} else {
  const disc = state.cycle.discovery;
  if (disc.completedAt === undefined) {
    fail(testName2, '`cycle.discovery.completedAt` key is missing');
  } else {
    pass(testName2);
  }
  if (disc.artefact === undefined) {
    fail(testName2, '`cycle.discovery.artefact` key is missing');
  } else {
    pass(testName2);
  }
  if (disc.status === undefined) {
    fail(testName2, '`cycle.discovery.status` key is missing');
  } else {
    pass(testName2);
  }
}

// ── state-written-after-phase-boundary-lastUpdated (AC5) ─────────────────────
// Validate lastUpdated against ISO 8601 format regex ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}

const testName5a = 'state-written-after-phase-boundary-lastUpdated';
const iso8601Re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
if (!state.lastUpdated) {
  fail(testName5a, '`lastUpdated` is missing or null');
} else if (!iso8601Re.test(state.lastUpdated)) {
  fail(testName5a, `\`lastUpdated\` value "${state.lastUpdated}" does not match ISO 8601 format (expected ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}...)`);
} else {
  pass(testName5a);
}

// ── state-written-after-phase-boundary-currentPhase (AC5) ────────────────────
// Assert typeof currentPhase === 'string' && currentPhase.length > 0

const testName5b = 'state-written-after-phase-boundary-currentPhase';
if (typeof state.currentPhase !== 'string' || state.currentPhase.length === 0) {
  fail(testName5b, '`currentPhase` must be a non-empty string');
} else {
  pass(testName5b);
}

// ── state-written-after-phase-boundary-cycle-block (AC5) ─────────────────────
// Assert cycle.discovery.status and cycle.discovery.artefact are present and non-empty

const testName5c = 'state-written-after-phase-boundary-cycle-block';
if (state.cycle && state.cycle.discovery) {
  const disc = state.cycle.discovery;
  if (!disc.status || typeof disc.status !== 'string' || disc.status.length === 0) {
    fail(testName5c, '`cycle.discovery.status` must be a non-empty string');
  } else {
    pass(testName5c);
  }
  if (!disc.artefact || typeof disc.artefact !== 'string' || disc.artefact.length === 0) {
    fail(testName5c, '`cycle.discovery.artefact` must be a non-empty string');
  } else {
    pass(testName5c);
  }
} else {
  fail(testName5c, '`cycle.discovery` block is missing — cannot verify status and artefact fields');
}

// ── nfr-state-json-no-credentials ────────────────────────────────────────────
// Scan the serialised JSON string for credential-like patterns.

const testNameNfr1 = 'nfr-state-json-no-credentials';
const credentialPatterns = [
  /ghp_/,
  /Bearer /i,
  /\btoken:/i,
  /\bpassword:/i,
  /\bsecret:/i,
  /\bapikey\b/i,
  /\bapi_key\b/i,
];
let credFound = false;
for (const pattern of credentialPatterns) {
  if (pattern.test(stateRaw)) {
    fail(testNameNfr1, `workspace/state.json contains a credential-like pattern: ${pattern}`);
    credFound = true;
  }
}
if (!credFound) {
  pass(testNameNfr1);
}

// ── nfr-state-json-audit-lastUpdated-present ─────────────────────────────────
// Assert lastUpdated field is present at root level and is ISO 8601.

const testNameNfr3 = 'nfr-state-json-audit-lastUpdated-present';
if (!state.lastUpdated) {
  fail(testNameNfr3, '`lastUpdated` field missing at root level');
} else if (!iso8601Re.test(state.lastUpdated)) {
  fail(testNameNfr3, `\`lastUpdated\` "${state.lastUpdated}" is not ISO 8601 format`);
} else {
  pass(testNameNfr3);
}

// ── Load .github/copilot-instructions.md ─────────────────────────────────────

const ciPath = path.join(root, '.github', 'copilot-instructions.md');

if (!fs.existsSync(ciPath)) {
  fail('copilot-instructions-exists', '.github/copilot-instructions.md does not exist');
  report();
  process.exit(1);
}

const ciContent = fs.readFileSync(ciPath, 'utf8');

// ── checkpoint-docs-invoke-before-compaction (AC6) ───────────────────────────
// Assert the file contains the word "compaction" and a negative instruction
// ("not at" or "before reaching").

const testName8 = 'checkpoint-docs-invoke-before-compaction';
if (!ciContent.includes('compaction')) {
  fail(testName8, '`copilot-instructions.md` does not contain the word "compaction"');
} else {
  pass(testName8);
}

const hasNegativeInstruction =
  ciContent.includes('not at it') ||
  ciContent.includes('before reaching') ||
  ciContent.includes('not at the') ||
  ciContent.includes('before the compaction');

if (!hasNegativeInstruction) {
  fail(testName8, '`copilot-instructions.md` does not contain a negative instruction ("not at it", "before reaching", "not at the", or "before the compaction")');
} else {
  pass(testName8);
}

// ── state-proposals-block-schema (ADR-003 schema-first) ──────────────────────
// If a proposals block is present, validate its structure.
// Fields required per proposal: file (string), created_at (string), status (string).
// This defines the proposals schema before any write — satisfying ADR-003.

const testNameProposals = 'state-proposals-block-schema';
if (state.proposals !== undefined) {
  if (!Array.isArray(state.proposals)) {
    fail(testNameProposals, '`proposals` must be an array if present');
  } else {
    let proposalsOk = true;
    for (let i = 0; i < state.proposals.length; i++) {
      const p = state.proposals[i];
      if (!p.file || typeof p.file !== 'string') {
        fail(testNameProposals, `proposals[${i}].file is missing or not a string`);
        proposalsOk = false;
      }
      if (!p.created_at || typeof p.created_at !== 'string') {
        fail(testNameProposals, `proposals[${i}].created_at is missing or not a string`);
        proposalsOk = false;
      }
      if (!p.status || typeof p.status !== 'string') {
        fail(testNameProposals, `proposals[${i}].status is missing or not a string`);
        proposalsOk = false;
      }
    }
    if (proposalsOk) {
      pass(testNameProposals);
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

function report() {
  if (failed) {
    process.stderr.write('\n[workspace-state] FAIL — schema and documentation issues found:\n\n');
    for (const issue of issues) {
      process.stderr.write(issue + '\n');
    }
    process.stderr.write(
      '\nFix workspace/state.json and/or .github/copilot-instructions.md to resolve.\n\n'
    );
    process.exit(1);
  }
  const testCount = 10; // number of named non-conditional test checks above
                        // (proposals block validation is conditional — only runs when proposals key is present)
  process.stdout.write(`[workspace-state] ${testCount} check(s) OK \u2713\n`);
  process.exit(0);
}

report();
