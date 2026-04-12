#!/usr/bin/env node
/**
 * process-dor-approval.js
 *
 * CLI entry point for the DoR approval GitHub Actions workflow (p2.8).
 *
 * Reads environment variables set by the GitHub Actions workflow:
 *   ACTOR_USERNAME       — GitHub username of the /approve-dor commenter
 *   COMMENT_BODY         — Full text of the comment
 *   COMMENT_CREATED_AT   — ISO 8601 timestamp of the comment
 *   PIPELINE_STATE_PATH  — (optional) override path to pipeline-state.json
 *   CONTEXT_YML_PATH     — (optional) override path to context.yml
 *
 * Comment format: /approve-dor <story-slug>
 *
 * On success: writes dorStatus, dorApprover, dorChannel, dorSignedOffAt to
 * pipeline-state.json and exits 0.
 * On failure: logs error to stderr and exits 1.
 *
 * ADR-004: channel config read from context.yml — no hardcoded values.
 * MC-PII:  dorApprover stores GitHub username from ACTOR_USERNAME — never email.
 *
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.8-persona-routing-non-engineer-approval.md
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const { processApproveCommentEvent } = require(path.join(root, 'src', 'approval-channel', 'index.js'));

// ─────────────────────────────────────────────────────────────────────────────
// Minimal YAML parser — reads channel_hints (3-level nesting) from context.yml.
// No external dependencies; plain Node.js only.
// ─────────────────────────────────────────────────────────────────────────────

function stripMatchingQuotes(s) {
  if (s.length >= 2 &&
      ((s[0] === "'" && s[s.length - 1] === "'") ||
       (s[0] === '"' && s[s.length - 1] === '"'))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Parse a minimal subset of context.yml needed by this script.
 * Handles up to 3 levels of indentation (e.g. channel_hints.approval.type).
 * Comments (#) and blank lines are ignored.
 *
 * @param {string} ymlText
 * @returns {object}
 */
function parseContextYml(ymlText) {
  const result = {};
  let level1Key = null;
  let level2Key = null;

  for (const rawLine of ymlText.split('\n')) {
    const stripped = rawLine.replace(/\s*#.*$/, '').trimEnd();
    if (stripped.trim() === '') continue;

    const indent   = stripped.match(/^(\s*)/)[1].length;
    const content  = stripped.trim();
    const colonIdx = content.indexOf(':');
    if (colonIdx < 0) continue;

    const key    = content.slice(0, colonIdx).trim();
    const rawVal = content.slice(colonIdx + 1).trim();
    const val    = rawVal === '' ? null : stripMatchingQuotes(rawVal);

    if (indent === 0) {
      level1Key = key;
      level2Key = null;
      result[key] = (val !== null) ? val : {};
    } else if (indent === 2 && level1Key !== null) {
      if (typeof result[level1Key] !== 'object' || result[level1Key] === null) {
        result[level1Key] = {};
      }
      level2Key = key;
      result[level1Key][key] = (val !== null) ? val : {};
    } else if (indent === 4 && level1Key !== null && level2Key !== null) {
      if (typeof result[level1Key][level2Key] !== 'object' || result[level1Key][level2Key] === null) {
        result[level1Key][level2Key] = {};
      }
      result[level1Key][level2Key][key] = val;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const actorUsername    = process.env.ACTOR_USERNAME    || '';
  const commentBody      = process.env.COMMENT_BODY      || '';
  const commentCreatedAt = process.env.COMMENT_CREATED_AT || new Date().toISOString();

  // Extract story slug from comment: /approve-dor <story-slug>
  const match = commentBody.match(/\/approve-dor\s+([a-zA-Z0-9._-]+)/);
  const storySlug = match ? match[1] : null;

  if (!actorUsername) {
    process.stderr.write('[dor-approval] ERROR: ACTOR_USERNAME environment variable is not set.\n');
    process.exit(1);
  }

  if (!storySlug) {
    process.stderr.write(
      '[dor-approval] ERROR: No story slug found in /approve-dor comment.\n' +
      '[dor-approval] Format: /approve-dor <story-slug>\n'
    );
    process.exit(1);
  }

  // Read context.yml (ADR-004 — channel config read from here only).
  const contextYmlPath = process.env.CONTEXT_YML_PATH ||
    path.join(root, '.github', 'context.yml');
  let context = {};
  if (fs.existsSync(contextYmlPath)) {
    try {
      context = parseContextYml(fs.readFileSync(contextYmlPath, 'utf8'));
    } catch (err) {
      process.stderr.write('[dor-approval] WARN: Could not parse context.yml — ' + err.message + '\n');
    }
  }

  // Read pipeline-state.json.
  const pipelineStatePath = process.env.PIPELINE_STATE_PATH ||
    path.join(root, '.github', 'pipeline-state.json');
  let pipelineState;
  try {
    pipelineState = JSON.parse(fs.readFileSync(pipelineStatePath, 'utf8'));
  } catch (err) {
    process.stderr.write('[dor-approval] ERROR: Could not read pipeline-state.json — ' + err.message + '\n');
    process.exit(1);
  }

  const event = {
    actorUsername,
    storySlug,
    timestamp: commentCreatedAt,
  };

  const result = processApproveCommentEvent(event, pipelineState, context);

  if (!result.success) {
    process.stderr.write(
      '[dor-approval] ERROR: Story "' + storySlug + '" not found in pipeline-state.json.\n'
    );
    process.exit(1);
  }

  // Update pipeline-state.json updated timestamp.
  pipelineState.updated = new Date().toISOString();

  // Write pipeline-state.json.
  fs.writeFileSync(pipelineStatePath, JSON.stringify(pipelineState, null, 2) + '\n', 'utf8');

  process.stdout.write(
    '[dor-approval] DoR sign-off written for story: ' + storySlug + '\n' +
    '[dor-approval] dorApprover: ' + result.story.dorApprover + '\n' +
    '[dor-approval] dorChannel:  ' + result.story.dorChannel + '\n' +
    '[dor-approval] dorStatus:   ' + result.story.dorStatus + '\n'
  );
}

main();
