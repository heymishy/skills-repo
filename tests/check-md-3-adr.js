'use strict';

// check-md-3-adr.js — TDD: Add ADR-015 to architecture-guardrails.md
// Story md-3: artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
// (ADR number used is 015 — ADR-014 is pre-occupied by the existing Sidecar ADR write-up section)

const fs = require('fs');
const path = require('path');

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

// T4 (nested `npm test` recursion) removed (mar-s1, 2026-08-08): this file
// re-ran the ENTIRE, ever-growing check-*.js suite as a subprocess from
// inside a single test file that scripts/run-all-tests.js itself discovers
// and runs as part of that same suite -- structurally redundant with the
// enclosing CI job, which already runs `npm test` once and gates the PR on
// its exit code. Confirmed as the cause of CPU-contention-driven flakiness
// in a different file (check-p3.5-validate-trace.js) across 3 past PRs, and
// separately documented (tests/check-tst-s1-baseline-triage.js) as a
// permanent, un-fixable baseline entry because run-all-tests.js's own 120s
// per-file timeout always killed the nested run before it could complete.
// See artefacts/2026-08-08-check-md-3-adr-recursion-fix/.

// ── Results ───────────────────────────────────────────────────────────────────
console.log(`\n[md-3-adr] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
