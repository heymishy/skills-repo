'use strict';

/**
 * Extract the first feature slug from a PR body text.
 * Scans for artefacts/<slug>/ pattern as produced by the standard PR template
 * "Chain references" table (backtick-wrapped or plain).
 *
 * @param {string|null} bodyText  PR body text
 * @returns {string}  The first slug found, or empty string
 */
function extractPRSlug(bodyText) {
  if (!bodyText) return '';
  const match = bodyText.match(/artefacts\/([^/\s`|)\]]+)\//);
  return match ? match[1] : '';
}

/**
 * Build a slug source note for the audit record "What was delivered" section header.
 *
 * @param {'pr-body'|'auto-resolved'|string} source  How the slug was resolved
 * @param {string} [slug]  The resolved slug (used when source is 'pr-body')
 * @returns {string}  Human-readable source note
 */
function buildSlugSourceNote(source, slug) {
  if (source === 'pr-body') {
    return `Source: PR body (Chain references) · \`${slug}\``;
  }
  if (source === 'auto-resolved') {
    return `⚠️ slug auto-resolved from pipeline-state — verify artefacts are correct`;
  }
  return '';
}

module.exports = { extractPRSlug, buildSlugSourceNote };

// CLI entrypoint — reads PR_BODY env var and prints the extracted slug to stdout
if (require.main === module) {
  const body = process.env.PR_BODY || '';
  const slug = extractPRSlug(body);
  process.stdout.write(slug + '\n');
}
