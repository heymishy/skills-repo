#!/usr/bin/env node
/**
 * check-model-risk.js
 *
 * Automated tests for MODEL-RISK.md and ONBOARDING.md.
 * Validates p1.8 delivery: risk register, audit question mapping,
 * T3M1 acceptance test record structure, sign-off record, and
 * onboarding documentation required pre-read listing.
 *
 * Tests from p1.8 test plan:
 *   Unit:  U1 — five named risks present in MODEL-RISK.md            (AC1)
 *          U2 — each risk has mitigation or acceptance rationale       (AC1)
 *          U3 — eight audit questions mapped to trace fields, no TBD  (AC2)
 *          U4 — sign-off record has all required fields               (AC4)
 *          U5 — onboarding doc lists MODEL-RISK.md as required pre-read before inner loop (AC5)
 *
 * Run:  node .github/scripts/check-model-risk.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root          = path.join(__dirname, '..', '..');
const modelRiskFile = path.join(root, 'MODEL-RISK.md');
const onboardingFile = path.join(root, 'ONBOARDING.md');

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  console.log(`  ✗ ${name}`);
  console.log(`    → ${reason}`);
}

// ── Read files ────────────────────────────────────────────────────────────────

if (!fs.existsSync(modelRiskFile)) {
  console.error('[model-risk-check] ERROR: MODEL-RISK.md not found at repository root');
  console.error('  Expected: MODEL-RISK.md');
  process.exit(1);
}

if (!fs.existsSync(onboardingFile)) {
  console.error('[model-risk-check] ERROR: ONBOARDING.md not found at repository root');
  console.error('  Expected: ONBOARDING.md');
  process.exit(1);
}

const modelRisk  = fs.readFileSync(modelRiskFile, 'utf8');
const onboarding = fs.readFileSync(onboardingFile, 'utf8');

// ── Test suite ────────────────────────────────────────────────────────────────

console.log('[model-risk-check] Running p1.8 model risk tests…');
console.log('');

// ── U1: Five named risks present in MODEL-RISK.md ────────────────────────────
console.log('  AC1: Risk register — five named risks');

const FIVE_RISKS = [
  {
    id: 'three-agent-independence',
    patterns: [/three.agent independence/i, /procedural.*not structural/i],
    label: 'three-agent independence is procedural not structural',
  },
  {
    id: 'hash-verification',
    patterns: [/hash verification/i, /audit signal.*not tamper/i],
    label: 'hash verification is an audit signal not tamper prevention',
  },
  {
    id: 'anti-overfitting',
    patterns: [/anti.overfitting.*gate.*self.assessed/i, /self.assessed/i],
    label: 'anti-overfitting gate is self-assessed',
  },
  {
    id: 'token-budget',
    patterns: [/token budget/i, /constrain.*delivery.*pace/i],
    label: 'token budget may constrain delivery pace',
  },
  {
    id: 'inter-session',
    patterns: [/Copilot Agent mode.*inter.session/i, /inter.session.*limitation/i],
    label: 'Copilot Agent mode inter-session limitation',
  },
];

const missingRisks = FIVE_RISKS.filter(risk => !risk.patterns.some(re => re.test(modelRisk)));

if (missingRisks.length === 0) {
  pass('u1-all-five-named-risks-present');
} else {
  fail('u1-all-five-named-risks-present',
    `Missing risk(s): ${missingRisks.map(r => r.label).join('; ')}`);
}

// ── U2: Each risk has mitigation or acceptance rationale ─────────────────────

// Each risk section must contain either "Mitigation:" or "Acceptance:"
const RISK_SECTION_MARKERS = [
  { id: 'R1', patterns: [/three.agent independence/i, /procedural.*not structural/i] },
  { id: 'R2', patterns: [/hash verification/i, /audit signal.*not tamper/i] },
  { id: 'R3', patterns: [/anti.overfitting.*gate.*self.assessed/i, /self.assessed/i] },
  { id: 'R4', patterns: [/token budget/i] },
  { id: 'R5', patterns: [/inter.session.*limitation/i, /Copilot Agent mode.*inter.session/i] },
];

// Split document into sections by risk heading, then check each section
const riskSectionsMissingRationale = [];

for (const risk of RISK_SECTION_MARKERS) {
  // Find the position of this risk in the document
  let riskPos = -1;
  for (const re of risk.patterns) {
    const match = re.exec(modelRisk);
    if (match) {
      riskPos = match.index;
      break;
    }
  }

  if (riskPos === -1) {
    // Not found — U1 will catch this; skip U2 check for this risk
    continue;
  }

  // Extract the section from the risk position to the next risk or end of document
  // Look for the next ### heading after this risk
  const afterRisk = modelRisk.slice(riskPos);
  const nextHeading = afterRisk.indexOf('\n### ', 5); // skip the current heading chars
  const section = nextHeading === -1 ? afterRisk : afterRisk.slice(0, nextHeading);

  // Check for "Mitigation:" or "Acceptance:" in the section
  const hasMitigation  = /\*\*Mitigation:\*\*/i.test(section);
  const hasAcceptance  = /\*\*Acceptance:\*\*/i.test(section);

  if (!hasMitigation && !hasAcceptance) {
    riskSectionsMissingRationale.push(risk.id);
  }
}

if (riskSectionsMissingRationale.length === 0) {
  pass('u2-each-risk-has-mitigation-or-acceptance');
} else {
  fail('u2-each-risk-has-mitigation-or-acceptance',
    `Risk section(s) missing Mitigation or Acceptance rationale: ${riskSectionsMissingRationale.join(', ')}`);
}

// ── U3: Eight audit questions mapped to trace fields, no TBD ─────────────────
console.log('');
console.log('  AC2: Audit question mapping — eight questions, no TBD');

// The audit question mapping table must have 8 rows (not counting header/separator rows)
// We identify table rows by lines starting with | that contain actual question numbers
// Look for the table section between section 2 heading and section 3 heading
const section2Match = /## 2\. Audit Question Mapping/i.exec(modelRisk);
const section3Match = /## 3\. /i.exec(modelRisk);

let auditSection = '';
if (section2Match) {
  const start = section2Match.index;
  const end   = section3Match ? section3Match.index : modelRisk.length;
  auditSection = modelRisk.slice(start, end);
}

// Count data rows in the table: lines starting with | that have a digit as the first cell content
const tableDataRows = auditSection
  .split('\n')
  .filter(line => /^\| *[0-9]/.test(line));

const auditRowCount = tableDataRows.length;

if (auditRowCount === 8) {
  pass(`u3-audit-table-has-eight-rows (found ${auditRowCount})`);
} else {
  fail('u3-audit-table-has-eight-rows',
    `Expected 8 audit question rows in the mapping table, found ${auditRowCount}`);
}

// No row may contain "TBD" (case-insensitive)
const tbdRows = tableDataRows.filter(row => /\bTBD\b/i.test(row));

if (tbdRows.length === 0) {
  pass('u3-no-tbd-entries-in-audit-table');
} else {
  fail('u3-no-tbd-entries-in-audit-table',
    `${tbdRows.length} row(s) contain TBD: ${tbdRows.map(r => r.slice(0, 80)).join(' | ')}`);
}

// Each row must reference at least one named trace field (backtick-wrapped identifier)
const TRACE_FIELD_PATTERN = /`[a-zA-Z][a-zA-Z0-9_]+`/;
const rowsMissingField = tableDataRows.filter(row => !TRACE_FIELD_PATTERN.test(row));

if (rowsMissingField.length === 0) {
  pass('u3-each-row-has-named-trace-field');
} else {
  fail('u3-each-row-has-named-trace-field',
    `${rowsMissingField.length} row(s) do not contain a backtick-wrapped trace field name`);
}

// ── U4: Sign-off record has all required fields ───────────────────────────────
console.log('');
console.log('  AC4: Sign-off record — required fields');

const SIGNOFF_FIELDS = [
  { label: 'reviewer name', pattern: /reviewer name/i },
  { label: 'review date',   pattern: /review date/i },
  { label: 'verdict',       pattern: /\bverdict\b/i },
  { label: 'conditions',    pattern: /\bconditions\b/i },
];

// Find the sign-off record section
const signoffStart = modelRisk.indexOf('<!-- SIGN-OFF-RECORD-START -->');
const signoffEnd   = modelRisk.indexOf('<!-- SIGN-OFF-RECORD-END -->');

if (signoffStart === -1 || signoffEnd === -1) {
  fail('u4-signoff-record-block-present',
    'Sign-off record block markers (<!-- SIGN-OFF-RECORD-START --> / <!-- SIGN-OFF-RECORD-END -->) not found in MODEL-RISK.md');
} else {
  pass('u4-signoff-record-block-present');

  const signoffSection = modelRisk.slice(signoffStart, signoffEnd);
  const missingFields = SIGNOFF_FIELDS.filter(f => !f.pattern.test(signoffSection));

  if (missingFields.length === 0) {
    pass('u4-signoff-record-has-all-required-fields');
  } else {
    fail('u4-signoff-record-has-all-required-fields',
      `Missing field(s) in sign-off record: ${missingFields.map(f => f.label).join(', ')}`);
  }

  // Verdict must NOT be pre-populated without a corresponding completed sign-off.
  // A filled verdict is acceptable only when reviewer name and review date are also
  // legitimately filled in (i.e., the human sign-off has actually been completed).
  const VERDICT_ROW_PATTERN   = /\|\s*Verdict\s*\|([^|\n]+)\|/i;
  const REVIEWER_ROW_PATTERN  = /\|\s*Reviewer name\s*\|([^|\n]+)\|/i;
  const REVIEWDATE_ROW_PATTERN = /\|\s*Review date\s*\|([^|\n]+)\|/i;
  const verdictRowMatch  = VERDICT_ROW_PATTERN.exec(signoffSection);
  if (verdictRowMatch) {
    const verdictValue = verdictRowMatch[1].trim();
    const isFilled = /approved for adoption|approved with conditions|not approved/i.test(verdictValue);
    if (!isFilled) {
      pass('u4-signoff-verdict-not-pre-populated');
    } else {
      // Verdict is filled — only acceptable if reviewer name and review date are also real
      const reviewerMatch  = REVIEWER_ROW_PATTERN.exec(signoffSection);
      const reviewDateMatch = REVIEWDATE_ROW_PATTERN.exec(signoffSection);
      const reviewerFilled  = reviewerMatch  && !/\[/.test(reviewerMatch[1].trim()) && reviewerMatch[1].trim().length > 0;
      const reviewDateFilled = reviewDateMatch && /\d{4}-\d{2}-\d{2}/.test(reviewDateMatch[1].trim());
      if (reviewerFilled && reviewDateFilled) {
        pass('u4-signoff-verdict-not-pre-populated');
      } else {
        fail('u4-signoff-verdict-not-pre-populated',
          `Verdict field is pre-populated with "${verdictValue}" — verdict must be left for human sign-off at DoD time`);
      }
    }
  } else {
    pass('u4-signoff-verdict-not-pre-populated');
  }
}

// ── U5: Onboarding doc lists MODEL-RISK.md as required pre-read ──────────────
console.log('');
console.log('  AC5: Onboarding documentation — MODEL-RISK.md as required pre-read');

// ONBOARDING.md must contain MODEL-RISK.md reference
if (!onboarding.includes('MODEL-RISK.md')) {
  fail('u5-onboarding-mentions-model-risk',
    'ONBOARDING.md does not mention MODEL-RISK.md');
} else {
  pass('u5-onboarding-mentions-model-risk');
}

// The MODEL-RISK.md reference must be marked as required (not optional)
const hasRequiredLanguage = /required.*(?:reading|pre.?read)/i.test(onboarding) ||
                             /must.*read.*MODEL-RISK/i.test(onboarding) ||
                             /Required reading before/i.test(onboarding);

if (hasRequiredLanguage) {
  pass('u5-onboarding-model-risk-marked-required');
} else {
  fail('u5-onboarding-model-risk-marked-required',
    'ONBOARDING.md does not use required-reading language for MODEL-RISK.md (e.g. "Required reading before proceeding:")');
}

// MODEL-RISK.md reference must appear BEFORE the first inner loop instruction
// Inner loop instructions are identified by /branch-setup appearing as an instruction step
const modelRiskPos   = onboarding.indexOf('MODEL-RISK.md');
const branchSetupPos = onboarding.indexOf('/branch-setup');

if (branchSetupPos === -1) {
  // No /branch-setup found — cannot verify order, but MODEL-RISK.md is present
  fail('u5-model-risk-before-inner-loop-instruction',
    'ONBOARDING.md does not contain a /branch-setup inner loop instruction reference — cannot verify ordering');
} else if (modelRiskPos === -1) {
  fail('u5-model-risk-before-inner-loop-instruction',
    'ONBOARDING.md does not reference MODEL-RISK.md');
} else if (modelRiskPos < branchSetupPos) {
  pass('u5-model-risk-before-inner-loop-instruction');
} else {
  fail('u5-model-risk-before-inner-loop-instruction',
    `MODEL-RISK.md reference (position ${modelRiskPos}) appears after /branch-setup (position ${branchSetupPos}) — must appear before first inner loop instruction`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`[model-risk-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
