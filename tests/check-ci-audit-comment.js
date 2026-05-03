#!/usr/bin/env node
/**
 * check-ci-audit-comment.js
 *
 * Unit tests for scripts/ci-audit-comment.js (extracted from assurance-gate.yml)
 * and extractPRSlug edge cases in scripts/extract-pr-slug.js.
 *
 * Tests:
 *   T1–T6   extractPRSlug edge cases (glob, wildcard, backtick, table cell, null)
 *   T7–T11  loadPipelineStories (flat, epic-nested, both, missing, null)
 *   T12–T15 classifyArtefact (stories/, dor/, top-level discovery, unknown dir)
 *   T16–T19 parseACs (standard, no section, empty, null)
 *   T20–T22 buildAuditComment smoke tests
 *
 * Run:  node tests/check-ci-audit-comment.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js only.
 */
'use strict';

const path = require('path');

const { extractPRSlug } = require(path.resolve(__dirname, '../scripts/extract-pr-slug.js'));
const {
  loadPipelineStories,
  classifyArtefact,
  parseACs,
  buildAuditComment,
} = require(path.resolve(__dirname, '../scripts/ci-audit-comment.js'));

let passed   = 0;
let failed   = 0;
const failures = [];

function assert(cond, label, detail) {
  if (cond) {
    passed++;
    process.stdout.write('  \u2713 ' + label + '\n');
  } else {
    failed++;
    failures.push({ label, detail });
    process.stdout.write('  \u2717 ' + label + '\n');
    if (detail) process.stdout.write('    \u2192 ' + detail + '\n');
  }
}

const FEAT = '2026-04-24-platform-onboarding-distribution';

// ── T1–T6: extractPRSlug edge cases ──────────────────────────────────────────

// T1: empty string → ''
assert(extractPRSlug('') === '', 'T1: empty string → ""');

// T2: glob-only — artefacts/*/ must NOT produce '*'
{
  const body = `Entry C: artefacts/*/dor/ files exist. artefacts/*/dod/ also checked.`;
  const result = extractPRSlug(body);
  assert(result === '', `T2: artefacts/*/ glob → "" (got ${JSON.stringify(result)})`);
}

// T3: real date-slug path → correct slug
{
  const body = `| artefacts/${FEAT}/stories/p11.7-start.md |`;
  const result = extractPRSlug(body);
  assert(
    result === FEAT,
    `T3: real date-slug → correct (got ${JSON.stringify(result)})`,
  );
}

// T4: glob appears BEFORE real path — real slug must be returned
{
  const body = `Brownfield check: artefacts/*/dod/ exists.\nSee artefacts/${FEAT}/stories/p11.7.md`;
  const result = extractPRSlug(body);
  assert(
    result === FEAT,
    `T4: glob before real path → real slug (got ${JSON.stringify(result)})`,
  );
}

// T5: backtick-wrapped path → correct slug
{
  const body = `| Story | \`artefacts/${FEAT}/stories/p11.7.md\` |`;
  const result = extractPRSlug(body);
  assert(
    result === FEAT,
    `T5: backtick-wrapped → correct slug (got ${JSON.stringify(result)})`,
  );
}

// T6: null body → '' (no throw)
try {
  const result = extractPRSlug(null);
  assert(result === '', `T6: null body → "" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T6: threw on null — ${e.message}`);
}

// ── T7–T11: loadPipelineStories ───────────────────────────────────────────────

// T7: flat stories[] layout
{
  const state = {
    features: [{ slug: 'test-feat', stories: [{ id: 's1' }, { id: 's2' }] }],
  };
  const result = loadPipelineStories(state, 'test-feat');
  assert(result.length === 2 && result[0].id === 's1', `T7: flat stories[] → 2 stories (got ${result.length})`);
}

// T8: epic-nested layout
{
  const state = {
    features: [{
      slug: 'test-feat',
      epics: [
        { stories: [{ id: 'e1s1' }, { id: 'e1s2' }] },
        { stories: [{ id: 'e2s1' }] },
      ],
    }],
  };
  const result = loadPipelineStories(state, 'test-feat');
  assert(result.length === 3 && result[0].id === 'e1s1', `T8: epic-nested → 3 stories (got ${result.length})`);
}

// T9: both flat and epic-nested → all included
{
  const state = {
    features: [{
      slug: 'test-feat',
      stories: [{ id: 'flat1' }],
      epics:   [{ stories: [{ id: 'epic1' }] }],
    }],
  };
  const result = loadPipelineStories(state, 'test-feat');
  assert(result.length === 2, `T9: flat + epic → 2 stories (got ${result.length})`);
  assert(
    result.some(s => s.id === 'flat1') && result.some(s => s.id === 'epic1'),
    `T9b: both flat1 and epic1 present`,
  );
}

// T10: missing feature slug → [] with no throw
try {
  const result = loadPipelineStories({ features: [] }, 'no-such-feature');
  assert(result.length === 0, `T10: missing feature → [] (got ${result.length})`);
} catch (e) {
  assert(false, `T10: threw on missing feature — ${e.message}`);
}

// T11: null state object → [] with no throw
try {
  const result = loadPipelineStories(null, 'any');
  assert(result.length === 0, `T11: null state → [] (got ${result.length})`);
} catch (e) {
  assert(false, `T11: threw on null state — ${e.message}`);
}

// ── T12–T15: classifyArtefact ─────────────────────────────────────────────────

// T12: stories/ subdir
{
  const r = classifyArtefact('artefacts/2026-04-01-feat/stories/s1.1-my-story.md');
  assert(r.type === 'Story',       `T12: stories/ → type "Story" (got ${JSON.stringify(r.type)})`);
  assert(r.typeOrder === 4,        `T12b: typeOrder 4 (got ${r.typeOrder})`);
}

// T13: dor/ subdir
{
  const r = classifyArtefact('artefacts/2026-04-01-feat/dor/s1.1-dor.md');
  assert(r.type === 'Definition of Ready', `T13: dor/ → "Definition of Ready" (got ${JSON.stringify(r.type)})`);
  assert(r.typeOrder === 8,                `T13b: typeOrder 8 (got ${r.typeOrder})`);
}

// T14: top-level discovery file
{
  const r = classifyArtefact('artefacts/2026-04-01-feat/discovery.md');
  assert(r.type === 'Discovery', `T14: top-level discovery → "Discovery" (got ${JSON.stringify(r.type)})`);
  assert(r.typeOrder === 1,      `T14b: typeOrder 1 (got ${r.typeOrder})`);
}

// T15: unknown subdir → type "Other"
{
  const r = classifyArtefact('artefacts/2026-04-01-feat/unknown-dir/file.md');
  assert(r.type === 'Other', `T15: unknown subdir → "Other" (got ${JSON.stringify(r.type)})`);
  assert(r.typeOrder === 99, `T15b: typeOrder 99 (got ${r.typeOrder})`);
}

// ── T16–T19: parseACs ─────────────────────────────────────────────────────────

// T16: standard AC section with two criteria
{
  const md = [
    '## Acceptance Criteria',
    '',
    '**AC1:** First criterion text.',
    '',
    '**AC2:** Second criterion text.',
    '',
    '## Notes',
    'other content',
  ].join('\n');
  const result = parseACs(md);
  assert(result.length === 2,       `T16: 2 ACs parsed (got ${result.length})`);
  assert(result[0].id === 'AC1',    `T16b: first id is AC1 (got ${JSON.stringify(result[0].id)})`);
  assert(result[1].id === 'AC2',    `T16c: second id is AC2 (got ${JSON.stringify(result[1].id)})`);
  assert(result[0].text.length > 0, `T16d: AC1 text is non-empty`);
}

// T17: no AC section → []
{
  const result = parseACs('## Overview\nSome content without ACs.');
  assert(result.length === 0, `T17: no AC section → [] (got ${result.length})`);
}

// T18: empty string → []
{
  const result = parseACs('');
  assert(result.length === 0, `T18: empty string → [] (got ${result.length})`);
}

// T19: null → [] with no throw
try {
  const result = parseACs(null);
  assert(result.length === 0, `T19: null → [] (got ${result.length})`);
} catch (e) {
  assert(false, `T19: threw on null — ${e.message}`);
}

// ── T20–T22: buildAuditComment smoke tests ────────────────────────────────────

const SAMPLE_DATA = {
  verdict:      'pass',
  traceHash:    'abc123deadbeef',
  shortSha:     'abc1234',
  headSha:      'abc1234567890abcdef',
  repoUrl:      'https://github.com/owner/repo',
  runUrl:       'https://github.com/owner/repo/actions/runs/1',
  artifactName: 'governed-artefacts-1',
  slug:         '2026-04-01-feat',
  sourceNote:   '',
  checks:       [{ name: 'check-1', passed: true }],
  artefactFiles: [{
    sourcePath:      'artefacts/2026-04-01-feat/stories/s1.1.md',
    sha256:          null,
    type:            'Story',
    typeOrder:       4,
    displayName:     'S1 1',
    integrityStatus: '\u2014',
  }],
  governanceInputs:     [],
  pipelineStories:      [],
  crossCheckStoryId:    '',
  crossCheckDispatchNote: '',
  crossCheckStoryFound: null,
};

// T20: returns string, contains required headers
{
  const body = buildAuditComment(SAMPLE_DATA);
  assert(typeof body === 'string',                          `T20: returns string`);
  assert(body.includes('Governed Delivery Audit Record'),   `T20b: contains audit header`);
  assert(body.includes('Verification result: PASS'),        `T20c: contains verdict`);
  assert(body.includes('How to verify this independently'), `T20d: contains verify section`);
}

// T21: artefact displayName appears in body
{
  const body = buildAuditComment(SAMPLE_DATA);
  assert(body.includes('S1 1'), `T21: artefact displayName in body`);
}

// T22: crossCheck dispatch note appears in AC section when story matches
{
  const data = {
    ...SAMPLE_DATA,
    crossCheckStoryId:    's1.1',
    crossCheckDispatchNote: '\u2705 Dispatch verified \u00b7 Issue #99',
    crossCheckStoryFound: { id: 's1.1', issueUrl: 'https://github.com/owner/repo/issues/99' },
    pipelineStories: [{
      id:       's1.1',
      title:    'My story',
      acs:      [{ id: 'AC1', text: 'Criterion one.' }],
      issueUrl: 'https://github.com/owner/repo/issues/99',
      issueAcCheck: '',
      suiteResult: null,
    }],
  };
  const body = buildAuditComment(data);
  assert(body.includes('Dispatch verified'), `T22: dispatch note in AC section`);
  assert(body.includes('Issue #99'),         `T22b: issue number in AC section`);
}

// T23: testPlan passing fallback — all passing → ✅ status icon on AC rows
{
  const data = {
    ...SAMPLE_DATA,
    pipelineStories: [{
      id:       's1.1',
      title:    'Fallback story',
      acs:      [{ id: 'AC1', text: 'Criterion one.' }, { id: 'AC2', text: 'Criterion two.' }],
      issueUrl: null,
      issueAcCheck: '',
      suiteResult: null,
      testPlan: { totalTests: 5, passing: 5 },
    }],
  };
  const body = buildAuditComment(data);
  // AC rows should contain ✅ (U+2705) not — (U+2014)
  assert(body.includes('\u2705'), `T23: all-passing testPlan fallback yields ✅ icon`);
  const acRowMatch = body.match(/\| `AC1` \|[^|]+\| ([^|]+) \|/);
  assert(acRowMatch && acRowMatch[1].includes('\u2705'), `T23b: AC row status is ✅`);
}

// T24: testPlan passing fallback — not all passing → — status icon
{
  const data = {
    ...SAMPLE_DATA,
    pipelineStories: [{
      id:       's1.1',
      title:    'Partial story',
      acs:      [{ id: 'AC1', text: 'Criterion one.' }],
      issueUrl: null,
      issueAcCheck: '',
      suiteResult: null,
      testPlan: { totalTests: 5, passing: 3 },
    }],
  };
  const body = buildAuditComment(data);
  const acRowMatch = body.match(/\| `AC1` \|[^|]+\| ([^|]+) \|/);
  assert(acRowMatch && acRowMatch[1].includes('\u2014'), `T24: partial testPlan fallback yields — icon`);
}

// T25: testPlan passing = 0 → no test line emitted (D31 fix: suppress misleading "0/N passing")
{
  const data = {
    ...SAMPLE_DATA,
    pipelineStories: [{
      id:       's1.1',
      title:    'Unverified story',
      acs:      [{ id: 'AC1', text: 'Criterion one.' }],
      issueUrl: null,
      issueAcCheck: '',
      suiteResult: null,
      testPlan: { totalTests: 18, passing: 0 },
    }],
  };
  const body = buildAuditComment(data);
  assert(!body.includes('Tests (pipeline-state): **0/'), `T25: passing=0 suppresses misleading 0/N test line`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\nci-audit-comment: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  failures.forEach(f => process.stderr.write(`  FAILED: ${f.label}${f.detail ? ' → ' + f.detail : ''}\n`));
}
process.exit(failed > 0 ? 1 : 0);
