#!/usr/bin/env node
// check-p4-dist-commit-format.js — test plan verification for p4-dist-commit-format
// Covers T1–T8 (AC1–AC4) and T-NFR1
// Tests FAIL until src/distribution/commit-format.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const FORMAT_MOD = path.join(ROOT, 'src', 'distribution', 'commit-format.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(FORMAT_MOD)) return null;
  try {
    delete require.cache[require.resolve(FORMAT_MOD)];
    return require(FORMAT_MOD);
  } catch (_) { return null; }
}

function getError(fn) {
  try {
    const r = fn();
    // May return error object instead of throwing
    if (r !== null && r !== undefined) return r;
    return null;
  } catch (e) { return e; }
}

// ── AC1 — Non-matching commit → error ─────────────────────────────────────────
console.log('\n[p4-dist-commit-format] AC1 — non-matching commit message → error with SHA, excerpt, regex');

// T1 — Module exists
{
  assert(fs.existsSync(FORMAT_MOD), 'T1: src/distribution/commit-format.js exists');
}

const mod = loadModule();

// T2 — Non-matching message returns error
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T2: validateCommitFormat exported (module or function missing)');
  } else {
    const err = getError(() => mod.validateCommitFormat({
      regex: '^JIRA-[0-9]+',
      sha: 'abc12345ffffffff',
      message: 'fix typo in README',
    }));
    assert(err !== null, 'T2: non-matching commit returns error (non-null)');
  }
}

// T3 — Error contains 8-char SHA, excerpt, and regex
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T3: error message content (function missing)');
  } else {
    const err = getError(() => mod.validateCommitFormat({
      regex: '^JIRA-[0-9]+',
      sha: 'abc12345ffffffff',
      message: 'fix typo in README for issue tracker purposes',
    }));
    const msg = err ? (err.message || err.toString() || JSON.stringify(err)) : '';
    assert(msg.includes('abc12345'), `T3a: error includes 8-char SHA prefix (got: ${msg.substring(0, 120)})`);
    assert(/fix typo/i.test(msg),    'T3b: error includes message excerpt');
    assert(msg.includes('^JIRA-[0-9]+'), 'T3c: error includes the regex string');
  }
}

// ── AC2 — Absent regex → no validation ───────────────────────────────────────
console.log('\n[p4-dist-commit-format] AC2 — absent commit_format_regex → no validation runs');

// T5 — null regex → returns null immediately
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T5: null regex skips validation (function missing)');
  } else {
    const result = getError(() => mod.validateCommitFormat({
      regex: null,
      sha: 'abc12345',
      message: 'anything goes here',
    }));
    assert(result === null || result === undefined,
      `T5: validateCommitFormat with null regex returns null (got: ${JSON.stringify(result)})`);
  }
}

// ── AC3 — Matching commit passes ──────────────────────────────────────────────
console.log('\n[p4-dist-commit-format] AC3 — matching commit message passes without error');

// T4 — Matching message returns null
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T4: matching message passes (function missing)');
  } else {
    const result = getError(() => mod.validateCommitFormat({
      regex: '^JIRA-[0-9]+',
      sha: 'abc12345',
      message: 'JIRA-123 fix typo in README',
    }));
    assert(result === null || result === undefined,
      `T4: matching message returns null/undefined — no error (got: ${JSON.stringify(result)})`);
  }
}

// ── AC4 — Invalid regex → named error ─────────────────────────────────────────
console.log('\n[p4-dist-commit-format] AC4 — invalid regex string → named error identifying context.yml location');

// T6 — Invalid regex handled gracefully (no thrown SyntaxError)
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T6: invalid regex handled gracefully (function missing)');
  } else {
    let caught = null;
    let isRawSyntaxError = false;
    try {
      const r = mod.validateCommitFormat({ regex: '[invalid', sha: 'abc12345', message: 'any' });
      caught = r;
    } catch (e) {
      caught = e;
      isRawSyntaxError = e instanceof SyntaxError && e.stack && !e.message.includes('context.yml');
    }
    assert(!isRawSyntaxError, 'T6: invalid regex does not propagate raw SyntaxError to caller');
    assert(caught !== null && caught !== undefined, 'T6b: invalid regex returns/throws something (error object)');
  }
}

// T7 — Invalid regex error message identifies context.yml location
{
  if (!mod || typeof mod.validateCommitFormat !== 'function') {
    assert(false, 'T7: invalid regex error identifies context.yml (function missing)');
  } else {
    let msg = '';
    try {
      const r = mod.validateCommitFormat({ regex: '[invalid', sha: 'abc12345', message: 'any' });
      msg = r ? (r.message || r.toString() || JSON.stringify(r)) : '';
    } catch (e) { msg = e.message || ''; }
    assert(msg.includes('distribution.commit_format_regex'),
      `T7a: error mentions 'distribution.commit_format_regex' (got: ${msg.substring(0, 120)})`);
    assert(msg.includes('context.yml'),
      `T7b: error mentions 'context.yml' (got: ${msg.substring(0, 120)})`);
  }
}

// ── AC1 / NFR — ADR-004 compliance ───────────────────────────────────────────
console.log('\n[p4-dist-commit-format] ADR-004 — no CLI arg or env var as regex source');

// T8 — Source scan: regex not sourced from process.argv or process.env
{
  if (!fs.existsSync(FORMAT_MOD)) {
    assert(false, 'T8: module exists for source scan');
  } else {
    const src = fs.readFileSync(FORMAT_MOD, 'utf8');
    // Should not read commit_format_regex from argv or env
    const ARGV_RE   = /process\.argv.*commit_format|commit_format.*process\.argv/i;
    const ENV_RE    = /process\.env.*commit_format|commit_format.*process\.env/i;
    assert(!ARGV_RE.test(src), 'T8a: regex not sourced from process.argv');
    assert(!ENV_RE.test(src),  'T8b: regex not sourced from process.env');
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-commit-format] NFR — commit message not logged externally');

// T-NFR1 — Source scan: no network call with message as argument
{
  if (!fs.existsSync(FORMAT_MOD)) {
    assert(false, 'T-NFR1: module exists for source scan');
  } else {
    const src = fs.readFileSync(FORMAT_MOD, 'utf8');
    const NETWORK_RE = /require\(['"]https?['"]|require\(['"]dns['"]|fetch\(|http\.get\(|https\.get\(/;
    assert(!NETWORK_RE.test(src), 'T-NFR1: no outbound HTTP/HTTPS/fetch call in commit-format module');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-commit-format] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
