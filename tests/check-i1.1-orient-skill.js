#!/usr/bin/env node
// check-i1.1-orient-skill.js — governance tests for i1.1 (orient concierge SKILL.md)
// Covers AC1, AC2a, AC2b, AC3, AC4, AC5, AC6a, AC6b and NFR routing, distinct, consistency
// 16 unit + 2 integration + 1 NFR = 19 tests
// All tests FAIL until .github/skills/orient/SKILL.md is created — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const ORIENT_SKILL = path.join(ROOT, '.github', 'skills', 'orient', 'SKILL.md');
const COPILOT_INS  = path.join(ROOT, '.github', 'copilot-instructions.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

// ── Prerequisites ────────────────────────────────────────────────────────────
console.log('\n[i1.1] orient-skill-file-exists — file exists at expected path');
{
  assert(fs.existsSync(ORIENT_SKILL), 'orient SKILL.md exists at .github/skills/orient/SKILL.md');
}

console.log('\n[i1.1] orient-skill-has-name-field — YAML frontmatter contains name: orient');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('name: orient'), 'SKILL.md has "name: orient" in frontmatter');
}

// ── NFR-distinct ─────────────────────────────────────────────────────────────
console.log('\n[i1.1] orient-skill-distinct-from-start-and-workflow — description distinguishes /orient from /start and /workflow');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/start'),    'SKILL.md references /start');
  assert(text !== null && text.includes('/workflow'), 'SKILL.md references /workflow');
}

// ── AC1 — new repo routes to /discovery ──────────────────────────────────────
console.log('\n[i1.1] orient-routes-ac1-new-repo-to-discovery — new repo state routes to /discovery');
{
  const text = readFile(ORIENT_SKILL);
  assert(
    text !== null && (
      text.includes('no artefacts') ||
      text.includes('no `artefacts`') ||
      text.includes('artefacts/` does not exist') ||
      text.includes('no pipeline state') ||
      text.includes('new repository') ||
      text.includes('new repo')
    ),
    'AC1: SKILL.md describes the new-repo / no-artefacts state'
  );
}

console.log('\n[i1.1] orient-routes-ac1-names-discovery-command-exactly — names /discovery as exact command');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/discovery'), 'AC1: /discovery appears as the named command');
}

console.log('\n[i1.1] orient-routes-ac1-explains-discovery-in-one-sentence — explains what /discovery produces');
{
  const text = readFile(ORIENT_SKILL);
  assert(
    text !== null && (
      text.includes('discovery artefact') ||
      text.includes('first discovery') ||
      text.includes('structures your idea') ||
      text.includes('structures the idea') ||
      text.includes('produces a discovery') ||
      text.includes('creates your first') ||
      text.includes('creates a discovery') ||
      text.includes('entry point')
    ),
    'AC1: SKILL.md contains an explanatory sentence about what /discovery produces'
  );
}

// ── AC2a — incomplete discovery routes to /clarify ───────────────────────────
console.log('\n[i1.1] orient-routes-ac2a-incomplete-discovery-to-clarify — incomplete discovery → /clarify');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/clarify'), 'AC2a: /clarify appears as routing target for incomplete discovery');
}

console.log('\n[i1.1] orient-routes-ac2a-names-incompleteness — routing rule requires naming the specific gap');
{
  const text = readFile(ORIENT_SKILL);
  assert(
    text !== null && (
      text.includes('[FILL IN]') ||
      text.includes('incomplete section') ||
      text.includes('name the gap') ||
      text.includes('name the specific') ||
      text.includes('specific gap') ||
      text.includes('specific incompleteness') ||
      text.includes('what is incomplete') ||
      text.includes('which section')
    ),
    'AC2a: SKILL.md includes instruction to name the specific incompleteness'
  );
}

// ── AC2b — complete unapproved discovery routes to /discovery ────────────────
console.log('\n[i1.1] orient-routes-ac2b-approval-pending-to-discovery — complete but unapproved discovery → /discovery with approval message');
{
  const text = readFile(ORIENT_SKILL);
  assert(
    text !== null && (text.includes('approval') || text.includes('Approved')),
    'AC2b: SKILL.md references approval step for complete discovery'
  );
}

console.log('\n[i1.1] orient-routes-ac2b-does-not-route-to-clarify-when-complete — two distinct routing rules for incomplete vs complete-unapproved');
{
  const text = readFile(ORIENT_SKILL);
  assert(
    text !== null && text.includes('/clarify') && text.includes('/discovery'),
    'AC2b: SKILL.md has both /clarify (incomplete) and /discovery (approval-pending) as separate targets'
  );
}

// ── AC3 — discovery approved + no benefit-metric → /benefit-metric ───────────
console.log('\n[i1.1] orient-routes-ac3-to-benefit-metric — approved discovery + no benefit-metric → /benefit-metric');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/benefit-metric'), 'AC3: /benefit-metric appears as routing target');
}

// ── AC4 — benefit-metric active + no stories → /definition ───────────────────
console.log('\n[i1.1] orient-routes-ac4-to-definition — benefit-metric active + no stories → /definition');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/definition'), 'AC4: /definition appears as routing target');
}

// ── AC5 — stories exist + missing test plan → /test-plan naming story ────────
console.log('\n[i1.1] orient-routes-ac5-to-test-plan-naming-story — routes to /test-plan and names the story');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/test-plan'), 'AC5: /test-plan appears as routing target');
  assert(
    text !== null && (
      text.includes('name the story') ||
      text.includes('naming the story') ||
      text.includes('story slug') ||
      text.includes('first story without') ||
      text.includes('story without a test plan') ||
      text.includes('name the specific story') ||
      text.includes('missing test plan')
    ),
    'AC5: SKILL.md instructs naming the specific story when routing to /test-plan'
  );
}

// ── AC6a — dorStatus signed-off + branch exists → /verify-completion ─────────
console.log('\n[i1.1] orient-routes-ac6a-to-verify-completion-with-branch — signed-off + branch → /verify-completion');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/verify-completion'), 'AC6a: /verify-completion appears as routing target');
  assert(
    text !== null && (text.includes('branch') || text.includes('worktree')),
    'AC6a: SKILL.md references branch/worktree detection for the signed-off routing decision'
  );
}

// ── AC6b — dorStatus signed-off + no branch → /branch-setup ──────────────────
console.log('\n[i1.1] orient-routes-ac6b-to-branch-setup-no-branch — signed-off + no branch → /branch-setup');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('/branch-setup'), 'AC6b: /branch-setup appears as routing target');
}

// ── NFR-consistency — canonical field names ───────────────────────────────────
console.log('\n[i1.1] orient-nfr-canonical-field-names — references dorStatus and pipeline-state.json by canonical name');
{
  const text = readFile(ORIENT_SKILL);
  assert(text !== null && text.includes('dorStatus'),           'NFR: canonical field name "dorStatus" present');
  assert(text !== null && text.includes('pipeline-state.json'), 'NFR: "pipeline-state.json" referenced by canonical name');
}

// ── Integration: all 8 routing states present ────────────────────────────────
console.log('\n[i1.1] orient-all-8-routing-states-present — all 8 routing targets present (integration)');
{
  const text = readFile(ORIENT_SKILL);
  const targets = ['/discovery', '/clarify', '/benefit-metric', '/definition', '/test-plan', '/verify-completion', '/branch-setup'];
  targets.forEach(t => {
    assert(text !== null && text.includes(t), `Integration: routing target "${t}" present`);
  });
}

// ── Integration: /orient registered in copilot-instructions.md ───────────────
console.log('\n[i1.1] orient-skill-registered-in-copilot-instructions — orient referenced in copilot-instructions.md');
{
  const text = readFile(COPILOT_INS);
  assert(
    text !== null && (text.includes('/orient') || text.includes('`orient`')),
    'Integration: /orient referenced in .github/copilot-instructions.md'
  );
}

// ── NFR: no generic fallback phrases ─────────────────────────────────────────
console.log('\n[i1.1] orient-nfr-routing-completeness — no generic "not sure" fallback phrases');
{
  const text = readFile(ORIENT_SKILL);
  const fallbacks = ['not sure', 'unclear state', 'i cannot determine', 'i am not sure', "i'm not sure"];
  const lower = text ? text.toLowerCase() : '';
  const hasFallback = fallbacks.some(f => lower.includes(f));
  assert(text !== null && !hasFallback, 'NFR: no generic fallback phrases — every state has an explicit routing rule');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[i1.1-orient-skill] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
