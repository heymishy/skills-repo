'use strict';
// check-mig1-migration-plan-skill.js
// TDD tests for mig.1: schema-migration-plan SKILL.md.
// 12 unit tests + 1 NFR. RED until .github/skills/schema-migration-plan/SKILL.md is created.

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var SKILL_PATH = path.join(__dirname, '../.github/skills/schema-migration-plan/SKILL.md');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    failures.push({ name: name, err: err });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
  }
}

var skillContent = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

console.log('\ncheck-mig1-migration-plan-skill.js');
console.log('====================================');

// ---------------------------------------------------------------------------
// T1 — file exists (AC1)
// ---------------------------------------------------------------------------
test('T1: .github/skills/schema-migration-plan/SKILL.md exists', function() {
  assert.ok(fs.existsSync(SKILL_PATH), 'T1: SKILL.md must exist at .github/skills/schema-migration-plan/SKILL.md');
});

// ---------------------------------------------------------------------------
// T2 — output path convention documented (AC1)
// ---------------------------------------------------------------------------
test('T2: SKILL.md specifies output path artefacts/[feature]/migrations/[story-id]-migration-plan.md', function() {
  assert.ok(
    /artefacts\/\[feature\]\/migrations\/\[story-id\]-migration-plan\.md/.test(skillContent) ||
    /artefacts\/\[feature\]\/migrations\//.test(skillContent),
    'T2: SKILL.md must specify artefact output at artefacts/[feature]/migrations/[story-id]-migration-plan.md'
  );
});

// ---------------------------------------------------------------------------
// T3 — five mandatory sections present in template (AC1)
// ---------------------------------------------------------------------------
test('T3: SKILL.md artefact template includes all five mandatory sections', function() {
  var hasClassification = /classification|classify/i.test(skillContent);
  var hasForward = /forward migration/i.test(skillContent);
  var hasRollback = /rollback migration/i.test(skillContent);
  var hasTier = /tier.applicability|tier-applicability|tier applicability/i.test(skillContent);
  var hasPrivacy = /staging.snapshot.privacy|staging snapshot privacy/i.test(skillContent);
  assert.ok(hasClassification, 'T3: SKILL.md must name "classification" section');
  assert.ok(hasForward, 'T3: SKILL.md must name "forward migration" section');
  assert.ok(hasRollback, 'T3: SKILL.md must name "rollback migration" section');
  assert.ok(hasTier, 'T3: SKILL.md must name "tier applicability" section');
  assert.ok(hasPrivacy, 'T3: SKILL.md must name "staging snapshot privacy" section');
});

// ---------------------------------------------------------------------------
// T4 — breaking classification requires non-blank rollback (AC2)
// ---------------------------------------------------------------------------
test('T4: SKILL.md requires non-blank rollback when classification is breaking', function() {
  assert.ok(
    /breaking[\s\S]{0,800}rollback[\s\S]{0,200}(non-blank|must not be blank|required|mandatory|must be provided|must provide)/im.test(skillContent) ||
    /breaking[\s\S]{0,800}blank[\s\S]{0,200}rollback/im.test(skillContent) ||
    /rollback[\s\S]{0,400}(required|mandatory)[\s\S]{0,400}breaking/im.test(skillContent),
    'T4: SKILL.md must state that breaking classification requires a non-blank rollback migration field'
  );
});

// ---------------------------------------------------------------------------
// T5 — breaking migration definition present (AC2)
// ---------------------------------------------------------------------------
test('T5: SKILL.md defines what constitutes a breaking migration', function() {
  var hasRename = /rename.*column|column.*rename/i.test(skillContent);
  var hasDrop = /drop.*column|drop.*table|remove.*table|remove.*column/i.test(skillContent);
  var hasTypeChange = /change.*type|alter.*type|column.*type/i.test(skillContent);
  var hasNotNull = /NOT NULL|not null/i.test(skillContent);
  assert.ok(
    hasRename || hasDrop || hasTypeChange || hasNotNull,
    'T5: SKILL.md must define breaking migration indicators (column rename/drop, type change, NOT NULL)'
  );
});

// ---------------------------------------------------------------------------
// T6 — additive-only still requires rollback (AC3)
// ---------------------------------------------------------------------------
test('T6: SKILL.md requires rollback even for additive-only classification', function() {
  assert.ok(
    /additive.only[\s\S]{0,800}rollback[\s\S]{0,200}(required|mandatory|must)/im.test(skillContent) ||
    /rollback[\s\S]{0,200}(required|mandatory)[\s\S]{0,200}(all|additive|both)/im.test(skillContent) ||
    /rollback[\s\S]{0,400}(all classification|additive)/im.test(skillContent) ||
    (/additive/i.test(skillContent) && /rollback.*(required|mandatory)/i.test(skillContent)),
    'T6: SKILL.md must state rollback is required even for additive-only migrations'
  );
});

// ---------------------------------------------------------------------------
// T7 — additive-only migration definition present (AC3)
// ---------------------------------------------------------------------------
test('T7: SKILL.md defines what constitutes an additive-only migration', function() {
  var hasNullable = /nullable.column|adds.*column|new.*column/i.test(skillContent);
  var hasNewTable = /new.*table|add.*table/i.test(skillContent);
  var hasIndex = /index/i.test(skillContent);
  assert.ok(
    hasNullable || hasNewTable || hasIndex,
    'T7: SKILL.md must define additive-only migration examples (nullable column, new table, index)'
  );
});

// ---------------------------------------------------------------------------
// T8 — tier applicability covers all four tiers (AC4)
// ---------------------------------------------------------------------------
test('T8: tier-applicability section names all four tiers: local, ci, staging, production', function() {
  var hasLocal = /local/i.test(skillContent);
  var hasCI = /\bci\b|continuous.integration/i.test(skillContent);
  var hasStaging = /staging/i.test(skillContent);
  var hasProduction = /production/i.test(skillContent);
  assert.ok(hasLocal, 'T8: SKILL.md must name "local" tier');
  assert.ok(hasCI, 'T8: SKILL.md must name "ci" tier');
  assert.ok(hasStaging, 'T8: SKILL.md must name "staging" tier');
  assert.ok(hasProduction, 'T8: SKILL.md must name "production" tier');
});

// ---------------------------------------------------------------------------
// T9 — tier applicability has validation-status column (AC4)
// ---------------------------------------------------------------------------
test('T9: tier-applicability template includes a validation-status column', function() {
  assert.ok(
    /validation.status|validation status/i.test(skillContent),
    'T9: SKILL.md tier-applicability template must include a validation-status column'
  );
});

// ---------------------------------------------------------------------------
// T10 — staging in scope requires privacy declaration (AC5)
// ---------------------------------------------------------------------------
test('T10: SKILL.md requires staging-snapshot-privacy declaration when staging is in scope', function() {
  assert.ok(
    /staging.*scope[\s\S]{0,600}privacy|privacy[\s\S]{0,600}staging.*scope/im.test(skillContent) ||
    /staging.snapshot.privacy[\s\S]{0,400}(required|mandatory|must|non-blank)/im.test(skillContent) ||
    (/staging/i.test(skillContent) && /privacy/i.test(skillContent) && /(required|mandatory|must not be blank)/i.test(skillContent)),
    'T10: SKILL.md must require staging-snapshot-privacy when staging tier is in scope'
  );
});

// ---------------------------------------------------------------------------
// T11 — staging-data-policy.md template referenced (AC5)
// ---------------------------------------------------------------------------
test('T11: SKILL.md references staging-data-policy.md template', function() {
  assert.ok(
    /staging-data-policy\.md|staging-data-policy/i.test(skillContent),
    'T11: SKILL.md must reference the staging-data-policy.md template'
  );
});

// ---------------------------------------------------------------------------
// T12 — no hardcoded database tool names in required instruction contexts (ADR-004)
// ---------------------------------------------------------------------------
test('T12: SKILL.md contains no hardcoded database tool names in required instruction contexts (ADR-004)', function() {
  var forbiddenInRequired = [
    { pattern: /\bFlyway\b/, name: 'Flyway' },
    { pattern: /\bAlembic\b/, name: 'Alembic' },
    { pattern: /\bLiquibase\b/, name: 'Liquibase' },
    { pattern: /\bpsql\b/, name: 'psql' },
    { pattern: /\bredis-cli\b/, name: 'redis-cli' }
  ];
  var found = forbiddenInRequired.filter(function(t) { return t.pattern.test(skillContent); });
  assert.strictEqual(found.length, 0,
    'T12: SKILL.md must not hardcode tool names in required instruction contexts: ' + found.map(function(t) { return t.name; }).join(', '));
});

// ---------------------------------------------------------------------------
// NFR — credentials warning present in skill instructions (Security NFR)
// ---------------------------------------------------------------------------
test('NFR: SKILL.md warns against pasting credentials/connection strings in migration command fields', function() {
  assert.ok(
    /credential|password|connection.string|token|secret/i.test(skillContent) &&
    /warn|must not|do not|never|avoid/i.test(skillContent),
    'NFR: SKILL.md must warn against pasting production credentials or connection strings into migration command fields'
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + (failed === 0 ? 'All ' + passed + ' tests passing' : passed + ' passing, ' + failed + ' failing'));
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f) { console.log('  ' + f.name + '\n    ' + (f.err && f.err.message || f.err)); });
}
process.exit(failed > 0 ? 1 : 0);
