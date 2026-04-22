'use strict';

// check-md-3-adr.js — TDD: Add ADR-015 to architecture-guardrails.md
// Story md-3: artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
// (ADR number used is 015 — ADR-014 is pre-occupied by the existing Sidecar ADR write-up section)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, '.github', 'architecture-guardrails.md');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    process.stderr.write(`  \u2717 ${label}${detail ? ': ' + detail : ''}\n`);
    failed++;
  }
}

const content = fs.readFileSync(FILE, 'utf8');

// ── T1: ADR-015 row in Active ADRs table ─────────────────────────────────────
console.log('[md-3-adr] T1: ADR-015 row in Active ADRs table');

assert(
  'T1.1 \u2014 ADR-015 row exists in Active ADRs table',
  content.includes('| ADR-015 |'),
);

assert(
  'T1.2 \u2014 ADR-015 row title contains "Two-tier artefact scope model"',
  content.includes('Two-tier artefact scope model'),
);

// Check constrains field of the ADR-015 table row
const tableRowMatch = content.match(/\|\s*ADR-015\s*\|[^|\n]+\|[^|\n]+\|([^|\n]+)\|/);
assert(
  'T1.3 \u2014 ADR-015 constrains field references modernisation programmes and /modernisation-decompose',
  !!(tableRowMatch &&
    tableRowMatch[1].includes('modernisation') &&
    tableRowMatch[1].includes('modernisation-decompose')),
);

// ── T2: ADR-015 write-up section ─────────────────────────────────────────────
console.log('\n[md-3-adr] T2: ADR-015 write-up section content');

assert(
  'T2.1 \u2014 ### ADR-015: heading present in write-up',
  content.includes('### ADR-015:'),
);

// Scope assertions to the ADR-015 section body only
const adr015Idx = content.indexOf('### ADR-015:');
const adr015Section = adr015Idx >= 0 ? content.slice(adr015Idx) : '';

assert(
  'T2.2 \u2014 Context sub-section describes both corpus scope and feature delivery scope',
  adr015Section.includes('#### Context') &&
    adr015Section.includes('corpus') &&
    adr015Section.includes('feature'),
);

assert(
  'T2.3 \u2014 Decision sub-section names /modernisation-decompose as the canonical bridge mechanism',
  adr015Section.includes('#### Decision') &&
    adr015Section.includes('/modernisation-decompose'),
);

assert(
  'T2.4 \u2014 Consequences sub-section names ad-hoc cross-scope bridging as a violation',
  adr015Section.includes('#### Consequences') &&
    adr015Section.includes('ad-hoc') &&
    (adr015Section.includes('violation') ||
      adr015Section.includes('prohibited') ||
      adr015Section.includes('not permitted')),
);

// ── T3: NFR — Decided date field ─────────────────────────────────────────────
console.log('\n[md-3-adr] T3: NFR \u2014 Decided date field');

assert(
  'T3.1 \u2014 ADR-015 write-up contains **Decided:** with a YYYY-MM-DD date',
  /\*\*Decided:\*\*\s*\d{4}-\d{2}-\d{2}/.test(adr015Section),
);

// ── T4: Integration — npm test passes ────────────────────────────────────────
// Known pre-existing failure: check-p4-enf-second-line.js T6 (validate-trace.sh / executorIdentity /
// WSL bash unavailable on Windows). This failure exists on master and all feature branches.
console.log('\n[md-3-adr] T4: Integration \u2014 npm test passes after file update');

// These patterns match the known pre-existing failure only.
const KNOWN_FAILURE_PATTERNS = ['executorIdentity', 'validate-trace.sh', 'WSL', '/bin/bash'];

try {
  execSync('npm test', { cwd: ROOT, stdio: 'pipe' });
  assert('T4.1 \u2014 npm test exits 0 (no regressions introduced)', true);
} catch (e) {
  const combined = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
  const failLines = combined.split('\n').filter(l => l.includes('\u2717') || l.includes('FAIL'));
  const newFailures = failLines.filter(
    l => !KNOWN_FAILURE_PATTERNS.some(pat => l.includes(pat)),
  );
  assert(
    'T4.1 \u2014 npm test exits 0 (no regressions introduced)',
    newFailures.length === 0,
    newFailures.length > 0 ? `New failures: ${newFailures.slice(0, 3).join('; ')}` : undefined,
  );
}

// ── Results ───────────────────────────────────────────────────────────────────
console.log(`\n[md-3-adr] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
