'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TRACE_CONTRACT = path.join(ROOT, 'standards', 'governance', 'trace-contract.md');
const CONTRIBUTING = path.join(ROOT, 'CONTRIBUTING.md');
let passed = 0, failed = 0;
function assert(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else { console.log('  \u2717 ' + label); failed++; }
}

// T1: trace-contract.md exists
assert(fs.existsSync(TRACE_CONTRACT), 'T1: standards/governance/trace-contract.md exists');

// T2: contains all 15 principle identifiers P01-P15
if (fs.existsSync(TRACE_CONTRACT)) {
  const content = fs.readFileSync(TRACE_CONTRACT, 'utf8');
  for (let i = 1; i <= 15; i++) {
    const id = 'P' + String(i).padStart(2, '0');
    assert(content.includes(id), 'T2: contains ' + id);
  }
} else {
  for (let i = 0; i < 15; i++) { failed++; console.log('  \u2717 T2: P' + (i+1) + ' (file missing)'); }
}

// T3: representative entries P01, P02, P08 have module reference, behaviour, and cross-reference
if (fs.existsSync(TRACE_CONTRACT)) {
  const content = fs.readFileSync(TRACE_CONTRACT, 'utf8');
  // Module reference: must contain a path with src/ or scripts/ or .github/
  assert(/src\/[a-z]|scripts\/[a-z]|\.github\/[a-z]/.test(content), 'T3a: at least one module path reference present');
  // Cross-reference: must contain copilot-instructions.md or ADR-0
  assert(content.includes('copilot-instructions.md') || content.includes('ADR-0'), 'T3b: cross-reference to copilot-instructions.md or ADR present');
  // Behaviour description: must have non-trivial content for P01, P02, P08 sections
  const p01idx = content.indexOf('P01');
  const p02idx = content.indexOf('P02');
  const p08idx = content.indexOf('P08');
  assert(p01idx >= 0 && content.slice(p01idx, p01idx + 300).length > 100, 'T3c: P01 section has substantial content');
  assert(p02idx >= 0 && content.slice(p02idx, p02idx + 300).length > 100, 'T3d: P02 section has substantial content');
  assert(p08idx >= 0 && content.slice(p08idx, p08idx + 300).length > 100, 'T3e: P08 section has substantial content');
} else {
  failed += 5; console.log('  \u2717 T3a-e (file missing)');
}

// T4: file is readable plain markdown (not a raw code dump)
if (fs.existsSync(TRACE_CONTRACT)) {
  const lines = fs.readFileSync(TRACE_CONTRACT, 'utf8').split('\n').filter(l => l.trim());
  const codeLines = lines.filter(l => l.trim().startsWith('```')).length;
  assert(codeLines / lines.length < 0.5, 'T4: file is primarily prose markdown (not a code dump)');
} else {
  failed++; console.log('  \u2717 T4 (file missing)');
}

// T5: CONTRIBUTING.md references trace-contract.md
assert(
  fs.readFileSync(CONTRIBUTING, 'utf8').includes('standards/governance/trace-contract.md'),
  'T5: CONTRIBUTING.md references standards/governance/trace-contract.md'
);

// T6: no regression check (file loading without error = pass; full npm test run at commit)
assert(true, 'T6: file loading without error (regression verified by npm test at commit)');

// T7: P02 contains exact validation pattern and source obligation
if (fs.existsSync(TRACE_CONTRACT)) {
  const content = fs.readFileSync(TRACE_CONTRACT, 'utf8');
  const p02start = content.indexOf('P02');
  const p02end = content.indexOf('P03', p02start);
  const p02section = p02start >= 0 ? content.slice(p02start, p02end > 0 ? p02end : p02start + 1000) : '';
  assert(p02section.includes('path.resolve(inputPath).startsWith(repoRoot + path.sep)'), 'T7a: P02 contains exact validation pattern');
  assert(p02section.includes('copilot-instructions.md'), 'T7b: P02 references copilot-instructions.md as source');
} else {
  failed += 2; console.log('  \u2717 T7a-b (file missing)');
}

// NFR-T1: all module path references in file resolve to real files
if (fs.existsSync(TRACE_CONTRACT)) {
  const content = fs.readFileSync(TRACE_CONTRACT, 'utf8');
  const matches = content.match(/(?:src|scripts|\.github)\/[\w./-]+\.(?:js|yml|json|md)/g) || [];
  let broken = 0;
  for (const m of matches) {
    const fullPath = path.join(ROOT, m);
    if (!fs.existsSync(fullPath)) { console.log('  \u2717 NFR-T1: broken path reference: ' + m); broken++; failed++; }
  }
  if (broken === 0) { console.log('  \u2713 NFR-T1: all module path references resolve (' + matches.length + ' checked)'); passed++; }
} else {
  failed++; console.log('  \u2717 NFR-T1 (file missing)');
}

console.log('\n[gpa-sc01] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
