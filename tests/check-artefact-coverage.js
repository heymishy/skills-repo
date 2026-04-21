#!/usr/bin/env node
// check-artefact-coverage.js — governance gate for artefact-first rule (ADR-011)
// Verifies every skill in .github/skills/ and every module in src/ has a
// corresponding DoR artefact file committed to artefacts/.
// Reads exemptions from artefact-coverage-exemptions.json (repo root).
// Node.js built-ins only — no external dependencies.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT = path.join(__dirname, '..');

// ── Inline self-tests ────────────────────────────────────────────────────────

let selfPassed = 0;
let selfFailed = 0;

function selfAssert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); selfPassed++; }
  else           { console.log(`  \u2717 ${label}`); selfFailed++; }
}

function normSlug(s) {
  return s.toLowerCase().replace(/[_\s]/g, '-');
}

function collectArtefactFilenames(artefactsDir) {
  const names = [];
  if (!fs.existsSync(artefactsDir)) return names;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); }
      else { names.push(normSlug(entry.name)); }
    }
  }
  walk(artefactsDir);
  return names;
}

function isCovered(slug, artefactNames) {
  const norm = normSlug(slug);
  return artefactNames.some(name => name.includes(norm));
}

function loadExemptions(exemptionsPath) {
  if (!fs.existsSync(exemptionsPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(exemptionsPath, 'utf8'));
    return Array.isArray(raw.exemptions) ? raw.exemptions : [];
  } catch (_) { return []; }
}

function getExemptReason(slug, exemptions) {
  const entry = exemptions.find(e => normSlug(e.slug || '') === normSlug(slug));
  if (!entry) return null;
  if (!entry.reason || entry.reason.trim() === '') return null; // no reason = not exempt
  return entry.reason;
}

console.log('[artefact-coverage] Running self-tests...');

// T1 — uncovered-slug-fails
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-test-'));
  try {
    fs.mkdirSync(path.join(tmp, 'artefacts'));
    const names = collectArtefactFilenames(path.join(tmp, 'artefacts'));
    const covered = isCovered('my-skill', names);
    const reason  = getExemptReason('my-skill', []);
    const isUncovered = !covered && !reason;
    selfAssert(isUncovered, 'T1 uncovered-slug-fails: slug with no artefact and no exemption is UNCOVERED');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// T2 — covered-slug-passes
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-test-'));
  try {
    const artDir = path.join(tmp, 'artefacts', '2026-01-01-feature', 'dor');
    fs.mkdirSync(artDir, { recursive: true });
    fs.writeFileSync(path.join(artDir, 'my-skill-dor.md'), '# dor');
    const names = collectArtefactFilenames(path.join(tmp, 'artefacts'));
    const covered = isCovered('my-skill', names);
    selfAssert(covered, 'T2 covered-slug-passes: slug with matching artefact filename is COVERED');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// T3 — exempted-slug-passes
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-test-'));
  try {
    fs.mkdirSync(path.join(tmp, 'artefacts'));
    const names = collectArtefactFilenames(path.join(tmp, 'artefacts'));
    const covered = isCovered('my-skill', names);
    const reason  = getExemptReason('my-skill', [{ slug: 'my-skill', reason: 'Added out-of-band, retroactive story pending' }]);
    const isExempt = !covered && !!reason;
    selfAssert(isExempt, 'T3 exempted-slug-passes: slug in exemption list with reason is EXEMPT');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// T4 — exemption-without-reason-fails
{
  const reason = getExemptReason('my-skill', [{ slug: 'my-skill', reason: '' }]);
  selfAssert(reason === null, 'T4 exemption-without-reason-fails: empty reason treated as not-exempt');
}

// T5 — skill enumeration (reads actual .github/skills dir from root)
{
  const skillsDir = path.join(ROOT, '.github', 'skills');
  const exists = fs.existsSync(skillsDir);
  if (exists) {
    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
                   .filter(e => e.isDirectory())
                   .map(e => e.name);
    selfAssert(dirs.length > 0, `T5 skill-enumeration: .github/skills/ has ${dirs.length} skill dirs`);
  } else {
    selfAssert(false, 'T5 skill-enumeration: .github/skills/ directory not found');
  }
}

// T6 — module enumeration (reads actual src/ dir from root)
{
  const srcDir = path.join(ROOT, 'src');
  const exists = fs.existsSync(srcDir);
  if (exists) {
    const dirs = fs.readdirSync(srcDir, { withFileTypes: true })
                   .filter(e => e.isDirectory())
                   .map(e => e.name);
    selfAssert(dirs.length > 0, `T6 module-enumeration: src/ has ${dirs.length} module dirs`);
  } else {
    selfAssert(false, 'T6 module-enumeration: src/ directory not found');
  }
}

// T7 — package.json includes this check
{
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const testScript = (pkg.scripts && pkg.scripts.test) || '';
  selfAssert(
    testScript.includes('check-artefact-coverage'),
    'T7 package-json-chain: package.json test script includes check-artefact-coverage'
  );
}

// T8 — exemptions file exists
{
  const exemptPath = path.join(ROOT, 'artefact-coverage-exemptions.json');
  selfAssert(fs.existsSync(exemptPath), 'T8 exemption-file-exists: artefact-coverage-exemptions.json exists');
}

console.log(`[artefact-coverage] Self-tests: ${selfPassed} passed, ${selfFailed} failed`);
if (selfFailed > 0) {
  console.error('[artefact-coverage] Self-tests failed — aborting main check');
  process.exit(1);
}

// ── Main coverage check ──────────────────────────────────────────────────────

const skillsDir    = path.join(ROOT, '.github', 'skills');
const srcDir       = path.join(ROOT, 'src');
const artefactsDir = path.join(ROOT, 'artefacts');
const exemptPath   = path.join(ROOT, 'artefact-coverage-exemptions.json');

const skillSlugs = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
  : [];

const moduleSlugs = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
  : [];

// Deduplicate (improvement-agent appears in both)
const seen = new Set();
const allSlugs = [...skillSlugs, ...moduleSlugs].filter(s => {
  if (seen.has(s)) return false;
  seen.add(s);
  return true;
});

const artefactNames = collectArtefactFilenames(artefactsDir);
const exemptions    = loadExemptions(exemptPath);

console.log(`[artefact-coverage] Checking ${allSlugs.length} slugs...`);

let coveredCount  = 0;
let exemptCount   = 0;
let uncoveredCount = 0;

for (const slug of allSlugs) {
  if (isCovered(slug, artefactNames)) {
    console.log(`  \u2713 ${slug}`);
    coveredCount++;
  } else {
    const reason = getExemptReason(slug, exemptions);
    if (reason) {
      console.log(`  ~ ${slug} (exempt: ${reason.slice(0, 80)}${reason.length > 80 ? '...' : ''})`);
      exemptCount++;
    } else {
      console.log(`  \u2717 ${slug} \u2014 NO DoR artefact found`);
      uncoveredCount++;
    }
  }
}

console.log(`[artefact-coverage] Results: ${coveredCount} covered, ${exemptCount} exempt, ${uncoveredCount} uncovered`);

if (uncoveredCount > 0) {
  console.error('[artefact-coverage] FAIL: uncovered slugs exist and are not exempted. Add them to artefact-coverage-exemptions.json with a reason, or create a story artefact for each.');
  process.exit(1);
}

console.log('[artefact-coverage] OK \u2713');
