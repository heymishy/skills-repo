#!/usr/bin/env node
// check-p4-spike-a.js — test plan verification for p4-spike-a
// Covers T1–T12 (AC1–AC5) and T-NFR1 (MC-SEC-02)
// Tests FAIL before spike investigation artefact is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SPIKE_FILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-a-output.md');
const STATE_FILE = path.join(ROOT, '.github', 'pipeline-state.json');
const DEC_FILE   = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'decisions.md');

const E3_STORIES = [
  'p4-enf-package.md',
  'p4-enf-mcp.md',
];

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
  // Split on . ! ? followed by space or end-of-string; filter empty
  return (text.split(/[.!?](?:\s|$)/).filter(s => s.trim().length > 0)).length;
}

// ── AC1 tests ─────────────────────────────────────────────────────────────────
console.log('\n[p4-spike-a] AC1 — Spike output artefact exists with valid verdict + rationale');

// T1 — File exists
{
  const exists = fs.existsSync(SPIKE_FILE);
  assert(exists, 'T1: spike-a-output.md exists at declared path');
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
    // Find rationale section: text between verdict and next heading or end
    const rationaleMatch = content.match(/(?:rationale|explanation|why)[^\n]*\n([\s\S]*?)(?=^##|\Z)/im);
    const rationaleText = rationaleMatch
      ? rationaleMatch[1]
      : content.replace(/^#.*$/gm, '').replace(/^\|.*$/gm, ''); // fallback: strip headings and tables
    const count = sentenceCount(rationaleText.trim());
    assert(count >= 3, `T3: rationale has ≥3 sentences (found: ~${count})`);
  }
}

// ── AC2 tests — PROCEED path ──────────────────────────────────────────────────
console.log('\n[p4-spike-a] AC2 — PROCEED: interface defines all 5 governance operations');

const REQUIRED_OPERATIONS = [
  /skill.?resol/i,
  /hash.?verif/i,
  /gate.?eval/i,
  /state.?advanc/i,
  /trace.?writ/i,
];
const OP_LABELS = ['skill-resolution', 'hash-verification', 'gate-evaluation', 'state-advancement', 'trace-writing'];

// T4 — All 5 operations present when PROCEED
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  if (verdict !== 'PROCEED') {
    console.log(`  - T4–T5: skipped (verdict is ${verdict || 'absent'}, not PROCEED)`);
  } else {
    REQUIRED_OPERATIONS.forEach((re, i) => {
      assert(re.test(content), `T4: interface contains ${OP_LABELS[i]}`);
    });
  }
}

// T5 — Each operation has at least minimal signature detail
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  if (verdict !== 'PROCEED') {
    // already logged above
  } else {
    REQUIRED_OPERATIONS.forEach((re, i) => {
      const match = content.match(new RegExp(`(${OP_LABELS[i].replace('-', '.?')}[\\s\\S]{0,300})`, 'i'));
      const snippet = match ? match[1] : '';
      const hasDetail = /\(|=>|:\s*{|param|return|input|output|arg/i.test(snippet);
      assert(hasDetail, `T5: ${OP_LABELS[i]} has at least one parameter or return shape detail`);
    });
  }
}

// ── AC3 tests — REDESIGN path ─────────────────────────────────────────────────
console.log('\n[p4-spike-a] AC3 — REDESIGN: blocking constraint + minimum shared contract');

// T6 — Blocking constraint explicitly named
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  if (verdict !== 'REDESIGN') {
    console.log(`  - T6–T7: skipped (verdict is ${verdict || 'absent'}, not REDESIGN)`);
  } else {
    const hasConstraint = /blocking.?constraint|constraint.?blocking|cannot.?single.?package|incompatible|lifecycle.?differ/i.test(content);
    assert(hasConstraint, 'T6: blocking constraint section is present and names a specific technical reason');
  }
}

// T7 — Minimum shared contract includes skill-format and trace-schema
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  if (verdict !== 'REDESIGN') {
    // already logged above
  } else {
    const hasSkillFormat = /skill.?format/i.test(content);
    const hasTraceSchema = /trace.?schema/i.test(content);
    assert(hasSkillFormat, 'T7a: minimum shared contract includes skill-format');
    assert(hasTraceSchema, 'T7b: minimum shared contract includes trace-schema');
  }
}

// ── AC4 tests — pipeline-state.json + decisions.md ───────────────────────────
console.log('\n[p4-spike-a] AC4 — Verdict in pipeline-state.json and decisions.md');

// T8 — pipeline-state.json has spike-a record
{
  if (!fs.existsSync(STATE_FILE)) {
    assert(false, 'T8: pipeline-state.json exists');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?a/i.test(s.id || s.spike || ''))
      : (spikes['spike-a'] || spikes['p4-spike-a'] || null);
    assert(!!entry, 'T8: pipeline-state.json contains a spike-a entry under phase4');
    if (entry) {
      assert(VALID_VERDICTS.includes(entry.verdict), `T8b: spike-a entry has a valid verdict (found: ${entry.verdict})`);
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
      ? spikes.find(s => /spike-?a/i.test(s.id || s.spike || ''))
      : (spikes['spike-a'] || spikes['p4-spike-a'] || null);
    if (!entry) {
      assert(false, 'T9: spike-a entry absent in pipeline-state.json');
    } else {
      assert(entry.verdict === artefactVerdict, `T9: state verdict (${entry.verdict}) matches artefact verdict (${artefactVerdict})`);
    }
  }
}

// T10 — decisions.md has Spike A ADR entry with all 4 required fields
{
  if (!fs.existsSync(DEC_FILE)) {
    assert(false, 'T10: decisions.md exists');
  } else {
    const dec = fs.readFileSync(DEC_FILE, 'utf8');
    // Find entries that are specifically ARCH category and mention spike-a
    // Format: **YYYY-MM-DD | ARCH | source**
    const archEntryRe = /\*\*\d{4}-\d{2}-\d{2}\s*\|\s*ARCH\s*\|[^\n]*\n([\s\S]*?)(?=---\s*\n\*\*\d{4}|$)/g;
    const archEntries = [];
    let m;
    while ((m = archEntryRe.exec(dec)) !== null) archEntries.push(m[0]);
    const spikeAEntry = archEntries.find(e => /spike.?a\b/i.test(e));
    assert(!!spikeAEntry, 'T10a: decisions.md contains a Spike A ARCH entry (| ARCH | category, not RISK-ACCEPT)');
    const block = spikeAEntry || '';
    // Match **Decision:** or **Decision** or "Decision:" at line start
    assert(/\*\*Decision\b|^Decision:/im.test(block),       'T10b: Spike A ARCH entry has a decision statement');
    assert(/Alternatives considered/i.test(block),          'T10c: Spike A ARCH entry has alternatives considered');
    assert(/\*\*Rationale\b|^Rationale:/im.test(block),    'T10d: Spike A ARCH entry has rationale');
    assert(/Revisit trigger/i.test(block),                  'T10e: Spike A ARCH entry has revisit trigger');
  }
}

// ── AC5 tests — E3 stories reference Spike A ─────────────────────────────────
console.log('\n[p4-spike-a] AC5 — E3 stories reference Spike A output as architecture input');

E3_STORIES.forEach(storyFile => {
  const storyPath = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'stories', storyFile);
  const label     = storyFile.replace('.md', '');
  if (!fs.existsSync(storyPath)) {
    console.log(`  - T11/T12: ${label} not yet written — will pass after story decomposition`);
    return;
  }
  const content = fs.readFileSync(storyPath, 'utf8');
  const hasSpikeRef = /spike-?a|spike_a|spike a/i.test(content);
  assert(hasSpikeRef, `T${label === 'p4-enf-package' ? '11' : '12'}: ${label} references Spike A output`);
});

// ── NFR tests ─────────────────────────────────────────────────────────────────
console.log('\n[p4-spike-a] NFR — MC-SEC-02: No credentials in spike artefact');

// T-NFR1
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T-NFR1: spike artefact exists for credential scan');
  } else {
    // Strip fenced code blocks first to avoid false positives on intentional examples
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
    assert(found.length === 0, `T-NFR1: no credential-shaped strings found outside code blocks (found: ${found.length})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-spike-a] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
