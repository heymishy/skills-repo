// standards-injection.js — dta-s1: activates the domain-tag standards
// injection mechanism described in .github/standards/index.yml's own header
// comment ("When a story has a domain tag matching a key here,
// /definition-of-ready will include all standards files for that domain in
// the coding agent instructions block"). Investigation (see
// artefacts/2026-07-18-domain-tag-activation/decisions.md, 2026-07-29 entry)
// found this mechanism was pure SKILL.md prose with no backing code, despite
// having been described as existing since index.yml was written -- this
// module is the first real implementation of it.
//
// No js-yaml dependency, matching this repo's established convention of
// text/regex-based parsing for simple, structured YAML files.
'use strict';

const fs   = require('fs');
const path = require('path');

const INDEX_PATH = path.join('.github', 'standards', 'index.yml');

/**
 * Parses .github/standards/index.yml into { [domainKey]: { description, files: [...] } }.
 * Returns null if the file does not exist (index.yml absence is a silent
 * skip, per the existing SKILL.md behaviour -- not a hard requirement).
 *
 * @param {string} repoRoot
 * @returns {Object|null}
 */
function parseStandardsIndex(repoRoot) {
  const indexPath = path.join(repoRoot, INDEX_PATH);
  if (!fs.existsSync(indexPath)) return null;

  const content = fs.readFileSync(indexPath, 'utf8');
  const lines = content.split(/\r?\n/);

  // Find the top-level `standards:` key, then read 2-space-indented domain
  // keys under it, each with an optional `description:` line and a `files:`
  // list (`      - path` lines, ignoring commented-out `# - path` lines).
  const standardsIdx = lines.findIndex((l) => /^standards:\s*$/.test(l));
  if (standardsIdx === -1) return {};

  const result = {};
  let currentDomain = null;

  for (let i = standardsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // dedent back to a new top-level key

    const domainMatch = /^  ([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (domainMatch) {
      currentDomain = domainMatch[1];
      result[currentDomain] = { description: '', files: [] };
      continue;
    }
    if (!currentDomain) continue;

    const descMatch = /^\s{4}description:\s*(.+)$/.exec(line);
    if (descMatch) {
      result[currentDomain].description = descMatch[1].trim();
      continue;
    }

    const fileMatch = /^\s{6}-\s+(\.github\/standards\/\S+\.md)\s*$/.exec(line);
    if (fileMatch) {
      result[currentDomain].files.push(fileMatch[1]);
    }
    // Commented-out entries (`      # - path`) are deliberately not matched.
  }

  return result;
}

/**
 * Normalises a raw domain tag for matching: trims whitespace and lowercases.
 * This is the one deliberate behaviour chosen for case/whitespace variants
 * (AC5/U10) -- a normalised match, not a third silent failure mode.
 *
 * @param {string} tag
 * @returns {string}
 */
function normaliseDomainTag(tag) {
  return String(tag || '').trim().toLowerCase();
}

/**
 * Matches an array of raw domain tags (as authored on a story) against
 * .github/standards/index.yml's domain keys.
 *
 * @param {string[]} domains - raw domain tag strings, e.g. [' Web-UI ', 'security']
 * @param {string} repoRoot
 * @returns {{ matched: Array<{domain: string, files: string[]}>, unmatched: string[], noDomainField?: boolean }}
 */
function matchDomainsToStandards(domains, repoRoot) {
  if (!domains || domains.length === 0) {
    return { matched: [], unmatched: [], noDomainField: true };
  }

  const index = parseStandardsIndex(repoRoot);
  if (!index) {
    return { matched: [], unmatched: domains.slice(), noDomainField: false };
  }

  const normalisedIndex = {};
  Object.keys(index).forEach((key) => {
    normalisedIndex[normaliseDomainTag(key)] = { key, entry: index[key] };
  });

  const matched = [];
  const unmatched = [];

  domains.forEach((rawTag) => {
    const normalised = normaliseDomainTag(rawTag);
    const found = normalisedIndex[normalised];
    if (found) {
      matched.push({ domain: found.key, files: found.entry.files.slice() });
    } else {
      unmatched.push(rawTag);
    }
  });

  return { matched, unmatched, noDomainField: false };
}

/**
 * Builds the full "## Applicable standards" Markdown block for inclusion in
 * a DoR artefact's Coding Agent Instructions section -- the actual file
 * content is included, not just a path reference (AC2/AC3, U4/IT1/IT2).
 *
 * Returns null when there is no domain field at all, so the caller can fall
 * back to the existing "Story has no domain field — skipped silently" text
 * unchanged (AC4 regression guard).
 *
 * @param {string[]} domains
 * @param {string} repoRoot
 * @returns {string|null}
 */
function buildStandardsInjectionBlock(domains, repoRoot) {
  const result = matchDomainsToStandards(domains, repoRoot);
  if (result.noDomainField) return null;

  const parts = ['## Applicable standards'];

  result.matched.forEach(({ domain, files }) => {
    files.forEach((relPath) => {
      const absPath = path.join(repoRoot, relPath);
      let fileContent;
      try {
        fileContent = fs.readFileSync(absPath, 'utf8');
      } catch (_) {
        fileContent = `_(could not read ${relPath})_`;
      }
      parts.push(`### From: ${relPath} (domain: ${domain})`);
      parts.push(fileContent.trim());
    });
  });

  result.unmatched.forEach((tag) => {
    parts.push(`> ⚠️ Tag \`${tag}\` was not found in index.yml — no standards injected for that domain.`);
  });

  return parts.join('\n\n');
}

module.exports = {
  parseStandardsIndex,
  normaliseDomainTag,
  matchDomainsToStandards,
  buildStandardsInjectionBlock,
};
