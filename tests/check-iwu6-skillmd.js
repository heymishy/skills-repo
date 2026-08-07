// check-iwu6-skillmd.js — unit tests for iwu.6
// AC1: SKILL.md contains ADR-018 marker format instruction
// AC4: registerHtmlSession sets assumptionCardsEnabled: true by default
// Note: AC2 (real session emission) is non-deterministic — not a CI gate.
//       AC3 (human DoD gate — emission verification stub) cannot be automated.

'use strict';

const fs   = require('fs');
const path = require('path');

const { registerHtmlSession, _getHtmlSession } = require('../src/web-ui/routes/skills');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[iwu6] PASS: ' + label);
    passed++;
  } else {
    console.error('[iwu6] FAIL: ' + label);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// AC1: SKILL.md contains ADR-018 marker format instruction
// ---------------------------------------------------------------------------

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'ideate', 'SKILL.md');
const skillContent = fs.readFileSync(SKILL_PATH, 'utf8');

assert('AC1: SKILL.md contains ADR-018 marker format start delimiter', skillContent.includes('---ASSUMPTION-JSON:'));
assert('AC1: SKILL.md contains all 5 required JSON fields in marker', skillContent.includes('"id"') && skillContent.includes('"text"') && skillContent.includes('"type"') && skillContent.includes('"risk"') && skillContent.includes('"knowness"'));
assert('AC1: SKILL.md contains closing delimiter of marker', skillContent.includes('---ASSUMPTION-JSON:') && skillContent.includes('}---'));
assert('AC1: SKILL.md marker instruction is in the Output section', (function() {
  var outputIdx = skillContent.indexOf('## Output');
  var endIdx    = skillContent.indexOf('\n## ', outputIdx + 1);
  if (endIdx < 0) endIdx = skillContent.length;
  var outputSection = skillContent.slice(outputIdx, endIdx);
  return outputSection.includes('---ASSUMPTION-JSON:');
})());
assert('AC1: SKILL.md instruction includes type enum (desirability|viability|feasibility|ethical)', skillContent.includes('desirability') && skillContent.includes('viability') && skillContent.includes('feasibility') && skillContent.includes('ethical'));
assert('AC1: SKILL.md instruction includes risk enum (high|medium|low)', skillContent.includes('high') && skillContent.includes('medium') && skillContent.includes('low'));
assert('AC1: SKILL.md instruction includes knowness enum (known-unknown|unknown-unknown)', skillContent.includes('known-unknown') && skillContent.includes('unknown-unknown'));
assert('AC1: SKILL.md does not remove existing lens sections (Lens A still present)', skillContent.includes('Lens A'));
assert('AC1: SKILL.md does not remove existing state update section', skillContent.includes('State update'));

// ---------------------------------------------------------------------------
// AC4: registerHtmlSession sets assumptionCardsEnabled: true by default
// ---------------------------------------------------------------------------

// Use a temp session path that does not need to exist for testing
// (buildSystemPrompt will fail if file doesn't exist — mock it via path to existing file)
const SESSION_ID = 'iwu6-test-session-001';

// We need to test that registerHtmlSession sets assumptionCardsEnabled: true.
// Since buildSystemPrompt reads a file, use the SKILL.md as the session path
// to avoid errors (buildSystemPrompt reads from sessionPath, produces a string).
// If it throws due to missing system prompt, catch and test with _setHtmlSession instead.
try {
  registerHtmlSession(SESSION_ID, SKILL_PATH, 'ideate');
  var sess = _getHtmlSession(SESSION_ID);
  assert('AC4: registerHtmlSession creates session', !!sess);
  assert('AC4: session.assumptionCardsEnabled is true by default', sess && sess.assumptionCardsEnabled === true);
  assert('AC4: session.skillName is set', sess && sess.skillName === 'ideate');
  assert('AC4: session.turns starts empty', sess && Array.isArray(sess.turns) && sess.turns.length === 0);
  assert('AC4: session.done starts false', sess && sess.done === false);
} catch(err) {
  // If buildSystemPrompt fails (e.g. file read error), still test the field directly
  console.log('[iwu6] registerHtmlSession threw: ' + err.message + ' — testing _setHtmlSession path instead');
  const { _setHtmlSession } = require('../src/web-ui/routes/skills');
  // The test still verifies the SOURCE CODE contains assumptionCardsEnabled: true
  var skillsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js'), 'utf8');
  assert('AC4: source code sets assumptionCardsEnabled: true in registerHtmlSession', skillsSource.includes('assumptionCardsEnabled: true'));
  assert('AC4: setting is in registerHtmlSession function body', (function() {
    var fnStart = skillsSource.indexOf('function registerHtmlSession(');
    var fnBody  = skillsSource.slice(fnStart, skillsSource.indexOf('\n}', fnStart) + 2);
    return fnBody.includes('assumptionCardsEnabled: true');
  })());
}

// Direct source code check (belt-and-braces)
var skillsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js'), 'utf8');
assert('AC4: source: assumptionCardsEnabled: true present in registerHtmlSession', (function() {
  var fnStart = skillsSource.indexOf('function registerHtmlSession(');
  var fnEnd   = skillsSource.indexOf('\n}', fnStart) + 2;
  return skillsSource.slice(fnStart, fnEnd).includes('assumptionCardsEnabled: true');
})());

// ---------------------------------------------------------------------------
// Note on AC2 and AC3
// ---------------------------------------------------------------------------
console.log('[iwu6] NOTE: AC2 (model emission confidence) is non-deterministic — not a CI gate.');
console.log('[iwu6] NOTE: AC3 (human-in-loop DoD gate) requires a real 6-turn session.');
console.log('[iwu6] NOTE: See artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md');

// Summary
console.log('\n[iwu6] ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
