'use strict';

// saas-fetch.js — rb-s4
//
// CLI-side "resolve source, copy/write content, log the fetch" logic,
// mirroring scripts/platform-fetch.js's shape, against the SaaS export
// endpoint (GET /api/export/:slug) instead of a local directory source.
//
// AC3 (no silent fallback): every early-return path below happens before
// any fs write, so a 403 (or any other non-ok response) leaves the target
// directory exactly as it was -- this function never writes fresh-repo
// bootstrap content as a fallback.
//
// Deliberately duplicates the small findDorApprovedStory() helper that also
// lives in src/web-ui/adapters/export-data-source.js rather than requiring
// across the cli/ <-> src/web-ui/ boundary: the CLI package (published to
// npm via package.json's "files") and the hosted SaaS server are two
// separate distributables and must not share a require path that only
// exists in this monorepo's checkout.

const fs = require('fs');
const path = require('path');

class SaasAccessDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SaasAccessDeniedError';
  }
}

class SaasFetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SaasFetchError';
  }
}

const DEFAULT_BASE_URL = process.env.SKILLS_SAAS_BASE_URL || 'https://app.skills-repo.dev';

// emss-s1: optional storySlug parameter, mirroring the same addition to
// src/web-ui/adapters/export-data-source.js's findDorApprovedStory. This
// copy must also accept the selector -- fetchFromSaas below already threads
// the caller's --story value into the request URL, and the server returns
// that specific story's artefactContent, but this function still needs to
// derive the *matching* story's dorArtefact path to write that content to.
// Without threading the same selector here, this would keep re-deriving
// story A's path (the no-selector default) while writing story B's actual
// returned content under it -- a silent file-path/content mismatch.
function findDorApprovedStory(feature, storySlug) {
  const flat = Array.isArray(feature.stories) ? feature.stories : [];
  const epicNested = Array.isArray(feature.epics)
    ? feature.epics.reduce((acc, epic) => acc.concat(Array.isArray(epic.stories) ? epic.stories : []), [])
    : [];
  const signedOff = flat.concat(epicNested).filter(s => typeof s === 'object' && s !== null)
    .filter(s => s.dorStatus === 'signed-off' && s.dorArtefact);
  if (storySlug) {
    return signedOff.find(s => (s.slug || s.id) === storySlug) || null;
  }
  return signedOff[0] || null;
}

/**
 * Fetches a DoR-approved feature bundle from the SaaS export endpoint and
 * materializes it into targetDir. Throws (never falls back to fresh-repo
 * bootstrap content) on any non-200 response -- see AC3.
 * @param {string} targetDir
 * @param {string} slug - feature slug
 * @param {string} credential - resolved via credential-prompt.js, never an env var or CLI arg
 * @param {{ baseUrl?: string, fetchImpl?: Function, story?: string }} [opts]
 * @returns {Promise<{ artefactPath: string, statePath: string }>}
 */
async function fetchFromSaas(targetDir, slug, credential, opts) {
  opts = opts || {};
  const baseUrl = opts.baseUrl || DEFAULT_BASE_URL;
  const fetchImpl = opts.fetchImpl || fetch;
  // emss-s1: opts.story (from the CLI's --story companion flag) is appended
  // as the same ?story= query parameter the route/adapter reads server-side.
  // Omitted entirely when absent, so the no-selector request URL shape is
  // byte-for-byte unchanged from before this story (AC1 backward compat).
  const url = `${baseUrl.replace(/\/$/, '')}/api/export/${encodeURIComponent(slug)}` +
    (opts.story ? `?story=${encodeURIComponent(opts.story)}` : '');

  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${credential}` }
    });
  } catch (err) {
    throw new SaasFetchError(`Network error contacting SaaS export endpoint: ${err.message}`);
  }

  if (response.status === 403) {
    let body = {};
    try { body = await response.json(); } catch (_) { /* ignore parse failure */ }
    throw new SaasAccessDeniedError(body.error || `Credential does not have access to feature ${slug}`);
  }

  if (!response.ok) {
    let body = {};
    try { body = await response.json(); } catch (_) { /* ignore parse failure */ }
    throw new SaasFetchError(body.error || `SaaS export endpoint returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const feature = data.pipelineStateEntry;
  const story = feature && findDorApprovedStory(feature, opts.story);
  if (!story) {
    throw new SaasFetchError(`SaaS export response for ${slug} did not include a DoR-approved story's artefact path`);
  }

  // Write the fetched DoR artefact to its conventional path.
  const artefactAbsPath = path.join(targetDir, story.dorArtefact);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, data.artefactContent, 'utf8');

  // Merge the fetched feature entry into .github/pipeline-state.json (create if absent).
  const statePath = path.join(targetDir, '.github', 'pipeline-state.json');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  let state;
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } else {
    state = { version: '1', updated: new Date().toISOString(), programmes: [], features: [] };
  }
  state.features = Array.isArray(state.features) ? state.features : [];
  const existingIdx = state.features.findIndex(f => f.slug === slug);
  if (existingIdx >= 0) state.features[existingIdx] = feature;
  else state.features.push(feature);
  state.updated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');

  // Fetch-log entry under workspace/ -- mirrors platform-fetch.js's own log write.
  const workspaceDir = path.join(targetDir, 'workspace');
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.writeFileSync(
    path.join(workspaceDir, 'saas-fetch-log.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), featureSlug: slug, source: baseUrl }, null, 2) + '\n',
    'utf8'
  );

  return { artefactPath: artefactAbsPath, statePath };
}

module.exports = { fetchFromSaas, findDorApprovedStory, SaasAccessDeniedError, SaasFetchError };
