#!/usr/bin/env node
'use strict';

// check-design-tokens.js
// Extracts the design-token hex palette from DESIGN.md and scans a given file's
// content for hardcoded color values that are not part of that palette.
// Governed by dsa-s5 — artefacts/2026-09-18-design-system-adoption/
//
// This is the real scan mechanism referenced by H-DESIGN in
// skills/definition-of-ready/SKILL.md — not a documentation-only stand-in.
//
// Usage:
//   node scripts/check-design-tokens.js <file> [--design-md <path>]
//
// Exit codes:
//   0 — no non-token colors found in <file>
//   1 — one or more non-token colors found (or a usage/read error)
//
// Plain Node.js — no external dependencies.

const fs = require('fs');
const path = require('path');

const DEFAULT_DESIGN_MD_PATH = path.join(
  __dirname,
  '..',
  'artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md'
);

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}/g;
const TOKEN_SECTION_START = /^## Color tokens.*$/m;
const TOKEN_SECTION_END = /^## Spacing & radius.*$/m;

// ── extractDesignTokens ──────────────────────────────────────────────────────
// Reads DESIGN.md and sweeps the "Color tokens" (dark) + "Light mode" sections
// (everything between the `## Color tokens` and `## Spacing & radius` headings)
// with a single hex-literal regex. Returns a Set of lowercased hex values, so
// callers can compare case-insensitively (`#ABC123` and `#abc123` are the same
// token).
function extractDesignTokens(designMdPath) {
  const content = fs.readFileSync(designMdPath, 'utf8');

  const startMatch = TOKEN_SECTION_START.exec(content);
  if (!startMatch) {
    throw new Error(`extractDesignTokens: could not find a "## Color tokens" heading in ${designMdPath}`);
  }
  const startIndex = startMatch.index;

  // Fail loud on a missing end heading too -- silently falling back to
  // content.length would expand the "token section" to swallow every hex
  // value in the rest of the document, making the scanner strictly less
  // likely to flag anything. A governance gate degrading silently (nothing
  // looks wrong, it just gets weaker) is worse than one that errors clearly.
  TOKEN_SECTION_END.lastIndex = 0;
  const endMatch = TOKEN_SECTION_END.exec(content.slice(startIndex));
  if (!endMatch) {
    throw new Error(`extractDesignTokens: could not find a "## Spacing & radius" heading (section end) in ${designMdPath}`);
  }
  const endIndex = startIndex + endMatch.index;

  const section = content.slice(startIndex, endIndex);

  const tokens = new Set();
  const matches = section.match(HEX_COLOR_PATTERN) || [];
  for (const hex of matches) {
    tokens.add(hex.toLowerCase());
  }
  return tokens;
}

// ── scanFileForNonTokenColors ────────────────────────────────────────────────
// Reads the file at filePath and extracts every hex-color-like literal from its
// content. Returns an array of { file, value } for each one NOT present in
// tokenSet (case-insensitive compare). value preserves the original casing as
// found in the scanned file, for accurate reporting.
function scanFileForNonTokenColors(filePath, tokenSet) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(HEX_COLOR_PATTERN) || [];

  const findings = [];
  for (const value of matches) {
    if (!tokenSet.has(value.toLowerCase())) {
      findings.push({ file: filePath, value });
    }
  }
  return findings;
}

module.exports = { extractDesignTokens, scanFileForNonTokenColors };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  let targetFile = null;
  let designMdPath = DEFAULT_DESIGN_MD_PATH;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--design-md' && args[i + 1]) {
      designMdPath = path.resolve(args[i + 1]);
      i++;
    } else if (!targetFile) {
      targetFile = args[i];
    }
  }

  if (!targetFile) {
    console.error('Usage: node scripts/check-design-tokens.js <file> [--design-md <path>]');
    process.exit(1);
  }

  try {
    const tokens = extractDesignTokens(designMdPath);
    const findings = scanFileForNonTokenColors(path.resolve(targetFile), tokens);

    if (findings.length === 0) {
      console.log(`H-DESIGN PASS: no non-token colors found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`H-DESIGN FAIL: non-token color(s) found in ${targetFile}`);
    for (const finding of findings) {
      console.error(`  ${finding.file}: ${finding.value}`);
    }
    process.exit(1);
  } catch (err) {
    console.error(`check-design-tokens.js error: ${err.message}`);
    process.exit(1);
  }
}
