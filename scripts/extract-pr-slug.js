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
  // Exclude * and other non-slug chars; a valid feature slug is always YYYY-MM-DD-name
  const match = bodyText.match(/artefacts\/([^/\s*`|)\]]+)\//);
  return match ? match[1] : '';
}

/**
 * Build a slug source note for the audit record "What was delivered" section header.
 *
 * @param {'pr-body'|'branch-name'|'auto-resolved'|string} source  How the slug was resolved
 * @param {string} [slug]  The resolved slug (used when source is 'pr-body' or 'branch-name')
 * @returns {string}  Human-readable source note
 */
function buildSlugSourceNote(source, slug) {
  if (source === 'pr-body') {
    return `Source: PR body (Chain references) · \`${slug}\``;
  }
  if (source === 'branch-name') {
    return `Source: branch name · \`${slug}\``;
  }
  if (source === 'auto-resolved') {
    return `⚠️ slug auto-resolved from pipeline-state — verify artefacts are correct`;
  }
  return '';
}

/**
 * Derive a feature slug from a branch name by matching the story ID embedded in
 * the branch name (e.g. "feature/owle.1") against pipeline-state stories.
 *
 * @param {string}      branchName  Git branch name, e.g. "feature/owle.1"
 * @param {object|null} stateObj    Parsed pipeline-state.json object
 * @returns {string}  The feature slug, or empty string if not matched
 */
function extractFeatureSlugFromBranchName(branchName, stateObj) {
  if (!branchName || !stateObj || !stateObj.features) return '';
  const m = branchName.match(/^(?:feature|feat)\/([a-z][a-z0-9]*\.[0-9]+)$/);
  if (!m) return '';
  const storyId = m[1];
  for (const feat of stateObj.features) {
    for (const s of feat.stories || []) {
      if ((s.id || s.slug) === storyId) return feat.slug;
    }
    for (const e of feat.epics || []) {
      for (const s of e.stories || []) {
        if ((s.id || s.slug) === storyId) return feat.slug;
      }
    }
  }
  return '';
}

/**
 * Extract the story ID referenced in a PR body for a given feature slug.
 * Scans bodyText for a path matching artefacts/<featureSlug>/stories/<storyId>-*.md
 * and returns the story ID (the alphanumeric+dot portion before the first `-`).
 *
 * @param {string|null} bodyText     PR body text
 * @param {string}      featureSlug  The feature slug to scope the search to
 * @returns {string}  Story ID (e.g. "p11.6"), or empty string if not found
 */
function extractStorySlug(bodyText, featureSlug) {
  if (!bodyText || !featureSlug) return '';
  const escaped = featureSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('artefacts/' + escaped + '/stories/([A-Za-z0-9.]+)-');
  const match = bodyText.match(re);
  return match ? match[1] : '';
}

/**
 * Build a dispatch note for the audit record AC section header.
 *
 * @param {'verified'|'not-found'|'no-dispatch'} status  Dispatch status
 * @param {string} storyId   The story ID being cross-checked
 * @param {string} [issueUrl]  The dispatch issue URL (used when status is 'verified')
 * @returns {string}  Human-readable dispatch note
 */
function buildDispatchNote(status, storyId, issueUrl) {
  if (status === 'verified') {
    const issueNum = issueUrl ? issueUrl.split('/').pop() : '';
    return `✅ Dispatch verified · Issue #${issueNum}`;
  }
  if (status === 'not-found') {
    return `⚠️ ${storyId} not found in pipeline-state`;
  }
  if (status === 'no-dispatch') {
    return `⚠️ No dispatch record`;
  }
  return '';
}

module.exports = { extractPRSlug, buildSlugSourceNote, extractStorySlug, buildDispatchNote, extractFeatureSlugFromBranchName };

// CLI entrypoint — reads PR_BODY env var and prints the extracted slug to stdout
if (require.main === module) {
  const body = process.env.PR_BODY || '';
  const slug = extractPRSlug(body);
  process.stdout.write(slug + '\n');
}
