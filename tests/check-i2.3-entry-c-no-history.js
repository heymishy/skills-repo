'use strict';
// RED: All tests fail until orient SKILL.md has Entry C routing (requires i1.1, i2.1, i2.2, i2.3).

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skillPath = path.join(root, '.github/skills/orient/SKILL.md');
const results = { passed: 0, failed: 0 };

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    results.passed++;
  } catch (e) {
    console.log(`  [FAIL] ${name}: ${e.message}`);
    results.failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function readSkill() {
  assert(fs.existsSync(skillPath), `orient/SKILL.md not found at ${skillPath}`);
  return fs.readFileSync(skillPath, 'utf8');
}

function getEntryCSection(content) {
  const start = content.indexOf('Entry C');
  assert(start !== -1, 'Entry C not found in SKILL.md');
  // Grab up to 3000 chars from Entry C heading
  return content.slice(start, start + 3000);
}

console.log('[i2.3-entry-c-no-history] Running tests...\n');

test('orient-entry-c-routing-block-present', () => {
  const content = readSkill();
  assert(content.includes('Entry C'), 'No "Entry C" found in orient/SKILL.md');
});

test('orient-entry-c-names-state-no-history-brownfield', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.includes('no-history brownfield') || section.includes('no-history') || section.match(/Entry C[^#]*brownfield/s),
    'Entry C does not name "no-history brownfield" state'
  );
});

test('orient-entry-c-explains-retrospective-discovery', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.includes('retrospective') && section.includes('/discovery'),
    'Entry C does not explain /discovery as retrospective exercise'
  );
});

test('orient-entry-c-surfaces-retrospective-story-template', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.includes('retrospective-story.md') || section.includes('retrospective-story'),
    'Entry C does not reference retrospective-story.md template'
  );
});

test('orient-entry-c-routes-to-discovery-with-retrospective-note', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.includes('/discovery') && section.includes('retrospective'),
    'Entry C does not route to /discovery with retrospective note'
  );
});

test('orient-entry-c-nfr-word-retrospective-in-output', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(section.includes('retrospective'), 'NFR: word "retrospective" must appear in Entry C routing section');
});

test('orient-entry-c-distinguishes-from-entry-b-in-signal', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.includes('Entry B') || section.match(/no app(lication)? logic/i) || section.match(/src[/,]|app[/,]|lib[/,]/),
    'Entry C does not distinguish from Entry B (no reference to Entry B check result)'
  );
});

test('orient-entry-c-signal-explains-why-not-entry-b', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  assert(
    section.match(/Entry B.*not|not.*Entry B|no app(lication)? logic|Entry B does not/i) ||
    section.match(/no (code|logic|src|application) files/i) ||
    section.includes('Entry B is not applicable') ||
    section.includes('No application logic'),
    'Entry C does not explain why Entry B does not apply'
  );
});

test('orient-entry-c-does-not-fire-on-empty-repo', () => {
  const content = readSkill();
  const section = getEntryCSection(content);
  // Entry C must require brownfield signals — not trigger on an empty repo
  assert(
    section.match(/git history|ops file|\.github|commits|brownfield signal/i) ||
    section.match(/not.*empty|empty.*not|exclude.*empty|greenfield.*before|before.*greenfield/i) ||
    section.match(/A.*B.*C|Entry A.*Entry B.*Entry C/i),
    'Entry C section does not indicate it requires brownfield signal (not empty repo)'
  );
});

test('orient-entry-c-is-fallback-after-a-and-b-in-priority-chain', () => {
  const content = readSkill();
  // The full priority chain must place greenfield/empty first, then A, B, C
  assert(content.includes('Entry A'), 'orient SKILL.md missing Entry A (from i2.1)');
  assert(content.includes('Entry B'), 'orient SKILL.md missing Entry B (from i2.2)');
  assert(content.includes('Entry C'), 'orient SKILL.md missing Entry C');
  // Entry C must appear after Entry B in the file
  const aIdx = content.indexOf('Entry A');
  const bIdx = content.indexOf('Entry B');
  const cIdx = content.indexOf('Entry C');
  assert(aIdx < bIdx, 'Entry A should appear before Entry B in file');
  assert(bIdx < cIdx, 'Entry B should appear before Entry C in file');
});

console.log(`\n[i2.3-entry-c-no-history] Results: ${results.passed} passed, ${results.failed} failed`);
if (results.failed > 0) process.exit(1);
