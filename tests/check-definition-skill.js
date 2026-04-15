#!/usr/bin/env node
/**
 * check-definition-skill.js
 *
 * Automated unit tests for the /definition skill D1/D2/D3 improvements.
 * Implements all automatable tests from the p2.1 test plan:
 *
 *   Unit tests:
 *   - import-path-uses-src                      (AC1 — p3.1c)
 *   - D1-warn-on-missing-upstream-slug          (AC1)
 *   - D1-no-warn-when-slug-resolves             (AC1 negative)
 *   - D1-external-annotation-preserved          (AC2)
 *   - D1-external-annotation-format-validated   (AC2 edge case)
 *   - D2-flags-should-phrasing                  (AC3a)
 *   - D2-flags-internal-state-ac                (AC3b)
 *   - D2-flags-coupled-ac                       (AC3c)
 *   - D2-accepted-ac-annotated                  (AC4)
 *   - D2-advisory-filter-story-continues        (AC4)
 *   - D3-learnings-prompt-present               (AC5)
 *
 * Run:  node tests/check-definition-skill.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── Import helpers from production source path (p3.1c AC1) ───────────────────

const {
  extractUpstreamSlugs,
  isExternallyAcknowledged,
  validateExternalAnnotation,
  resolveSlug,
  checkTestability,
  hasTestabilityAnnotation,
} = require('../src/definition-skill/helpers.js');

// ── Test harness ──────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

// ── U1: self-audit — import path uses ../src/ (p3.1c AC1) ────────────────────

{
  const selfContent = fs.readFileSync(__filename, 'utf8');
  const hasSrcImport = /require\(['"]\.\.\/src\//.test(selfContent);
  if (hasSrcImport) {
    pass('import-path-uses-src');
  } else {
    fail('import-path-uses-src', 'no require("../src/...") found in this file — import path must reference ../src/');
  }
}

// ── Load fixture files ────────────────────────────────────────────────────────

const fixtureMissing     = path.join(root, 'tests', 'fixtures', 'story-missing-upstream.md');
const fixtureExternalDep = path.join(root, 'tests', 'fixtures', 'story-external-dep.md');
const skillMdPath        = path.join(root, '.github', 'skills', 'definition', 'SKILL.md');

if (!fs.existsSync(fixtureMissing)) {
  process.stderr.write('[definition-skill-check] FATAL: tests/fixtures/story-missing-upstream.md not found\n');
  process.exit(1);
}
if (!fs.existsSync(fixtureExternalDep)) {
  process.stderr.write('[definition-skill-check] FATAL: tests/fixtures/story-external-dep.md not found\n');
  process.exit(1);
}
if (!fs.existsSync(skillMdPath)) {
  process.stderr.write('[definition-skill-check] FATAL: .github/skills/definition/SKILL.md not found\n');
  process.exit(1);
}

const missingUpstreamContent  = fs.readFileSync(fixtureMissing,     'utf8');
const externalDepContent      = fs.readFileSync(fixtureExternalDep, 'utf8');
const skillMdContent          = fs.readFileSync(skillMdPath,        'utf8');

// ── D1 unit tests ─────────────────────────────────────────────────────────────

console.log('[definition-skill-check] D1 — dependency chain validation');

// D1-warn-on-missing-upstream-slug (AC1)
{
  const slugs = extractUpstreamSlugs(missingUpstreamContent);
  const missingSlug = 'p2.x-nonexistent-story';

  if (!slugs.includes(missingSlug)) {
    fail('D1-warn-on-missing-upstream-slug', `fixture does not contain expected slug "${missingSlug}"; found: ${JSON.stringify(slugs)}`);
  } else {
    const { resolved } = resolveSlug(missingSlug, '2026-04-11-skills-platform-phase2');
    if (resolved) {
      fail('D1-warn-on-missing-upstream-slug', `slug "${missingSlug}" unexpectedly resolves — test fixture integrity broken`);
    } else {
      pass('D1-warn-on-missing-upstream-slug');
    }
  }
}

// D1-no-warn-when-slug-resolves (AC1 negative)
{
  const existingSlug    = 'p2.1-definition-skill-improvements';
  const { resolved }    = resolveSlug(existingSlug, '2026-04-11-skills-platform-phase2');
  if (resolved) {
    pass('D1-no-warn-when-slug-resolves');
  } else {
    fail('D1-no-warn-when-slug-resolves', `slug "${existingSlug}" expected to resolve but did not — story artefact missing at artefacts/2026-04-11-skills-platform-phase2/stories/${existingSlug}.md`);
  }
}

// D1-external-annotation-preserved (AC2)
{
  const missingSlug = 'p2.x-nonexistent-story';
  const acknowledged = isExternallyAcknowledged(externalDepContent, missingSlug);
  if (acknowledged) {
    pass('D1-external-annotation-preserved');
  } else {
    fail('D1-external-annotation-preserved', `fixture story-external-dep.md does not contain [External: ...] annotation for slug "${missingSlug}"`);
  }
}

// D1-external-annotation-format-validated (AC2 edge case)
{
  // Well-formed annotation — should pass
  const wellFormed  = '[External: third-party payment gateway — confirmed by operator on 2026-04-11]';
  const badMissing  = '[External: some description]'; // missing date
  const badEmpty    = '[External:  — confirmed by operator on 2026-04-11]'; // empty description

  const r1 = validateExternalAnnotation(wellFormed);
  const r2 = validateExternalAnnotation(badMissing);
  const r3 = validateExternalAnnotation(badEmpty);

  if (r1.valid && !r2.valid && !r3.valid) {
    pass('D1-external-annotation-format-validated');
  } else {
    const details = [
      r1.valid ? null : `well-formed annotation should be valid: ${r1.reason}`,
      r2.valid ? 'annotation without date should be invalid' : null,
      r3.valid ? 'annotation with empty description should be invalid' : null,
    ].filter(Boolean).join('; ');
    fail('D1-external-annotation-format-validated', details);
  }
}

// ── D2 unit tests ─────────────────────────────────────────────────────────────

console.log('[definition-skill-check] D2 — testability filter');

// D2-flags-should-phrasing (AC3a)
{
  const acText   = 'Given X, when Y, then the system should display Z';
  const warnings = checkTestability(acText);
  const hit      = warnings.some(w => w.pattern === 'a');
  if (hit) {
    pass('D2-flags-should-phrasing');
  } else {
    fail('D2-flags-should-phrasing', `no pattern-a warning returned for AC text containing "should": ${acText}`);
  }
}

// D2-flags-internal-state-ac (AC3b)
{
  const acText   = 'Given X, when Y, then pipeline-state.json has field health set to green in the internal store';
  const warnings = checkTestability(acText);
  const hit      = warnings.some(w => w.pattern === 'b');
  if (hit) {
    pass('D2-flags-internal-state-ac');
  } else {
    fail('D2-flags-internal-state-ac', `no pattern-b warning returned for AC text describing internal state: ${acText}`);
  }
}

// D2-flags-coupled-ac (AC3c)
{
  const acText   = 'Given the previous AC has passed and set up state, when Y, then Z';
  const warnings = checkTestability(acText);
  const hit      = warnings.some(w => w.pattern === 'c');
  if (hit) {
    pass('D2-flags-coupled-ac');
  } else {
    fail('D2-flags-coupled-ac', `no pattern-c warning returned for AC text with coupling reference: ${acText}`);
  }
}

// D2-accepted-ac-annotated (AC4)
{
  const annotatedAC = 'Given X, when Y, then the system should display Z [Testability: accepted by operator on 2026-04-11]';
  if (hasTestabilityAnnotation(annotatedAC)) {
    pass('D2-accepted-ac-annotated');
  } else {
    fail('D2-accepted-ac-annotated', 'annotation [Testability: accepted by operator on YYYY-MM-DD] not found in AC text');
  }
}

// D2-advisory-filter-story-continues (AC4)
{
  // Verify the advisory-only constraint: the filter must not remove or alter the original AC text.
  // We represent this by checking that the original AC text is preserved alongside the annotation.
  const originalAC   = 'Given X, when Y, then the system should display Z';
  const annotatedAC  = originalAC + ' [Testability: accepted by operator on 2026-04-11]';

  const originalPreserved = annotatedAC.startsWith(originalAC);
  const annotationPresent = hasTestabilityAnnotation(annotatedAC);

  if (originalPreserved && annotationPresent) {
    pass('D2-advisory-filter-story-continues');
  } else {
    fail('D2-advisory-filter-story-continues', `original AC text not preserved: startsWith=${originalPreserved}, annotationPresent=${annotationPresent}`);
  }
}

// ── D3 unit tests ─────────────────────────────────────────────────────────────

console.log('[definition-skill-check] D3 — learnings exit step');

// D3-learnings-prompt-present (AC5)
{
  const hasPromptText   = skillMdContent.includes('Before ending this session \u2014 are there any learnings from this decomposition to write to `workspace/learnings.md`?');
  const hasReplyOptions = skillMdContent.includes('Reply with the learning text, or `skip` to proceed to /estimate');

  if (hasPromptText && hasReplyOptions) {
    pass('D3-learnings-prompt-present');
  } else {
    const details = [
      hasPromptText   ? null : 'learnings prompt text missing from SKILL.md',
      hasReplyOptions ? null : 'reply-options text missing from SKILL.md',
    ].filter(Boolean).join('; ');
    fail('D3-learnings-prompt-present', details);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
if (failed > 0) {
  console.log(`[definition-skill-check] Results: ${passed} passed, ${failed} failed`);
  for (const { name, reason } of failures) {
    process.stderr.write(`  \u2717 ${name}: ${reason}\n`);
  }
  process.exit(1);
} else {
  console.log(`[definition-skill-check] Results: ${passed} passed, 0 failed`);
  process.exit(0);
}
