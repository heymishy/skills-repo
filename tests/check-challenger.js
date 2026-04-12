#!/usr/bin/env node
/**
 * check-challenger.js
 *
 * Automated tests for the challenger skill (p2.12):
 * challenger spec generation, pre-check result validation, proposal acceptance,
 * rejection, deferral, and improvement-agent SKILL.md.
 *
 * Tests from the test plan:
 *
 *   AC1 — Challenger spec generation:
 *   - proposal-file-read-validates-required-fields
 *   - invalid-proposal-missing-fields-rejects-gracefully
 *   - challenger-spec-written-with-required-sections
 *   - proposed-skill-md-written-with-same-structure
 *   - challenger-spec-proposed-skill-no-credentials
 *   - no-self-modify-improvement-agent-not-targeted
 *
 *   AC2 — Pre-check result recording:
 *   - result-file-all-5-fields-passes-validation
 *   - result-file-missing-field-flagged
 *   - result-file-reviewer-must-be-human
 *   - result-file-immutable-after-creation
 *
 *   AC3 — Proposal acceptance:
 *   - acceptance-applies-proposed-skill-to-target
 *   - acceptance-updates-status-accepted-at-by
 *
 *   AC4 — Proposal rejection:
 *   - rejection-skill-md-unchanged
 *   - rejection-rationale-required
 *   - rejection-records-all-fields
 *
 *   AC5 — Proposal deferral:
 *   - deferral-status-deferred-fields-present
 *   - deferral-proposal-not-resurfaced-before-date
 *   - deferral-can-resurface-for-higher-severity
 *
 *   AC6 — improvement-agent SKILL.md:
 *   - skill-md-discoverable-trigger-phrases
 *   - skill-md-contains-all-8-sections
 *
 *   NFR:
 *   - human-oversight-reviewer-not-ci-job-id
 *   - traceability-proposal-id-in-state-json
 *   - immutability-result-file-not-overwritten
 *
 * Run:  node tests/check-challenger.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var root       = path.join(__dirname, '..');
var challenger = require(path.join(root, 'src', 'improvement-agent', 'challenger.js'));
var detector   = require(path.join(root, 'src', 'improvement-agent', 'failure-detector.js'));

// ── Helpers ───────────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'challenger-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  var entries = fs.readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var full = path.join(dir, entries[i]);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

/**
 * Build a minimal valid proposal file content.
 *
 * @param {object} [overrides] - frontmatter field overrides
 * @returns {string}
 */
function makeProposalContent(overrides) {
  var defaults = {
    evidence:            '["trace-001", "trace-002", "trace-003"]',
    proposed_diff_before: 'Old section content',
    proposed_diff_after:  'New improved section content',
    confidence:          'medium',
    anti_overfitting_gate: 'passed',
    status:              'pending_review',
    created_at:          '2026-04-12T00:00:00.000Z',
    skill_slug:          'definition',
    surface_type:        'ci',
  };
  var o = overrides || {};
  var evidence            = o.evidence            !== undefined ? o.evidence            : defaults.evidence;
  var diff_before         = o.proposed_diff_before !== undefined ? o.proposed_diff_before : defaults.proposed_diff_before;
  var diff_after          = o.proposed_diff_after  !== undefined ? o.proposed_diff_after  : defaults.proposed_diff_after;
  var confidence          = o.confidence          !== undefined ? o.confidence          : defaults.confidence;
  var anti_overfitting    = o.anti_overfitting_gate !== undefined ? o.anti_overfitting_gate : defaults.anti_overfitting_gate;
  var status              = o.status              !== undefined ? o.status              : defaults.status;
  var created_at          = o.created_at          !== undefined ? o.created_at          : defaults.created_at;
  var skill_slug          = o.skill_slug          !== undefined ? o.skill_slug          : defaults.skill_slug;
  var surface_type        = o.surface_type        !== undefined ? o.surface_type        : defaults.surface_type;

  var lines = ['---'];
  if (evidence !== null)         lines.push('evidence: ' + evidence);
  if (diff_before !== null && diff_after !== null) {
    lines.push('proposed_diff:');
    lines.push('  before: "' + diff_before + '"');
    lines.push('  after: "' + diff_after + '"');
  }
  if (confidence !== null)       lines.push('confidence: ' + confidence);
  if (anti_overfitting !== null) lines.push('anti_overfitting_gate: ' + anti_overfitting);
  if (status !== null)           lines.push('status: ' + status);
  if (created_at !== null)       lines.push('created_at: "' + created_at + '"');
  if (skill_slug !== null)       lines.push('skill_slug: ' + skill_slug);
  if (surface_type !== null)     lines.push('surface_type: ' + surface_type);
  lines.push('---');
  lines.push('');
  lines.push('# Proposal Body');
  lines.push('');
  lines.push('Signal description here.');
  return lines.join('\n') + '\n';
}

/**
 * Build a valid challenger-result.md content.
 *
 * @param {object} [overrides] - frontmatter field overrides
 * @returns {string}
 */
function makeResultContent(overrides) {
  var o = overrides || {};
  var verdict         = o.verdict         !== undefined ? o.verdict         : 'pass';
  var session_summary = o.session_summary !== undefined ? o.session_summary : 'Dev session produced updated SKILL.md; assurance session passed all checks.';
  var traces_produced = o.traces_produced !== undefined ? o.traces_produced : 'none';
  var reviewer        = o.reviewer        !== undefined ? o.reviewer        : 'platform-maintainer-1';
  var reviewed_at     = o.reviewed_at     !== undefined ? o.reviewed_at     : '2026-04-12T12:00:00.000Z';

  var lines = ['---'];
  if (verdict         !== null) lines.push('verdict: ' + verdict);
  if (session_summary !== null) lines.push('session_summary: "' + session_summary + '"');
  if (traces_produced !== null) lines.push('traces_produced: ' + traces_produced);
  if (reviewer        !== null) lines.push('reviewer: "' + reviewer + '"');
  if (reviewed_at     !== null) lines.push('reviewed_at: "' + reviewed_at + '"');
  lines.push('---');
  lines.push('');
  lines.push('# Challenger Result');
  return lines.join('\n') + '\n';
}

/**
 * Write a proposal file to a temp directory.
 *
 * @param {string} dir
 * @param {string} filename
 * @param {string} content
 * @returns {string} full file path
 */
function writeFile(dir, filename, content) {
  var p = path.join(dir, filename);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

var tmpBase = mkTmpDir();

// ── AC1: Challenger spec generation ──────────────────────────────────────────

console.log('\n  AC1 — Challenger spec generation');

(function testProposalValidationAllFields() {
  var tmpDir = path.join(tmpBase, 'ac1-valid');
  fs.mkdirSync(tmpDir, { recursive: true });

  var content = makeProposalContent();
  var proposalFile = writeFile(tmpDir, '2026-04-12-definition-failure-proposal.md', content);

  var parsed = challenger.parseMarkdownFrontmatter(content);
  var v = challenger.validateProposal(parsed.frontmatter);

  if (!v.valid) {
    fail('proposal-file-read-validates-required-fields',
      'Expected valid=true, got valid=false. Missing: ' + v.missingFields.join(', '));
    return;
  }
  if (v.missingFields.length !== 0) {
    fail('proposal-file-read-validates-required-fields',
      'Expected 0 missing fields, got: ' + v.missingFields.join(', '));
    return;
  }
  pass('proposal-file-read-validates-required-fields');
}());

(function testProposalMissingFieldsRejected() {
  // Test each required field missing one at a time
  var allFieldsMissing = challenger.REQUIRED_PROPOSAL_FIELDS;
  var allOk = true;

  for (var i = 0; i < allFieldsMissing.length; i++) {
    var field = allFieldsMissing[i];
    var overrides = {};
    // Map field name to the override key
    if (field === 'evidence')             overrides.evidence = null;
    if (field === 'proposed_diff')        { overrides.proposed_diff_before = null; overrides.proposed_diff_after = null; }
    if (field === 'confidence')           overrides.confidence = null;
    if (field === 'anti_overfitting_gate') overrides.anti_overfitting_gate = null;
    if (field === 'status')               overrides.status = null;
    if (field === 'created_at')           overrides.created_at = null;

    var content = makeProposalContent(overrides);
    var parsed = challenger.parseMarkdownFrontmatter(content);
    var v = challenger.validateProposal(parsed.frontmatter);

    if (v.valid) {
      fail('invalid-proposal-missing-fields-rejects-gracefully',
        'Expected invalid when field "' + field + '" is missing, but got valid=true');
      allOk = false;
      break;
    }
    if (!v.missingFields.includes(field)) {
      fail('invalid-proposal-missing-fields-rejects-gracefully',
        'Expected "' + field + '" in missingFields, got: ' + v.missingFields.join(', '));
      allOk = false;
      break;
    }
  }

  if (allOk) pass('invalid-proposal-missing-fields-rejects-gracefully');
}());

(function testChallengerSpecWrittenWithRequiredSections() {
  var tmpDir = path.join(tmpBase, 'ac1-spec');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });

  // Write a minimal target SKILL.md
  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'),
    '# Definition Skill\n\n## Old section content\n\nSome text here.\n', 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-failure-proposal.md', makeProposalContent());

  var result = challenger.generateChallengerSpec(proposalFile, {
    proposalsDir: proposalsDir,
    skillsDir:    skillsDir,
  });

  if (!result.ok) {
    fail('challenger-spec-written-with-required-sections', 'generateChallengerSpec failed: ' + result.error);
    return;
  }

  if (!fs.existsSync(result.specFile)) {
    fail('challenger-spec-written-with-required-sections', 'specFile not written: ' + result.specFile);
    return;
  }

  var specContent = fs.readFileSync(result.specFile, 'utf8');
  var hasUserStory  = specContent.includes('## User Story');
  var hasACs        = specContent.includes('## Acceptance Criteria');
  var hasDone       = specContent.includes('## Done condition');

  if (!hasUserStory || !hasACs || !hasDone) {
    fail('challenger-spec-written-with-required-sections',
      'Missing sections: ' +
      (!hasUserStory ? 'User Story ' : '') +
      (!hasACs ? 'Acceptance Criteria ' : '') +
      (!hasDone ? 'Done condition' : ''));
    return;
  }

  pass('challenger-spec-written-with-required-sections');
}());

(function testProposedSkillMdStructureMatches() {
  var tmpDir = path.join(tmpBase, 'ac1-proposed');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });

  var originalContent = [
    '# Definition Skill',
    '',
    '## Entry condition check',
    '',
    'Check entry conditions.',
    '',
    '## Old section content',
    '',
    'Some text here.',
    '',
    '## Exit',
    '',
    'Exit conditions.',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'), originalContent, 'utf8');

  var proposalContent = makeProposalContent({
    proposed_diff_before: 'Some text here.',
    proposed_diff_after:  'New improved content here.',
  });
  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-struct-proposal.md', proposalContent);

  var result = challenger.generateChallengerSpec(proposalFile, {
    proposalsDir: proposalsDir,
    skillsDir:    skillsDir,
  });

  if (!result.ok) {
    fail('proposed-skill-md-written-with-same-structure', 'generateChallengerSpec failed: ' + result.error);
    return;
  }

  var proposedContent = fs.readFileSync(result.proposedSkillFile, 'utf8');

  // Check that all original headings are preserved
  var headings = ['# Definition Skill', '## Entry condition check', '## Old section content', '## Exit'];
  var allPresent = true;
  for (var h = 0; h < headings.length; h++) {
    if (!proposedContent.includes(headings[h])) {
      fail('proposed-skill-md-written-with-same-structure',
        'Heading missing from proposed-skill.md: ' + headings[h]);
      allPresent = false;
      break;
    }
  }
  if (!allPresent) return;

  // Check that the diff was applied (after content present)
  if (!proposedContent.includes('New improved content here.')) {
    fail('proposed-skill-md-written-with-same-structure',
      'Proposed diff not applied — after content missing');
    return;
  }

  pass('proposed-skill-md-written-with-same-structure');
}());

(function testChallengerSpecNoCredentials() {
  var tmpDir = path.join(tmpBase, 'ac1-nocreds');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });

  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'),
    '# Definition Skill\n\n## Section\n\nOld content.\n', 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-creds-proposal.md', makeProposalContent());

  var result = challenger.generateChallengerSpec(proposalFile, {
    proposalsDir: proposalsDir,
    skillsDir:    skillsDir,
  });

  if (!result.ok) {
    fail('challenger-spec-proposed-skill-no-credentials', 'generateChallengerSpec failed: ' + result.error);
    return;
  }

  var specContent         = fs.readFileSync(result.specFile, 'utf8');
  var proposedContent     = fs.readFileSync(result.proposedSkillFile, 'utf8');
  var combined            = specContent + proposedContent;

  // Check for credential-like patterns
  var credPatterns = [
    /password\s*[:=]\s*\S+/i,
    /secret\s*[:=]\s*\S+/i,
    /api_?key\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
  ];

  var credFound = false;
  for (var i = 0; i < credPatterns.length; i++) {
    if (credPatterns[i].test(combined)) {
      fail('challenger-spec-proposed-skill-no-credentials',
        'Potential credential found matching pattern: ' + credPatterns[i]);
      credFound = true;
      break;
    }
  }

  if (!credFound) pass('challenger-spec-proposed-skill-no-credentials');
}());

(function testNoSelfModify() {
  var tmpDir = path.join(tmpBase, 'ac1-noself');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, challenger.SELF_MODIFY_SKILL_SLUG), { recursive: true });

  // Proposal targeting improvement-agent SKILL.md
  var selfModifyProposal = makeProposalContent({
    skill_slug: challenger.SELF_MODIFY_SKILL_SLUG,
  });
  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-improvement-agent-failure-proposal.md', selfModifyProposal);

  var result = challenger.generateChallengerSpec(proposalFile, {
    proposalsDir: proposalsDir,
    skillsDir:    skillsDir,
  });

  if (result.ok) {
    fail('no-self-modify-improvement-agent-not-targeted',
      'Expected generateChallengerSpec to fail for improvement-agent target, but it succeeded');
    return;
  }

  if (!result.error || !result.error.includes(challenger.SELF_MODIFY_SKILL_SLUG)) {
    fail('no-self-modify-improvement-agent-not-targeted',
      'Error message does not mention self-modify constraint: ' + result.error);
    return;
  }

  pass('no-self-modify-improvement-agent-not-targeted');
}());

// ── AC2: Pre-check result recording ──────────────────────────────────────────

console.log('\n  AC2 — Pre-check result recording');

(function testResultFileAllFieldsValid() {
  var tmpDir = path.join(tmpBase, 'ac2-valid');
  fs.mkdirSync(tmpDir, { recursive: true });

  var resultFile = writeFile(tmpDir, 'test-proposal-challenger-result.md', makeResultContent());

  var v = challenger.validateResultFile(resultFile);

  if (!v.valid) {
    fail('result-file-all-5-fields-passes-validation',
      'Expected valid=true, got false. Missing: ' + v.missingFields.join(', ') +
      ' Warnings: ' + v.warnings.join('; '));
    return;
  }
  if (v.missingFields.length !== 0) {
    fail('result-file-all-5-fields-passes-validation',
      'Expected 0 missing fields, got: ' + v.missingFields.join(', '));
    return;
  }
  if (v.reviewerIsCI) {
    fail('result-file-all-5-fields-passes-validation',
      'Expected reviewerIsCI=false but got true');
    return;
  }
  pass('result-file-all-5-fields-passes-validation');
}());

(function testResultFileMissingFieldFlagged() {
  var requiredFields = challenger.REQUIRED_RESULT_FIELDS;
  var allOk = true;

  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];

    var tmpDir = path.join(tmpBase, 'ac2-missing-' + field);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Set the field to null to omit it
    var overrides = {};
    overrides[field] = null;

    var resultFile = writeFile(tmpDir,
      'test-proposal-challenger-result.md', makeResultContent(overrides));

    var v = challenger.validateResultFile(resultFile);

    if (v.valid) {
      fail('result-file-missing-field-flagged',
        'Expected invalid when field "' + field + '" is absent, but got valid=true');
      allOk = false;
      break;
    }
    if (!v.missingFields.includes(field)) {
      fail('result-file-missing-field-flagged',
        'Expected "' + field + '" in missingFields but got: ' + v.missingFields.join(', '));
      allOk = false;
      break;
    }
  }

  if (allOk) pass('result-file-missing-field-flagged');
}());

(function testResultFileReviewerMustBeHuman() {
  var tmpDir = path.join(tmpBase, 'ac2-reviewer');
  fs.mkdirSync(tmpDir, { recursive: true });

  // CI job ID reviewers that should be rejected
  var ciIdentities = [
    'github-actions',
    'github-actions-bot',
    'copilot',
    'ci-runner',
    'bot',
    'runner',
  ];

  var allOk = true;
  for (var i = 0; i < ciIdentities.length; i++) {
    var identity = ciIdentities[i];
    var resultFile = writeFile(
      tmpDir,
      'result-' + i + '-challenger-result.md',
      makeResultContent({ reviewer: identity })
    );

    var v = challenger.validateResultFile(resultFile);
    if (!v.reviewerIsCI) {
      fail('result-file-reviewer-must-be-human',
        'Expected reviewerIsCI=true for "' + identity + '" but got false');
      allOk = false;
      break;
    }
    if (v.valid) {
      fail('result-file-reviewer-must-be-human',
        'Expected valid=false for CI identity "' + identity + '" but got true');
      allOk = false;
      break;
    }
  }

  if (allOk) pass('result-file-reviewer-must-be-human');
}());

(function testResultFileImmutableAfterCreation() {
  var tmpDir = path.join(tmpBase, 'ac2-immutable');
  fs.mkdirSync(tmpDir, { recursive: true });

  var originalContent = makeResultContent();
  var resultFile = writeFile(tmpDir, 'test-proposal-challenger-result.md', originalContent);

  // Compute hash of original content
  var originalHash = Buffer.from(originalContent).toString('base64');

  // Validate (should pass)
  var v = challenger.validateResultFile(resultFile);
  if (!v.valid) {
    fail('result-file-immutable-after-creation', 'Result file validation failed unexpectedly');
    return;
  }

  // Read after validation — content should be unchanged
  var afterContent = fs.readFileSync(resultFile, 'utf8');
  var afterHash = Buffer.from(afterContent).toString('base64');

  if (originalHash !== afterHash) {
    fail('result-file-immutable-after-creation',
      'Result file content changed after validateResultFile call — must be immutable');
    return;
  }

  pass('result-file-immutable-after-creation');
}());

// ── AC3: Proposal acceptance ─────────────────────────────────────────────────

console.log('\n  AC3 — Proposal acceptance');

(function testAcceptanceAppliesProposedSkill() {
  var tmpDir = path.join(tmpBase, 'ac3-apply');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var originalSkillContent = '# Definition Skill\n\n## Section\n\nOld content.\n';
  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'), originalSkillContent, 'utf8');

  var proposalId = '2026-04-12-definition-accept-proposal';
  var proposalFile = writeFile(proposalsDir, proposalId + '.md', makeProposalContent({
    proposed_diff_before: 'Old content.',
    proposed_diff_after:  'New accepted content.',
  }));

  // Write proposed-skill.md
  var proposedSkillContent = '# Definition Skill\n\n## Section\n\nNew accepted content.\n';
  fs.writeFileSync(
    path.join(proposalsDir, proposalId + '-proposed-skill.md'),
    proposedSkillContent, 'utf8'
  );

  // Write challenger-result.md with verdict: pass
  fs.writeFileSync(
    path.join(proposalsDir, proposalId + '-challenger-result.md'),
    makeResultContent({ verdict: 'pass' }), 'utf8'
  );

  var result = challenger.acceptProposal(proposalFile, 'platform-maintainer-1', {
    proposalsDir:  proposalsDir,
    skillsDir:     skillsDir,
    stateJsonPath: stateJson,
    skipGitCommit: true,
  });

  if (!result.ok) {
    fail('acceptance-applies-proposed-skill-to-target', 'acceptProposal failed: ' + result.error);
    return;
  }

  // Check target SKILL.md content was updated
  var updatedSkill = fs.readFileSync(path.join(skillsDir, 'definition', 'SKILL.md'), 'utf8');
  if (updatedSkill !== proposedSkillContent) {
    fail('acceptance-applies-proposed-skill-to-target',
      'Target SKILL.md content was not updated to proposed-skill.md content');
    return;
  }

  pass('acceptance-applies-proposed-skill-to-target');
}());

(function testAcceptanceUpdatesStatusFields() {
  var tmpDir = path.join(tmpBase, 'ac3-status');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');
  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'),
    '# Definition Skill\n\n## Section\n\nOld content.\n', 'utf8');

  var proposalId = '2026-04-12-definition-status-proposal';
  var proposalFile = writeFile(proposalsDir, proposalId + '.md', makeProposalContent());

  // Write proposed-skill.md and result.md
  fs.writeFileSync(
    path.join(proposalsDir, proposalId + '-proposed-skill.md'),
    '# Definition Skill\n\n## Section\n\nUpdated content.\n', 'utf8'
  );
  fs.writeFileSync(
    path.join(proposalsDir, proposalId + '-challenger-result.md'),
    makeResultContent({ verdict: 'pass' }), 'utf8'
  );

  var acceptedBy = 'platform-maintainer-2';
  var result = challenger.acceptProposal(proposalFile, acceptedBy, {
    proposalsDir:  proposalsDir,
    skillsDir:     skillsDir,
    stateJsonPath: stateJson,
    skipGitCommit: true,
  });

  if (!result.ok) {
    fail('acceptance-updates-status-accepted-at-by', 'acceptProposal failed: ' + result.error);
    return;
  }

  // Read updated proposal
  var updatedContent = fs.readFileSync(proposalFile, 'utf8');
  var parsed = challenger.parseMarkdownFrontmatter(updatedContent);
  var fm = parsed.frontmatter;

  if (fm.status !== 'accepted') {
    fail('acceptance-updates-status-accepted-at-by',
      'Expected status=accepted, got: ' + fm.status);
    return;
  }
  if (!fm.accepted_at || isNaN(new Date(fm.accepted_at).getTime())) {
    fail('acceptance-updates-status-accepted-at-by',
      'accepted_at missing or invalid ISO datetime: ' + fm.accepted_at);
    return;
  }
  if (fm.accepted_by !== acceptedBy) {
    fail('acceptance-updates-status-accepted-at-by',
      'Expected accepted_by="' + acceptedBy + '", got: ' + fm.accepted_by);
    return;
  }

  pass('acceptance-updates-status-accepted-at-by');
}());

// ── AC4: Proposal rejection ───────────────────────────────────────────────────

console.log('\n  AC4 — Proposal rejection');

(function testRejectionSkillMdUnchanged() {
  var tmpDir = path.join(tmpBase, 'ac4-unchanged');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var originalSkillContent = '# Definition Skill\n\n## Section\n\nOriginal content.\n';
  var skillPath = path.join(skillsDir, 'definition', 'SKILL.md');
  fs.writeFileSync(skillPath, originalSkillContent, 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-reject-proposal.md', makeProposalContent());

  var result = challenger.rejectProposal(
    proposalFile,
    'platform-maintainer-1',
    'Change would remove a currently-passing check.',
    { stateJsonPath: stateJson }
  );

  if (!result.ok) {
    fail('rejection-skill-md-unchanged', 'rejectProposal failed: ' + result.error);
    return;
  }

  // SKILL.md must be byte-identical to pre-rejection state
  var afterContent = fs.readFileSync(skillPath, 'utf8');
  if (afterContent !== originalSkillContent) {
    fail('rejection-skill-md-unchanged',
      'SKILL.md was modified on rejection — must be unchanged');
    return;
  }

  pass('rejection-skill-md-unchanged');
}());

(function testRejectionRationaleRequired() {
  var tmpDir = path.join(tmpBase, 'ac4-rationale');
  var proposalsDir = path.join(tmpDir, 'proposals');
  fs.mkdirSync(proposalsDir, { recursive: true });

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-rationale-proposal.md', makeProposalContent());

  // Empty string rationale
  var resultEmpty = challenger.rejectProposal(
    proposalFile,
    'platform-maintainer-1',
    ''
  );

  if (resultEmpty.ok) {
    fail('rejection-rationale-required',
      'Expected rejection to fail with empty rationale, but it succeeded');
    return;
  }

  if (!resultEmpty.error || !resultEmpty.error.includes('rejection_rationale')) {
    fail('rejection-rationale-required',
      'Error message does not mention rejection_rationale: ' + resultEmpty.error);
    return;
  }

  // Absent rationale (null/undefined)
  var resultNull = challenger.rejectProposal(
    proposalFile,
    'platform-maintainer-1',
    null
  );

  if (resultNull.ok) {
    fail('rejection-rationale-required',
      'Expected rejection to fail with null rationale, but it succeeded');
    return;
  }

  pass('rejection-rationale-required');
}());

(function testRejectionRecordsAllFields() {
  var tmpDir = path.join(tmpBase, 'ac4-fields');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-fields-proposal.md', makeProposalContent());

  var rejectedBy = 'platform-maintainer-3';
  var rationale  = 'Proposed change weakens an essential guard.';

  var result = challenger.rejectProposal(
    proposalFile,
    rejectedBy,
    rationale,
    { stateJsonPath: stateJson }
  );

  if (!result.ok) {
    fail('rejection-records-all-fields', 'rejectProposal failed: ' + result.error);
    return;
  }

  var updatedContent = fs.readFileSync(proposalFile, 'utf8');
  var parsed = challenger.parseMarkdownFrontmatter(updatedContent);
  var fm = parsed.frontmatter;

  if (fm.status !== 'rejected') {
    fail('rejection-records-all-fields', 'Expected status=rejected, got: ' + fm.status);
    return;
  }
  if (!fm.rejected_at || isNaN(new Date(fm.rejected_at).getTime())) {
    fail('rejection-records-all-fields',
      'rejected_at missing or invalid: ' + fm.rejected_at);
    return;
  }
  if (fm.rejected_by !== rejectedBy) {
    fail('rejection-records-all-fields',
      'Expected rejected_by="' + rejectedBy + '", got: ' + fm.rejected_by);
    return;
  }
  if (fm.rejection_rationale !== rationale) {
    fail('rejection-records-all-fields',
      'Expected rejection_rationale="' + rationale + '", got: ' + fm.rejection_rationale);
    return;
  }

  pass('rejection-records-all-fields');
}());

// ── AC5: Proposal deferral ────────────────────────────────────────────────────

console.log('\n  AC5 — Proposal deferral');

(function testDeferralFieldsPresent() {
  var tmpDir = path.join(tmpBase, 'ac5-defer');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-defer-proposal.md', makeProposalContent());

  var deferredUntil  = '2027-01-01';
  var deferralReason = 'Untimely — Phase 3 scope.';

  var result = challenger.deferProposal(
    proposalFile,
    deferredUntil,
    deferralReason,
    { stateJsonPath: stateJson }
  );

  if (!result.ok) {
    fail('deferral-status-deferred-fields-present', 'deferProposal failed: ' + result.error);
    return;
  }

  var updatedContent = fs.readFileSync(proposalFile, 'utf8');
  var parsed = challenger.parseMarkdownFrontmatter(updatedContent);
  var fm = parsed.frontmatter;

  if (fm.status !== 'deferred') {
    fail('deferral-status-deferred-fields-present', 'Expected status=deferred, got: ' + fm.status);
    return;
  }
  if (fm.deferred_until !== deferredUntil) {
    fail('deferral-status-deferred-fields-present',
      'Expected deferred_until="' + deferredUntil + '", got: ' + fm.deferred_until);
    return;
  }
  if (fm.deferral_reason !== deferralReason) {
    fail('deferral-status-deferred-fields-present',
      'Expected deferral_reason="' + deferralReason + '", got: ' + fm.deferral_reason);
    return;
  }

  pass('deferral-status-deferred-fields-present');
}());

(function testDeferralNotResurfacedBeforeDate() {
  var tmpDir = path.join(tmpBase, 'ac5-suppress');
  var tracesDir    = path.join(tmpDir, 'traces');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(tracesDir,    { recursive: true });
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  // Write 3 traces with the same failure pattern + skill slug (triggers signal)
  var skillSlug   = 'definition';
  var pattern     = 'missing-test-coverage';
  var surfaceType = 'ci';

  for (var i = 0; i < 3; i++) {
    fs.writeFileSync(
      path.join(tracesDir, 't' + i + '.json'),
      JSON.stringify({
        traceId:        'defer-t' + i,
        storySlug:      'story-' + i,
        skillSlug:      skillSlug,
        surfaceType:    surfaceType,
        createdAt:      '2026-04-0' + (i + 1) + 'T00:00:00Z',
        failurePattern: pattern,
        checks:         [],
      }) + '\n', 'utf8'
    );
  }

  // Write a deferred proposal for the same skill + pattern
  var deferredContent = makeProposalContent({
    skill_slug:   skillSlug,
    surface_type: surfaceType,
    status:       'deferred',
  });
  // Manually add deferred_until and deferral_reason to the file
  deferredContent = deferredContent.replace(
    'status: deferred',
    'status: deferred\ndeferred_until: "2099-12-31"\ndeferral_reason: "Phase 3 scope."'
  );
  // Also add pattern field
  deferredContent = deferredContent.replace(
    'skill_slug: definition',
    'skill_slug: definition\npattern: missing-test-coverage'
  );
  var deferredFile = writeFile(proposalsDir,
    '2026-04-10-definition-existing-deferred.md', deferredContent);

  // Run the improvement agent — should NOT create a new proposal for the same pattern
  var now = new Date('2026-04-12T00:00:00Z');
  var runResult = detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: stateJson,
    now:          now,
  });

  // Count new proposal files (not including the pre-existing deferred one)
  var files = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.endsWith('.md') &&
           f !== '2026-04-10-definition-existing-deferred.md' &&
           !f.includes('-overfitting-warning') &&
           !f.includes('-challenger-spec') &&
           !f.includes('-challenger-result') &&
           !f.includes('-proposed-skill');
  });

  if (files.length > 0) {
    fail('deferral-proposal-not-resurfaced-before-date',
      'Expected no new proposal files (deferral active), but found: ' + files.join(', '));
    return;
  }

  pass('deferral-proposal-not-resurfaced-before-date');
}());

(function testDeferralCanResurfaceForHigherSeverity() {
  var tmpDir = path.join(tmpBase, 'ac5-resurface');
  var tracesDir    = path.join(tmpDir, 'traces');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(tracesDir,    { recursive: true });
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var skillSlug   = 'definition';
  var pattern     = 'missing-test-coverage';
  var surfaceType = 'ci';

  // Write 5 traces to generate a HIGH confidence signal (count >= 5)
  for (var i = 0; i < 5; i++) {
    fs.writeFileSync(
      path.join(tracesDir, 'resurface-t' + i + '.json'),
      JSON.stringify({
        traceId:        'resurface-' + i,
        storySlug:      'story-' + i,
        skillSlug:      skillSlug,
        surfaceType:    surfaceType,
        createdAt:      '2026-04-0' + (i + 1) + 'T00:00:00Z',
        failurePattern: pattern,
        checks:         [],
      }) + '\n', 'utf8'
    );
  }

  // Write a deferred proposal with MEDIUM confidence (count 3) for same skill + pattern
  var deferredContent = makeProposalContent({
    skill_slug:   skillSlug,
    surface_type: surfaceType,
    confidence:   'medium',
    status:       'deferred',
  });
  deferredContent = deferredContent.replace(
    'status: deferred',
    'status: deferred\ndeferred_until: "2099-12-31"\ndeferral_reason: "Phase 3 scope."'
  );
  deferredContent = deferredContent.replace(
    'skill_slug: definition',
    'skill_slug: definition\npattern: missing-test-coverage'
  );
  writeFile(proposalsDir, '2026-04-10-definition-medium-deferred.md', deferredContent);

  // Run improvement agent with 5 traces — should create a HIGH confidence proposal
  // (higher than the deferred MEDIUM confidence)
  var now = new Date('2026-04-12T00:00:00Z');
  var runResult = detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: stateJson,
    now:          now,
  });

  // Expect a new proposal file
  var newFiles = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.endsWith('.md') &&
           f !== '2026-04-10-definition-medium-deferred.md' &&
           !f.includes('-overfitting-warning') &&
           !f.includes('-challenger-spec') &&
           !f.includes('-challenger-result') &&
           !f.includes('-proposed-skill');
  });

  if (newFiles.length === 0) {
    fail('deferral-can-resurface-for-higher-severity',
      'Expected a new proposal for higher-severity signal, but no new proposal found');
    return;
  }

  // Check that the new proposal references the deferred proposal
  var newFile = path.join(proposalsDir, newFiles[0]);
  var newContent = fs.readFileSync(newFile, 'utf8');
  var parsed = challenger.parseMarkdownFrontmatter(newContent);

  if (!parsed.frontmatter.deferred_reference) {
    fail('deferral-can-resurface-for-higher-severity',
      'New proposal does not contain deferred_reference field');
    return;
  }

  pass('deferral-can-resurface-for-higher-severity');
}());

// ── AC6: improvement-agent SKILL.md ──────────────────────────────────────────

console.log('\n  AC6 — improvement-agent SKILL.md');

(function testSkillMdDiscoverableTriggerPhrases() {
  var skillMdPath = path.join(root, '.github', 'skills', 'improvement-agent', 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    fail('skill-md-discoverable-trigger-phrases',
      'SKILL.md not found at: ' + skillMdPath);
    return;
  }

  var content = fs.readFileSync(skillMdPath, 'utf8');

  var requiredTriggers = [
    '/improvement-agent',
    'review proposals',
    'challenger pre-check',
    'generate proposals',
  ];

  var missingTriggers = [];
  for (var i = 0; i < requiredTriggers.length; i++) {
    if (!content.includes(requiredTriggers[i])) {
      missingTriggers.push(requiredTriggers[i]);
    }
  }

  if (missingTriggers.length > 0) {
    fail('skill-md-discoverable-trigger-phrases',
      'Missing trigger phrases: ' + missingTriggers.join(', '));
    return;
  }

  pass('skill-md-discoverable-trigger-phrases');
}());

(function testSkillMdContainsAll8Sections() {
  var skillMdPath = path.join(root, '.github', 'skills', 'improvement-agent', 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    fail('skill-md-contains-all-8-sections',
      'SKILL.md not found at: ' + skillMdPath);
    return;
  }

  var content = fs.readFileSync(skillMdPath, 'utf8');

  // Extract body only (skip frontmatter) to avoid trigger phrases confusing section order check
  var bodyStart = 0;
  if (content.startsWith('---')) {
    var endFm = content.indexOf('\n---', 3);
    if (endFm !== -1) {
      bodyStart = endFm + 4; // skip past closing ---
    }
  }
  var body = content.substring(bodyStart);

  // Required sections in order (from story AC6)
  var requiredSections = [
    'trace interface',             // section 1
    'failure signal detection',    // section 2
    'staleness',                   // section 3
    'anti-overfitting',            // section 4
    'challenger pre-check',        // section 5
    'pre-check result',            // section 6
    'proposal review workflow',    // section 7
    'state.json',                  // section 8
  ];

  var missingSections = [];
  for (var i = 0; i < requiredSections.length; i++) {
    if (!body.toLowerCase().includes(requiredSections[i].toLowerCase())) {
      missingSections.push(requiredSections[i]);
    }
  }

  if (missingSections.length > 0) {
    fail('skill-md-contains-all-8-sections',
      'Missing required sections: ' + missingSections.join(', '));
    return;
  }

  // Verify sections appear in correct order in the body
  var positions = requiredSections.map(function (s) {
    return body.toLowerCase().indexOf(s.toLowerCase());
  });
  var outOfOrder = false;
  for (var j = 1; j < positions.length; j++) {
    if (positions[j] < positions[j - 1]) {
      outOfOrder = true;
      fail('skill-md-contains-all-8-sections',
        'Section "' + requiredSections[j] + '" appears before "' + requiredSections[j - 1] + '"');
      break;
    }
  }

  if (!outOfOrder) pass('skill-md-contains-all-8-sections');
}());

// ── NFR Tests ─────────────────────────────────────────────────────────────────

console.log('\n  NFR — Human oversight, traceability, immutability');

(function testHumanOversightReviewerNotCiJobId() {
  var tmpDir = path.join(tmpBase, 'nfr-ci');
  fs.mkdirSync(tmpDir, { recursive: true });

  var ciIdentity = 'copilot-swe-agent';
  var resultFile = writeFile(tmpDir,
    'nfr-proposal-challenger-result.md',
    makeResultContent({ reviewer: ciIdentity })
  );

  var v = challenger.validateResultFile(resultFile);
  if (!v.reviewerIsCI) {
    fail('human-oversight-reviewer-not-ci-job-id',
      'Expected reviewerIsCI=true for "' + ciIdentity + '" but got false');
    return;
  }
  if (v.valid) {
    fail('human-oversight-reviewer-not-ci-job-id',
      'Expected valid=false for CI identity "' + ciIdentity + '" but got true');
    return;
  }

  // Also verify the SKILL.md states reviewer must be human
  var skillMdPath = path.join(root, '.github', 'skills', 'improvement-agent', 'SKILL.md');
  if (fs.existsSync(skillMdPath)) {
    var skillContent = fs.readFileSync(skillMdPath, 'utf8');
    var mentionsHuman = skillContent.toLowerCase().includes('human identity') ||
                        skillContent.toLowerCase().includes('named human');
    if (!mentionsHuman) {
      fail('human-oversight-reviewer-not-ci-job-id',
        'SKILL.md does not mention reviewer must be a named human identity');
      return;
    }
  }

  pass('human-oversight-reviewer-not-ci-job-id');
}());

(function testTraceabilityProposalIdInStateJson() {
  var tmpDir = path.join(tmpBase, 'nfr-trace');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');

  var proposalFile = writeFile(proposalsDir,
    '2026-04-12-definition-trace-proposal.md', makeProposalContent());

  // Reject the proposal to trigger state.json update
  challenger.rejectProposal(
    proposalFile,
    'platform-maintainer-1',
    'Test traceability rejection.',
    { stateJsonPath: stateJson }
  );

  var state = JSON.parse(fs.readFileSync(stateJson, 'utf8'));
  if (!Array.isArray(state.proposals) || state.proposals.length === 0) {
    fail('traceability-proposal-id-in-state-json',
      'Expected state.json proposals block to have an entry after rejection');
    return;
  }

  var entry = state.proposals[0];
  if (!entry.file || !entry.status) {
    fail('traceability-proposal-id-in-state-json',
      'state.json proposal entry missing file or status fields: ' + JSON.stringify(entry));
    return;
  }

  if (entry.status !== 'rejected') {
    fail('traceability-proposal-id-in-state-json',
      'Expected status=rejected in state.json, got: ' + entry.status);
    return;
  }

  pass('traceability-proposal-id-in-state-json');
}());

(function testImmutabilityResultFileNotOverwritten() {
  var tmpDir = path.join(tmpBase, 'nfr-immutable');
  var proposalsDir = path.join(tmpDir, 'proposals');
  var skillsDir    = path.join(tmpDir, 'skills');
  var stateJson    = path.join(tmpDir, 'state.json');
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(path.join(skillsDir, 'definition'), { recursive: true });
  fs.writeFileSync(stateJson, JSON.stringify({ proposals: [] }), 'utf8');
  fs.writeFileSync(path.join(skillsDir, 'definition', 'SKILL.md'),
    '# Definition Skill\n\n## Section\n\nOriginal.\n', 'utf8');

  var proposalId = '2026-04-12-definition-immutable-proposal';
  var proposalFile = writeFile(proposalsDir, proposalId + '.md', makeProposalContent());

  // Write result.md
  var resultFile = path.join(proposalsDir, proposalId + '-challenger-result.md');
  var originalResultContent = makeResultContent({ verdict: 'pass' });
  fs.writeFileSync(resultFile, originalResultContent, 'utf8');
  var originalResultHash = Buffer.from(originalResultContent).toString('base64');

  // Write proposed-skill.md
  fs.writeFileSync(
    path.join(proposalsDir, proposalId + '-proposed-skill.md'),
    '# Definition Skill\n\n## Section\n\nUpdated.\n', 'utf8'
  );

  // Accept the proposal (triggers use of the result file)
  challenger.acceptProposal(proposalFile, 'platform-maintainer-1', {
    proposalsDir:  proposalsDir,
    skillsDir:     skillsDir,
    stateJsonPath: stateJson,
    skipGitCommit: true,
  });

  // Check result.md content is unchanged
  var afterResultContent = fs.readFileSync(resultFile, 'utf8');
  var afterResultHash = Buffer.from(afterResultContent).toString('base64');

  if (originalResultHash !== afterResultHash) {
    fail('immutability-result-file-not-overwritten',
      'challenger-result.md was modified during acceptance workflow — must be immutable');
    return;
  }

  pass('immutability-result-file-not-overwritten');
}());

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');

if (failed === 0) {
  console.log('  All ' + passed + ' test(s) passed.');
} else {
  console.log('  ' + passed + ' passed, ' + failed + ' failed.');
  console.log('');
  failures.forEach(function (f) {
    console.log('  FAILED: ' + f.name);
    console.log('    ' + f.reason);
  });
}

// Cleanup temp directory
try { rmDir(tmpBase); } catch (e) { /* ignore */ }

if (failed > 0) {
  process.exit(1);
}
