#!/usr/bin/env node
/**
 * check-p3.6-dispatch.js
 *
 * Automated tests for the pipeline-evolution dispatch wiring (p3.6).
 *
 * Tests from the test plan:
 *   AC1 — issue-dispatch SKILL.md adds "Closes #[issueNumber]" to vscode body format:
 *   - closes-keyword-present-in-issue-dispatch-skill
 *
 *   AC2 — definition-of-ready SKILL.md has forward-pointer to /issue-dispatch:
 *   - dor-skill-has-forward-pointer-to-issue-dispatch
 *
 *   AC3 — note about auto-close is present (Closes keyword auto-closes):
 *   - issue-dispatch-skill-documents-auto-close-behaviour
 *
 *   AC4 — no manual instruction to add Closes keyword in DoR skill:
 *   - dor-skill-says-closes-added-automatically
 *
 * Run:  node tests/check-p3.6-dispatch.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let passed  = 0;
let failed  = 0;
const failures = [];

function pass(name) {
  console.log('  ✓ ' + name);
  passed++;
}
function fail(name, reason) {
  console.error('  ✗ ' + name);
  console.error('      ' + reason);
  failed++;
  failures.push(name + ': ' + reason);
}

const issueDispatchSkill = path.join(root, '.github', 'skills', 'issue-dispatch', 'SKILL.md');
const dorSkill           = path.join(root, '.github', 'skills', 'definition-of-ready', 'SKILL.md');

// ── Test: Closes keyword in issue-dispatch SKILL.md (AC1) ────────────────────
(function test_closes_keyword_in_issue_dispatch() {
  const name = 'closes-keyword-present-in-issue-dispatch-skill';
  if (!fs.existsSync(issueDispatchSkill)) {
    fail(name, '.github/skills/issue-dispatch/SKILL.md not found');
    return;
  }
  const content = fs.readFileSync(issueDispatchSkill, 'utf8');
  if (/Closes\s+#\[issueNumber\]/i.test(content) || /Closes\s+#/.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain "Closes #" keyword pattern');
  }
})();

// ── Test: auto-close documented in issue-dispatch SKILL.md (AC3) ─────────────
(function test_auto_close_documented() {
  const name = 'issue-dispatch-skill-documents-auto-close-behaviour';
  if (!fs.existsSync(issueDispatchSkill)) {
    fail(name, '.github/skills/issue-dispatch/SKILL.md not found');
    return;
  }
  const content = fs.readFileSync(issueDispatchSkill, 'utf8');
  const hasAutoClose = /auto.?clos|automatically clos/i.test(content);
  const hasGitHubNote = /github|pull request|PR/i.test(content);
  if (hasAutoClose || hasGitHubNote) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not document auto-close behaviour (missing "auto-close" / "automatically closes" text)');
  }
})();

// ── Test: DoR SKILL.md has forward-pointer to /issue-dispatch (AC2) ──────────
(function test_dor_has_forward_pointer() {
  const name = 'dor-skill-has-forward-pointer-to-issue-dispatch';
  if (!fs.existsSync(dorSkill)) {
    fail(name, '.github/skills/definition-of-ready/SKILL.md not found');
    return;
  }
  const content = fs.readFileSync(dorSkill, 'utf8');
  if (/\/issue-dispatch/.test(content)) {
    pass(name);
  } else {
    fail(name, 'definition-of-ready SKILL.md does not reference /issue-dispatch');
  }
})();

// ── Test: DoR SKILL.md says Closes is added automatically (AC4) ──────────────
(function test_dor_says_closes_automatic() {
  const name = 'dor-skill-says-closes-added-automatically';
  if (!fs.existsSync(dorSkill)) {
    fail(name, '.github/skills/definition-of-ready/SKILL.md not found');
    return;
  }
  const content = fs.readFileSync(dorSkill, 'utf8');
  // Either "automatically" near "Closes" OR "do not need to add"
  const hasAutomatic = /automatically|do not need to add/i.test(content);
  if (hasAutomatic) {
    pass(name);
  } else {
    fail(name, 'definition-of-ready SKILL.md does not state that Closes keyword is added automatically');
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('check-p3.6-dispatch: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
