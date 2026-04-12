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
  const lines  = content.replace(/\r/g, '').split('\n');

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

// (P2.9 tests follow before the summary)

// ── P2.9: Full standards index parser ────────────────────────────────────────

/**
 * Parses standards/index.yml into { disciplines: {...}, domains: {...} }.
 * Recognises top-level section keys (disciplines:, surfaces:, domains:) and
 * only collects entries within the correct section — avoiding cross-section bleed.
 *
 * Each entry object may contain: core (string), policy-floor (string).
 */
function parseFullStandardsIndex(content) {
  const result = { disciplines: {}, domains: {} };
  const lines  = content.replace(/\r/g, '').split('\n');

  let currentSection = null; // 'disciplines' | 'domains' | null
  let currentEntry   = null;

  for (const line of lines) {
    // Skip blank lines and comments
    if (!line.trim() || /^\s*#/.test(line)) continue;

    // Top-level key detection — zero indent, ends with colon (no inline value)
    const topKeyMatch = /^([a-z][a-z0-9-]*):\s*$/.exec(line);
    if (topKeyMatch) {
      const key = topKeyMatch[1];
      if (key === 'disciplines') {
        currentSection = 'disciplines';
      } else if (key === 'domains') {
        currentSection = 'domains';
      } else {
        // surfaces:, version treated as section exits
        currentSection = null;
      }
      currentEntry = null;
      continue;
    }

    if (!currentSection) continue;

    // Entry name: exactly 2-space indent + slug + colon (no inline value)
    const entryMatch = /^  ([a-z][a-z0-9-]+):\s*$/.exec(line);
    if (entryMatch) {
      currentEntry = entryMatch[1];
      if (!result[currentSection][currentEntry]) {
        result[currentSection][currentEntry] = {};
      }
      continue;
    }

    if (!currentEntry) continue;

    // core: — exactly 4-space indent
    const coreMatch = /^    core:\s+(.+)$/.exec(line);
    if (coreMatch) {
      result[currentSection][currentEntry].core = coreMatch[1].trim();
      continue;
    }

    // policy-floor: — exactly 4-space indent
    const policyMatch = /^    policy-floor:\s+(.+)$/.exec(line);
    if (policyMatch) {
      result[currentSection][currentEntry]['policy-floor'] = policyMatch[1].trim();
    }
  }

  return result;
}

// ── P2.9: Eight new discipline entries and three pilot domain entries ──────────

console.log('');
console.log('  P2.9: standards/index.yml discipline and domain extension');

const NEW_P29_DISCIPLINES = [
  'data', 'ux', 'security-extended', 'regulatory',
  'infrastructure', 'devops', 'product', 'ml-ai',
];

const REQUIRED_HEADINGS = [
  '## Overview',
  '## Outcomes',
  '## Requirements',
  '## Out of Scope for this standard',
];

// Tool product names that must not appear as hard assumptions (ADR-004, AP-02).
// Strip [FILL IN: ...] placeholders before checking so that placeholder examples
// do not produce false positives.
const BANNED_TOOL_PATTERNS = [
  /\bTerraform\b/i,
  /\bJenkins\b/i,
  /\bJira\b/i,
  /\bConfluence\b/i,
  /\bGitHub\b/i,
  /\bAzure DevOps\b/i,
  /\bSonarQube\b/i,
  /\bSonarCloud\b/i,
  /\bSplunk\b/i,
  /\bDatadog\b/i,
];

const p29Index = parseFullStandardsIndex(indexContent);

// AC1: exactly 11 total discipline entries (3 existing + 8 new)
assert(
  Object.keys(p29Index.disciplines).length === 11,
  'p29-index-has-11-total-discipline-entries',
  `Expected 11 discipline entries, found ${Object.keys(p29Index.disciplines).length}: ` +
  Object.keys(p29Index.disciplines).join(', ')
);

// AC1: all 8 new discipline slugs present
for (const slug of NEW_P29_DISCIPLINES) {
  assert(
    slug in p29Index.disciplines,
    `p29-${slug}-discipline-entry-present-in-index`,
    `${slug} discipline entry is missing from standards/index.yml disciplines: key`
  );
}

// AC1 (A6): existing 3 entries still present (paths validated by U2–U4)
for (const slug of ['software-engineering', 'security-engineering', 'quality-assurance']) {
  assert(
    slug in p29Index.disciplines,
    `p29-existing-${slug}-still-present-in-index`,
    `${slug} is missing from index after p2.9 extension — A6 non-breaking change violated`
  );
}

// AC1/AC3: disciplines: and domains: are both top-level (sibling) keys
const hasDisciplinesKey = /^disciplines:\s*$/m.test(indexContent);
const hasDomainsKey     = /^domains:\s*$/m.test(indexContent);
assert(
  hasDisciplinesKey && hasDomainsKey,
  'p29-disciplines-and-domains-are-sibling-top-level-keys',
  `disciplines: present=${hasDisciplinesKey}, domains: present=${hasDomainsKey}`
);

// AC1/AC3: domains: key is NOT nested under disciplines:
const domainsNestedUnderDisciplines = /^  domains:\s*$/m.test(indexContent);
assert(
  !domainsNestedUnderDisciplines,
  'p29-domains-key-not-nested-under-disciplines',
  'domains: key must be at top level (0-indent), not indented under disciplines:'
);

// AC2: each new discipline has core.md and POLICY.md at declared paths
console.log('');
console.log('  P2.9: AC2 — new discipline file pairs and structural conformance');

for (const slug of NEW_P29_DISCIPLINES) {
  const entry = p29Index.disciplines[slug];
  if (!entry) continue; // already failed above

  const corePath   = entry.core           ? path.join(root, entry.core)           : null;
  const policyPath = entry['policy-floor'] ? path.join(root, entry['policy-floor']) : null;

  // File existence
  assert(
    corePath && fs.existsSync(corePath),
    `p29-${slug}-core-md-exists`,
    `core.md for ${slug} not found at declared path: ${entry.core}`
  );
  assert(
    policyPath && fs.existsSync(policyPath),
    `p29-${slug}-policy-md-exists`,
    `POLICY.md for ${slug} not found at declared path: ${entry['policy-floor']}`
  );

  // Required headings and outcome-oriented requirements in core.md
  if (corePath && fs.existsSync(corePath)) {
    const coreContent = fs.readFileSync(corePath, 'utf8');

    for (const heading of REQUIRED_HEADINGS) {
      assert(
        coreContent.includes(heading),
        `p29-${slug}-core-has-heading-${heading.replace(/^## /, '').replace(/ /g, '-').toLowerCase()}`,
        `${entry.core} is missing required heading "${heading}"`
      );
    }

    const coreReqLines = getRequirementLines(coreContent);
    assert(
      coreReqLines.length >= 1,
      `p29-${slug}-core-has-must-should-may-statements`,
      `${entry.core} must contain at least one MUST/SHOULD/MAY requirement line`
    );

    // AC6: no hardcoded tool names
    const coreStripped = coreContent.replace(/\[FILL IN:[^\]]*\]/gi, '[FILL IN]');
    const coreToolViolations = BANNED_TOOL_PATTERNS
      .filter(p => p.test(coreStripped))
      .map(p => p.toString());
    assert(
      coreToolViolations.length === 0,
      `p29-${slug}-core-no-hardcoded-tool-name`,
      `${entry.core} contains hardcoded tool name(s): ${coreToolViolations.join(', ')}`
    );
  }

  // Required headings and binary requirements in POLICY.md
  if (policyPath && fs.existsSync(policyPath)) {
    const policyContent = fs.readFileSync(policyPath, 'utf8');

    for (const heading of REQUIRED_HEADINGS) {
      assert(
        policyContent.includes(heading),
        `p29-${slug}-policy-has-heading-${heading.replace(/^## /, '').replace(/ /g, '-').toLowerCase()}`,
        `${entry['policy-floor']} is missing required heading "${heading}"`
      );
    }

    const policyReqLines = getRequirementLines(policyContent);
    assert(
      policyReqLines.length >= 1,
      `p29-${slug}-policy-has-must-should-may-statements`,
      `${entry['policy-floor']} must contain at least one MUST/SHOULD/MAY requirement line`
    );

    // AC6: no hardcoded tool names in POLICY.md
    const policyStripped = policyContent.replace(/\[FILL IN:[^\]]*\]/gi, '[FILL IN]');
    const policyToolViolations = BANNED_TOOL_PATTERNS
      .filter(p => p.test(policyStripped))
      .map(p => p.toString());
    assert(
      policyToolViolations.length === 0,
      `p29-${slug}-policy-no-hardcoded-tool-name`,
      `${entry['policy-floor']} contains hardcoded tool name(s): ${policyToolViolations.join(', ')}`
    );
  }
}

// AC3: domains: key has ≥3 pilot domain entries
console.log('');
console.log('  P2.9: AC3 — pilot domain entries and POLICY.md files');

assert(
  Object.keys(p29Index.domains).length >= 3,
  'p29-domains-key-has-three-or-more-entries',
  `Expected ≥3 domain entries under domains: key, found ${Object.keys(p29Index.domains).length}: ` +
  Object.keys(p29Index.domains).join(', ')
);

// AC3: each domain POLICY.md exists at declared path; check required headings
for (const [domainSlug, entry] of Object.entries(p29Index.domains)) {
  const policyPath = entry['policy-floor'] ? path.join(root, entry['policy-floor']) : null;

  assert(
    policyPath && fs.existsSync(policyPath),
    `p29-domain-${domainSlug}-policy-md-exists`,
    `Domain ${domainSlug} POLICY.md not found at declared path: ${entry['policy-floor']}`
  );

  if (policyPath && fs.existsSync(policyPath)) {
    const content = fs.readFileSync(policyPath, 'utf8');

    for (const heading of REQUIRED_HEADINGS) {
      assert(
        content.includes(heading),
        `p29-domain-${domainSlug}-policy-has-heading-${heading.replace(/^## /, '').replace(/ /g, '-').toLowerCase()}`,
        `Domain ${entry['policy-floor']} is missing required heading "${heading}"`
      );
    }

    // AC6: no hardcoded tool names in domain POLICY.md
    const stripped = content.replace(/\[FILL IN:[^\]]*\]/gi, '[FILL IN]');
    const toolViolations = BANNED_TOOL_PATTERNS
      .filter(p => p.test(stripped))
      .map(p => p.toString());
    assert(
      toolViolations.length === 0,
      `p29-domain-${domainSlug}-policy-no-hardcoded-tool-name`,
      `Domain ${entry['policy-floor']} contains hardcoded tool name(s): ${toolViolations.join(', ')}`
    );
  }
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
