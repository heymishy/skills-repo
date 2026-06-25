/**
 * Tests for sri.1: git fetch timeout + fallback in inner-loop skills.
 * Content assertion tests — no mocking, no network calls.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

const SKILLS = {
  branchComplete: path.join(repoRoot, 'skills', 'branch-complete', 'SKILL.md'),
  implementationPlan: path.join(repoRoot, 'skills', 'implementation-plan', 'SKILL.md'),
  subagentExecution: path.join(repoRoot, 'skills', 'subagent-execution', 'SKILL.md'),
};

function readSkill(p) {
  return fs.readFileSync(p, 'utf8');
}

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ─── T1: branch-complete contains fetch timeout + fallback ─────────────────
{
  const content = readSkill(SKILLS.branchComplete);
  const hasTimeout = /5[- ]second timeout|timeout.*5[,\s]|timeout:\s*5000/i.test(content);
  const hasFallback = /fallback/i.test(content);
  assert(
    'T1 branch-complete-contains-fetch-timeout-and-fallback',
    hasTimeout && hasFallback,
    `timeout=${hasTimeout} fallback=${hasFallback}`
  );
}

// ─── T2: branch-complete fallback mentions local copy ───────────────────────
{
  const content = readSkill(SKILLS.branchComplete);
  const hasLocal = /local.*copy|local.*branch|worktree.*file/i.test(content);
  assert('T2 branch-complete-contains-local-copy-fallback-path', hasLocal);
}

// ─── T3: branch-complete contains origin-not-reachable warning ──────────────
{
  const content = readSkill(SKILLS.branchComplete);
  const hasWarning = /origin.*not.*reachable|warn.*origin|origin.*unreachable/i.test(content);
  assert('T3 branch-complete-contains-origin-not-reachable-warning', hasWarning);
}

// ─── T4: implementation-plan contains fetch timeout + fallback ──────────────
{
  const content = readSkill(SKILLS.implementationPlan);
  const hasTimeout = /5[- ]second timeout|timeout.*5[,\s]|timeout:\s*5000/i.test(content);
  const hasFallback = /fallback/i.test(content);
  assert(
    'T4 implementation-plan-contains-fetch-timeout-and-fallback',
    hasTimeout && hasFallback,
    `timeout=${hasTimeout} fallback=${hasFallback}`
  );
}

// ─── T5: implementation-plan fallback mentions local copy ───────────────────
{
  const content = readSkill(SKILLS.implementationPlan);
  const hasLocal = /local.*copy|local.*branch|worktree.*file/i.test(content);
  assert('T5 implementation-plan-contains-local-copy-fallback-path', hasLocal);
}

// ─── T6: implementation-plan contains origin-not-reachable warning ──────────
{
  const content = readSkill(SKILLS.implementationPlan);
  const hasWarning = /origin.*not.*reachable|warn.*origin|origin.*unreachable/i.test(content);
  assert('T6 implementation-plan-contains-origin-not-reachable-warning', hasWarning);
}

// ─── T7: subagent-execution contains fetch timeout + fallback ───────────────
{
  const content = readSkill(SKILLS.subagentExecution);
  const hasTimeout = /5[- ]second timeout|timeout.*5[,\s]|timeout:\s*5000/i.test(content);
  const hasFallback = /fallback/i.test(content);
  assert(
    'T7 subagent-execution-contains-fetch-timeout-and-fallback',
    hasTimeout && hasFallback,
    `timeout=${hasTimeout} fallback=${hasFallback}`
  );
}

// ─── T8: subagent-execution fallback mentions local copy ────────────────────
{
  const content = readSkill(SKILLS.subagentExecution);
  const hasLocal = /local.*copy|local.*branch|worktree.*file/i.test(content);
  assert('T8 subagent-execution-contains-local-copy-fallback-path', hasLocal);
}

// ─── T9: subagent-execution contains origin-not-reachable warning ───────────
{
  const content = readSkill(SKILLS.subagentExecution);
  const hasWarning = /origin.*not.*reachable|warn.*origin|origin.*unreachable/i.test(content);
  assert('T9 subagent-execution-contains-origin-not-reachable-warning', hasWarning);
}

// ─── T10: regression guard — git fetch origin master still present ───────────
{
  const bc = readSkill(SKILLS.branchComplete);
  const ip = readSkill(SKILLS.implementationPlan);
  const se = readSkill(SKILLS.subagentExecution);
  const allPresent =
    bc.includes('git fetch origin master') &&
    ip.includes('git fetch origin master') &&
    se.includes('git fetch origin master');
  assert('T10 git-fetch-origin-master-instruction-still-present', allPresent);
}

// ─── T11: NFR-SEC — branch-complete warning does not log remote URL ─────────
{
  const content = readSkill(SKILLS.branchComplete);
  // Extract the fallback/warning block — find text near the warning
  const hasUnsafeLog = /log.*https?:\/\/|log.*origin.*url|log.*remote.*url|console.*log.*url/i.test(content);
  assert('T11 branch-complete-warning-does-not-log-remote-url', !hasUnsafeLog);
}

// ─── T12: NFR-SEC — implementation-plan warning does not log remote URL ─────
{
  const content = readSkill(SKILLS.implementationPlan);
  const hasUnsafeLog = /log.*https?:\/\/|log.*origin.*url|log.*remote.*url|console.*log.*url/i.test(content);
  assert('T12 implementation-plan-warning-does-not-log-remote-url', !hasUnsafeLog);
}

// ─── T13: NFR-SEC — subagent-execution warning does not log remote URL ──────
{
  const content = readSkill(SKILLS.subagentExecution);
  const hasUnsafeLog = /log.*https?:\/\/|log.*origin.*url|log.*remote.*url|console.*log.*url/i.test(content);
  assert('T13 subagent-execution-warning-does-not-log-remote-url', !hasUnsafeLog);
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
