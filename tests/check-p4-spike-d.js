#!/usr/bin/env node
// check-p4-spike-d.js — test plan verification for p4-spike-d
// Covers T1–T12 (AC1–AC5) and T-NFR1 (MC-SEC-02)
// Tests FAIL before spike investigation artefact is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SPIKE_FILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-d-output.md');
const STATE_FILE = path.join(ROOT, '.github', 'pipeline-state.json');
const DEC_FILE   = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'decisions.md');
// E4 story spot-check — nta-surface depends directly on a PROCEED verdict from Spike D
const E4_SURFACE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'stories', 'p4-nta-surface.md');

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

// ── AC1 — Spike output exists with structured turn-by-turn log (≥3 turns) ────
console.log('\n[p4-spike-d] AC1 — Spike output exists with valid verdict and structured turn-by-turn log (≥3 turns)');

// T1 — File exists
{
  const exists = fs.existsSync(SPIKE_FILE);
  assert(exists, 'T1: spike-d-output.md exists at declared path');
}

// T2 — Contains valid verdict
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  assert(VALID_VERDICTS.includes(verdict), `T2: verdict is one of PROCEED/REDESIGN/DEFER/REJECT (found: ${verdict})`);
}

// T3 — Turn-by-turn test log has ≥3 turns
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T3: turn-by-turn log has ≥3 turns (skipped — file missing)');
  } else {
    // Accept numbered turns: "Turn 1", "Turn 2", "1.", "2.", "Turn:", or table rows with "|" per turn
    const turnMatches = content.match(/(?:Turn\s*\d+|^\d+\.\s|\|\s*Turn|\|\s*\d+\s*\|)/gim) || [];
    // Also accept simple numbered lists (1. 2. 3. in sequence)
    const numberedList = content.match(/^[0-9]+\.\s/gm) || [];
    const turnCount = Math.max(turnMatches.length, numberedList.length);
    assert(turnCount >= 3, `T3: turn-by-turn log has ≥3 labelled turns (found: ~${turnCount})`);
  }
}

// T4 — Turn log entries have structured fields
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T4: turn log entries are structured (skipped — file missing)');
  } else {
    // At least one turn entry should contain: a question or prompt, and an answer/state outcome
    const hasQuestion = /question|prompt|asked|presented/i.test(content);
    const hasOutcome  = /answered|responded|advance|state.?advanc|bot.?advanc|result|outcome/i.test(content);
    assert(hasQuestion, 'T4a: turn log records questions presented');
    assert(hasOutcome,  'T4b: turn log records outcomes or state advance per turn');
  }
}

// ── AC2 — C11 compliance explicitly stated ────────────────────────────────────
console.log('\n[p4-spike-d] AC2 — C11 compliance explicitly stated; if violated, runtime requirement and cost recorded');

// T5 — C11 compliance outcome stated
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T5: C11 compliance stated (skipped — file missing)');
  } else {
    const hasC11 = /\bC11\b/.test(content);
    const hasOutcome = /satisfied|compliant|no persistent|violated|non-compliant|persistent.?process.?required|persistent.?endpoint/i.test(content);
    assert(hasC11,     'T5a: artefact contains C11 constraint reference');
    assert(hasOutcome, 'T5b: C11 compliance outcome explicitly stated (satisfied / violated / persistent process)');
  }
}

// T6 — If C11 violated, specific runtime requirement + cost + REDESIGN/DEFER verdict
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T6: C11 violation details (skipped — file missing)');
  } else {
    const isViolated = /C11[^\n]*violated|persistent.?process.?required|persistent.?endpoint.?required/i.test(content);
    if (!isViolated) {
      console.log('  - T6: skipped (C11 not violated per artefact)');
      passed++; // pass as not-applicable
    } else {
      const hasRuntime  = /bot.?framework|azure.?bot.?service|endpoint|hosting|long.?running/i.test(content);
      const hasCost     = /cost|hosting.?fee|per.?month|estimate|\$/i.test(content);
      const hasVerdict  = /REDESIGN|DEFER/.test(content);
      assert(hasRuntime,  'T6a: C11 violation names the specific runtime requirement');
      assert(hasCost,     'T6b: C11 violation records estimated hosting cost');
      assert(hasVerdict,  'T6c: C11 violation results in REDESIGN or DEFER verdict');
    }
  }
}

// ── AC3 — C7 violation count recorded ────────────────────────────────────────
console.log('\n[p4-spike-d] AC3 — C7 violation count recorded with definition applied');

// T7 — C7 violation count present
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T7: C7 violation count (skipped — file missing)');
  } else {
    // Accept: "C7 violations: 0", "C7 violation count: N", "violations: N", "0 C7 violations", "N C7 violations"
    const hasCount = /\bC7.{0,30}violation.{0,20}\d|\bviolation.{0,20}\bC7|\bviolations:\s*\d/i.test(content);
    assert(hasCount, 'T7: C7 violation count explicitly stated with a numeric value (including 0)');
  }
}

// T8 — Both C7 violation types referenced
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T8: C7 violation definition applied (skipped — file missing)');
  } else {
    // Type (a): multiple questions in a single turn
    const hasTypeA = /multiple.?question|more than one.?question|simultaneous.?question/i.test(content);
    // Type (b): advancing state without answering
    const hasTypeB = /advance.{0,60}without.{0,30}answer|bypass.{0,30}gate|skip.{0,30}answer|state.{0,60}without.{0,30}answer/i.test(content);
    assert(hasTypeA || hasTypeB, 'T8: at least one C7 violation type defined (multiple questions OR advance-without-answer)');
  }
}

// ── AC4 — Minimum signal evaluated as PROCEED or DEFER ───────────────────────
console.log('\n[p4-spike-d] AC4 — Minimum signal (3 consecutive C7-compliant turns) evaluated as PROCEED or DEFER');

// T9 — Minimum signal evaluation stated
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T9: minimum signal evaluation (skipped — file missing)');
  } else {
    const hasMinSignal = /minimum.?signal|3 consecutive|three consecutive|C7.?compliant.{0,20}turn/i.test(content);
    const hasVerdict   = /\bPROCEED\b|\bDEFER\b/.test(content);
    assert(hasMinSignal, 'T9a: minimum signal evaluation is present (minimum signal / 3 consecutive / C7-compliant turns)');
    assert(hasVerdict,   'T9b: PROCEED or DEFER verdict stated');
  }
}

// T10 — Minimum signal verdict is consistent with overall verdict
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T10: verdict consistency check (skipped — file missing)');
  } else {
    const overallVerdict = extractVerdict(content);
    // If minimum signal says DEFER, overall must not be PROCEED
    const minSignalDefer = /minimum.?signal.{0,100}DEFER|minimum.?signal.{0,100}not.?met|minimum.?signal.{0,100}fail/i.test(content);
    if (minSignalDefer) {
      assert(overallVerdict !== 'PROCEED', `T10: if minimum signal DEFER, overall verdict should not be PROCEED (found: ${overallVerdict})`);
    } else {
      // Minimum signal PROCEED or not explicitly DEFER — consistency passes trivially
      console.log(`  \u2713 T10: verdict consistency check (minimum signal ≠ DEFER; overall verdict ${overallVerdict})`);
      passed++;
    }
  }
}

// ── AC5 — Verdict in pipeline-state.json + ADR in decisions.md ───────────────
console.log('\n[p4-spike-d] AC5 — Verdict in pipeline-state.json and ADR in decisions.md with C11 and C7 coverage');

// T11 — pipeline-state.json spike-d entry with valid verdict
{
  if (!fs.existsSync(STATE_FILE)) {
    assert(false, 'T11: pipeline-state.json exists');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?d\b/i.test(s.id || s.spike || ''))
      : (spikes['spike-d'] || spikes['p4-spike-d'] || null);
    assert(!!entry, 'T11: pipeline-state.json contains a spike-d entry under phase4');
    if (entry) {
      assert(VALID_VERDICTS.includes(entry.verdict), `T11b: spike-d entry has a valid verdict (found: ${entry.verdict})`);
    }
  }
}

// T12 — decisions.md has Spike D / Teams ARCH entry with C11 finding and C7 count
{
  if (!fs.existsSync(DEC_FILE)) {
    assert(false, 'T12: decisions.md exists');
  } else {
    const dec = fs.readFileSync(DEC_FILE, 'utf8');
    const archEntryRe = /\*\*\d{4}-\d{2}-\d{2}\s*\|\s*ARCH\s*\|[^\n]*\n([\s\S]*?)(?=---\s*\n\*\*\d{4}|$)/g;
    const archEntries = [];
    let m;
    while ((m = archEntryRe.exec(dec)) !== null) archEntries.push(m[0]);
    // Accept entries mentioning spike-d or teams (the surface being investigated)
    const spikeEntry = archEntries.find(e => /spike.?d\b/i.test(e) || /\bteams\b/i.test(e));
    assert(!!spikeEntry, 'T12a: decisions.md contains an ARCH entry for Spike D / Teams surface');
    const block = spikeEntry || '';
    assert(/\*\*Decision\b|^Decision:/im.test(block),    'T12b: Spike D ARCH entry has a decision statement');
    assert(/C11/i.test(block),                           'T12c: Spike D ARCH entry covers C11 compliance finding');
    assert(/C7/i.test(block),                            'T12d: Spike D ARCH entry covers C7 violation count');
    assert(/Revisit trigger/i.test(block),               'T12e: Spike D ARCH entry has revisit trigger');
  }
}

// ── NFR — MC-SEC-02 ───────────────────────────────────────────────────────────
console.log('\n[p4-spike-d] NFR — MC-SEC-02: No M365/Azure credentials in spike artefact');

// T-NFR1
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T-NFR1: spike artefact exists for credential scan');
  } else {
    const stripped = content.replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');
    const credPatterns = [
      // UUID-shaped tenant IDs (hex blocks separated by dashes)
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
      /\btenantId\s*[:=]\s*["'][^"']{8,}/i,
      /\bclientSecret\s*[:=]\s*["'][^"']{8,}/i,
      /\bbot_framework\s*[:=]\s*["'][^"']{4,}/i,
      /\bAZURE_BOT[^\s]*\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{10,}/i,
      /\bBearer\s+[A-Za-z0-9+/=]{20,}/,
      /\btoken:\s*[A-Za-z0-9+/=_-]{20,}/i,
      /\bpassword\s*[:=]\s*["'][^"']{8,}/i,
    ];
    const found = credPatterns.filter(re => re.test(stripped));
    assert(found.length === 0, `T-NFR1: no M365/Azure credential-shaped strings found outside code blocks (found: ${found.length})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-spike-d] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
