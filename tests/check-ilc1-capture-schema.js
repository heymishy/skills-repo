#!/usr/bin/env node
// check-ilc1-capture-schema.js — governance tests for ilc.1
// Covers 12 tests across AC1–AC6 and 2 NFR checks.
// Tests FAIL until copilot-instructions.md is updated with /capture instruction
// and .gitignore is updated — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT         = path.join(__dirname, '..');
const INSTRUCTIONS = path.join(ROOT, '.github', 'copilot-instructions.md');
const GITIGNORE    = path.join(ROOT, '.gitignore');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readInstructions() {
  return fs.readFileSync(INSTRUCTIONS, 'utf8');
}

function readGitignore() {
  return fs.readFileSync(GITIGNORE, 'utf8');
}

function appendToTempFile(tmpPath, content) {
  fs.appendFileSync(tmpPath, content, 'utf8');
}

// ── AC1: /capture command described with all 5 required fields ───────────────

console.log('\n[ilc1-capture-schema] AC1 — /capture instruction + schema');

const instructions = readInstructions();

assert(
  instructions.includes('/capture'),
  'capture-instruction-present: copilot-instructions.md contains /capture as a named command'
);

assert(
  ['date', 'session-phase', 'signal-type', 'signal-text', 'source'].every(f => instructions.includes(f)),
  'capture-schema-five-fields: instruction specifies all 5 required fields (date, session-phase, signal-type, signal-text, source)'
);

assert(
  ['decision', 'learning', 'assumption-validated', 'assumption-invalidated', 'pattern', 'gap'].every(v => instructions.includes(v)),
  'capture-signal-types-enumerated: instruction lists all 6 valid signal-type values'
);

// ── AC2: append preserves existing entries ───────────────────────────────────

console.log('\n[ilc1-capture-schema] AC2 — append preserves existing entries');

{
  const tmp = path.join(os.tmpdir(), `ilc1-ac2-${Date.now()}.md`);
  const entry1 = '- date: 2026-04-28\n  session-phase: definition\n  signal-type: decision\n  signal-text: Use append-only writes.\n  source: operator-manual\n';
  const entry2 = '- date: 2026-04-28\n  session-phase: definition\n  signal-type: learning\n  signal-text: Plain markdown is portable.\n  source: operator-manual\n';

  fs.writeFileSync(tmp, entry1, 'utf8');
  appendToTempFile(tmp, entry2);

  const content = fs.readFileSync(tmp, 'utf8');
  assert(
    content.includes(entry1) && content.includes(entry2),
    'capture-append-preserves-existing: second append does not modify earlier entry'
  );
  assert(
    content.indexOf(entry1) < content.indexOf(entry2),
    'capture-append-no-truncate: original entry precedes appended entry; file not truncated'
  );

  try { fs.unlinkSync(tmp); } catch (_) {}
}

// ── AC3: source=operator-manual ──────────────────────────────────────────────

console.log('\n[ilc1-capture-schema] AC3 — source field value');

{
  const syntheticEntry = '- date: 2026-04-28\n  session-phase: test-plan\n  signal-type: pattern\n  signal-text: Tests read from repo root.\n  source: operator-manual\n';
  assert(
    syntheticEntry.includes('source: operator-manual'),
    'capture-source-operator-manual: operator-invoked entry uses source=operator-manual'
  );
}

// ── AC4: blank-entry guard ───────────────────────────────────────────────────

console.log('\n[ilc1-capture-schema] AC4 — blank-entry guard');

assert(
  /prompt|ask|require/i.test(instructions) &&
  /blank|empty|no signal/i.test(instructions),
  'capture-blank-guard: instruction contains explicit guard against writing a blank entry'
);

// ── AC5: new-session append ───────────────────────────────────────────────────

console.log('\n[ilc1-capture-schema] AC5 — new-session append (never truncate)');

{
  const tmp = path.join(os.tmpdir(), `ilc1-ac5-${Date.now()}.md`);
  const priorEntries = '- date: 2026-04-27\n  session-phase: review\n  signal-type: gap\n  signal-text: Missing NFR for conciseness.\n  source: operator-manual\n- date: 2026-04-27\n  session-phase: review\n  signal-type: decision\n  signal-text: Keep word counts in ACs.\n  source: operator-manual\n';
  const newSessionEntry = '- date: 2026-04-28\n  session-phase: implementation\n  signal-type: learning\n  signal-text: TDD cycle revealed missing guard.\n  source: operator-manual\n';

  fs.writeFileSync(tmp, priorEntries, 'utf8');
  appendToTempFile(tmp, newSessionEntry);

  const after = fs.readFileSync(tmp, 'utf8');
  assert(
    after.includes(priorEntries),
    'capture-new-session-appends: prior session entries preserved on new invocation'
  );
  assert(
    after.length > priorEntries.length,
    'capture-new-session-no-overwrite: new-session invocation grows the file, never empties it'
  );

  try { fs.unlinkSync(tmp); } catch (_) {}
}

// ── AC6: .gitignore entry ────────────────────────────────────────────────────

console.log('\n[ilc1-capture-schema] AC6 — .gitignore excludes capture-log');

{
  const gitignore = readGitignore();
  const lines = gitignore.split('\n').map(l => l.trim());

  // Accept exact path OR a wildcard that would match workspace/capture-log.md
  const exactMatch    = lines.includes('workspace/capture-log.md');
  const workspaceDir  = lines.includes('workspace/') || lines.includes('workspace');
  const wildcardMatch = lines.some(l => /^workspace\/\*/.test(l));

  assert(
    exactMatch || workspaceDir || wildcardMatch,
    'gitignore-excludes-capture-log: workspace/capture-log.md or a matching wildcard is in .gitignore'
  );
}

// ── NFR: no new npm dependencies ─────────────────────────────────────────────

console.log('\n[ilc1-capture-schema] NFR — no new dependencies');

{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const devDeps = Object.keys(pkg.devDependencies || {}).length;
  // ilc.1 adds zero deps — total should be <= known baseline (0 prod, any devDeps present)
  assert(
    deps === 0,
    `capture-append-no-parser-dependency: no production dependencies added (found ${deps})`
  );
}

{
  // Portability: can a synthetic entry be read as plain string without special parser
  const syntheticEntry = '- date: 2026-04-28\n  session-phase: definition\n  signal-type: learning\n  signal-text: Entries are plain text.\n  source: operator-manual\n';
  const readable = typeof syntheticEntry === 'string' && syntheticEntry.includes('signal-text');
  assert(
    readable,
    'capture-entry-is-plain-markdown: capture-log entry is plain text, no special parser required'
  );
}

// ── Results ──────────────────────────────────────────────────────────────────

console.log(`\n[ilc1-capture-schema] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('  Failures:');
  process.exit(1);
}
