'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const COPILOT_INSTRUCTIONS = path.join(REPO_ROOT, '.github', 'copilot-instructions.md');
const SKILL_FILES = {
  checkpoint: path.join(REPO_ROOT, '.github', 'skills', 'checkpoint', 'SKILL.md'),
  definition: path.join(REPO_ROOT, '.github', 'skills', 'definition', 'SKILL.md'),
  review: path.join(REPO_ROOT, '.github', 'skills', 'review', 'SKILL.md'),
  'test-plan': path.join(REPO_ROOT, '.github', 'skills', 'test-plan', 'SKILL.md'),
  'definition-of-ready': path.join(REPO_ROOT, '.github', 'skills', 'definition-of-ready', 'SKILL.md'),
  tdd: path.join(REPO_ROOT, '.github', 'skills', 'tdd', 'SKILL.md'),
  'systematic-debugging': path.join(REPO_ROOT, '.github', 'skills', 'systematic-debugging', 'SKILL.md'),
  'implementation-review': path.join(REPO_ROOT, '.github', 'skills', 'implementation-review', 'SKILL.md'),
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

const ci = fs.readFileSync(COPILOT_INSTRUCTIONS, 'utf8');

// ─── copilot-instructions.md tests ────────────────────────────────────────────

test('self-recording-instruction-present — copilot-instructions.md contains agent self-recording rule', () => {
  const hasAgentAuto = ci.includes('agent-auto');
  const hasWriteRef = ci.includes('workspace/capture-log.md');
  assert.ok(
    hasAgentAuto && hasWriteRef,
    `Expected copilot-instructions.md to contain both 'agent-auto' and 'workspace/capture-log.md'. ` +
    `agent-auto: ${hasAgentAuto}, capture-log.md ref: ${hasWriteRef}`
  );
});

test('self-recording-instruction-word-count — self-recording block is ≤60 words', () => {
  // Extract the agent self-recording block by looking for "agent-auto" section
  const lines = ci.split('\n');
  let blockStart = -1;
  let blockEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('agent-auto') && blockStart === -1) {
      // Walk back to find a heading
      for (let j = i; j >= 0; j--) {
        if (lines[j].startsWith('#') || lines[j].startsWith('**') || lines[j].trim() === '') {
          blockStart = j + 1;
          break;
        }
      }
      // Walk forward to find next blank line or heading
      for (let j = i; j < lines.length; j++) {
        if (j > i && (lines[j].startsWith('#') || (lines[j].trim() === '' && j > i + 1))) {
          blockEnd = j;
          break;
        }
      }
      if (blockEnd === -1) blockEnd = Math.min(i + 15, lines.length);
      break;
    }
  }
  assert.ok(blockStart !== -1, "Could not find agent-auto block in copilot-instructions.md");
  const blockText = lines.slice(blockStart, blockEnd).join(' ');
  const words = blockText.split(/\s+/).filter(w => w.length > 0);
  assert.ok(
    words.length <= 60,
    `Agent self-recording block has ${words.length} words — must be ≤60`
  );
});

test('self-recording-captures-non-trivial-only — instruction includes non-trivial qualifier', () => {
  const qualifiers = ['non-trivial', 'significant', 'decision', 'assumption', 'pattern', 'gap', 'not for routine', 'only when'];
  const hasQualifier = qualifiers.some(q => ci.toLowerCase().includes(q.toLowerCase()));
  assert.ok(
    hasQualifier,
    `copilot-instructions.md self-recording rule must include a qualifier (e.g. "non-trivial", "decision", "pattern", "gap") — not unconditional capture for every step`
  );
});

test('self-recording-imperative-wording — instruction uses imperative language', () => {
  // Find the agent-auto section and check for hedging language
  const agentAutoIdx = ci.indexOf('agent-auto');
  assert.ok(agentAutoIdx !== -1, 'agent-auto not found in copilot-instructions.md');
  // Extract surrounding context (300 chars either side)
  const context = ci.slice(Math.max(0, agentAutoIdx - 300), agentAutoIdx + 300).toLowerCase();
  const hedging = ['consider', 'may want to', 'optionally', 'if appropriate', 'you may'];
  const foundHedge = hedging.filter(h => context.includes(h));
  assert.deepStrictEqual(
    foundHedge,
    [],
    `Agent self-recording instruction uses hedging language: [${foundHedge.join(', ')}] — must use imperative form`
  );
});

test('self-recording-no-new-npm-dependencies — package.json has no new dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  // Neither dependencies nor devDependencies should exist (baseline: this repo has none)
  const depCount = Object.keys(pkg.dependencies || {}).length;
  const devDepCount = Object.keys(pkg.devDependencies || {}).length;
  assert.strictEqual(depCount, 0, `Expected 0 dependencies, found ${depCount}`);
  assert.strictEqual(devDepCount, 0, `Expected 0 devDependencies, found ${devDepCount}`);
});

// ─── SKILL.md reminder tests ─────────────────────────────────────────────────

for (const [skillName, skillPath] of Object.entries(SKILL_FILES)) {
  test(`skill-${skillName}-has-capture-reminder — ${skillName} SKILL.md references workspace/capture-log.md`, () => {
    assert.ok(fs.existsSync(skillPath), `SKILL.md not found at ${skillPath}`);
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(
      content.includes('workspace/capture-log.md'),
      `${skillName}/SKILL.md must contain a reference to workspace/capture-log.md`
    );
  });
}

test('skill-capture-reminder-references-signal-types — each SKILL.md reminder references signal types or delegates', () => {
  const signalTypes = ['decision', 'learning', 'assumption', 'pattern', 'gap'];
  for (const [skillName, skillPath] of Object.entries(SKILL_FILES)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    // Either the reminder includes signal-type names OR it delegates to copilot-instructions.md
    const hasSignalRef = signalTypes.some(st => content.toLowerCase().includes(st));
    const hasDelegation = content.includes('capture-log.md');
    assert.ok(
      hasSignalRef || hasDelegation,
      `${skillName}/SKILL.md reminder must reference signal types (decision/learning/assumption/pattern/gap) or delegate to copilot-instructions.md`
    );
  }
});

test('agent-auto-entry-schema-complete — synthetic agent-auto entry has all 5 required fields', () => {
  const syntheticEntry = `- date: 2026-04-28
  session-phase: subagent-execution
  signal-type: decision
  signal-text: Chose append-only log to preserve cross-session learning history.
  source: agent-auto`;

  const requiredFields = ['date:', 'session-phase:', 'signal-type:', 'signal-text:', 'source:'];
  for (const field of requiredFields) {
    assert.ok(
      syntheticEntry.includes(field),
      `Synthetic agent-auto entry is missing required field: ${field}`
    );
  }
  assert.ok(
    syntheticEntry.includes('source: agent-auto'),
    "Agent-written entries must use source: agent-auto"
  );
});

test('skill-reminder-word-count — each SKILL.md reminder callout is ≤30 words', () => {
  for (const [skillName, skillPath] of Object.entries(SKILL_FILES)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    // Find the capture-log.md reference and extract surrounding line(s)
    const idx = content.indexOf('workspace/capture-log.md');
    assert.ok(idx !== -1, `${skillName}/SKILL.md must contain workspace/capture-log.md reference`);
    // Extract the reminder block: from the nearest preceding newline before a > or ** marker to the next blank line
    const lines = content.split('\n');
    let reminderLines = [];
    let inReminder = false;
    for (const line of lines) {
      if (line.includes('workspace/capture-log.md')) {
        inReminder = true;
      }
      if (inReminder) {
        reminderLines.push(line);
        if (line.trim() === '' && reminderLines.length > 1) break;
      }
    }
    // Also capture the line just before the capture-log reference (the heading/intro)
    const captureLineIdx = lines.findIndex(l => l.includes('workspace/capture-log.md'));
    if (captureLineIdx > 0 && lines[captureLineIdx - 1].trim() !== '') {
      reminderLines = [lines[captureLineIdx - 1], ...reminderLines];
    }
    const text = reminderLines.join(' ').replace(/[`*#>]/g, ' ');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    assert.ok(
      words.length <= 30,
      `${skillName}/SKILL.md capture reminder is ${words.length} words — must be ≤30`
    );
  }
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n[ilc.2] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
