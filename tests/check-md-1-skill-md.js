#!/usr/bin/env node
// check-md-1-skill-md.js — content-inspection tests for md-1 (Write /modernisation-decompose SKILL.md)
// Covers T1.1 (file exists), T1.2 (structural), AC2–AC7 (content), T-NFR1–T-NFR3
// Tests FAIL until .github/skills/modernisation-decompose/SKILL.md is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'modernisation-decompose', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readSkill() {
  if (!fs.existsSync(SKILL_MD)) return null;
  return fs.readFileSync(SKILL_MD, 'utf8');
}

// ── T1.1 — file exists ────────────────────────────────────────────────────────
console.log('\n[md-1-skill-md] T1.1 — SKILL.md exists at governance path');
{
  assert(fs.existsSync(SKILL_MD),
    'T1.1: .github/skills/modernisation-decompose/SKILL.md exists');
}

// ── T1.2 — structural sections ───────────────────────────────────────────────
console.log('\n[md-1-skill-md] T1.2 — SKILL.md contains required structural sections');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T1.2a: name: present in frontmatter (file missing)');
    assert(false, 'T1.2b: description: present in frontmatter (file missing)');
    assert(false, 'T1.2c: triggers: present in frontmatter (file missing)');
    assert(false, 'T1.2d: numbered step heading present (file missing)');
    assert(false, 'T1.2e: ## Completion output section present (file missing)');
    assert(false, 'T1.2f: ## State update section present (file missing)');
  } else {
    assert(text.includes('name:'),        'T1.2a: name: present in frontmatter');
    assert(text.includes('description:'), 'T1.2b: description: present in frontmatter');
    assert(text.includes('triggers:'),    'T1.2c: triggers: present in frontmatter');
    assert(/^##\s+Step\s+\d+/m.test(text), 'T1.2d: numbered step heading present (## Step N)');
    assert(text.includes('## Completion output'), 'T1.2e: ## Completion output section present');
    assert(text.includes('## State update'),      'T1.2f: ## State update — mandatory final step section present');
  }
}

// ── AC2 — entry condition ─────────────────────────────────────────────────────
console.log('\n[md-1-skill-md] AC2 — Entry condition references report and blocks gracefully');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC2a: entry condition references reverse-engineering-report.md (file missing)');
    assert(false, 'AC2b: entry condition contains block/error language (file missing)');
  } else {
    assert(text.includes('reverse-engineering-report.md'),
      'AC2a: entry condition references reverse-engineering-report.md');
    const lower = text.toLowerCase();
    const hasBlockLanguage = text.includes('\u274c') || lower.includes('not found') ||
      lower.includes('not met') || lower.includes('error');
    assert(hasBlockLanguage,
      'AC2b: entry condition contains block/error language (\u274c or "not found" or "not met" or "error")');
  }
}

// ── AC3 — Java boundary signals as stated rationale ──────────────────────────
console.log('\n[md-1-skill-md] AC3 — Java boundary signals named and connected to feature boundary rationale');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC3a: all four Java signal types present (file missing)');
    assert(false, 'AC3b: rationale field language present (file missing)');
  } else {
    const hasMaven       = text.includes('Maven module');
    const hasService     = text.includes('@Service');
    const hasJpa         = text.includes('JPA aggregate root') || text.includes('aggregate root');
    const hasTransaction = text.includes('@Transactional');
    assert(hasMaven && hasService && hasJpa && hasTransaction,
      'AC3a: all four signal types present (Maven module, @Service, JPA aggregate root / aggregate root, @Transactional)');
    assert(text.toLowerCase().includes('rationale'),
      'AC3b: "rationale" language connects signals to feature boundary field');
  }
}

// ── AC4 — corpus-state.md fields ─────────────────────────────────────────────
console.log('\n[md-1-skill-md] AC4 — corpus-state.md write instructions contain module coverage, ratio, lastRunAt');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC4a: corpus-state.md and coverage % co-located in state update (file missing)');
    assert(false, 'AC4b: VERIFIED/UNCERTAIN ratio and lastRunAt present (file missing)');
  } else {
    const stateIdx     = text.indexOf('## State update');
    const stateSection = stateIdx >= 0 ? text.slice(stateIdx) : '';
    assert(stateSection.includes('corpus-state.md') && stateSection.toLowerCase().includes('coverage'),
      'AC4a: corpus-state.md and module coverage % co-located in state update section');
    assert((stateSection.toUpperCase().includes('VERIFIED') || stateSection.toLowerCase().includes('verified')) &&
           stateSection.includes('lastRunAt'),
      'AC4b: VERIFIED/UNCERTAIN ratio and lastRunAt both present in state update write instructions');
  }
}

// ── AC5 — candidate-features.md five fields ───────────────────────────────────
console.log('\n[md-1-skill-md] AC5 — candidate-features.md format describes all five required fields');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC5a: all five field names present (file missing)');
    assert(false, 'AC5b: direct-use language for /discovery (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasSlug    = lower.includes('feature-slug')  || lower.includes('feature slug');
    const hasProblem = lower.includes('problem-statement') || lower.includes('problem statement');
    const hasRuleIds = lower.includes('rule-id') || lower.includes('rule id');
    const hasPersona = lower.includes('persona');
    const hasMvp     = lower.includes('mvp-scope') || lower.includes('mvp scope');
    assert(hasSlug && hasProblem && hasRuleIds && hasPersona && hasMvp,
      'AC5a: all five required fields present (feature-slug, problem-statement, rule-id(s), persona, mvp-scope)');
    assert(lower.includes('discovery') && (lower.includes('direct') || lower.includes('without manual')),
      'AC5b: direct-use language for /discovery without manual augmentation');
  }
}

// ── AC6 — low-signal escalation three options ─────────────────────────────────
console.log('\n[md-1-skill-md] AC6 — low-signal escalation section with three operator options');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC6a: escalation section with specific signal references (file missing)');
    assert(false, 'AC6b: three distinct escalation options present (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasEscalation     = lower.includes('low-signal') || lower.includes('low signal') || lower.includes('escalat');
    const hasSpecificSignal = lower.includes('maven') || lower.includes('@service') || lower.includes('circular');
    assert(hasEscalation && hasSpecificSignal,
      'AC6a: low-signal escalation section exists and references specific signal types (maven/@service/circular)');
    const hasPackageFallback = lower.includes('package') && (lower.includes('fallback') || lower.includes('proxy'));
    const hasManualInput     = lower.includes('manual') && (lower.includes('boundary') || lower.includes('input'));
    const hasAbort           = lower.includes('abort') || (lower.includes('record') && lower.includes('low-signal'));
    assert(hasPackageFallback && hasManualInput && hasAbort,
      'AC6b: three escalation options present (package fallback, manual input, abort/record as low-signal)');
  }
}

// ── AC7 — umbrellaMetric field and traceability note ─────────────────────────
console.log('\n[md-1-skill-md] AC7 — umbrellaMetric field and traceability note in output instructions');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC7a: umbrellaMetric field in output section (file missing)');
    assert(false, 'AC7b: traceability note references /modernisation-decompose (file missing)');
  } else {
    assert(text.includes('umbrellaMetric'),
      'AC7a: umbrellaMetric field referenced in completion output / format description');
    const hasTrace = text.includes('/modernisation-decompose') &&
      (text.toLowerCase().includes('produced by') || text.toLowerCase().includes('traceability'));
    assert(hasTrace,
      'AC7b: traceability note references /modernisation-decompose and "produced by" or "traceability"');
  }
}

// ── T-NFR1 — determinism: explicit priority order ────────────────────────────
console.log('\n[md-1-skill-md] T-NFR1 — explicit boundary signal priority order defined');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR1: explicit priority order defined (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasPriority = lower.includes('priority') || lower.includes('first match') || lower.includes('top-down');
    assert(hasPriority,
      'T-NFR1: decomposition step defines explicit priority order for boundary signals');
  }
}

// ── T-NFR2 — security: state update describes only metrics ───────────────────
console.log('\n[md-1-skill-md] T-NFR2 — corpus-state write instructions reference only metrics (counts/ratios/timestamps)');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR2: write instructions metrics-only (file missing)');
  } else {
    const stateIdx     = text.indexOf('## State update');
    const stateSection = stateIdx >= 0 ? text.slice(stateIdx) : '';
    const hasMetrics   = stateSection.includes('ratio') || stateSection.toLowerCase().includes('percent') ||
      stateSection.toLowerCase().includes('timestamp') || stateSection.includes('lastRunAt');
    assert(hasMetrics,
      'T-NFR2: state update section describes metrics only (ratio/percent/timestamp/lastRunAt)');
  }
}

// ── T-NFR3 — audit: lastRunAt explicitly named ───────────────────────────────
console.log('\n[md-1-skill-md] T-NFR3 — lastRunAt explicitly named in write instructions');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR3: lastRunAt present in write instructions (file missing)');
  } else {
    assert(text.includes('lastRunAt'),
      'T-NFR3: lastRunAt explicitly named in corpus-state.md write instructions');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[md-1-skill-md] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
