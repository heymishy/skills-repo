'use strict';

// spc.3 — Add instrumentation instruction to copilot-instructions.md
// Tests read .github/copilot-instructions.md and assert the required
// ## Skill Performance Capture (instrumentation) section exists with correct content.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '.github', 'copilot-instructions.md');

let content;
try {
  content = fs.readFileSync(FILE, 'utf8');
} catch (e) {
  console.error(`[spc3-instruction-integration] ERROR: Cannot read ${FILE}: ${e.message}`);
  process.exit(1);
}

// Extract the instrumentation section (from the heading to the next ## heading or EOF)
const sectionMatch = content.match(/## Skill Performance Capture \(instrumentation\)([\s\S]*?)(?=\n## |\n---|\s*$)/);
const section = sectionMatch ? sectionMatch[0] + (sectionMatch[1] || '') : '';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.log(`  [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// T1 — AC1: section heading present
test('T1 section heading ## Skill Performance Capture (instrumentation) present', () => {
  assert(
    content.includes('## Skill Performance Capture (instrumentation)'),
    'Heading "## Skill Performance Capture (instrumentation)" not found in copilot-instructions.md'
  );
});

// T2 — AC1: instruction to read .github/context.yml present
test('T2 instrumentation section instructs agent to read .github/context.yml', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  assert(
    section.includes('context.yml'),
    'Section does not reference context.yml'
  );
});

// T3 — AC1: instruction to check instrumentation.enabled flag present
test('T3 instrumentation section instructs agent to check instrumentation.enabled', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  assert(
    section.includes('instrumentation.enabled'),
    'Section does not reference instrumentation.enabled'
  );
});

// T4 — AC1: instruction to append capture block when enabled present
test('T4 instrumentation section instructs agent to append capture block when enabled:true', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  assert(
    section.includes('capture-block') || section.includes('capture block'),
    'Section does not reference appending a capture block'
  );
  assert(
    section.includes('append') || section.includes('Append'),
    'Section does not instruct appending'
  );
});

// T5 — AC4: appendix-only constraint explicitly stated
test('T5 instrumentation section contains explicit appendix-only constraint', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  const hasAppendix = section.toLowerCase().includes('appendix');
  const hasDoNotModify = section.toLowerCase().includes('do not modify') || section.toLowerCase().includes('must not modify') || section.toLowerCase().includes('not alter');
  assert(
    hasAppendix || hasDoNotModify,
    'Section does not contain appendix-only constraint (expected "appendix" and/or "do not modify"/"not alter")'
  );
});

// T6 — AC5: five artefact types named
test('T6 instrumentation section names required artefact types (discovery.md, benefit-metric.md, story, test plan)', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  assert(section.includes('discovery.md'), 'Section missing "discovery.md"');
  assert(section.includes('benefit-metric.md'), 'Section missing "benefit-metric.md"');
  assert(
    section.includes('story') || section.includes('stories'),
    'Section missing story artefact type'
  );
  assert(
    section.includes('test plan') || section.includes('test-plan'),
    'Section missing test plan artefact type'
  );
});

// T7 — AC5: gate artefacts explicitly excluded
test('T7 instrumentation section explicitly excludes gate artefacts (DoR and/or DoD)', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  const hasDoR = section.includes('DoR') || section.toLowerCase().includes('definition-of-ready');
  const hasDoD = section.includes('DoD') || section.toLowerCase().includes('definition-of-done');
  assert(
    hasDoR || hasDoD,
    'Section does not explicitly exclude gate artefacts (DoR/DoD not mentioned)'
  );
});

// NFR: Security — fidelity_self_report must not contain credentials
test('NFR instrumentation section warns against session tokens/credentials in fidelity_self_report', () => {
  assert(section.length > 0, 'Instrumentation section not found');
  assert(
    section.includes('fidelity_self_report'),
    'Section does not reference fidelity_self_report'
  );
  const hasCredentialWarning =
    section.includes('session token') ||
    section.includes('API credential') ||
    section.includes('api credential') ||
    section.includes('user identifier') ||
    section.includes('credentials');
  assert(
    hasCredentialWarning,
    'Section does not warn against credentials/tokens in fidelity_self_report'
  );
});

console.log('');
console.log(`[spc3-instruction-integration] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
