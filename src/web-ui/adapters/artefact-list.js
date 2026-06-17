'use strict';

// artefact-list.js — listArtefacts adapter (ADR-012)
// Returns artefacts for a feature grouped by pipeline stage with plain-language labels.
// AC2: all returned type fields use plain-language labels — never internal type identifiers.

const fs   = require('fs');
const path = require('path');

const { labelArtefactType, labelFromPath, groupArtefactsByStage } = require('../utils/plain-language-labels');

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

// Known subdirectory names that map directly to pipeline stage labels
const SUBDIR_TYPE_MAP = {
  'dor':            'Ready Check',
  'stories':        'Stories',
  'test-plans':     'Test Plan',
  'plans':          'Plan',
  'dod':            'Definition of Done',
  'decisions':      'Decisions',
  'reference':      'Reference',
  'research':       'Research',
  'coverage':       'Coverage'
};

/**
 * Derive artefact type from a file path within an artefacts directory.
 * Handles both flat files (e.g. "discovery.md") and nested paths (e.g. "dor/wuce.1-dor.md").
 * @param {string} filePath  e.g. "artefacts/2026-05-02-test-feature/dor/wuce.1-dor.md"
 * @returns {string} plain-language label
 */
function deriveTypeFromPath(filePath) {
  const parts = filePath.split('/');
  // If nested in a known subdirectory (e.g. dor/, stories/, test-plans/)
  if (parts.length >= 3) {
    const subDir = parts[parts.length - 2].toLowerCase();
    if (SUBDIR_TYPE_MAP[subDir]) return SUBDIR_TYPE_MAP[subDir];
  }
  const fileName = parts[parts.length - 1];
  return labelFromPath(fileName);
}

/**
 * List all artefacts for a feature, with plain-language labels and wuce.2 viewUrls.
 * If the artefacts directory is absent (404 / "Not Found"), returns a no-artefacts marker.
 *
 * @param {string} featureSlug  e.g. "2026-05-02-test-feature"
 * @param {string} token        OAuth access token
 * @returns {Promise<{ artefacts: Array, grouped: Object, noArtefacts: boolean }>}
 */
async function listArtefacts(featureSlug, token) {
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
  const featDir = path.join(repoRoot, 'artefacts', featureSlug);
  if (!fs.existsSync(featDir)) return null;
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
