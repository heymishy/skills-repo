#!/usr/bin/env node
// check-p4-spike-b1.js — test plan verification for p4-spike-b1
// Covers T1–T12 (AC1–AC5) and T-NFR1 (MC-SEC-02)
// Tests FAIL before spike investigation artefact is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SPIKE_FILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-b1-output.md');
const STATE_FILE = path.join(ROOT, '.github', 'pipeline-state.json');
const DEC_FILE   = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'decisions.md');
const ENF_MCP    = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'stories', 'p4-enf-mcp.md');

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

function sentenceCount(text) {
  return (text.split(/[.!?](?:\s|$)/).filter(s => s.trim().length > 0)).length;
}

// ── AC1 — Spike output artefact exists with valid verdict + rationale + observable test evidence ──
console.log('\n[p4-spike-b1] AC1 — Spike output exists with verdict, rationale, and hash-verifiable test evidence');

// T1 — File exists
{
  const exists = fs.existsSync(SPIKE_FILE);
  assert(exists, 'T1: spike-b1-output.md exists at declared path');
}

// T2 — Contains valid verdict
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  assert(VALID_VERDICTS.includes(verdict), `T2: verdict is one of PROCEED/REDESIGN/DEFER/REJECT (found: ${verdict})`);
}

// T3 — Rationale has at least 3 sentences
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T3: rationale has ≥3 sentences (skipped — file missing)');
  } else {
    const rationaleMatch = content.match(/(?:rationale|explanation|why)[^\n]*\n([\s\S]*?)(?=^##|\Z)/im);
    const rationaleText = rationaleMatch
      ? rationaleMatch[1]
      : content.replace(/^#.*$/gm, '').replace(/^\|.*$/gm, '');
    const count = sentenceCount(rationaleText.trim());
    assert(count >= 3, `T3: rationale has ≥3 sentences (found: ~${count})`);
  }
}

// T4 — Evidence of at least 1 hash-verifiable trace entry
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T4: hash-verifiable trace evidence (skipped — file missing)');
  } else {
    const hasHash    = /\bhash\b/i.test(content);
    const hasTrace   = /\btrace\b/i.test(content);
    const hasEvidence = /SATISFIED|PARTIAL|invocation|test run|observed|test result/i.test(content);
    assert(hasHash,     'T4a: artefact contains "hash" (hash-verifiable evidence)');
    assert(hasTrace,    'T4b: artefact contains "trace" (trace entry reference)');
    assert(hasEvidence, 'T4c: artefact records an observable result (SATISFIED/PARTIAL/invocation/test run)');
  }
}

// ── AC2 — C11 compliance status explicitly stated ─────────────────────────────
console.log('\n[p4-spike-b1] AC2 — C11 compliance explicitly stated; mitigation if violated');

// T5 — C11 compliance status stated
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T5: C11 compliance stated (skipped — file missing)');
  } else {
    const hasC11 = /\bC11\b/.test(content);
    const hasOutcome = /satisfied|compliant|no persistent|violated|non-compliant|persistent process required/i.test(content);
    assert(hasC11,     'T5a: artefact contains C11 constraint reference');
    assert(hasOutcome, 'T5b: C11 compliance outcome explicitly stated (satisfied/violated/no persistent process)');
  }
}

// T6 — If C11 violated, mitigation or REDESIGN/DEFER verdict present
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T6: C11 mitigation check (skipped — file missing)');
  } else {
    const isViolated = /C11[^\n]*violated|C11[^\n]*non-compliant|persistent process required/i.test(content);
    if (!isViolated) {
      console.log('  - T6: skipped (C11 not violated per artefact)');
      passed++; // pass as not-applicable
    } else {
      const hasMitigation = /sidecar|vs code extension|redesign|defer|mitigation/i.test(content);
      assert(hasMitigation, 'T6: C11 violation — mitigation proposed or verdict is REDESIGN/DEFER');
    }
  }
}

// ── AC3 — P1–P4 fidelity properties all stated ───────────────────────────────
console.log('\n[p4-spike-b1] AC3 — P1–P4 fidelity properties stated as SATISFIED/PARTIAL/NOT MET');

// T7 — All four properties present with verdict
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T7: P1-P4 fidelity check (skipped — file missing)');
  } else {
    ['P1', 'P2', 'P3', 'P4'].forEach(p => {
      const re = new RegExp(`${p}[^\\n]{0,200}(SATISFIED|PARTIAL|NOT MET)`, 'i');
      assert(re.test(content), `T7: ${p} has an explicit SATISFIED/PARTIAL/NOT MET verdict`);
    });
  }
}

// ── AC4 — pipeline-state.json + decisions.md ─────────────────────────────────
console.log('\n[p4-spike-b1] AC4 — Verdict in pipeline-state.json and decisions.md ARCH entry');

// T8 — pipeline-state.json spike-b1 entry with valid verdict
{
  if (!fs.existsSync(STATE_FILE)) {
    assert(false, 'T8: pipeline-state.json exists');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?b1/i.test(s.id || s.spike || ''))
      : (spikes['spike-b1'] || spikes['p4-spike-b1'] || null);
    assert(!!entry, 'T8: pipeline-state.json contains a spike-b1 entry under phase4');
    if (entry) {
      assert(VALID_VERDICTS.includes(entry.verdict), `T8b: spike-b1 entry has a valid verdict (found: ${entry.verdict})`);
    }
  }
}

// T9 — pipeline-state.json verdict matches artefact verdict
{
  const spikeContent = readSpike();
  const artefactVerdict = extractVerdict(spikeContent);
  if (!fs.existsSync(STATE_FILE) || !artefactVerdict) {
    assert(false, 'T9: pipeline-state.json verdict matches artefact verdict (preconditions not met)');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?b1/i.test(s.id || s.spike || ''))
      : (spikes['spike-b1'] || spikes['p4-spike-b1'] || null);
    if (!entry) {
      assert(false, 'T9: spike-b1 entry absent in pipeline-state.json');
    } else {
      assert(entry.verdict === artefactVerdict, `T9: state verdict (${entry.verdict}) matches artefact verdict (${artefactVerdict})`);
    }
  }
}

// T10 — decisions.md has Spike B1 ARCH entry with all 4 required fields
{
  if (!fs.existsSync(DEC_FILE)) {
    assert(false, 'T10: decisions.md exists');
  } else {
    const dec = fs.readFileSync(DEC_FILE, 'utf8');
    const archEntryRe = /\*\*\d{4}-\d{2}-\d{2}\s*\|\s*ARCH\s*\|[^\n]*\n([\s\S]*?)(?=---\s*\n\*\*\d{4}|$)/g;
    const archEntries = [];
    let m;
    while ((m = archEntryRe.exec(dec)) !== null) archEntries.push(m[0]);
    const spikeEntry = archEntries.find(e => /spike.?b1\b/i.test(e));
    assert(!!spikeEntry, 'T10a: decisions.md contains a Spike B1 ARCH entry');
    const block = spikeEntry || '';
    assert(/\*\*Decision\b|^Decision:/im.test(block),       'T10b: Spike B1 ARCH entry has a decision statement');
    assert(/Alternatives considered/i.test(block),          'T10c: Spike B1 ARCH entry has alternatives considered');
    assert(/\*\*Rationale\b|^Rationale:/im.test(block),    'T10d: Spike B1 ARCH entry has rationale');
    assert(/Revisit trigger/i.test(block),                  'T10e: Spike B1 ARCH entry has revisit trigger');
  }
}

// ── AC5 — p4.enf-mcp references Spike A and Spike B1 ────────────────────────
console.log('\n[p4-spike-b1] AC5 — p4.enf-mcp references both Spike A and Spike B1 output');

// T11 — p4.enf-mcp references Spike A
{
  if (!fs.existsSync(ENF_MCP)) {
    console.log('  - T11: p4-enf-mcp.md not yet written — will pass after E3 story decomposition');
  } else {
    const content = fs.readFileSync(ENF_MCP, 'utf8');
    assert(/spike-?a|spike_a|spike a/i.test(content), 'T11: p4-enf-mcp references Spike A output');
  }
}

// T12 — p4.enf-mcp references Spike B1
{
  if (!fs.existsSync(ENF_MCP)) {
    console.log('  - T12: p4-enf-mcp.md not yet written — will pass after E3 story decomposition');
  } else {
    const content = fs.readFileSync(ENF_MCP, 'utf8');
    assert(/spike-?b1|spike_b1|spike b1/i.test(content), 'T12: p4-enf-mcp references Spike B1 output');
  }
}

// ── NFR — MC-SEC-02 ───────────────────────────────────────────────────────────
console.log('\n[p4-spike-b1] NFR — MC-SEC-02: No credentials in spike artefact');

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
      /\bclientSecret\s*[:=]\s*["'][^"']{8,}/i,
    ];
    const found = credPatterns.filter(re => re.test(stripped));
    assert(found.length === 0, `T-NFR1: no credential-shaped strings found outside code blocks (found: ${found.length})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-spike-b1] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
