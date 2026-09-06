'use strict';

// artefact-list.js — listArtefacts adapter (ADR-012)
// Returns artefacts for a feature grouped by pipeline stage with plain-language labels.
// AC2: all returned type fields use plain-language labels — never internal type identifiers.

const fs   = require('fs');
const path = require('path');

const { labelArtefactType, labelFromPath, groupArtefactsByStage } = require('../utils/plain-language-labels');
const { resolveLabel, isKnownSubdir } = require('../utils/artefact-labels');

// Injected dependencies — replaced in tests via setters
let _fetchArtefactDirectory = async (/* owner, repo, featureSlug, token */) => null;
let _getConfiguredRepositories = () => {
  const raw = process.env.WUCE_REPOSITORIES || '';
  return raw.split(',').map((r) => r.trim()).filter(Boolean);
};
let _validateRepositoryAccess = async (/* owner, repo, token */) => true;

function setFetchArtefactDirectory(fn)     { _fetchArtefactDirectory = fn; }
function setConfiguredRepositories(fn)     { _getConfiguredRepositories = fn; }
function setValidateRepositoryAccess(fn)   { _validateRepositoryAccess = fn; }

/**
 * Derive artefact type from a file path within an artefacts directory.
 * Handles both flat files (e.g. "discovery.md") and nested paths (e.g. "dor/wuce.1-dor.md").
 * cat-s2: sourced from the canonical subdirectory label table
 * (utils/artefact-labels.js's resolveLabel/isKnownSubdir) instead of a
 * separately-maintained SUBDIR_TYPE_MAP, closing the 5-table divergence risk.
 * @param {string} filePath  e.g. "artefacts/2026-05-02-test-feature/dor/wuce.1-dor.md"
 * @returns {string} plain-language label
 */
function deriveTypeFromPath(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  // If nested in a known subdirectory (e.g. dor/, stories/, test-plans/)
  if (parts.length >= 3) {
    const subDir = parts[parts.length - 2].toLowerCase();
    if (isKnownSubdir(subDir)) return resolveLabel(subDir, fileName);
  }
  return labelFromPath(fileName);
}

/**
 * List all artefacts for a feature, with plain-language labels and wuce.2 viewUrls.
 * If the artefacts directory is absent (404 / "Not Found"), returns a no-artefacts marker.
 *
 * When repoRoot is supplied, the local filesystem (via listLocalArtefacts) is checked
 * first — this is the path that actually reflects real content for single-checkout
 * deployments (staging, this repo), since WUCE_REPOSITORIES-based GitHub-API lookup
 * returns noArtefacts unconditionally when that env var is unset. The GitHub-API path
 * remains the fallback for multi-repo setups where the web-ui process has no local
 * checkout of the feature's repo. Source: canvas-render-and-story-extraction-fix retro.
 *
 * alrf-s4: when the local directory doesn't exist either (the expected case
 * on a redeployed, volumeless container — see decisions.md D3/D4), a third
 * source is checked before falling to the GitHub-API path: pgArtefactRows,
 * pre-fetched by the caller from journey-store's getArtefactsForJourney()
 * (Postgres/Neon, already durably written on every stage completion — see
 * routes/skills.js's "Persist artefact content to Postgres so cross-device
 * / post-deploy resume works"). This was already being WRITTEN; nothing was
 * reading it back for this page until now.
 *
 * @param {string} featureSlug  e.g. "2026-05-02-test-feature"
 * @param {string} token        OAuth access token
 * @param {string} [repoRoot]   absolute path to a local checkout, from adapters/repo-root
 * @param {Array<{skill_name:string, artefact_path:string, content:string}>} [pgArtefactRows]
 *   pre-fetched rows from journey-store's getArtefactsForJourney(), or undefined/empty
 * @returns {Promise<{ artefacts: Array, grouped: Object, noArtefacts: boolean }>}
 */
async function listArtefacts(featureSlug, token, repoRoot, pgArtefactRows) {
  let localArtefacts = null;
  if (repoRoot) {
    const localItems = listLocalArtefacts(repoRoot, featureSlug);
    if (localItems !== null) {
      localArtefacts = localItems.map((item) => {
        const relPath = path.relative(repoRoot, item.path).split(path.sep).join('/');
        return {
          name:    path.basename(item.path),
          path:    relPath,
          sha:     null,
          type:    deriveTypeFromPath(relPath),
          viewUrl: `/artefacts/${encodeURIComponent(relPath)}`
        };
      });
    }
    // Directory doesn't exist locally at all -- localArtefacts stays null.
  }

  const pgArtefacts = (Array.isArray(pgArtefactRows) && pgArtefactRows.length > 0)
    ? pgArtefactRows.map((row) => ({
        name:    path.basename(row.artefact_path),
        path:    row.artefact_path,
        sha:     null,
        type:    deriveTypeFromPath(row.artefact_path),
        viewUrl: `/artefacts/${encodeURIComponent(row.artefact_path)}`
      }))
    : [];

  if ((localArtefacts && localArtefacts.length > 0) || pgArtefacts.length > 0) {
    // lpmf-s1: merge instead of local-wins-if-nonempty -- local overlays
    // Postgres by path so a stale/partial local checkout no longer hides
    // artefacts that only exist in the durably-saved Postgres store.
    const merged = new Map();
    for (const item of pgArtefacts) merged.set(item.path, item);
    for (const item of (localArtefacts || [])) merged.set(item.path, item);
    const artefacts = Array.from(merged.values());
    const grouped = groupArtefactsByStage(artefacts);
    return { artefacts, grouped, noArtefacts: false };
  }

  const repos = _getConfiguredRepositories();

  for (const repoPath of repos) {
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) continue;

    const canAccess = await _validateRepositoryAccess(owner, repo, token);
    if (!canAccess) continue;

    const rawItems = await _fetchArtefactDirectory(owner, repo, featureSlug, token);

    // AC5: 404 / "Not Found" → no artefacts found (not an error)
    if (!rawItems || (rawItems.message && rawItems.message === 'Not Found') || (Array.isArray(rawItems) && rawItems.length === 0)) {
      return { artefacts: [], grouped: {}, noArtefacts: true };
    }

    if (!Array.isArray(rawItems)) {
      return { artefacts: [], grouped: {}, noArtefacts: true };
    }

    const artefacts = rawItems
      .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      .map((item) => ({
        name:    item.name,
        path:    item.path,
        sha:     item.sha,
        type:    deriveTypeFromPath(item.path),  // AC2: plain-language label
        viewUrl: `/artefacts/${encodeURIComponent(item.path)}`  // AC4: wuce.2 view
      }));

    const grouped = groupArtefactsByStage(artefacts);
    return { artefacts, grouped, noArtefacts: false };
  }

  // No accessible repos found for this feature
  return { artefacts: [], grouped: {}, noArtefacts: true };
}

/**
 * Recursively walk a directory and collect all .md files as artefact items.
 * @param {string} dir  absolute path to search
 * @param {string[]} acc  accumulator
 */
function walkMdFiles(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walkMdFiles(full, acc); }
    else if (e.isFile() && e.name.endsWith('.md')) { acc.push(full); }
  }
}

/**
 * List artefacts for a feature from the local filesystem (used when COPILOT_REPO_PATH is set).
 * Returns an array of { path, type: 'file' } or null if the directory doesn't exist.
 *
 * @param {string} repoRoot   absolute path to the repository root
 * @param {string} featureSlug
 * @returns {Array<{path:string, type:'file'}>|null}
 */
function listLocalArtefacts(repoRoot, featureSlug) {
  let featDir = path.join(repoRoot, 'artefacts', featureSlug);
  if (!fs.existsSync(featDir)) {
    // aada-s1: a feature moved to artefacts/archived/<slug>/ by the
    // archival pass still has real files -- validate-trace.sh/.ps1 already
    // check this exact fallback path for trace-validation; this brings the
    // web UI's own artefact-serving path in line with that convention.
    const archivedDir = path.join(repoRoot, 'artefacts', 'archived', featureSlug);
    if (!fs.existsSync(archivedDir)) return null;
    featDir = archivedDir;
  }
  const files = [];
  walkMdFiles(featDir, files);
  return files.map((f) => ({ path: f, type: 'file' }));
}

module.exports = {
  listArtefacts,
  listLocalArtefacts,
  setFetchArtefactDirectory,
  setConfiguredRepositories,
  setValidateRepositoryAccess,
  deriveTypeFromPath
};
