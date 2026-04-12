#!/usr/bin/env node
/**
 * challenger.js
 *
 * Challenger skill procedure for the improvement agent (p2.12).
 *
 * This module manages the proposal review workflow:
 *   AC1 — generateChallengerSpec: write challenger-spec.md + proposed-skill.md for a proposal
 *   AC2 — validateResultFile: validate a challenger-result.md (5 required fields)
 *   AC3 — acceptProposal: apply proposed-skill.md to target SKILL.md; update status accepted
 *   AC4 — rejectProposal: record rejection with mandatory rationale; SKILL.md unchanged
 *   AC5 — deferProposal: record deferral with deferred_until + deferral_reason; SKILL.md unchanged
 *
 * Proposal status lifecycle (schema-first ADR-003):
 *   pending_review → accepted | rejected | deferred
 *
 * CLI usage:
 *   node src/improvement-agent/challenger.js --proposal workspace/proposals/[file.md]
 *   node src/improvement-agent/challenger.js --validate-result workspace/proposals/[result.md]
 *
 * No auto-spawn of new Copilot sessions (A3 — human-assisted Phase 2).
 * No credentials or personal data in proposal files or decision entries (MC-SEC-02, AP-02).
 * No hardcoded skill names, proposal IDs, or thresholds (ADR-004).
 * No self-modify: improvement-agent SKILL.md cannot be targeted by any proposal.
 *
 * Zero external dependencies — plain Node.js (fs, path, child_process).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var cp   = require('child_process');

// ── Constants ─────────────────────────────────────────────────────────────────

var ROOT = path.join(__dirname, '..', '..');
var DEFAULT_PROPOSALS_DIR  = path.join(ROOT, 'workspace', 'proposals');
var DEFAULT_SKILLS_DIR     = path.join(ROOT, '.github', 'skills');
var DEFAULT_STATE_JSON     = path.join(ROOT, 'workspace', 'state.json');

// The improvement-agent SKILL.md is excluded from self-modification (no-self-modify constraint)
var SELF_MODIFY_SKILL_SLUG = 'improvement-agent';

// CI job identity patterns that are NOT valid human reviewer identities (AC2, NFR)
var CI_IDENTITY_PATTERNS = [
  /^github-actions/i,
  /^copilot$/i,
  /copilot-swe-agent/i,
  /^ci-/i,
  /^bot$/i,
  /^runner$/i,
  /\bbot\b/i,
];

// Required fields for a proposal file (AC1 validation, from p2.11 schema)
var REQUIRED_PROPOSAL_FIELDS = [
  'evidence',
  'proposed_diff',
  'confidence',
  'anti_overfitting_gate',
  'status',
  'created_at',
];

// Required fields for a challenger-result.md (AC2)
var REQUIRED_RESULT_FIELDS = [
  'verdict',
  'session_summary',
  'traces_produced',
  'reviewer',
  'reviewed_at',
];

// ── YAML frontmatter parser ───────────────────────────────────────────────────

/**
 * Parse YAML frontmatter from a markdown file.
 * Handles scalar values, quoted strings, and simple nested objects (proposed_diff).
 *
 * @param {string} content - raw file content
 * @returns {{ frontmatter: object, body: string }}
 */
function parseMarkdownFrontmatter(content) {
  var result = { frontmatter: {}, body: '' };
  if (!content.startsWith('---')) return result;

  var endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return result;

  var fmText = content.substring(4, endIdx);
  result.body = content.substring(endIdx + 4).trimLeft();

  var lines = fmText.split('\n');
  var fm = {};
  var currentKey = null;
  var currentObj = null;

  for (var i = 0; i < lines.length; i++) {
    var raw = lines[i];
    if (!raw.trim()) continue;

    var indent = raw.match(/^(\s*)/)[1].length;
    var trimmed = raw.trim();

    // Nested object value (e.g. under proposed_diff:)
    if (indent > 0 && currentObj !== null) {
      var nested = trimmed.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
      if (nested) {
        currentObj[nested[1]] = stripQuotes(nested[2].trim());
      }
      continue;
    }

    // Top-level key
    var kv = trimmed.match(/^([\w][\w_.-]*)\s*:\s*(.*)$/);
    if (!kv) continue;

    currentKey = kv[1];
    var rawVal = kv[2].trim();

    if (rawVal === '') {
      // Start of nested block
      currentObj = {};
      fm[currentKey] = currentObj;
    } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      // Inline array
      currentObj = null;
      var inner = rawVal.slice(1, -1);
      if (!inner.trim()) {
        fm[currentKey] = [];
      } else {
        fm[currentKey] = inner.split(',').map(function (s) {
          return stripQuotes(s.trim());
        });
      }
    } else {
      currentObj = null;
      fm[currentKey] = parseScalar(rawVal);
    }
  }

  result.frontmatter = fm;
  return result;
}

/**
 * Strip surrounding single or double quotes from a string.
 *
 * @param {string} s
 * @returns {string}
 */
function stripQuotes(s) {
  if (!s) return s;
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Parse a scalar YAML value.
 *
 * @param {string} raw
 * @returns {string|number|boolean|null}
 */
function parseScalar(raw) {
  var clean = stripQuotes(raw.trim());
  if (clean === 'true')  return true;
  if (clean === 'false') return false;
  if (clean === 'null' || clean === '~') return null;
  if (!isNaN(clean) && clean !== '') return Number(clean);
  return clean;
}

// ── Proposal file I/O ─────────────────────────────────────────────────────────

/**
 * Read and parse a proposal file from disk.
 *
 * @param {string} proposalFilePath
 * @returns {{ frontmatter: object, body: string, raw: string } | null}
 */
function readProposalFile(proposalFilePath) {
  var content;
  try {
    content = fs.readFileSync(proposalFilePath, 'utf8');
  } catch (e) {
    return null;
  }
  var parsed = parseMarkdownFrontmatter(content);
  return { frontmatter: parsed.frontmatter, body: parsed.body, raw: content };
}

/**
 * Validate that a proposal object has all required fields.
 *
 * @param {object} fm - frontmatter object
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
function validateProposal(fm) {
  var missing = [];
  for (var i = 0; i < REQUIRED_PROPOSAL_FIELDS.length; i++) {
    var field = REQUIRED_PROPOSAL_FIELDS[i];
    if (fm[field] === undefined || fm[field] === null || fm[field] === '') {
      missing.push(field);
    }
  }
  return { valid: missing.length === 0, missingFields: missing };
}

/**
 * Derive proposal ID from a proposal file path (filename without .md extension).
 *
 * @param {string} proposalFilePath
 * @returns {string}
 */
function deriveProposalId(proposalFilePath) {
  return path.basename(proposalFilePath, '.md');
}

/**
 * Render updated frontmatter + body back to markdown.
 *
 * @param {object} fm  - frontmatter fields
 * @param {string} body
 * @returns {string}
 */
function renderMarkdown(fm, body) {
  var lines = ['---'];
  var keys = Object.keys(fm);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = fm[k];
    if (v === null || v === undefined) {
      lines.push(k + ': null');
    } else if (typeof v === 'object' && !Array.isArray(v)) {
      lines.push(k + ':');
      var subKeys = Object.keys(v);
      for (var j = 0; j < subKeys.length; j++) {
        var sk = subKeys[j];
        var sv = v[sk];
        lines.push('  ' + sk + ': "' + escapeYamlString(sv) + '"');
      }
    } else if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(k + ': []');
      } else {
        lines.push(k + ': [' + v.map(function (x) { return '"' + x + '"'; }).join(', ') + ']');
      }
    } else if (typeof v === 'string') {
      lines.push(k + ': "' + escapeYamlString(v) + '"');
    } else {
      lines.push(k + ': ' + v);
    }
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n') + (body ? body : '');
}

/**
 * Escape a string value for safe embedding in a YAML double-quoted scalar.
 * Handles backslash, double-quote, newline, carriage-return, and tab characters.
 *
 * @param {string} s
 * @returns {string}
 */
function escapeYamlString(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}


// ── AC1 — Challenger spec generation ─────────────────────────────────────────

/**
 * Apply a before/after diff to SKILL.md content.
 * Replaces the first occurrence of `before` with `after`.
 * If `before` is not found, appends the `after` content at the end.
 *
 * @param {string} skillContent - target SKILL.md content
 * @param {{ before: string, after: string }} diff
 * @returns {string}
 */
function applyDiff(skillContent, diff) {
  if (!diff || typeof diff !== 'object') return skillContent;
  var before = diff.before || '';
  var after  = diff.after  || '';

  if (before && skillContent.includes(before)) {
    return skillContent.replace(before, after);
  }
  // If before text not found, append after content with a section separator
  return skillContent.trimEnd() + '\n\n' + after + '\n';
}

/**
 * Generate challenger spec files for a proposal.
 *
 * Writes two files to proposalsDir:
 *   - [proposalId]-challenger-spec.md   (User Story, ACs, Done condition)
 *   - [proposalId]-proposed-skill.md    (full SKILL.md with diff applied)
 *
 * Blocks if the target is the improvement-agent SKILL.md (no-self-modify).
 * Idempotent: skips if files already exist.
 *
 * @param {string} proposalFilePath - path to the proposal markdown file
 * @param {object} [opts]
 * @param {string}  [opts.proposalsDir]
 * @param {string}  [opts.skillsDir]
 * @returns {{ ok: boolean, error?: string, specFile?: string, proposedSkillFile?: string }}
 */
function generateChallengerSpec(proposalFilePath, opts) {
  var options      = opts || {};
  var proposalsDir = options.proposalsDir || DEFAULT_PROPOSALS_DIR;
  var skillsDir    = options.skillsDir    || DEFAULT_SKILLS_DIR;

  var parsed = readProposalFile(proposalFilePath);
  if (!parsed) {
    return { ok: false, error: 'Could not read proposal file: ' + proposalFilePath };
  }

  var fm = parsed.frontmatter;

  // Validate required proposal fields (AC1 pre-condition)
  var validation = validateProposal(fm);
  if (!validation.valid) {
    return {
      ok: false,
      error: 'Proposal validation failed — missing required fields: ' +
             validation.missingFields.join(', '),
    };
  }

  var proposalId = deriveProposalId(proposalFilePath);
  var skillSlug  = fm.skill_slug || fm.skillSlug || '';

  // No-self-modify constraint: block if targeting improvement-agent SKILL.md
  if (skillSlug === SELF_MODIFY_SKILL_SLUG) {
    return {
      ok: false,
      error: 'No-self-modify constraint violated: proposals targeting the ' +
             SELF_MODIFY_SKILL_SLUG + ' SKILL.md are not permitted.',
    };
  }

  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  var specFile         = path.join(proposalsDir, proposalId + '-challenger-spec.md');
  var proposedSkillFile = path.join(proposalsDir, proposalId + '-proposed-skill.md');

  // Idempotency: skip if already written
  if (fs.existsSync(specFile) && fs.existsSync(proposedSkillFile)) {
    return { ok: true, specFile: specFile, proposedSkillFile: proposedSkillFile };
  }

  // Read target SKILL.md
  var targetSkillPath = path.join(skillsDir, skillSlug, 'SKILL.md');
  var skillContent    = '';
  if (skillSlug && fs.existsSync(targetSkillPath)) {
    try {
      skillContent = fs.readFileSync(targetSkillPath, 'utf8');
    } catch (e) {
      skillContent = '';
    }
  }

  // Apply diff to produce proposed SKILL.md content
  var proposedContent = applyDiff(skillContent, fm.proposed_diff);

  // Write proposed-skill.md (AC1 second file)
  if (!fs.existsSync(proposedSkillFile)) {
    fs.writeFileSync(proposedSkillFile, proposedContent, 'utf8');
  }

  // Build challenger spec (AC1 first file)
  var pattern    = fm.surface_type || fm.surfaceType || skillSlug || 'unknown';
  var confidence = fm.confidence   || 'medium';
  var createdAt  = fm.created_at   || new Date().toISOString();

  var specLines = [
    '# Challenger Spec: ' + proposalId,
    '',
    '## User Story',
    '',
    'As a platform maintainer,',
    'I want to validate the proposed change to the `' + (skillSlug || '[FILL IN: skill-slug]') + '` skill,',
    'so that any modification to the skill file is backed by evidence and a pre-check result.',
    '',
    '## Acceptance Criteria',
    '',
    '- **AC1:** The proposed-skill.md has the same heading structure as the current `' +
      (skillSlug || '[FILL IN: skill-slug]') + '` SKILL.md.',
    '- **AC2:** The proposed change improves or does not regress the eval harness results.',
    '- **AC3:** No credentials, personal data, or org identifiers are introduced by the change.',
    '- **AC4:** The diff target section (before/after) is structurally valid.',
    '',
    '## Done condition',
    '',
    'Pre-check is complete when a `' + proposalId + '-challenger-result.md` file exists in',
    '`workspace/proposals/` with all 5 required fields: `verdict`, `session_summary`,',
    '`traces_produced`, `reviewer` (named human identity), `reviewed_at` (ISO datetime).',
    '',
    '## Proposal reference',
    '',
    '- **Proposal ID:** ' + proposalId,
    '- **Skill slug:** ' + (skillSlug || '[FILL IN: skill-slug]'),
    '- **Confidence:** ' + confidence,
    '- **Created at:** ' + createdAt,
    '- **Evidence count:** ' +
      (Array.isArray(fm.evidence) ? fm.evidence.length : (fm.evidence ? 1 : 0)),
    '',
    '## Proposed diff summary',
    '',
    '**Before:** ' + (fm.proposed_diff && fm.proposed_diff.before
      ? fm.proposed_diff.before
      : '[FILL IN: before section]'),
    '',
    '**After:** ' + (fm.proposed_diff && fm.proposed_diff.after
      ? fm.proposed_diff.after
      : '[FILL IN: after section]'),
    '',
    '## Notes',
    '',
    'Reviewer must be a named human identity — CI job IDs are not accepted.',
    'See `[FILL IN: team review process]` for how to record a pre-check result.',
    '',
  ];

  if (!fs.existsSync(specFile)) {
    fs.writeFileSync(specFile, specLines.join('\n'), 'utf8');
  }

  return { ok: true, specFile: specFile, proposedSkillFile: proposedSkillFile };
}

// ── AC2 — Pre-check result recording / validation ─────────────────────────────

/**
 * Validate a challenger-result.md file.
 * Checks all 5 required fields are present and non-empty.
 * Flags if reviewer field is a CI job identity.
 *
 * @param {string} resultFilePath
 * @returns {{
 *   valid: boolean,
 *   missingFields: string[],
 *   reviewerIsCI: boolean,
 *   warnings: string[]
 * }}
 */
function validateResultFile(resultFilePath) {
  var result = {
    valid: false,
    missingFields: [],
    reviewerIsCI: false,
    warnings: [],
  };

  var content;
  try {
    content = fs.readFileSync(resultFilePath, 'utf8');
  } catch (e) {
    result.missingFields = REQUIRED_RESULT_FIELDS.slice();
    result.warnings.push('Could not read result file: ' + resultFilePath);
    return result;
  }

  var parsed = parseMarkdownFrontmatter(content);
  var fm = parsed.frontmatter;

  // Check each required field
  for (var i = 0; i < REQUIRED_RESULT_FIELDS.length; i++) {
    var field = REQUIRED_RESULT_FIELDS[i];
    var value = fm[field];
    if (value === undefined || value === null || value === '') {
      result.missingFields.push(field);
    }
  }

  // Reviewer field must be a human identity (not CI job ID)
  var reviewer = fm.reviewer || '';
  for (var j = 0; j < CI_IDENTITY_PATTERNS.length; j++) {
    if (CI_IDENTITY_PATTERNS[j].test(reviewer)) {
      result.reviewerIsCI = true;
      result.warnings.push(
        'reviewer field "' + reviewer + '" appears to be a CI job identity — ' +
        'must be a named human identity (AC2, NFR Human Oversight)'
      );
      break;
    }
  }

  result.valid = result.missingFields.length === 0 && !result.reviewerIsCI;
  return result;
}

// ── AC3 — Proposal acceptance ─────────────────────────────────────────────────

/**
 * Accept a proposal: apply proposed-skill.md to target SKILL.md and update status.
 *
 * Steps:
 *   1. Read + validate proposal and challenger-result.md
 *   2. Check verdict is "pass"
 *   3. Apply proposed-skill.md content to target SKILL.md
 *   4. Update proposal file status to accepted with accepted_at + accepted_by
 *   5. Update workspace/state.json proposals block
 *   6. Attempt git commit (single atomic commit — AC3 atomicity)
 *
 * No-self-modify: blocks if target is improvement-agent SKILL.md.
 *
 * @param {string} proposalFilePath
 * @param {string} acceptedBy   - human identity (named person, not CI job ID)
 * @param {object} [opts]
 * @param {string}  [opts.proposalsDir]
 * @param {string}  [opts.skillsDir]
 * @param {string}  [opts.stateJsonPath]
 * @param {boolean} [opts.skipGitCommit]  - skip git commit step (for tests)
 * @returns {{ ok: boolean, error?: string }}
 */
function acceptProposal(proposalFilePath, acceptedBy, opts) {
  var options      = opts || {};
  var proposalsDir = options.proposalsDir || DEFAULT_PROPOSALS_DIR;
  var skillsDir    = options.skillsDir    || DEFAULT_SKILLS_DIR;
  var stateJsonPath = options.stateJsonPath || DEFAULT_STATE_JSON;

  if (!acceptedBy || !acceptedBy.trim()) {
    return { ok: false, error: 'accepted_by must be a non-empty human identity' };
  }

  var parsed = readProposalFile(proposalFilePath);
  if (!parsed) {
    return { ok: false, error: 'Could not read proposal file: ' + proposalFilePath };
  }

  var fm = parsed.frontmatter;

  // Validate proposal fields
  var validation = validateProposal(fm);
  if (!validation.valid) {
    return {
      ok: false,
      error: 'Proposal validation failed — missing fields: ' +
             validation.missingFields.join(', '),
    };
  }

  var proposalId = deriveProposalId(proposalFilePath);
  var skillSlug  = fm.skill_slug || fm.skillSlug || '';

  // No-self-modify constraint
  if (skillSlug === SELF_MODIFY_SKILL_SLUG) {
    return {
      ok: false,
      error: 'No-self-modify constraint: cannot accept proposals targeting ' +
             SELF_MODIFY_SKILL_SLUG + ' SKILL.md',
    };
  }

  // Read challenger-result.md
  var resultFile = path.join(proposalsDir, proposalId + '-challenger-result.md');
  var resultValidation = validateResultFile(resultFile);
  if (!resultValidation.valid) {
    var issues = resultValidation.missingFields.length > 0
      ? 'missing fields: ' + resultValidation.missingFields.join(', ')
      : 'reviewer is a CI identity';
    return {
      ok: false,
      error: 'Cannot accept proposal — challenger-result.md is invalid (' + issues + ')',
    };
  }

  // Check verdict is pass
  var resultContent = fs.readFileSync(resultFile, 'utf8');
  var resultParsed  = parseMarkdownFrontmatter(resultContent);
  var verdict       = (resultParsed.frontmatter.verdict || '').toLowerCase();
  if (verdict !== 'pass') {
    return {
      ok: false,
      error: 'Cannot accept proposal — challenger-result.md verdict is "' + verdict +
             '" (must be "pass")',
    };
  }

  // Read proposed-skill.md
  var proposedSkillFile = path.join(proposalsDir, proposalId + '-proposed-skill.md');
  if (!fs.existsSync(proposedSkillFile)) {
    return {
      ok: false,
      error: 'Cannot accept proposal — proposed-skill.md not found: ' + proposedSkillFile +
             '. Run generateChallengerSpec first.',
    };
  }

  var proposedContent;
  try {
    proposedContent = fs.readFileSync(proposedSkillFile, 'utf8');
  } catch (e) {
    return { ok: false, error: 'Could not read proposed-skill.md: ' + proposedSkillFile };
  }

  // Apply proposed-skill.md content to target SKILL.md
  var targetSkillPath = path.join(skillsDir, skillSlug, 'SKILL.md');
  if (skillSlug) {
    var skillDir = path.join(skillsDir, skillSlug);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }
    try {
      fs.writeFileSync(targetSkillPath, proposedContent, 'utf8');
    } catch (e) {
      return { ok: false, error: 'Failed to write target SKILL.md: ' + e.message };
    }
  }

  // Update proposal status to accepted
  var now = new Date().toISOString();
  fm.status      = 'accepted';
  fm.accepted_at = now;
  fm.accepted_by = acceptedBy;

  var updatedContent = renderMarkdown(fm, parsed.body);
  try {
    fs.writeFileSync(proposalFilePath, updatedContent, 'utf8');
  } catch (e) {
    return { ok: false, error: 'Failed to update proposal file: ' + e.message };
  }

  // Update workspace/state.json proposals block
  updateChallengerState(stateJsonPath, proposalFilePath, 'accepted');

  // Git commit — single atomic commit (AC3 atomicity)
  if (!options.skipGitCommit) {
    var commitResult = gitCommitAcceptance(proposalId, targetSkillPath, proposalFilePath);
    if (!commitResult.ok) {
      return { ok: false, error: 'Git commit failed: ' + commitResult.error };
    }
  }

  return { ok: true };
}

// ── AC4 — Proposal rejection ──────────────────────────────────────────────────

/**
 * Reject a proposal: update status to rejected with mandatory rationale.
 * SKILL.md is NOT modified on rejection.
 *
 * @param {string} proposalFilePath
 * @param {string} rejectedBy            - human identity
 * @param {string} rejectionRationale    - mandatory non-empty rationale
 * @param {object} [opts]
 * @param {string}  [opts.stateJsonPath]
 * @returns {{ ok: boolean, error?: string }}
 */
function rejectProposal(proposalFilePath, rejectedBy, rejectionRationale, opts) {
  var options = opts || {};
  var stateJsonPath = options.stateJsonPath || DEFAULT_STATE_JSON;

  if (!rejectedBy || !rejectedBy.trim()) {
    return { ok: false, error: 'rejected_by must be a non-empty human identity' };
  }

  // Mandatory rationale enforcement (AC4)
  if (!rejectionRationale || !rejectionRationale.trim()) {
    return {
      ok: false,
      error: 'rejection_rationale is required — empty rationale is not a valid rejection',
    };
  }

  var parsed = readProposalFile(proposalFilePath);
  if (!parsed) {
    return { ok: false, error: 'Could not read proposal file: ' + proposalFilePath };
  }

  var fm = parsed.frontmatter;

  // Update proposal status
  var now = new Date().toISOString();
  fm.status               = 'rejected';
  fm.rejected_at          = now;
  fm.rejected_by          = rejectedBy;
  fm.rejection_rationale  = rejectionRationale.trim();

  var updatedContent = renderMarkdown(fm, parsed.body);
  try {
    fs.writeFileSync(proposalFilePath, updatedContent, 'utf8');
  } catch (e) {
    return { ok: false, error: 'Failed to update proposal file: ' + e.message };
  }

  // Update workspace/state.json proposals block
  updateChallengerState(stateJsonPath, proposalFilePath, 'rejected');

  return { ok: true };
}

// ── AC5 — Proposal deferral ───────────────────────────────────────────────────

/**
 * Defer a proposal: update status to deferred with deferred_until + deferral_reason.
 * SKILL.md is NOT modified on deferral.
 *
 * @param {string} proposalFilePath
 * @param {string} deferredUntil    - ISO date (YYYY-MM-DD or ISO datetime)
 * @param {string} deferralReason   - non-empty reason for deferral
 * @param {object} [opts]
 * @param {string}  [opts.stateJsonPath]
 * @returns {{ ok: boolean, error?: string }}
 */
function deferProposal(proposalFilePath, deferredUntil, deferralReason, opts) {
  var options = opts || {};
  var stateJsonPath = options.stateJsonPath || DEFAULT_STATE_JSON;

  if (!deferredUntil || !deferredUntil.trim()) {
    return { ok: false, error: 'deferred_until is required for deferral' };
  }

  if (!deferralReason || !deferralReason.trim()) {
    return { ok: false, error: 'deferral_reason is required for deferral' };
  }

  var parsed = readProposalFile(proposalFilePath);
  if (!parsed) {
    return { ok: false, error: 'Could not read proposal file: ' + proposalFilePath };
  }

  var fm = parsed.frontmatter;

  // Update proposal status
  fm.status         = 'deferred';
  fm.deferred_until = deferredUntil.trim();
  fm.deferral_reason = deferralReason.trim();

  var updatedContent = renderMarkdown(fm, parsed.body);
  try {
    fs.writeFileSync(proposalFilePath, updatedContent, 'utf8');
  } catch (e) {
    return { ok: false, error: 'Failed to update proposal file: ' + e.message };
  }

  // Update workspace/state.json proposals block
  updateChallengerState(stateJsonPath, proposalFilePath, 'deferred');

  return { ok: true };
}

// ── State management ──────────────────────────────────────────────────────────

/**
 * Read all proposal files from proposalsDir and return an array of
 * { id, file, status, deferred_until, skill_slug, confidence } objects.
 *
 * @param {string} proposalsDir
 * @returns {Array<object>}
 */
function readExistingProposals(proposalsDir) {
  if (!fs.existsSync(proposalsDir)) return [];

  var entries;
  try {
    entries = fs.readdirSync(proposalsDir);
  } catch (e) {
    return [];
  }

  var proposals = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    // Only read base proposal files (not spec/result/warning files)
    if (!entry.endsWith('.md')) continue;
    if (entry.includes('-challenger-spec') ||
        entry.includes('-challenger-result') ||
        entry.includes('-proposed-skill') ||
        entry.includes('-overfitting-warning') ||
        entry.includes('-baseline-failure')) continue;

    var filePath = path.join(proposalsDir, entry);
    try {
      var stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
    } catch (e) {
      continue;
    }

    var parsed = readProposalFile(filePath);
    if (!parsed) continue;

    var fm = parsed.frontmatter;
    proposals.push({
      id:             path.basename(entry, '.md'),
      file:           filePath,
      status:         fm.status || '',
      deferred_until: fm.deferred_until || null,
      skill_slug:     fm.skill_slug || fm.skillSlug || '',
      pattern:        fm.pattern || '',
      confidence:     fm.confidence || 'medium',
    });
  }

  return proposals;
}

/**
 * Check if a proposal for the same skill_slug + pattern is already deferred
 * and the deferral has not yet expired. Used by failure-detector to suppress
 * redundant proposals (AC5c).
 *
 * Returns the deferred proposal if suppression applies, or null if:
 *   - No matching deferred proposal exists
 *   - deferred_until has passed
 *   - New confidence is higher than the deferred proposal's confidence
 *
 * @param {string} skillSlug
 * @param {string} pattern
 * @param {string} newConfidence  - 'high' | 'medium' | 'low'
 * @param {string} proposalsDir
 * @param {Date}   [now]
 * @returns {{ proposal: object, deferredProposalId: string } | null}
 */
function findActiveDeferral(skillSlug, pattern, newConfidence, proposalsDir, now) {
  var proposals = readExistingProposals(proposalsDir);
  var nowTime   = (now instanceof Date ? now : new Date()).getTime();

  var confidenceRank = { high: 3, medium: 2, low: 1 };
  var newRank = confidenceRank[newConfidence] || 2;

  for (var i = 0; i < proposals.length; i++) {
    var p = proposals[i];
    if (p.status !== 'deferred') continue;

    // Match by skill_slug + pattern
    var skillMatch   = p.skill_slug === skillSlug;
    var patternMatch = p.pattern === pattern;
    if (!skillMatch || !patternMatch) continue;

    // Check if deferral is still active (deferred_until > now)
    if (!p.deferred_until) continue;
    var deferUntilTime = new Date(p.deferred_until).getTime();
    if (isNaN(deferUntilTime) || deferUntilTime <= nowTime) continue;

    // Suppression applies unless new confidence is strictly higher
    var existingRank = confidenceRank[p.confidence] || 2;
    if (newRank > existingRank) {
      // Higher severity — allow re-surface, do not suppress
      return null;
    }

    return { proposal: p, deferredProposalId: p.id };
  }

  return null;
}

/**
 * Update workspace/state.json proposals block for a challenger decision.
 * Schema-first (ADR-003): only writes schema-defined fields.
 * Transitions: pending_review → accepted | rejected | deferred
 *
 * @param {string} stateJsonPath
 * @param {string} proposalFilePath
 * @param {string} status  - 'accepted' | 'rejected' | 'deferred'
 */
function updateChallengerState(stateJsonPath, proposalFilePath, status) {
  if (!stateJsonPath || !fs.existsSync(stateJsonPath)) return;

  var state;
  try {
    state = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8'));
  } catch (e) {
    state = {};
  }

  if (!Array.isArray(state.proposals)) {
    state.proposals = [];
  }

  var relPath = proposalFilePath;
  // Make path relative to repo root if possible
  try {
    var repoRoot = path.join(__dirname, '..', '..');
    if (proposalFilePath.startsWith(repoRoot)) {
      relPath = proposalFilePath.substring(repoRoot.length).replace(/^[/\\]/, '');
    }
  } catch (e) { /* use full path */ }

  // Update existing entry or append new one
  var found = false;
  for (var i = 0; i < state.proposals.length; i++) {
    var p = state.proposals[i];
    if (p.file === relPath || p.file === proposalFilePath) {
      p.status = status;
      found = true;
      break;
    }
  }

  if (!found) {
    state.proposals.push({
      file:       relPath,
      created_at: new Date().toISOString(),
      status:     status,
    });
  }

  try {
    fs.writeFileSync(stateJsonPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch (e) { /* ignore write failures in tests */ }
}

// ── Git operations ────────────────────────────────────────────────────────────

/**
 * Attempt a single atomic git commit for a proposal acceptance.
 * git commit --no-verify is PROHIBITED — all hooks must run (AC3).
 *
 * @param {string} proposalId
 * @param {string} targetSkillPath
 * @param {string} proposalFilePath
 * @returns {{ ok: boolean, error?: string }}
 */
function gitCommitAcceptance(proposalId, targetSkillPath, proposalFilePath) {
  try {
    // Stage target SKILL.md and proposal file together (one atomic commit)
    var filesToStage = [];
    if (targetSkillPath && fs.existsSync(targetSkillPath)) {
      filesToStage.push(targetSkillPath);
    }
    if (proposalFilePath && fs.existsSync(proposalFilePath)) {
      filesToStage.push(proposalFilePath);
    }

    if (filesToStage.length === 0) {
      return { ok: true }; // Nothing to commit
    }

    // Use execFileSync with argument array to avoid shell injection (no shell quoting needed)
    cp.execFileSync('git', ['add', '--'].concat(filesToStage), { cwd: ROOT });

    var commitMsg = 'improvement: apply ' + proposalId + ' — skill update from challenger pre-check';
    // NOTE: --no-verify is PROHIBITED (AC3). All hooks must run.
    cp.execFileSync('git', ['commit', '-m', commitMsg], { cwd: ROOT });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── CLI entry point ───────────────────────────────────────────────────────────

/**
 * Parse CLI arguments.
 *
 * @param {string[]} argv
 * @returns {object}
 */
function parseCli(argv) {
  var args = {};
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === '--proposal' && argv[i + 1]) {
      args.proposal = argv[++i];
    } else if (argv[i] === '--validate-result' && argv[i + 1]) {
      args.validateResult = argv[++i];
    } else if (argv[i] === '--accept' && argv[i + 1]) {
      args.accept = argv[++i];
    } else if (argv[i] === '--accepted-by' && argv[i + 1]) {
      args.acceptedBy = argv[++i];
    } else if (argv[i] === '--reject' && argv[i + 1]) {
      args.reject = argv[++i];
    } else if (argv[i] === '--rejected-by' && argv[i + 1]) {
      args.rejectedBy = argv[++i];
    } else if (argv[i] === '--rejection-rationale' && argv[i + 1]) {
      args.rejectionRationale = argv[++i];
    } else if (argv[i] === '--defer' && argv[i + 1]) {
      args.defer = argv[++i];
    } else if (argv[i] === '--deferred-until' && argv[i + 1]) {
      args.deferredUntil = argv[++i];
    } else if (argv[i] === '--deferral-reason' && argv[i + 1]) {
      args.deferralReason = argv[++i];
    }
  }
  return args;
}

if (require.main === module) {
  var args = parseCli(process.argv.slice(2));

  if (args.proposal) {
    var specResult = generateChallengerSpec(args.proposal);
    if (specResult.ok) {
      process.stdout.write('[challenger] Spec generated:\n');
      process.stdout.write('  spec:          ' + specResult.specFile + '\n');
      process.stdout.write('  proposed-skill: ' + specResult.proposedSkillFile + '\n');
    } else {
      process.stderr.write('[challenger] ERROR: ' + specResult.error + '\n');
      process.exit(1);
    }
  } else if (args.validateResult) {
    var vResult = validateResultFile(args.validateResult);
    if (vResult.valid) {
      process.stdout.write('[challenger] Result file is valid.\n');
    } else {
      process.stderr.write('[challenger] Result file is INVALID.\n');
      if (vResult.missingFields.length > 0) {
        process.stderr.write('  Missing fields: ' + vResult.missingFields.join(', ') + '\n');
      }
      vResult.warnings.forEach(function (w) {
        process.stderr.write('  Warning: ' + w + '\n');
      });
      process.exit(1);
    }
  } else if (args.accept) {
    var acceptResult = acceptProposal(args.accept, args.acceptedBy || '');
    if (acceptResult.ok) {
      process.stdout.write('[challenger] Proposal accepted.\n');
    } else {
      process.stderr.write('[challenger] ERROR: ' + acceptResult.error + '\n');
      process.exit(1);
    }
  } else if (args.reject) {
    var rejectResult = rejectProposal(
      args.reject,
      args.rejectedBy || '',
      args.rejectionRationale || ''
    );
    if (rejectResult.ok) {
      process.stdout.write('[challenger] Proposal rejected.\n');
    } else {
      process.stderr.write('[challenger] ERROR: ' + rejectResult.error + '\n');
      process.exit(1);
    }
  } else if (args.defer) {
    var deferResult = deferProposal(
      args.defer,
      args.deferredUntil || '',
      args.deferralReason || ''
    );
    if (deferResult.ok) {
      process.stdout.write('[challenger] Proposal deferred.\n');
    } else {
      process.stderr.write('[challenger] ERROR: ' + deferResult.error + '\n');
      process.exit(1);
    }
  } else {
    process.stderr.write(
      'Usage:\n' +
      '  node challenger.js --proposal <file.md>\n' +
      '  node challenger.js --validate-result <result.md>\n' +
      '  node challenger.js --accept <file.md> --accepted-by <human>\n' +
      '  node challenger.js --reject <file.md> --rejected-by <human> --rejection-rationale <text>\n' +
      '  node challenger.js --defer <file.md> --deferred-until <date> --deferral-reason <text>\n'
    );
    process.exit(1);
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  parseMarkdownFrontmatter: parseMarkdownFrontmatter,
  validateProposal:         validateProposal,
  generateChallengerSpec:   generateChallengerSpec,
  validateResultFile:       validateResultFile,
  acceptProposal:           acceptProposal,
  rejectProposal:           rejectProposal,
  deferProposal:            deferProposal,
  readExistingProposals:    readExistingProposals,
  findActiveDeferral:       findActiveDeferral,
  updateChallengerState:    updateChallengerState,
  // Exported for testing
  applyDiff:                applyDiff,
  deriveProposalId:         deriveProposalId,
  REQUIRED_PROPOSAL_FIELDS: REQUIRED_PROPOSAL_FIELDS,
  REQUIRED_RESULT_FIELDS:   REQUIRED_RESULT_FIELDS,
  SELF_MODIFY_SKILL_SLUG:   SELF_MODIFY_SKILL_SLUG,
};
