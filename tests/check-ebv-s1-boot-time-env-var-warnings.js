#!/usr/bin/env node
// check-ebv-s1-boot-time-env-var-warnings.js — test plan verification for ebv-s1
// Covers U1-U11 (AC1-AC5) from the test plan.
// Run: node tests/check-ebv-s1-boot-time-env-var-warnings.js
'use strict';

const path = require('path');

const MODULE = path.join(__dirname, '..', 'src', 'web-ui', 'config', 'validate-env.js');
const { warnOnOptionalEnvVars } = require(MODULE);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function fakeLogger() {
  const warnings = [];
  return {
    warnings,
    warn: (msg) => warnings.push(msg),
  };
}

function includesAll(warnings, substrings) {
  return warnings.some((w) => substrings.every((s) => w.includes(s)));
}

const FULLY_CONFIGURED = {
  PLATFORM_TENANT_ID: 'tenant-abc',
  ADMIN_GITHUB_LOGINS: 'someuser',
  ANTHROPIC_API_KEY: 'sk-real-value',
};

// ── U1/U2 — AC1: PLATFORM_TENANT_ID ──────────────────────────────────────────
console.log('\n[ebv-s1] AC1 — PLATFORM_TENANT_ID');
{
  const log1 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { PLATFORM_TENANT_ID: undefined }), log1);
  assert(includesAll(log1.warnings, ['PLATFORM_TENANT_ID', 'self-registration']), 'U1: missing PLATFORM_TENANT_ID warns naming it and the consequence');

  const log2 = fakeLogger();
  warnOnOptionalEnvVars(FULLY_CONFIGURED, log2);
  assert(!log2.warnings.some((w) => w.includes('PLATFORM_TENANT_ID')), 'U2: present PLATFORM_TENANT_ID emits no warning for it');
}

// ── U3/U4/U5 — AC2: ADMIN_GITHUB_LOGINS ──────────────────────────────────────
console.log('\n[ebv-s1] AC2 — ADMIN_GITHUB_LOGINS');
{
  const log3 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { ADMIN_GITHUB_LOGINS: undefined }), log3);
  assert(includesAll(log3.warnings, ['ADMIN_GITHUB_LOGINS', 'admin/credits']), 'U3: unset ADMIN_GITHUB_LOGINS warns naming it and the consequence');

  const log4 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { ADMIN_GITHUB_LOGINS: '  ,  ,' }), log4);
  assert(includesAll(log4.warnings, ['ADMIN_GITHUB_LOGINS']), 'U4: whitespace/empty-after-parsing value also warns (not silently accepted)');

  const log5 = fakeLogger();
  warnOnOptionalEnvVars(FULLY_CONFIGURED, log5);
  assert(!log5.warnings.some((w) => w.includes('ADMIN_GITHUB_LOGINS')), 'U5: present, real ADMIN_GITHUB_LOGINS emits no warning');
}

// ── U6/U7/U8 — AC3: anthropic provider + ANTHROPIC_API_KEY ───────────────────
console.log('\n[ebv-s1] AC3 — anthropic provider + ANTHROPIC_API_KEY');
{
  const log6 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { ANTHROPIC_API_KEY: undefined }), log6);
  assert(includesAll(log6.warnings, ['SKILL_EXECUTOR_PROVIDER', 'ANTHROPIC_API_KEY']), 'U6: default (unset) provider + missing key warns naming both');

  const log7 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { SKILL_EXECUTOR_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: undefined }), log7);
  assert(includesAll(log7.warnings, ['ANTHROPIC_API_KEY']), 'U7: explicit anthropic provider + missing key warns');

  const log8 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { SKILL_EXECUTOR_PROVIDER: 'anthropic' }), log8);
  assert(!log8.warnings.some((w) => w.includes('ANTHROPIC_API_KEY')), 'U8: anthropic provider + key present emits no warning');
}

// ── U9/U10 — AC4: copilot provider caveat ────────────────────────────────────
console.log('\n[ebv-s1] AC4 — copilot provider caveat');
{
  const log9 = fakeLogger();
  warnOnOptionalEnvVars(Object.assign({}, FULLY_CONFIGURED, { SKILL_EXECUTOR_PROVIDER: 'copilot' }), log9);
  assert(includesAll(log9.warnings, ['copilot', 'Copilot']), 'U9: copilot provider always warns about the per-user token caveat');

  const log10 = fakeLogger();
  warnOnOptionalEnvVars({ SKILL_EXECUTOR_PROVIDER: 'copilot' }, log10); // no ANTHROPIC_API_KEY at all
  const anthropicWarning = log10.warnings.find((w) => w.includes('ANTHROPIC_API_KEY'));
  assert(!anthropicWarning, 'U10: copilot provider does not also spuriously warn about ANTHROPIC_API_KEY');
}

// ── U11 — AC5: fully-configured environment emits zero warnings ─────────────
console.log('\n[ebv-s1] AC5 — fully-configured regression guard');
{
  const log11 = fakeLogger();
  warnOnOptionalEnvVars(FULLY_CONFIGURED, log11);
  assert(log11.warnings.length === 0, `U11: fully-configured environment emits zero warnings (got ${log11.warnings.length}: ${JSON.stringify(log11.warnings)})`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-ebv-s1-boot-time-env-var-warnings results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
