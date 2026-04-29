#!/usr/bin/env node
/**
 * check-rrc4-corpus-update-skill.js
 *
 * Automated tests for rrc.4: New /reference-corpus-update SKILL.md.
 *
 * Tests from test plan artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.4-test-plan.md
 *
 *   AC1 — SKILL.md exists with all 4 contract markers:
 *   - rrc4-skill-file-exists
 *   - rrc4-skill-contract-markers-present
 *   - rrc4-skill-name-matches-directory
 *
 *   AC2 — Asks for corpus-state.md path AND changed file list:
 *   - rrc4-asks-for-corpus-state-path
 *   - rrc4-asks-for-changed-file-list
 *
 *   AC3 — DEEPEN pass scope with matching rule IDs:
 *   - rrc4-deepen-scope-for-matching-rules
 *   - rrc4-rule-ids-in-deepen-scope
 *
 *   AC4 — No-match messaging:
 *   - rrc4-no-match-message
 *
 *   AC5 — corpus-state.md update with lastRunAt and changeNote:
 *   - rrc4-corpus-state-last-run-at
 *   - rrc4-corpus-state-change-note
 *
 *   AC6 — Triggers include required phrases:
 *   - rrc4-triggers-include-update-corpus
 *   - rrc4-triggers-include-corpus-refresh
 *   - rrc4-triggers-include-legacy-rules
 *
 *   NFR — SKILL.md <= 100 lines:
 *   - rrc4-skill-line-count-within-nfr
 *
 * Run:  node tests/check-rrc4-corpus-update-skill.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 *
 * Note (4-L2): The "41 skills" assertion (AC1) is branch-scoped.
 * This script asserts the SKILL.md file exists with all required markers.
 * Run `node .github/scripts/check-skill-contracts.js` in the implementation
 * branch to verify the 41st skill is counted.
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

const skillFile = path.join(root, '.github', 'skills', 'reference-corpus-update', 'SKILL.md');

function getContent() {
  if (!fs.existsSync(skillFile)) return null;
  return fs.readFileSync(skillFile, 'utf8');
}

console.log('\n[rrc.4] /reference-corpus-update SKILL.md\n');

// ── T4.1: SKILL.md file exists (AC1) ─────────────────────────────────────────
(function test_file_exists() {
  const name = 'rrc4-skill-file-exists';
  if (fs.existsSync(skillFile)) {
    pass(name);
  } else {
    fail(name, '.github/skills/reference-corpus-update/SKILL.md not found — rrc.4 implementation required');
  }
})();

// ── T4.2: All four contract markers present (AC1) ────────────────────────────
(function test_contract_markers() {
  const name = 'rrc4-skill-contract-markers-present';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  const missing = [];
  if (!/^name:/m.test(content)) missing.push('name:');
  if (!/^description:/m.test(content)) missing.push('description:');
  if (!/^triggers:/m.test(content)) missing.push('triggers:');
  if (!/##\s+Output|outputs:/i.test(content)) missing.push('outputs section');
  if (missing.length === 0) {
    pass(name);
  } else {
    fail(name, `SKILL.md missing contract markers: ${missing.join(', ')} — check-skill-contracts.js would NOT count this skill`);
  }
})();

// ── T4.3: name: value corresponds to skill directory (AC1) ───────────────────
(function test_name_matches_directory() {
  const name = 'rrc4-skill-name-matches-directory';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  if (!nameMatch) { fail(name, 'SKILL.md has no name: field'); return; }
  const nameValue = nameMatch[1].trim().toLowerCase();
  if (nameValue.includes('reference-corpus-update') || nameValue.includes('reference corpus update')) {
    pass(name);
  } else {
    fail(name, `SKILL.md name: value "${nameMatch[1].trim()}" does not correspond to directory "reference-corpus-update"`);
  }
})();

// ── T4.4: SKILL.md asks for corpus-state.md (AC2) ────────────────────────────
(function test_asks_for_corpus_state() {
  const name = 'rrc4-asks-for-corpus-state-path';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/corpus-state/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference corpus-state.md — required by AC2 as an input');
  }
})();

// ── T4.5: SKILL.md asks for changed file list (AC2) ──────────────────────────
(function test_asks_for_changed_files() {
  const name = 'rrc4-asks-for-changed-file-list';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/changed.?files|modified.?files|files.*changed|diff|changed.*source/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not ask for changed file list — required by AC2');
  }
})();

// ── T4.6: SKILL.md produces DEEPEN scope for matching rules (AC3) ────────────
(function test_deepen_scope() {
  const name = 'rrc4-deepen-scope-for-matching-rules';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/DEEPEN/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference DEEPEN pass — required by AC3 (targeted DEEPEN for changed rules)');
  }
})();

// ── T4.7: SKILL.md references rule IDs in DEEPEN scope (AC3) ─────────────────
(function test_rule_ids_in_deepen() {
  const name = 'rrc4-rule-ids-in-deepen-scope';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  const deepenIdx = content.search(/DEEPEN/i);
  if (deepenIdx === -1) { fail(name, 'SKILL.md has no DEEPEN reference'); return; }
  const region = content.slice(Math.max(0, deepenIdx - 300), deepenIdx + 600).toLowerCase();
  if (/rule.?id|rule id/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference rule IDs in DEEPEN scope instructions — required by AC3');
  }
})();

// ── T4.8: SKILL.md has no-match message (AC4) ────────────────────────────────
(function test_no_match_message() {
  const name = 'rrc4-no-match-message';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/no.*corpus.*rules.*affected|no.*rules.*affected|no.*match|not.*affect/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not include a "No corpus rules affected" message for the no-match case — required by AC4');
  }
})();

// ── T4.9: SKILL.md instructs lastRunAt update (AC5) ──────────────────────────
(function test_last_run_at() {
  const name = 'rrc4-corpus-state-last-run-at';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/lastRunAt|last.?run.?at/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference lastRunAt field for corpus-state.md update — required by AC5');
  }
})();

// ── T4.10: SKILL.md instructs changeNote update (AC5) ────────────────────────
(function test_change_note() {
  const name = 'rrc4-corpus-state-change-note';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/changeNote|change.?note/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference changeNote field for corpus-state.md update — required by AC5');
  }
})();

// ── T4.11: triggers include "update corpus" (AC6) ────────────────────────────
(function test_trigger_update_corpus() {
  const name = 'rrc4-triggers-include-update-corpus';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  const triggersMatch = content.match(/^triggers:([\s\S]*?)(?=^[a-z]|\n---|\n##)/m);
  const triggersBlock = triggersMatch ? triggersMatch[0] : content;
  if (/update corpus|update the corpus/i.test(triggersBlock)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md triggers do not include "update corpus" — required by AC6');
  }
})();

// ── T4.12: triggers include "corpus refresh" (AC6) ───────────────────────────
(function test_trigger_corpus_refresh() {
  const name = 'rrc4-triggers-include-corpus-refresh';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/corpus refresh/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md triggers do not include "corpus refresh" — required by AC6');
  }
})();

// ── T4.13: triggers include "legacy rules" (AC6) ─────────────────────────────
(function test_trigger_legacy_rules() {
  const name = 'rrc4-triggers-include-legacy-rules';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/reference-corpus-update/SKILL.md not found'); return; }
  if (/legacy rules/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md triggers do not include "legacy rules" — required by AC6');
  }
})();

// ── T4.14: SKILL.md line count ≤ 100 (NFR) ───────────────────────────────────
(function test_line_count_nfr() {
  const name = 'rrc4-skill-line-count-within-nfr';
  const content = getContent();
  if (!content) {
    // File doesn't exist yet — not a direct NFR failure, T4.1 already covers the missing file
    pass(name + ' (file not created yet — T4.1 covers this)');
    return;
  }
  const lineCount = content.split('\n').length;
  if (lineCount <= 100) {
    pass(name);
  } else {
    fail(name, `SKILL.md has ${lineCount} lines — exceeds NFR limit of 100 lines`);
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('check-rrc4-corpus-update-skill: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
