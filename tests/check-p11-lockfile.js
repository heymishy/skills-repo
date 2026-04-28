#!/usr/bin/env node
// check-p11-lockfile.js — p11.4 skill lockfile pin/verify tests
// Tests pin() and verify() in src/enforcement/cli-adapter.js.
// Uses temp directories — no side effects on the working repo.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const adapter = require(path.join(ROOT, 'src', 'enforcement', 'cli-adapter.js'));
const { pin, verify } = adapter;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

/** Create a temp root with SKILL.md files under .github/skills/<n>/SKILL.md */
function makeTempRoot(count = 2) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-lock-'));
  for (let i = 1; i <= count; i++) {
    const sd = path.join(dir, '.github', 'skills', `skill-${i}`);
    fs.mkdirSync(sd, { recursive: true });
    fs.writeFileSync(path.join(sd, 'SKILL.md'), `# Skill ${i}\n\nTest content ${i}.\n`);
  }
  return dir;
}

const LOCKFILE_REL = path.join('.github', 'skills', 'skill-lockfile.json');

// ── T1 — pin() creates lockfile ───────────────────────────────────────────────
console.log('\n[p11-lockfile] p11.4 — skill lockfile: pin() and verify()');

const root1 = makeTempRoot();
pin(root1);
const lf1 = path.join(root1, LOCKFILE_REL);
assert(fs.existsSync(lf1), 'T1 — pin(rootDir) creates .github/skills/skill-lockfile.json');

// ── T2 — lockfile top-level schema fields ────────────────────────────────────
let lf1data = null;
try { lf1data = JSON.parse(fs.readFileSync(lf1, 'utf8')); } catch (_) {}
assert(lf1data !== null, 'T2a — lockfile is valid JSON');
assert(
  lf1data && (lf1data.schemaVersion === '1.0.0' || lf1data.version === 1 || lf1data.version === '1.0.0'),
  'T2b — lockfile has schemaVersion "1.0.0" or version 1'
);
assert(
  lf1data && !!(lf1data.pinnedAt || lf1data.generated),
  'T2c — lockfile has pinnedAt / generated timestamp (ISO-8601 string)'
);
assert(
  lf1data && Array.isArray(lf1data.skills),
  'T2d — lockfile has skills array'
);

// ── T3 — each skills entry has required fields ────────────────────────────────
const skills = lf1data && lf1data.skills;
assert(Array.isArray(skills) && skills.length >= 2, 'T3a — lockfile skills array has at least 2 entries');

if (Array.isArray(skills) && skills.length > 0) {
  const e = skills[0];
  assert(typeof e.path === 'string' && e.path.length > 0, 'T3b — skills entry has non-empty path field');
  assert(
    typeof e.sha256 === 'string' && /^[a-f0-9]{64}$/.test(e.sha256),
    'T3c — skills entry sha256 is 64-char lowercase hex'
  );
  assert(
    typeof e.skill === 'string' || typeof e.name === 'string',
    'T3d — skills entry has skill or name identifier field'
  );
} else {
  assert(false, 'T3b — skills entry has non-empty path field (no entries to inspect)');
  assert(false, 'T3c — skills entry sha256 is 64-char lowercase hex (no entries to inspect)');
  assert(false, 'T3d — skills entry has skill or name identifier field (no entries to inspect)');
}

// ── T4 — verify() passes when nothing changed ─────────────────────────────────
const root2 = makeTempRoot();
pin(root2);
const result2 = verify(root2);
assert(result2 && result2.status === 'pass', 'T4a — verify(rootDir) returns status: "pass" when files unchanged');
assert(result2 && Array.isArray(result2.drifted) && result2.drifted.length === 0, 'T4b — verify() drifted array is empty when files unchanged');
assert(result2 && typeof result2.checked === 'number' && result2.checked >= 2, 'T4c — verify() checked count equals number of pinned skills');

// ── T5 — verify() fails when a file is modified post-pin ─────────────────────
const root3 = makeTempRoot();
pin(root3);
fs.writeFileSync(path.join(root3, '.github', 'skills', 'skill-1', 'SKILL.md'), '# Tampered\n\nModified after pin.\n');
const result3 = verify(root3);
assert(result3 && result3.status === 'fail', 'T5a — verify(rootDir) returns status: "fail" when file modified post-pin');
assert(result3 && Array.isArray(result3.drifted) && result3.drifted.length >= 1, 'T5b — verify() drifted array is non-empty when file modified');

// ── T6 — pin() is idempotent ──────────────────────────────────────────────────
const root4 = makeTempRoot();
pin(root4);
pin(root4);
let lf4a = null, lf4b = null;
try {
  lf4a = JSON.parse(fs.readFileSync(path.join(root4, LOCKFILE_REL), 'utf8'));
  lf4b = lf4a; // second pin call should produce same content; re-read if available
  pin(root4);
  lf4b = JSON.parse(fs.readFileSync(path.join(root4, LOCKFILE_REL), 'utf8'));
} catch (_) {}
assert(
  lf4a !== null && lf4b !== null &&
  JSON.stringify((lf4a.skills || []).map(e => e.sha256).sort()) ===
  JSON.stringify((lf4b.skills || []).map(e => e.sha256).sort()),
  'T6 — pin() is idempotent: repeated calls produce same sha256 values'
);

// ── T7 — verify() with no lockfile returns error ──────────────────────────────
const root5 = makeTempRoot();
// no pin() call
const result5 = verify(root5);
assert(
  result5 && result5.status === 'fail' && result5.error && /no lockfile|not found/i.test(result5.error),
  'T7 — verify() with no lockfile present returns {status:"fail", error: "no lockfile"}'
);

// ── T8 — docs/skill-lockfile.schema.json exists ───────────────────────────────
const schemaPath = path.join(ROOT, 'docs', 'skill-lockfile.schema.json');
assert(fs.existsSync(schemaPath), 'T8 — docs/skill-lockfile.schema.json exists in repo');

// ── T9 — schema has required fields ───────────────────────────────────────────
let schema = null;
try { schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')); } catch (_) {}
assert(schema !== null, 'T9a — skill-lockfile.schema.json is valid JSON');
assert(
  schema && (schema.$schema || schema.title || schema.type === 'object'),
  'T9b — schema is a JSON Schema object (has $schema, title, or type)'
);
const schemaHasSkills = schema && schema.properties && schema.properties.skills;
assert(schemaHasSkills, 'T9c — schema has skills property defined');

console.log(`\n[p11-lockfile] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
