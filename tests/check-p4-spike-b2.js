#!/usr/bin/env node
// check-p4-spike-b2.js — test plan verification for p4-spike-b2
// Covers T1–T12 (AC1–AC5) and T-NFR1, T-NFR2 (MC-SEC-02 + C1)
// Tests FAIL before spike investigation artefact is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SPIKE_FILE = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-b2-output.md');
const STATE_FILE = path.join(ROOT, '.github', 'pipeline-state.json');
const DEC_FILE   = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'decisions.md');
const ENF_CLI    = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'stories', 'p4-enf-cli.md');

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

// ── AC1 — Spike output exists; records Craig's artefacts as inputs ────────────
console.log('\n[p4-spike-b2] AC1 — Spike output exists with verdict and Craig\'s artefacts referenced as inputs');

// T1 — File exists
{
  const exists = fs.existsSync(SPIKE_FILE);
  assert(exists, 'T1: spike-b2-output.md exists at declared path');
}

// T2 — Contains valid verdict
{
  const content = readSpike();
  const verdict = extractVerdict(content);
  assert(VALID_VERDICTS.includes(verdict), `T2: verdict is one of PROCEED/REDESIGN/DEFER/REJECT (found: ${verdict})`);
}

// T3 — References Craig's input artefacts (discovery path and at least one reference document)
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T3: Craig\'s artefacts referenced (skipped — file missing)');
  } else {
    const hasCraigPath = /artefacts\/2026-04-18-cli-approach/i.test(content);
    const hasRefDoc    = /\b(012|013)\b/.test(content);
    assert(hasCraigPath, 'T3a: artefact references artefacts/2026-04-18-cli-approach/ path');
    assert(hasRefDoc,    'T3b: artefact references at least one of Craig\'s reference documents (012 or 013)');
  }
}

// ── AC2 — P1–P4 fidelity properties stated for CLI ───────────────────────────
console.log('\n[p4-spike-b2] AC2 — P1–P4 fidelity properties stated as SATISFIED/PARTIAL/NOT MET for CLI');

// T4 — All four properties stated
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T4: P1-P4 fidelity check (skipped — file missing)');
  } else {
    ['P1', 'P2', 'P3', 'P4'].forEach(p => {
      const re = new RegExp(`${p}[^\\n]{0,200}(SATISFIED|PARTIAL|NOT MET)`, 'i');
      assert(re.test(content), `T4: ${p} has an explicit SATISFIED/PARTIAL/NOT MET verdict`);
    });
  }
}

// ── AC3 — Assumption A2 validated with outcome ────────────────────────────────
console.log('\n[p4-spike-b2] AC3 — Assumption A2 (assurance gate accepts CLI trace) explicitly validated');

// T5 — A2 validated with outcome
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T5: A2 validation outcome (skipped — file missing)');
  } else {
    const hasA2     = /\bA2\b|Assumption A2|assurance.?gate/i.test(content);
    const hasResult = /accepted|required substantial modification|schema delta|minor|no modification|REDESIGN trigger/i.test(content);
    assert(hasA2,     'T5a: artefact contains Assumption A2 or assurance gate reference');
    assert(hasResult, 'T5b: A2 outcome explicitly stated (accepted/required modification/schema delta)');
  }
}

// T6 — If substantial modification required, schema delta described
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T6: A2 schema delta check (skipped — file missing)');
  } else {
    const needsDelta = /required substantial modification|REDESIGN trigger|substantial.?modification/i.test(content);
    if (!needsDelta) {
      console.log('  - T6: skipped (A2 did not require substantial modification per artefact)');
      passed++; // pass as not-applicable
    } else {
      // At least one specific field, schema key, or structure change mentioned
      const hasSpecific = /schema.?field|field name|structure change|specific.?delta|new.?field|updated.?field|\bfield\b[^\n]{0,60}:/i.test(content);
      assert(hasSpecific, 'T6: schema delta describes at least one specific field or structural change');
    }
  }
}

// ── AC4 — pipeline-state.json + decisions.md ─────────────────────────────────
console.log('\n[p4-spike-b2] AC4 — Verdict in pipeline-state.json and mechanism-selection ADR in decisions.md');

// T7 — pipeline-state.json spike-b2 entry with valid verdict
{
  if (!fs.existsSync(STATE_FILE)) {
    assert(false, 'T7: pipeline-state.json exists');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?b2/i.test(s.id || s.spike || ''))
      : (spikes['spike-b2'] || spikes['p4-spike-b2'] || null);
    assert(!!entry, 'T7: pipeline-state.json contains a spike-b2 entry under phase4');
    if (entry) {
      assert(VALID_VERDICTS.includes(entry.verdict), `T7b: spike-b2 entry has a valid verdict (found: ${entry.verdict})`);
    }
  }
}

// T8 — pipeline-state.json verdict matches artefact verdict
{
  const spikeContent = readSpike();
  const artefactVerdict = extractVerdict(spikeContent);
  if (!fs.existsSync(STATE_FILE) || !artefactVerdict) {
    assert(false, 'T8: pipeline-state.json verdict matches artefact verdict (preconditions not met)');
  } else {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const phase4 = state.phase4 || {};
    const spikes = phase4.spikes || phase4.spikeRecords || {};
    const entry = Array.isArray(spikes)
      ? spikes.find(s => /spike-?b2/i.test(s.id || s.spike || ''))
      : (spikes['spike-b2'] || spikes['p4-spike-b2'] || null);
    if (!entry) {
      assert(false, 'T8: spike-b2 entry absent in pipeline-state.json');
    } else {
      assert(entry.verdict === artefactVerdict, `T8: state verdict (${entry.verdict}) matches artefact verdict (${artefactVerdict})`);
    }
  }
}

// T9 — decisions.md has Spike B2 ARCH entry (mechanism-selection ADR for CLI)
{
  if (!fs.existsSync(DEC_FILE)) {
    assert(false, 'T9: decisions.md exists');
  } else {
    const dec = fs.readFileSync(DEC_FILE, 'utf8');
    const archEntryRe = /\*\*\d{4}-\d{2}-\d{2}\s*\|\s*ARCH\s*\|[^\n]*\n([\s\S]*?)(?=---\s*\n\*\*\d{4}|$)/g;
    const archEntries = [];
    let m;
    while ((m = archEntryRe.exec(dec)) !== null) archEntries.push(m[0]);
    // Must be the mechanism-selection ADR for CLI — requires spike-b2 AND CLI/mechanism content.
    // Avoids false-positive on existing C11 ADR entry that mentions "Spike B2" in passing but is
    // about ADR gate timing at consumer shipment, not CLI mechanism selection.
    const spikeEntry = archEntries.find(e =>
      /spike.?b2\b/i.test(e) &&
      /cli.{0,200}mechanism|mechanism.{0,200}cli|regulated.{0,100}cli|cli.{0,100}surface|cli.{0,100}verdict|cli-for/i.test(e)
    );
    assert(!!spikeEntry, 'T9a: decisions.md contains a Spike B2 ARCH entry');
    const block = spikeEntry || '';
    assert(/\*\*Decision\b|^Decision:/im.test(block),       'T9b: Spike B2 ARCH entry has a decision statement');
    assert(/Alternatives considered/i.test(block),          'T9c: Spike B2 ARCH entry has alternatives considered');
    assert(/\*\*Rationale\b|^Rationale:/im.test(block),    'T9d: Spike B2 ARCH entry has rationale');
    assert(/Revisit trigger/i.test(block),                  'T9e: Spike B2 ARCH entry has revisit trigger');
  }
}

// ── AC5 — p4.enf-cli references Spike A, Spike B2, and Craig's artefacts ─────
console.log('\n[p4-spike-b2] AC5 — p4.enf-cli references Spike A, Spike B2, and Craig\'s artefacts as source');

// T10 — p4.enf-cli references Spike A
{
  if (!fs.existsSync(ENF_CLI)) {
    console.log('  - T10: p4-enf-cli.md not yet written — will pass after E3 story decomposition');
  } else {
    const content = fs.readFileSync(ENF_CLI, 'utf8');
    assert(/spike-?a|spike_a|spike a/i.test(content), 'T10: p4-enf-cli references Spike A output');
  }
}

// T11 — p4.enf-cli references Spike B2
{
  if (!fs.existsSync(ENF_CLI)) {
    console.log('  - T11: p4-enf-cli.md not yet written — will pass after E3 story decomposition');
  } else {
    const content = fs.readFileSync(ENF_CLI, 'utf8');
    assert(/spike-?b2|spike_b2|spike b2/i.test(content), 'T11: p4-enf-cli references Spike B2 output');
  }
}

// T12 — p4.enf-cli references Craig's artefacts as source
{
  if (!fs.existsSync(ENF_CLI)) {
    console.log('  - T12: p4-enf-cli.md not yet written — will pass after E3 story decomposition');
  } else {
    const content = fs.readFileSync(ENF_CLI, 'utf8');
    const hasCraig = /2026-04-18-cli-approach|craig|PR.?#?155/i.test(content);
    assert(hasCraig, 'T12: p4-enf-cli references Craig\'s artefacts (2026-04-18-cli-approach or Craig or PR #155)');
  }
}

// ── NFR — MC-SEC-02 + C1 ─────────────────────────────────────────────────────
console.log('\n[p4-spike-b2] NFR — MC-SEC-02 and C1 compliance');

// T-NFR1 — No credentials in spike-b2-output.md
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

// T-NFR2 — C1 compliance (no SKILL.md/POLICY.md copied to consumer repo) explicitly verified
{
  const content = readSpike();
  if (!content) {
    assert(false, 'T-NFR2: C1 compliance verification (skipped — file missing)');
  } else {
    const hasC1 = /\bC1\b/.test(content);
    const hasOutcome = /non-fork|no copy|SKILL\.md not present|POLICY\.md not present|sidecar does not copy|not copied|no SKILL|no POLICY/i.test(content);
    assert(hasC1,     'T-NFR2a: artefact contains C1 constraint reference');
    assert(hasOutcome, 'T-NFR2b: C1 verification result stated (no copy of SKILL.md or POLICY.md confirmed)');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-spike-b2] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
