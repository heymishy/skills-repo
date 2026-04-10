#!/usr/bin/env node
/**
 * check-standards-model.js
 *
 * Automated tests for the p1.7 standards model Phase 1 delivery.
 * Validates three anchor discipline standards files, POLICY.md floors,
 * and standards/index.yml routing table.
 *
 * Tests from p1.7 test plan:
 *   Unit:        U1 — POLICY.md floor files contain only binary requirements    (AC2)
 *                U2 — index.yml software-engineering lookup returns correct paths (AC3)
 *                U3 — index.yml security-engineering lookup returns correct paths (AC3)
 *                U4 — index.yml quality-assurance lookup returns correct paths    (AC3)
 *                U5 — adding a fourth discipline entry does not break the parser  (AC3)
 *   Integration: I1 — all six standards files exist                               (AC1, AC2)
 *                I2 — each core.md contains required metadata and 5+ requirements (AC1)
 *   NFR:         N2 — security POLICY.md includes OWASP check + secrets check     (Security NFR)
 *                N3 — every standards file has lastReviewedBy and lastReviewedDate (Audit NFR)
 *
 * Tests I3, I4 (hash injection) and N1 (performance) are dependency-gated on P1.3 DoD-complete.
 *
 * Run:  node .github/scripts/check-standards-model.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root         = path.join(__dirname, '..', '..');
const standardsDir = path.join(root, 'standards');

// ── Test harness ──────────────────────────────────────────────────────────────

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

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ── File paths ────────────────────────────────────────────────────────────────

const FILES = {
  seCore:    path.join(standardsDir, 'software-engineering', 'core.md'),
  sePolicy:  path.join(standardsDir, 'software-engineering', 'POLICY.md'),
  secCore:   path.join(standardsDir, 'security-engineering', 'core.md'),
  secPolicy: path.join(standardsDir, 'security-engineering', 'POLICY.md'),
  qaCore:    path.join(standardsDir, 'quality-assurance', 'core.md'),
  qaPolicy:  path.join(standardsDir, 'quality-assurance', 'POLICY.md'),
  indexYml:  path.join(standardsDir, 'index.yml'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns lines from a markdown file that look like requirement items
 * (bullet list entries starting with MUST, SHOULD, or MAY).
 */
function getRequirementLines(content) {
  return content.split('\n').filter(line =>
    /^\s*-\s+(MUST|SHOULD|MAY)\b/.test(line)
  );
}

/**
 * Minimal YAML parser for standards/index.yml.
 * Returns { [disciplineId]: { core: string, 'policy-floor': string } }.
 * Ignores unknown keys (surface-variants etc.) — making the parser
 * extensible to additional discipline entries without modification.
 */
function parseDisciplineIndex(content) {
  const result = {};
  const lines  = content.split('\n');

  let inDisciplines   = false;
  let currentDiscipline = null;

  for (const line of lines) {
    if (/^disciplines:\s*$/.test(line)) {
      inDisciplines = true;
      continue;
    }

    if (!inDisciplines) continue;

    // Discipline name: exactly 2-space indent + key + colon (no inline value)
    const disciplineMatch = /^  ([a-z][a-z0-9-]+):\s*$/.exec(line);
    if (disciplineMatch) {
      currentDiscipline = disciplineMatch[1];
      result[currentDiscipline] = {};
      continue;
    }

    if (!currentDiscipline) continue;

    // core: exactly 4-space indent
    const coreMatch = /^    core:\s+(.+)$/.exec(line);
    if (coreMatch) {
      result[currentDiscipline].core = coreMatch[1].trim();
      continue;
    }

    // policy-floor: exactly 4-space indent
    const policyMatch = /^    policy-floor:\s+(.+)$/.exec(line);
    if (policyMatch) {
      result[currentDiscipline]['policy-floor'] = policyMatch[1].trim();
      continue;
    }

    // All other lines (surface-variants, injection-points, etc.) are silently ignored,
    // which is what makes the schema extensible without parser modification.
  }

  return result;
}

// ── Read files with early exit on missing ─────────────────────────────────────

// index.yml is required for unit tests — fail fast if missing
if (!fs.existsSync(FILES.indexYml)) {
  console.error('[standards-model-check] ERROR: standards/index.yml not found');
  process.exit(1);
}

const indexContent = fs.readFileSync(FILES.indexYml, 'utf8');

console.log('[standards-model-check] Running p1.7 standards model tests…');
console.log('');

// ── Integration: I1 — All six standards files exist ───────────────────────────

console.log('  Integration: I1 — all six standards files exist');

const SIX_FILES = [
  { label: 'standards/software-engineering/core.md',    p: FILES.seCore    },
  { label: 'standards/software-engineering/POLICY.md',  p: FILES.sePolicy  },
  { label: 'standards/security-engineering/core.md',    p: FILES.secCore   },
  { label: 'standards/security-engineering/POLICY.md',  p: FILES.secPolicy },
  { label: 'standards/quality-assurance/core.md',       p: FILES.qaCore    },
  { label: 'standards/quality-assurance/POLICY.md',     p: FILES.qaPolicy  },
];

const missingFiles = SIX_FILES.filter(f => !fs.existsSync(f.p));

assert(
  missingFiles.length === 0,
  'i1-all-six-standards-files-exist',
  `Missing file(s): ${missingFiles.map(f => f.label).join(', ')}`
);

// Read all files (safe to do after existence check; abort if any still missing)
const contents = {};
for (const { label, p } of SIX_FILES) {
  if (!fs.existsSync(p)) {
    fail(`read-${label}`, 'File does not exist — cannot continue checks');
    continue;
  }
  contents[label] = fs.readFileSync(p, 'utf8');
}

// ── Integration: I2 — Each core.md has required metadata + 5+ requirements ───

console.log('');
console.log('  Integration: I2 — each core.md has required metadata and 5+ requirements');

const CORE_FILES = [
  { label: 'standards/software-engineering/core.md', key: 'standards/software-engineering/core.md' },
  { label: 'standards/security-engineering/core.md', key: 'standards/security-engineering/core.md' },
  { label: 'standards/quality-assurance/core.md',    key: 'standards/quality-assurance/core.md'    },
];

for (const { label, key } of CORE_FILES) {
  const content = contents[key];
  if (!content) continue; // already failed in I1

  const shortName = label.replace('standards/', '').replace('/core.md', '');

  // Title: must contain a markdown heading or front-matter title field
  const hasTitle = /^#\s+\S/.test(content) || /^title:\s+\S/m.test(content);
  assert(hasTitle, `i2-${shortName}-has-title`,
    `${label} must contain a markdown heading (# …) or front-matter title: field`);

  // Owning discipline: must contain a discipline field
  const hasDiscipline = /^discipline:\s+\S/m.test(content) ||
                         /\*\*Discipline:\*\*/i.test(content);
  assert(hasDiscipline, `i2-${shortName}-has-discipline`,
    `${label} must contain a discipline: field in front-matter or **Discipline:** field`);

  // lastReviewedBy field
  const hasReviewedBy = /lastReviewedBy:\s+\S/m.test(content);
  assert(hasReviewedBy, `i2-${shortName}-has-lastReviewedBy`,
    `${label} must contain a populated lastReviewedBy: field`);

  // lastReviewedDate field
  const hasReviewedDate = /lastReviewedDate:\s+\S/m.test(content);
  assert(hasReviewedDate, `i2-${shortName}-has-lastReviewedDate`,
    `${label} must contain a populated lastReviewedDate: field`);

  // At least 5 requirements in MUST / SHOULD / MAY [observable outcome] format
  const reqLines = getRequirementLines(content);
  assert(
    reqLines.length >= 5,
    `i2-${shortName}-has-five-or-more-requirements`,
    `${label} must contain at least 5 MUST/SHOULD/MAY requirement lines; found ${reqLines.length}`
  );
}

// ── Unit: U1 — POLICY.md floors are binary (no gradient language) ─────────────

console.log('');
console.log('  Unit: U1 — POLICY.md floors are binary (no gradient language)');

const POLICY_FILES = [
  { label: 'standards/software-engineering/POLICY.md', key: 'standards/software-engineering/POLICY.md' },
  { label: 'standards/security-engineering/POLICY.md', key: 'standards/security-engineering/POLICY.md' },
  { label: 'standards/quality-assurance/POLICY.md',    key: 'standards/quality-assurance/POLICY.md'    },
];

// Gradient patterns that must not appear in requirement lines of POLICY.md files
const GRADIENT_PATTERNS = [
  { pattern: /\bshould\b/i,              label: '"should"'           },
  { pattern: /at least partially/i,      label: '"at least partially"' },
  { pattern: /\bgenerally\b/i,           label: '"generally"'        },
  { pattern: /aim\s+to\b/i,             label: '"aim to"'           },
  { pattern: /where possible/i,          label: '"where possible"'   },
  { pattern: /as far as possible/i,      label: '"as far as possible"' },
];

for (const { label, key } of POLICY_FILES) {
  const content = contents[key];
  if (!content) continue;

  const shortName = label.replace('standards/', '').replace('/POLICY.md', '');
  const reqLines  = getRequirementLines(content);

  const gradientViolations = [];
  for (const reqLine of reqLines) {
    for (const { pattern, label: gradientLabel } of GRADIENT_PATTERNS) {
      if (pattern.test(reqLine)) {
        gradientViolations.push(`line contains ${gradientLabel}: ${reqLine.trim()}`);
      }
    }
  }

  assert(
    gradientViolations.length === 0,
    `u1-${shortName}-policy-requirements-are-binary`,
    `POLICY.md must not contain gradient language. Violation(s): ${gradientViolations.join('; ')}`
  );
}

// ── Unit: U2–U4 — index.yml discipline ID lookups ─────────────────────────────

console.log('');
console.log('  Unit: U2–U4 — index.yml discipline ID lookups');

const disciplines = parseDisciplineIndex(indexContent);

// U2: software-engineering
{
  const se = disciplines['software-engineering'];
  const coreOk   = se && se.core           === 'standards/software-engineering/core.md';
  const policyOk = se && se['policy-floor'] === 'standards/software-engineering/POLICY.md';
  assert(coreOk && policyOk, 'u2-software-engineering-lookup-returns-correct-paths',
    `software-engineering: core="${se && se.core}" policy-floor="${se && se['policy-floor']}"`);
}

// U3: security-engineering
{
  const sec = disciplines['security-engineering'];
  const coreOk   = sec && sec.core           === 'standards/security-engineering/core.md';
  const policyOk = sec && sec['policy-floor'] === 'standards/security-engineering/POLICY.md';
  assert(coreOk && policyOk, 'u3-security-engineering-lookup-returns-correct-paths',
    `security-engineering: core="${sec && sec.core}" policy-floor="${sec && sec['policy-floor']}"`);
}

// U4: quality-assurance
{
  const qa = disciplines['quality-assurance'];
  const coreOk   = qa && qa.core           === 'standards/quality-assurance/core.md';
  const policyOk = qa && qa['policy-floor'] === 'standards/quality-assurance/POLICY.md';
  assert(coreOk && policyOk, 'u4-quality-assurance-lookup-returns-correct-paths',
    `quality-assurance: core="${qa && qa.core}" policy-floor="${qa && qa['policy-floor']}"`);
}

// ── Unit: U5 — adding a fourth discipline does not break the parser ───────────

console.log('');
console.log('  Unit: U5 — adding a fourth discipline entry does not break the parser');

{
  // Append a fourth discipline entry using the same schema structure
  const fourthEntry = [
    '  test-discipline:',
    '    core: standards/test-discipline/core.md',
    '    policy-floor: standards/test-discipline/POLICY.md',
  ].join('\n');

  const extendedContent = indexContent.trimEnd() + '\n' + fourthEntry + '\n';
  const extendedDisciplines = parseDisciplineIndex(extendedContent);

  const fourthOk =
    extendedDisciplines['test-discipline'] &&
    extendedDisciplines['test-discipline'].core           === 'standards/test-discipline/core.md' &&
    extendedDisciplines['test-discipline']['policy-floor'] === 'standards/test-discipline/POLICY.md';

  // Original three entries must also still parse correctly
  const seOk  = extendedDisciplines['software-engineering'] &&
                extendedDisciplines['software-engineering'].core === 'standards/software-engineering/core.md';
  const secOk = extendedDisciplines['security-engineering'] &&
                extendedDisciplines['security-engineering'].core === 'standards/security-engineering/core.md';
  const qaOk  = extendedDisciplines['quality-assurance'] &&
                extendedDisciplines['quality-assurance'].core    === 'standards/quality-assurance/core.md';

  assert(
    fourthOk && seOk && secOk && qaOk,
    'u5-adding-fourth-discipline-does-not-break-parser',
    [
      !fourthOk && `Fourth discipline (test-discipline) not parsed correctly: ${JSON.stringify(extendedDisciplines['test-discipline'])}`,
      !seOk     && 'software-engineering broken after fourth entry added',
      !secOk    && 'security-engineering broken after fourth entry added',
      !qaOk     && 'quality-assurance broken after fourth entry added',
    ].filter(Boolean).join('; ')
  );
}

// ── NFR: N2 — security POLICY.md includes OWASP check + secrets check ─────────

console.log('');
console.log('  NFR: N2 — security POLICY.md includes OWASP and secrets floors');

{
  const content = contents['standards/security-engineering/POLICY.md'];
  if (content) {
    const hasOwaspCheck = /OWASP/i.test(content) &&
      /(high|critical).*(?:without|RISK-ACCEPT|risk.accept)/i.test(content);
    assert(
      hasOwaspCheck,
      'n2-security-policy-has-owasp-check',
      'security-engineering/POLICY.md must include a floor requirement for OWASP high/critical findings without RISK-ACCEPT'
    );

    const hasSecretsCheck = /secrets?\s+never\s+commit/i.test(content) ||
      /never\s+commit\s+secrets?/i.test(content) ||
      /secrets?\s+(?:must not|MUST\s+never|not\s+be\s+committed)/i.test(content);
    assert(
      hasSecretsCheck,
      'n2-security-policy-has-secrets-check',
      'security-engineering/POLICY.md must include a floor requirement that secrets are never committed to source control'
    );
  }
}

// ── NFR: N3 — every standards file has lastReviewedBy and lastReviewedDate ────

console.log('');
console.log('  NFR: N3 — every standards file has lastReviewedBy and lastReviewedDate populated');

for (const { label, key } of [...CORE_FILES.map(f => ({ label: f.label, key: f.key })),
                               ...POLICY_FILES.map(f => ({ label: f.label, key: f.key }))] ) {
  const content = contents[key];
  if (!content) continue;

  const shortName = label.replace('standards/', '');

  const hasReviewedBy   = /lastReviewedBy:\s+\S/m.test(content);
  const hasReviewedDate = /lastReviewedDate:\s+\S/m.test(content);

  assert(
    hasReviewedBy && hasReviewedDate,
    `n3-${shortName.replace(/\//g, '-').replace('.md', '')}-has-review-record`,
    [
      !hasReviewedBy   && 'missing populated lastReviewedBy field',
      !hasReviewedDate && 'missing populated lastReviewedDate field',
    ].filter(Boolean).join('; ')
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`[standards-model-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
