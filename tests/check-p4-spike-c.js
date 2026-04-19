#!/usr/bin/env node
// check-p4-spike-c.js — test plan verification for p4-spike-c
// Covers T1–T12 (AC1–AC5) and T-NFR1 (MC-SEC-02)
// Tests FAIL before spike investigation artefact is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SPIKE_FILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-c-output.md');
const STATE_FILE = path.join(ROOT, '.github', 'pipeline-state.json');
const DEC_FILE   = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'decisions.md');
// Spot-check E2 story — dist-lockfile is the primary consumer of the lockfile design decision
const E2_LOCKFILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'stories', 'p4-dist-lockfile.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

const VALID_VERDICTS = ['PROCEED', 'REDESIGN', 'DEFER', 'REJECT'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function readSpike() {
  if (!fs.existsSync(SPIKE_FILE)) return null;
  return fs.readFileSync(SPIKE_FILE, 'utf8');
}

function extractVerdict(content) {
  if (!content) return null;
  const m = content.match(/\b(PROCEED|REDESIGN|DEFER|REJECT)\b/);
  return m ? m[1] : null;
}

// ── AC1 — Spike output exists; named design decisions for all 4 sub-problems ──
console.log('\n[p4-spike-c] AC1 — Spike output exists with valid overall verdict and named decisions for all 4 sub-problems');

// T1 — File exists
{
  const exists = fs.existsSync(SPIKE_FILE);
  assert(exists, 'T1: spike-c-output.md exists at declared path');
}

// T2 — Contains valid overall verdict
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  assert(VALID_VERDICTS.includes(verdict), `T2: verdict is one of PROCEED/REDESIGN/DEFER/REJECT (found: ${verdict})`);
}

// T3 — All 4 distribution sub-problems addressed
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T3: 4 sub-problems addressed (skipped — file missing)');
  } else {
    // Sub-problem 1: sidecar / directory / collision
    const hasSub1 = /sidecar|repo.?struct|collision|directory.?convent/i.test(content);
    // Sub-problem 2: commit provenance / zero-commit install
    const hasSub2 = /commit.?provenance|zero.?commit|zero commit|no.?commit/i.test(content);
    // Sub-problem 3: update channel / lockfile / upgrade
    const hasSub3 = /update.?channel|lockfile|upgrade.?semant/i.test(content);
    // Sub-problem 4: upstream authority
    const hasSub4 = /upstream.?authorit|upstream authority/i.test(content);
    assert(hasSub1, 'T3a: sub-problem 1 addressed (sidecar/repo structure/collision)');
    assert(hasSub2, 'T3b: sub-problem 2 addressed (commit provenance/zero-commit install)');
    assert(hasSub3, 'T3c: sub-problem 3 addressed (update channel/lockfile/upgrade)');
    assert(hasSub4, 'T3d: sub-problem 4 addressed (upstream authority)');
  }
}

// T4 — Sub-problem verdicts or explicit design decisions for all 4
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T4: sub-problem verdicts or design decisions (skipped — file missing)');
  } else {
    // Each sub-problem section should have at least one of: a verdict label, "Decision:", "We will", "Resolved:", "Approach:"
    const decisionIndicator = /\b(PROCEED|REDESIGN|DEFER|REJECT|Decision:|Resolved:|We will|Approach:|Design:|Decided:)/i;
    // Count sections with a decision indicator near each sub-problem keyword
    const sub1Snip = content.match(/sidecar[^\n]{0,400}/i);
    const sub2Snip = content.match(/(?:commit.?provenance|zero.?commit)[^\n]{0,400}/i);
    const sub3Snip = content.match(/(?:update.?channel|lockfile)[^\n]{0,400}/i);
    const sub4Snip = content.match(/upstream.?authorit[^\n]{0,400}/i);
    assert(!sub1Snip || decisionIndicator.test(sub1Snip[0]), 'T4a: sub-problem 1 has a decision or verdict statement');
    assert(!sub2Snip || decisionIndicator.test(sub2Snip[0]), 'T4b: sub-problem 2 has a decision or verdict statement');
    assert(!sub3Snip || decisionIndicator.test(sub3Snip[0]), 'T4c: sub-problem 3 has a decision or verdict statement');
    assert(!sub4Snip || decisionIndicator.test(sub4Snip[0]), 'T4d: sub-problem 4 has a decision or verdict statement');
  }
}

// ── AC2 — Upstream authority decision complete ────────────────────────────────
console.log('\n[p4-spike-c] AC2 — Upstream authority decision: authoritative repo, context.yml config, Craig\'s fork role');

// T5 — Authoritative repository named
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T5: authoritative repository named (skipped — file missing)');
  } else {
    const hasRepo = /heymishy\/skills-repo|authoritative.*fork|publishing.*fork|authoritative.*repo/i.test(content);
    assert(hasRepo, 'T5: authoritative repository explicitly named (heymishy/skills-repo or a named fork)');
  }
}

// T6 — context.yml skills_upstream block described
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T6: context.yml skills_upstream described (skipped — file missing)');
  } else {
    const hasSkillsUpstream = /skills_upstream/i.test(content);
    const hasContextYml     = /context\.yml/i.test(content);
    assert(hasSkillsUpstream && hasContextYml, 'T6: context.yml skills_upstream block described for upstream authority configuration');
  }
}

// T7 — Craig's fork role categorised
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T7: Craig\'s fork role categorised (skipped — file missing)');
  } else {
    const hasForkRole = /publishing.?layer|downstream.?fork|productis.?fork|craig.{0,60}fork|fork.{0,60}craig/i.test(content);
    assert(hasForkRole, 'T7: Craig\'s fork role categorised (publishing layer / downstream fork / productisation fork)');
  }
}

// ── AC3 — Lockfile structure specified ───────────────────────────────────────
console.log('\n[p4-spike-c] AC3 — Lockfile structure: format/fields, upgrade diff, POLICY.md floor verification');

// T8 — Lockfile minimum required fields named
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T8: lockfile fields named (skipped — file missing)');
  } else {
    const hasSourceUrl   = /upstream.?source.?url|source.?url|remote.?url/i.test(content);
    const hasPinnedRef   = /pinned.?ref|pin.{0,20}ref|ref.{0,20}pin|pinned.?version|version.{0,20}pin/i.test(content);
    const hasContentHash = /content.?hash|skill.?hash|hash.{0,20}skill/i.test(content);
    assert(hasSourceUrl,   'T8a: lockfile format includes upstream source URL field');
    assert(hasPinnedRef,   'T8b: lockfile format includes pinned ref/version field');
    assert(hasContentHash, 'T8c: lockfile format includes skill content hashes field');
  }
}

// T9 — Upgrade diff and POLICY.md floor verification described
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T9: upgrade diff and POLICY.md floor (skipped — file missing)');
  } else {
    const hasUpgradeDiff   = /upgrade.{0,100}diff|diff.{0,100}upgrade|consumer.?review|review.{0,60}upgrade/i.test(content);
    const hasPolicyFloor   = /POLICY\.md.{0,100}floor|floor.{0,100}POLICY|policy.?floor.?verif/i.test(content);
    assert(hasUpgradeDiff,   'T9a: upgrade section describes diff display for consumer review before re-pinning');
    assert(hasPolicyFloor,   'T9b: POLICY.md floor verification after upgrade described');
  }
}

// ── AC4 — pipeline-state.json + upstream authority ADR ───────────────────────
console.log('\n[p4-spike-c] AC4 — Verdicts in pipeline-state.json; upstream authority ADR in decisions.md');

// T10 — pipeline-state.json spike-c entry with valid verdict
{
  if (!fs.existsSync(STATE_FILE)) {
    assert(false, 'T10: pipeline-state.json exists');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?c\b/i.test(s.id || s.spike || ''))
      : (spikes['spike-c'] || spikes['p4-spike-c'] || null);
    assert(!!entry, 'T10: pipeline-state.json contains a spike-c entry under phase4');
    if (entry) {
      assert(VALID_VERDICTS.includes(entry.verdict), `T10b: spike-c entry has a valid verdict (found: ${entry.verdict})`);
    }
  }
}

// T11 — decisions.md has upstream authority ARCH entry
{
  if (!fs.existsSync(DEC_FILE)) {
    assert(false, 'T11: decisions.md exists');
  } else {
    const dec = fs.readFileSync(DEC_FILE, 'utf8');
    const archEntryRe = /\*\*\d{4}-\d{2}-\d{2}\s*\|\s*ARCH\s*\|[^\n]*\n([\s\S]*?)(?=---\s*\n\*\*\d{4}|$)/g;
    const archEntries = [];
    let m;
    while ((m = archEntryRe.exec(dec)) !== null) archEntries.push(m[0]);
    // Accept entries mentioning spike-c OR upstream authority (the primary irreversible decision)
    const spikeEntry = archEntries.find(e => /spike.?c\b/i.test(e) || /upstream.?authorit/i.test(e));
    assert(!!spikeEntry, 'T11a: decisions.md contains an ARCH entry for Spike C / upstream authority');
    const block = spikeEntry || '';
    assert(/\*\*Decision\b|^Decision:/im.test(block),    'T11b: Spike C ARCH entry has a decision statement');
    assert(/Alternatives considered/i.test(block),       'T11c: Spike C ARCH entry has alternatives considered');
    assert(/\*\*Rationale\b|^Rationale:/im.test(block), 'T11d: Spike C ARCH entry has rationale');
    assert(/Revisit trigger/i.test(block),               'T11e: Spike C ARCH entry has revisit trigger');
  }
}

// ── AC5 — E2 story references Spike C ────────────────────────────────────────
console.log('\n[p4-spike-c] AC5 — E2 story (p4-dist-lockfile) references Spike C output as architecture input');

// T12 — p4-dist-lockfile.md references spike-c
{
  if (!fs.existsSync(E2_LOCKFILE)) {
    console.log('  - T12: p4-dist-lockfile.md not yet written — will pass after E2 story decomposition');
  } else {
    const content = fs.readFileSync(E2_LOCKFILE, 'utf8');
    assert(/spike-?c|spike_c|spike c/i.test(content), 'T12: p4-dist-lockfile references Spike C output');
  }
}

// ── NFR — MC-SEC-02 ───────────────────────────────────────────────────────────
console.log('\n[p4-spike-c] NFR — MC-SEC-02: No credentials in spike artefact');

// T-NFR1
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T-NFR1: spike artefact exists for credential scan');
  } else {
    const stripped = content.replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');
    const credPatterns = [
      /\bsk-[A-Za-z0-9]{20,}/,
      /\bghp_[A-Za-z0-9]{36}/,
      /\bBearer\s+[A-Za-z0-9+/=]{20,}/,
      /\btoken:\s*[A-Za-z0-9+/=_-]{20,}/i,
      /\bapi_key\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{20,}/i,
      /\bpassword\s*[:=]\s*["'][^"']{8,}/i,
    ];
    const found = credPatterns.filter(re => re.test(stripped));
    assert(found.length === 0, `T-NFR1: no credential-shaped strings outside code blocks (found: ${found.length})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-spike-c] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
