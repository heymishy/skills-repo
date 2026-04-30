#!/usr/bin/env node
/**
 * check-rrc2-constraint-index.js
 *
 * Automated tests for rrc.2: Output 10 (constraint-index.md) added to /reverse-engineer.
 *
 * Tests from test plan artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.2-test-plan.md
 *
 *   AC1 — Output 10 with pipe-delimited format (5 columns):
 *   - rrc2-output-10-instruction-present
 *   - rrc2-constraint-index-filename-specified
 *   - rrc2-constraint-index-has-rule-id-column
 *   - rrc2-constraint-index-has-source-file-column
 *   - rrc2-constraint-index-has-confidence-column
 *   - rrc2-constraint-index-has-disposition-column
 *   - rrc2-constraint-index-has-summary-column
 *
 *   AC2 — CHANGE-RISK notation referenced in constraint-index instructions:
 *   - rrc2-change-risk-notation-in-constraint-index
 *
 *   AC3 — VERIFY pass instructs constraint-index.md update:
 *   - rrc2-verify-updates-constraint-index
 *
 *   AC4 — DEFER outcome does NOT produce Output 10:
 *   - rrc2-output-10-gated-not-for-defer
 *
 *   AC5 — Contract markers intact:
 *   - rrc2-skill-contract-markers-present
 *
 *   DEC-001 — rule-id format specified with layer prefix:
 *   - rrc2-rule-id-format-layer-sequence
 *
 *   NFR — SKILL.md line count <= 650:
 *   - rrc2-skill-line-count-within-nfr
 *
 * Run:  node tests/check-rrc2-constraint-index.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let passed  = 0;
let failed  = 0;
const failures = [];

function pass(name) {
  console.log('  ✓ ' + name);
  passed++;
}
function fail(name, reason) {
  console.error('  ✗ ' + name);
  console.error('      ' + reason);
  failed++;
  failures.push(name + ': ' + reason);
}

const revEngSkill = path.join(root, '.github', 'skills', 'reverse-engineer', 'SKILL.md');

function getContent() {
  if (!fs.existsSync(revEngSkill)) return null;
  return fs.readFileSync(revEngSkill, 'utf8');
}

console.log('\n[rrc.2] /reverse-engineer Output 10 — constraint-index.md\n');

// ── T2.1: Output 10 instruction is present (AC1) ──────────────────────────────
(function test_output_10_present() {
  const name = 'rrc2-output-10-instruction-present';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  if (/Output 10/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain "Output 10" — rrc.2 implementation required');
  }
})();

// ── T2.2: Output 10 names constraint-index.md (AC1) ──────────────────────────
(function test_constraint_index_filename() {
  const name = 'rrc2-constraint-index-filename-specified';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  if (/constraint-index\.md/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference "constraint-index.md" — Output 10 filename not specified');
  }
})();

// ── T2.3: constraint-index has rule-id column (AC1) ──────────────────────────
(function test_rule_id_column() {
  const name = 'rrc2-constraint-index-has-rule-id-column';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  const region = content.slice(Math.max(0, idx - 100), idx + 600);
  if (/rule.?id/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index format does not include rule-id column — required by AC1');
  }
})();

// ── T2.4: constraint-index has source-file column (AC1) ──────────────────────
(function test_source_file_column() {
  const name = 'rrc2-constraint-index-has-source-file-column';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  const region = content.slice(Math.max(0, idx - 100), idx + 600);
  if (/source.?file/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index format does not include source-file column — required by AC1');
  }
})();

// ── T2.5: constraint-index has confidence column (AC1) ───────────────────────
(function test_confidence_column() {
  const name = 'rrc2-constraint-index-has-confidence-column';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  const region = content.slice(Math.max(0, idx - 100), idx + 600);
  if (/confidence/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index format does not include confidence column — required by AC1');
  }
})();

// ── T2.6: constraint-index has disposition column (AC1) ──────────────────────
(function test_disposition_column() {
  const name = 'rrc2-constraint-index-has-disposition-column';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  const region = content.slice(Math.max(0, idx - 100), idx + 600);
  if (/disposition/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index format does not include disposition column — required by AC1');
  }
})();

// ── T2.7: constraint-index has summary column (AC1) ──────────────────────────
(function test_summary_column() {
  const name = 'rrc2-constraint-index-has-summary-column';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  const region = content.slice(Math.max(0, idx - 100), idx + 600);
  if (/summary/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index format does not include summary column — required by AC1');
  }
})();

// ── T2.8: CHANGE-RISK notation referenced in constraint-index context (AC2) ───
(function test_change_risk_notation() {
  const name = 'rrc2-change-risk-notation-in-constraint-index';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const idx = content.indexOf('constraint-index');
  if (idx === -1) { fail(name, 'SKILL.md has no constraint-index section'); return; }
  // CHANGE-RISK must appear near the constraint-index section
  const region = content.slice(Math.max(0, idx - 200), idx + 1000);
  if (/CHANGE.?RISK/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'constraint-index instructions do not reference CHANGE-RISK notation — required by AC2');
  }
})();

// ── T2.9: VERIFY pass instructs constraint-index.md update (AC3) ─────────────
(function test_verify_updates_constraint_index() {
  const name = 'rrc2-verify-updates-constraint-index';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const verifyIdx = content.search(/VERIFY pass|## VERIFY|### VERIFY/i);
  if (verifyIdx === -1) { fail(name, 'SKILL.md has no VERIFY pass section'); return; }
  const verifyRegion = content.slice(verifyIdx, verifyIdx + 1000);
  if (/constraint-index|Output 10/i.test(verifyRegion)) {
    pass(name);
  } else {
    fail(name, 'VERIFY pass section does not reference constraint-index.md — required by AC3');
  }
})();

// ── T2.10: Output 10 gated — DEFER does not produce it (AC4) ─────────────────
(function test_output_10_not_for_defer() {
  const name = 'rrc2-output-10-gated-not-for-defer';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const deferIdx = content.search(/DEFER|Q0.*C\b/i);
  if (deferIdx === -1) { fail(name, 'SKILL.md has no DEFER section'); return; }
  const deferRegion = content.slice(deferIdx, deferIdx + 500);
  if (/Output 10|constraint-index/i.test(deferRegion)) {
    fail(name, 'DEFER outcome section references Output 10 — it must not instruct constraint-index.md production for DEFER');
  } else {
    pass(name);
  }
})();

// ── T2.11: rule-id format specifies layer-sequence pattern (DEC-001) ──────────
(function test_rule_id_format() {
  const name = 'rrc2-rule-id-format-layer-sequence';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  // DEC-001: rule-id format is <layer>-<sequence> e.g. L1-001
  // Accept: "L1-001", "layer-sequence", "<layer>-<seq>", "L\d+-\d+"
  if (/L\d+-\d{3}|<layer>|layer.?sequence|layer.?number.*sequence/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not specify the rule-id format with a layer prefix (e.g. L1-001) — required by DEC-001 to ensure consistency with corpus-state.md');
  }
})();

// ── T2.12: SKILL.md contract markers intact (AC5) ────────────────────────────
(function test_contract_markers() {
  const name = 'rrc2-skill-contract-markers-present';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const missing = [];
  if (!/^name:/m.test(content)) missing.push('name:');
  if (!/^description:/m.test(content)) missing.push('description:');
  if (!/^triggers:/m.test(content)) missing.push('triggers:');
  if (!/##\s+Output|outputs:/i.test(content)) missing.push('outputs section');
  if (missing.length === 0) {
    pass(name);
  } else {
    fail(name, `SKILL.md missing contract markers: ${missing.join(', ')}`);
  }
})();

// ── T2.13: SKILL.md line count ≤ 650 (NFR) ───────────────────────────────────
(function test_line_count_nfr() {
  const name = 'rrc2-skill-line-count-within-nfr';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reverse-engineer/SKILL.md not found'); return; }
  const lineCount = content.split('\n').length;
  if (lineCount <= 650) {
    pass(name);
  } else {
    fail(name, `SKILL.md has ${lineCount} lines — exceeds NFR limit of 650 (combined rrc.1+rrc.2 budget)`);
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('[rrc2] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
