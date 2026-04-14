/**
 * helpers.js
 *
 * Production helper functions for the /definition skill and its test suite.
 * Extracted from tests/check-definition-skill.js (p3.1c) so that tests import
 * from the real source path rather than maintaining inline copies.
 *
 * Exports:
 *   extractUpstreamSlugs(storyContent)         → string[]
 *   isExternallyAcknowledged(storyContent, slug) → boolean
 *   validateExternalAnnotation(text)            → { valid: boolean, reason: string }
 *   resolveSlug(slug, featureDir)               → { resolved: boolean, expectedPath: string }
 *   checkTestability(acText)                    → Array<{ pattern: string, reason: string }>
 *   hasTestabilityAnnotation(text)              → boolean
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

/**
 * Extract the upstream dependency slugs from a story Dependencies block.
 * Returns an array of slug strings found after "Upstream:" lines.
 */
function extractUpstreamSlugs(storyContent) {
  const slugs = [];
  const depSection = storyContent.match(/## Dependencies([\s\S]*?)(?=\n## |\n---|\s*$)/);
  if (!depSection) return slugs;

  const lines = depSection[1].split('\n');
  for (const line of lines) {
    // Match lines like: - **Upstream:** slug-name [External: ...]
    // or: - **Upstream:** slug-name
    const m = line.match(/Upstream:\*?\*?\s+([a-z0-9][a-z0-9.-]*)/);
    if (m) {
      slugs.push(m[1]);
    }
  }
  return slugs;
}

/**
 * Check whether an upstream slug has been acknowledged as external.
 * Returns true if the line containing the slug has an [External: ...] annotation.
 */
function isExternallyAcknowledged(storyContent, slug) {
  const depSection = storyContent.match(/## Dependencies([\s\S]*?)(?=\n## |\n---|\s*$)/);
  if (!depSection) return false;

  const lines = depSection[1].split('\n');
  for (const line of lines) {
    if (line.includes(slug)) {
      return /\[External:/.test(line);
    }
  }
  return false;
}

/**
 * Validate the format of an [External: ...] annotation.
 * Must contain: [External: <non-empty description> — confirmed by operator on <date>]
 * Returns { valid: boolean, reason: string }
 */
function validateExternalAnnotation(text) {
  const m = text.match(/\[External:\s*(.+?)\s*—\s*confirmed by operator on\s*(\d{4}-\d{2}-\d{2})\]/);
  if (!m) {
    return { valid: false, reason: 'annotation missing required format: [External: <description> — confirmed by operator on YYYY-MM-DD]' };
  }
  if (!m[1] || m[1].trim().length === 0) {
    return { valid: false, reason: 'annotation missing description field' };
  }
  return { valid: true, reason: '' };
}

/**
 * Slug resolver: checks whether a story slug resolves to an expected path.
 * The feature directory is inferred from the story file or can be provided.
 * Returns { resolved: boolean, expectedPath: string }
 */
function resolveSlug(slug, featureDir) {
  const expectedPath = path.join(root, 'artefacts', featureDir, 'stories', slug + '.md');
  return {
    resolved:     fs.existsSync(expectedPath),
    expectedPath: expectedPath,
  };
}

/**
 * D2 testability heuristic.
 * Checks an AC text for the three anti-patterns.
 * Returns an array of warning objects: { pattern, reason }
 */
function checkTestability(acText) {
  const warnings = [];

  // Pattern (a): uses "should" or "would"
  if (/\bshould\b|\bwould\b/i.test(acText)) {
    warnings.push({
      pattern: 'a',
      reason:  "uses 'should' or 'would' instead of asserting current-state observable behaviour",
    });
  }

  // Pattern (b): internal system state not visible to a test runner or reviewer
  // Heuristic: mentions internal store, internal state, or non-visible internal fields
  if (/internal (system |)state|internal store|not visible to (a |)(test runner|reviewer)/i.test(acText)) {
    warnings.push({
      pattern: 'b',
      reason:  'describes internal system state not visible to a test runner or human reviewer',
    });
  }

  // Pattern (c): cannot be evaluated independently without a prior AC
  if (/previous AC|prior AC|after AC|preceding AC|first running a prior AC/i.test(acText)) {
    warnings.push({
      pattern: 'c',
      reason:  'cannot be evaluated independently without first running a prior AC',
    });
  }

  return warnings;
}

/**
 * Check whether an AC string has a testability acceptance annotation.
 * Returns true if the annotation [Testability: accepted by operator on <date>] is present.
 */
function hasTestabilityAnnotation(text) {
  return /\[Testability: accepted by operator on \d{4}-\d{2}-\d{2}\]/.test(text);
}

module.exports = {
  extractUpstreamSlugs,
  isExternallyAcknowledged,
  validateExternalAnnotation,
  resolveSlug,
  checkTestability,
  hasTestabilityAnnotation,
};
