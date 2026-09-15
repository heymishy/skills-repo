#!/usr/bin/env node
/**
 * check-psrc-s1-model-routing-config.js
 *
 * Regression test for psrc-s1 -- centralizes per-skill model routing
 * (previously duplicated independently in routes/skills.js's getModelForSkill()
 * and the streaming turn handler's own inline block, with nothing enforcing
 * they stayed in sync) into src/web-ui/config/model-routing.js, and adds a
 * scoped per-skill override mechanism (WUCE_MODEL_OVERRIDE_<SKILL>) so a
 * single skill's model can be changed via a Fly secret without the blanket,
 * all-skills blast radius of the pre-existing WUCE_FAST_MODEL.
 *
 * Run: node tests/check-psrc-s1-model-routing-config.js
 */
'use strict';

const { getModelForSkill, DEFAULT_SONNET_SKILLS, HAIKU_BLOCKED_SKILLS } =
  require('../src/web-ui/config/model-routing');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

function run() {
  // AC1: no override env vars set -- default routing matches pre-change behaviour.
  {
    const env = {};
    ok(!/haiku/.test(getModelForSkill('discovery', env)), 'AC1: discovery defaults to a non-Haiku model with no overrides');
    ok(!/haiku/.test(getModelForSkill('ideate', env)), 'AC1: ideate defaults to a non-Haiku model with no overrides');
    eq(getModelForSkill('test-plan', env), 'claude-haiku-4-5', 'AC1: test-plan defaults to claude-haiku-4-5 with no overrides');
    eq(getModelForSkill('definition-of-ready', env), 'claude-haiku-4-5', 'AC1: definition-of-ready defaults to claude-haiku-4-5 with no overrides');
    eq(getModelForSkill('review', env), 'claude-haiku-4-5', 'AC1: review defaults to claude-haiku-4-5 with no overrides');
    eq(getModelForSkill('definition', env), 'claude-haiku-4-5', 'AC1: definition defaults to claude-haiku-4-5 with no overrides');
    ok(DEFAULT_SONNET_SKILLS.indexOf('discovery') !== -1 && DEFAULT_SONNET_SKILLS.indexOf('ideate') !== -1,
      'AC1: DEFAULT_SONNET_SKILLS exported and unchanged from pre-change list');
    ok(HAIKU_BLOCKED_SKILLS.indexOf('discovery') !== -1, 'AC1: HAIKU_BLOCKED_SKILLS exported and unchanged from pre-change list');
  }

  // AC1b: WUCE_HAIKU_MODEL still overrides the Haiku model id for non-Sonnet skills.
  {
    const env = { WUCE_HAIKU_MODEL: 'claude-haiku-custom' };
    eq(getModelForSkill('test-plan', env), 'claude-haiku-custom', 'AC1b: WUCE_HAIKU_MODEL still overrides the default Haiku model id');
  }

  // AC2: per-skill override affects only the targeted skill.
  {
    const env = { WUCE_MODEL_OVERRIDE_TEST_PLAN: 'claude-sonnet-4-6' };
    eq(getModelForSkill('test-plan', env), 'claude-sonnet-4-6', 'AC2: WUCE_MODEL_OVERRIDE_TEST_PLAN routes test-plan to sonnet');
    eq(getModelForSkill('definition-of-ready', env), 'claude-haiku-4-5', 'AC2: definition-of-ready is unaffected by test-plan\'s override');
    eq(getModelForSkill('review', env), 'claude-haiku-4-5', 'AC2: review is unaffected by test-plan\'s override');
  }

  // AC2b: hyphenated skill names map correctly to their env var name.
  {
    const env = { WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY: 'claude-sonnet-4-6' };
    eq(getModelForSkill('definition-of-ready', env), 'claude-sonnet-4-6', 'AC2b: hyphenated skill name maps to underscore env var name');
  }

  // AC3: a per-skill override that resolves to Haiku for a Haiku-blocked skill is refused.
  {
    const env = { WUCE_MODEL_OVERRIDE_DISCOVERY: 'claude-haiku-4-5' };
    ok(!/haiku/.test(getModelForSkill('discovery', env)), 'AC3: Haiku override for discovery (Haiku-blocked) is refused, safe default returned');
  }

  // AC4: per-skill override takes precedence over the blanket WUCE_FAST_MODEL.
  {
    const env = { WUCE_MODEL_OVERRIDE_TEST_PLAN: 'claude-sonnet-4-6', WUCE_FAST_MODEL: 'claude-opus-4-8' };
    eq(getModelForSkill('test-plan', env), 'claude-sonnet-4-6', 'AC4: per-skill override wins over blanket WUCE_FAST_MODEL for the same skill');
    eq(getModelForSkill('review', env), 'claude-opus-4-8', 'AC4: blanket WUCE_FAST_MODEL still applies to a skill with no per-skill override');
  }

  // AC4b: blanket WUCE_FAST_MODEL is also refused for a Haiku-blocked skill (pre-existing guard, preserved).
  {
    const env = { WUCE_FAST_MODEL: 'claude-haiku-4-5' };
    ok(!/haiku/.test(getModelForSkill('discovery', env)), 'AC4b: blanket WUCE_FAST_MODEL Haiku override is refused for discovery');
  }

  // AC4c: allowBlanketOverride: false disables the blanket path (mirrors the streaming turn
  // handler's mid-artefact-continuation guard) but per-skill overrides still apply.
  {
    const env = { WUCE_FAST_MODEL: 'claude-opus-4-8' };
    eq(getModelForSkill('review', env, { allowBlanketOverride: false }), 'claude-haiku-4-5',
      'AC4c: allowBlanketOverride:false suppresses the blanket override, default is used');
    const env2 = { WUCE_MODEL_OVERRIDE_REVIEW: 'claude-sonnet-4-6', WUCE_FAST_MODEL: 'claude-opus-4-8' };
    eq(getModelForSkill('review', env2, { allowBlanketOverride: false }), 'claude-sonnet-4-6',
      'AC4c: per-skill override still applies even when allowBlanketOverride is false');
  }

  // AC5: routes/skills.js's getModelForSkill() (UI display path) and the module this test
  // exercises directly (the streaming turn handler's actual routing path) are now the SAME
  // function -- verified by requiring skills.js and checking its exported getModelForSkill
  // produces identical results to calling the module directly for a representative skill set.
  {
    process.env.NODE_ENV = 'test';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
    const routes = require('../src/web-ui/routes/skills');
    ['discovery', 'ideate', 'test-plan', 'definition-of-ready', 'review', 'definition'].forEach((skill) => {
      eq(routes.getModelForSkill(skill), getModelForSkill(skill), 'AC5: skills.js getModelForSkill(\'' + skill + '\') matches the centralized module directly (real process.env, no overrides active)');
    });
  }

  console.log(`\n[psrc-s1] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
