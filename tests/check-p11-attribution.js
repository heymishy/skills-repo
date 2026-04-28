#!/usr/bin/env node
// check-p11-attribution.js — p11.1 + p11.2 governance tests
// p11.1: /discovery template attribution sections + SKILL.md prompt + contract marker
// p11.2: /benefit-metric template attribution fields + SKILL.md prompt + contract marker
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT              = path.join(__dirname, '..');
const DISCOVERY_TPL     = path.join(ROOT, '.github', 'templates', 'discovery.md');
const DISCOVERY_SKILL   = path.join(ROOT, '.github', 'skills', 'discovery', 'SKILL.md');
const BM_TPL            = path.join(ROOT, '.github', 'templates', 'benefit-metric.md');
const BM_SKILL          = path.join(ROOT, '.github', 'skills', 'benefit-metric', 'SKILL.md');
const CONTRACTS_SCRIPT  = path.join(ROOT, '.github', 'scripts', 'check-skill-contracts.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── p11.1: /discovery template ────────────────────────────────────────────────
console.log('\n[p11-attribution] p11.1 — /discovery template attribution sections');

const discoveryTpl = fs.readFileSync(DISCOVERY_TPL, 'utf8');

// T1 — AC1: ## Contributors section present
assert(discoveryTpl.includes('## Contributors'), 'T1 — discovery.md contains ## Contributors section');

// T2 — AC1: ## Reviewers section present
assert(discoveryTpl.includes('## Reviewers'), 'T2 — discovery.md contains ## Reviewers section');

// T3 — AC1: ## Approved By section present with non-engineering distinction in HTML comment
assert(
  discoveryTpl.includes('## Approved By') || discoveryTpl.includes('## Approved-By'),
  'T3a — discovery.md contains ## Approved By section'
);
assert(
  /Approved.By[\s\S]{0,400}non-engineering/i.test(discoveryTpl),
  'T3b — Approved By section HTML comment mentions non-engineering distinction'
);

// T4 — AC2: SKILL.md completion step prompts attribution
const discoverySkill = fs.readFileSync(DISCOVERY_SKILL, 'utf8');
assert(
  /contributors/i.test(discoverySkill) &&
  /reviewers/i.test(discoverySkill) &&
  /approved.by/i.test(discoverySkill),
  'T4 — discovery SKILL.md completion step references contributors, reviewers, approved-by'
);

// T5 — AC3: approved-by-required marker in check-skill-contracts.js
const contracts = fs.readFileSync(CONTRACTS_SCRIPT, 'utf8');
assert(
  contracts.includes('approved-by-required'),
  'T5 — check-skill-contracts.js has approved-by-required marker for discovery skill'
);

// ── p11.2: /benefit-metric template ───────────────────────────────────────────
console.log('\n[p11-attribution] p11.2 — /benefit-metric template attribution fields');

const bmTpl = fs.readFileSync(BM_TPL, 'utf8');

// T6 — AC1: Metric owner field present
assert(
  bmTpl.includes('Metric owner') || bmTpl.includes('metric-owner'),
  'T6 — benefit-metric.md contains Metric owner field'
);

// T7 — AC1: Metric owner HTML comment indicates non-engineering role expected
assert(
  /Metric.owner[\s\S]{0,400}non-engineering/i.test(bmTpl),
  'T7 — Metric owner HTML comment indicates non-engineering role expected'
);

// T8 — AC2: Reviewers field present
assert(
  bmTpl.includes('Reviewers'),
  'T8 — benefit-metric.md contains Reviewers field'
);

// T9 — AC2: Reviewers comment references Tier 1 non-engineering requirement
assert(
  /Tier.?1/i.test(bmTpl) && /non-engineering/i.test(bmTpl.slice(bmTpl.indexOf('Reviewers'))),
  'T9 — Reviewers HTML comment references Tier 1 and non-engineering requirement'
);

// T10 — AC3: metric-owner-required marker in check-skill-contracts.js
assert(
  contracts.includes('metric-owner-required'),
  'T10 — check-skill-contracts.js has metric-owner-required marker for benefit-metric skill'
);

// ── benefit-metric SKILL.md prompt ────────────────────────────────────────────
const bmSkill = fs.readFileSync(BM_SKILL, 'utf8');
assert(
  /metric.owner/i.test(bmSkill) && /reviewers/i.test(bmSkill),
  'T11 — benefit-metric SKILL.md completion step prompts metric owner and reviewers'
);

console.log(`\n[p11-attribution] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
