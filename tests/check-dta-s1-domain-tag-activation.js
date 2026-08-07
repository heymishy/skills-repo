#!/usr/bin/env node
// check-dta-s1-domain-tag-activation.js — test plan verification for dta-s1
// Covers U1-U10 (AC1-AC5) and IT1-IT2 from the test plan.
// Run: node tests/check-dta-s1-domain-tag-activation.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'standards-injection.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

const { matchDomainsToStandards, buildStandardsInjectionBlock } = require(MODULE);

const definitionSkill    = fs.readFileSync(path.join(ROOT, 'skills', 'definition', 'SKILL.md'), 'utf8');
const definitionOfReadySkill = fs.readFileSync(path.join(ROOT, 'skills', 'definition-of-ready', 'SKILL.md'), 'utf8');

// ── U1/U2 — AC1: /definition mentions domain, no hardcoded stale list ───────
console.log('\n[dta-s1] AC1 — /definition domain-tag prompt');
{
  assert(/domain/i.test(definitionSkill) && /index\.yml/i.test(definitionSkill), 'U1: /definition instructions mention domain and index.yml');

  // U2: must NOT hardcode a copy of index.yml's current key list as if it
  // were the authoritative source (a literal enumeration used INSTEAD of
  // reading index.yml would drift). Confirm the instructions explicitly say
  // to read the keys dynamically, not "here is the list: api, auth, ...".
  const readsDynamically = /read\s+.*index\.yml.*domain\s+keys\s+dynamically|do not hardcode/i.test(definitionSkill);
  assert(readsDynamically, 'U2: instructions read index.yml keys dynamically, not a hardcoded stale list');
}

// ── U3 — AC2: single domain resolves to its standards file path ────────────
console.log('\n[dta-s1] AC2/AC3 — domain matching');
{
  const r3 = matchDomainsToStandards(['web-ui'], ROOT);
  assert(r3.matched.length === 1 && r3.matched[0].domain === 'web-ui', 'U3: single domain resolves');
  assert(r3.matched[0].files.includes('.github/standards/web-ui/web-ui-patterns.md'), 'U3: resolves to the correct standards file path');

  // U5 — multiple domains resolve to all matching files, not just the first
  const r5 = matchDomainsToStandards(['web-ui', 'security'], ROOT);
  assert(r5.matched.length === 2, 'U5: multiple domains all resolve (not just the first)');
  const domainNames = r5.matched.map((m) => m.domain);
  assert(domainNames.includes('web-ui') && domainNames.includes('security'), 'U5: both web-ui and security matched');
}

// ── U4/IT1 — AC2: matched content actually included, not just a path ───────
console.log('\n[dta-s1] U4/IT1 — content actually included');
{
  const block = buildStandardsInjectionBlock(['web-ui'], ROOT);
  assert(typeof block === 'string' && block.includes('## Applicable standards'), 'U4: block has the Applicable standards heading');
  assert(block.includes('Injectable adapter pattern'), 'U4: full file content included, not just a path reference');
  assert(block.includes('.github/standards/web-ui/web-ui-patterns.md'), 'U4: source file clearly attributed');

  // IT1 — the blended-aggregation rule (this session's own /improve
  // addition) is genuinely reachable through the injection mechanism
  assert(block.includes('blended sum-of-numerator'), 'IT1: blended-aggregation rule text is genuinely reachable via injection');
}

// ── IT2 — AC3: multiple domains, both files present and attributed ─────────
console.log('\n[dta-s1] IT2 — multiple domains end-to-end');
{
  const block = buildStandardsInjectionBlock(['web-ui', 'security'], ROOT);
  assert(block.includes('web-ui-patterns.md') && block.includes('security-standards.md'), 'IT2: both files present in the block');
  assert(block.includes('(domain: web-ui)') && block.includes('(domain: security)'), 'IT2: both attributed to their matched domain');
}

// ── U6/U7 — AC4: no-domain regression guard ─────────────────────────────────
console.log('\n[dta-s1] AC4 — no-domain regression guard');
{
  assert(definitionOfReadySkill.includes('Story has no `domain` field — skipped silently.'), 'U6: SKILL.md still contains the exact byte-for-byte no-domain message');

  const rEmpty = matchDomainsToStandards([], ROOT);
  assert(rEmpty.noDomainField === true, 'U6: matchDomainsToStandards([]) returns the noDomainField sentinel');
  assert(rEmpty.matched.length === 0 && rEmpty.unmatched.length === 0, 'U6: no matched/unmatched entries for a no-domain call');

  const blockEmpty = buildStandardsInjectionBlock([], ROOT);
  assert(blockEmpty === null, 'U7: buildStandardsInjectionBlock([]) returns null — caller falls back to the unchanged message');

  const rUndefined = matchDomainsToStandards(undefined, ROOT);
  assert(rUndefined.noDomainField === true, 'U7: undefined domains (field genuinely absent) also treated as no-domain-field');
}

// ── U8/U9 — AC5: unmatched domain surfaces a distinct warning ──────────────
console.log('\n[dta-s1] AC5 — unmatched domain handling');
{
  const r8 = matchDomainsToStandards(['web-uis'], ROOT); // typo, not a real key
  assert(r8.matched.length === 0 && r8.unmatched.length === 1 && r8.unmatched[0] === 'web-uis', 'U8: unmatched domain surfaces distinctly, names the exact tag');

  const block8 = buildStandardsInjectionBlock(['web-uis'], ROOT);
  assert(block8.includes('web-uis') && /not found/i.test(block8), 'U8: injection block includes a clear unmatched-domain warning');
  assert(!block8.includes('Story has no `domain` field'), 'U8: unmatched-domain case is NOT conflated with the no-domain-field message');

  const r9 = matchDomainsToStandards(['web-ui', 'web-uis'], ROOT);
  assert(r9.matched.length === 1 && r9.matched[0].domain === 'web-ui', 'U9: valid domain among a typo still resolves');
  assert(r9.unmatched.length === 1 && r9.unmatched[0] === 'web-uis', 'U9: only the typo is named as unmatched');
}

// ── U10 — AC5: case/whitespace handling is deliberate, not a third failure ──
console.log('\n[dta-s1] U10 — case/whitespace normalisation');
{
  const r10 = matchDomainsToStandards([' Web-UI '], ROOT);
  assert(r10.matched.length === 1 && r10.matched[0].domain === 'web-ui', 'U10: whitespace + case variant normalises and matches correctly');
  assert(r10.unmatched.length === 0, 'U10: no spurious unmatched entry for the normalised variant');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-dta-s1-domain-tag-activation results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
