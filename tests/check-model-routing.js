#!/usr/bin/env node
/**
 * check-model-routing.js
 *
 * Governance tests for the Layer 2 MODEL_ROUTING map in scripts/run-model-sweep.js.
 *
 * Enforces:
 *   T1 — MODEL_ROUTING constant is defined in the script
 *   T2 — MODEL_ROUTING covers all 5 measurement-backed skills
 *   T3 — Every model value in MODEL_ROUTING is a key in the PRICING map (cost is known)
 *   T4 — Every skill in MODEL_ROUTING has an EVAL.md (routing only applies to evaluated skills)
 *   T5 — --policy flag is parsed (appears in parseArgs function)
 *   T6 — --routing flag is parsed (routing display mode exists)
 *   T7 — COPILOT_MODEL_MAP includes claude-haiku-4-5 (required for --provider copilot + Haiku)
 *   T8 — discovery routes to claude-sonnet-4-6 (EXP-002a measurement-backed)
 *   T9 — definition, review, test-plan, definition-of-ready all route to claude-haiku-4-5
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const SWEEP_PATH  = path.join(ROOT, 'scripts', 'run-model-sweep.js');
const SKILLS_DIR  = path.join(ROOT, 'skills');

let passed = 0;
let failed = 0;

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  process.stdout.write('  \u2717 ' + name + '\n');
  if (reason) process.stdout.write('    \u2192 ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name); else fail(name, reason);
}

// ── Load script source ────────────────────────────────────────────────────────

const sweepSrc = fs.existsSync(SWEEP_PATH) ? fs.readFileSync(SWEEP_PATH, 'utf8') : null;

// ── T1 — MODEL_ROUTING constant exists ───────────────────────────────────────
console.log('\n[model-routing] T1 — MODEL_ROUTING constant defined in run-model-sweep.js');
{
  assert(sweepSrc !== null, 'T1a: scripts/run-model-sweep.js exists');
  assert(sweepSrc !== null && sweepSrc.includes('const MODEL_ROUTING'), 'T1b: MODEL_ROUTING constant declared');
}

// ── T2 — Covers all 5 measurement-backed skills ──────────────────────────────
console.log('\n[model-routing] T2 — MODEL_ROUTING covers all 5 measurement-backed skills');
{
  const requiredSkills = ['discovery', 'definition', 'review', 'test-plan', 'definition-of-ready'];
  for (const skill of requiredSkills) {
    assert(
      sweepSrc !== null && sweepSrc.includes(`'${skill}'`),
      `T2: '${skill}' present in MODEL_ROUTING block`
    );
  }
}

// ── T3 — All routing models are in the PRICING map ───────────────────────────
console.log('\n[model-routing] T3 — All MODEL_ROUTING values are in the PRICING map');
{
  // Extract MODEL_ROUTING block — flat object, values are quoted strings
  const routingMatch = sweepSrc && sweepSrc.match(/const MODEL_ROUTING\s*=\s*\{([^}]+)\}/);
  // Extract PRICING block — values are objects { inputPerM: N, outputPerM: N }, use lazy [\s\S]+?
  const pricingMatch = sweepSrc && sweepSrc.match(/const PRICING\s*=\s*\{([\s\S]+?)\};/);

  if (!routingMatch || !pricingMatch) {
    fail('T3: could not extract MODEL_ROUTING or PRICING block for cross-check');
  } else {
    // Parse entries: 'skill': 'model-id'
    const routingEntries = [...routingMatch[1].matchAll(/'([\w-]+)'\s*:\s*'([\w.-]+)'/g)]
      .map(m => ({ skill: m[1], model: m[2] }));
    // PRICING keys are quoted model IDs on lines like '  "claude-haiku-4-5": {'
    const pricingKeys = new Set([...pricingMatch[1].matchAll(/'([\w.-]+)'\s*:/g)].map(m => m[1]));

    assert(routingEntries.length >= 5, `T3a: MODEL_ROUTING has at least 5 entries (found ${routingEntries.length})`);

    for (const { skill, model } of routingEntries) {
      assert(
        pricingKeys.has(model),
        `T3b: '${skill}' routes to '${model}' which is in PRICING map`,
        `'${model}' not found in PRICING — add cost entry or fix routing`
      );
    }
  }
}

// ── T4 — All skills in MODEL_ROUTING have EVAL.md ────────────────────────────
console.log('\n[model-routing] T4 — Every skill in MODEL_ROUTING has an EVAL.md file');
{
  const routingMatch = sweepSrc && sweepSrc.match(/const MODEL_ROUTING\s*=\s*\{([^}]+)\}/);
  if (!routingMatch) {
    fail('T4: could not extract MODEL_ROUTING block');
  } else {
    const routingSkills = [...routingMatch[1].matchAll(/'([\w-]+)'\s*:/g)].map(m => m[1]);
    for (const skill of routingSkills) {
      const evalPath = path.join(SKILLS_DIR, skill, 'EVAL.md');
      assert(
        fs.existsSync(evalPath),
        `T4: '${skill}' has EVAL.md at skills/${skill}/EVAL.md`,
        `Missing EVAL.md — routing only applies to skills with evaluation specs`
      );
    }
  }
}

// ── T5 — --policy flag in parseArgs ─────────────────────────────────────────
console.log('\n[model-routing] T5 — --policy flag handled in parseArgs');
{
  assert(
    sweepSrc !== null && sweepSrc.includes("'--policy'"),
    "T5: '--policy' string literal present in parseArgs"
  );
  assert(
    sweepSrc !== null && sweepSrc.includes('args.policy'),
    "T5b: args.policy referenced in script"
  );
}

// ── T6 — --routing flag in parseArgs ────────────────────────────────────────
console.log('\n[model-routing] T6 — --routing flag handled in parseArgs');
{
  assert(
    sweepSrc !== null && sweepSrc.includes("'--routing'"),
    "T6: '--routing' string literal present in parseArgs"
  );
  assert(
    sweepSrc !== null && sweepSrc.includes('args.routing'),
    "T6b: args.routing referenced in script"
  );
}

// ── T7 — COPILOT_MODEL_MAP includes haiku ───────────────────────────────────
console.log('\n[model-routing] T7 — COPILOT_MODEL_MAP includes claude-haiku-4-5');
{
  assert(
    sweepSrc !== null && sweepSrc.includes("'claude-haiku-4-5'") && sweepSrc.includes("'claude-haiku-4.5'"),
    "T7: COPILOT_MODEL_MAP maps claude-haiku-4-5 to claude-haiku-4.5"
  );
}

// ── T8 — discovery routes to sonnet ─────────────────────────────────────────
console.log('\n[model-routing] T8 — discovery routes to claude-sonnet-4-6');
{
  // Look for 'discovery' key followed by sonnet value in the routing block
  assert(
    sweepSrc !== null && /['"]discovery['"]\s*:\s*['"]claude-sonnet-4-6['"]/.test(sweepSrc),
    "T8: discovery → claude-sonnet-4-6 in MODEL_ROUTING"
  );
}

// ── T9 — definition, review, test-plan, definition-of-ready route to haiku ──
console.log('\n[model-routing] T9 — four skills route to claude-haiku-4-5');
{
  const haikuSkills = ['definition', 'review', 'test-plan', 'definition-of-ready'];
  for (const skill of haikuSkills) {
    assert(
      sweepSrc !== null && new RegExp(`['"]${skill}['"]\\s*:\\s*['"]claude-haiku-4-5['"]`).test(sweepSrc),
      `T9: '${skill}' → claude-haiku-4-5 in MODEL_ROUTING`
    );
  }
}

// ── T10 — --conversation flag handled in parseArgs ──────────────────────────
console.log('\n[model-routing] T10 — --conversation flag present in parseArgs');
{
  assert(
    sweepSrc !== null && sweepSrc.includes("'--conversation'"),
    "T10: '--conversation' string literal present in parseArgs"
  );
  assert(
    sweepSrc !== null && sweepSrc.includes('args.conversation'),
    "T10b: args.conversation referenced in script"
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[model-routing] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
