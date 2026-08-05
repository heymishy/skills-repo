'use strict';

// export-data-source.js — rb-s4 AC4/AC5
//
// Real data-access implementation for the export endpoint
// (routes/export.js). Reuses fetchArtefact() -- the exact function
// handleArtefactRoute calls -- and the same GitHub Contents API path
// pipeline-state-fetch-adapter.js already uses for pipeline-state.json, so
// AC4 ("no divergent or stale copy" vs the in-app viewer) is structurally
// true rather than merely asserted by convention.
//
// D37 (CLAUDE.md): the throw-on-unwired stub and set/get pair live in
// routes/export.js (mirroring artefact.js's setFetcher location); this
// module only exports the "real" implementation, wired in server.js —
// same split already used by repo-adapter.js / pipeline-state-fetch-adapter.js.

const { fetchArtefact, ArtefactNotFoundError } = require('./artefact-fetcher');
const { realFetchPipelineState } = require('./pipeline-state-fetch-adapter');

class ExportNotDorApprovedError extends Error {
  constructor(slug) {
    super(`Feature ${slug} is not DoR-approved`);
    this.name = 'ExportNotDorApprovedError';
  }
}

class ExportAccessDeniedError extends Error {
  constructor(slug) {
    super(`Credential does not have access to feature ${slug}`);
    this.name = 'ExportAccessDeniedError';
  }
}

class ExportNotFoundError extends Error {
  constructor(slug) {
    super(`Feature ${slug} not found`);
    this.name = 'ExportNotFoundError';
  }
}

/** Collects both flat feature.stories[] and epic-nested feature.epics[].stories[] (Phase 3+ schema allows either shape). */
function collectStories(feature) {
  const flat = Array.isArray(feature.stories) ? feature.stories : [];
  const epicNested = Array.isArray(feature.epics)
    ? feature.epics.reduce((acc, epic) => acc.concat(Array.isArray(epic.stories) ? epic.stories : []), [])
    : [];
  return flat.concat(epicNested).filter(s => typeof s === 'object' && s !== null);
}

/** Returns the first story with dorStatus 'signed-off' and a recorded dorArtefact path, or null. */
function findDorApprovedStory(feature) {
  return collectStories(feature).find(s => s.dorStatus === 'signed-off' && s.dorArtefact) || null;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Converts a repo-root-relative dorArtefact path (artefacts/{slug}/dor/{story}-dor.md) into fetchArtefact's artefactType param (dor/{story}-dor). */
function toArtefactType(dorArtefactPath, slug) {
  return dorArtefactPath
    .replace(/^artefacts\//, '')
    .replace(new RegExp('^' + escapeRegExp(slug) + '/'), '')
    .replace(/\.md$/, '');
}

function ownerRepoFromEnv() {
  const repoSpec = process.env.GITHUB_REPO || '';
  const parts = repoSpec.split('/');
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Real export data source: fetches pipeline-state.json + the DoR-approved
 * story's artefact for `slug`, using the caller's own credential (never a
 * service account, per product/constraints.md #12).
 * @param {string} slug
 * @param {string} credential
 * @returns {Promise<{ artefactContent: string, pipelineStateEntry: object }>}
 */
async function realExportDataSource(slug, credential) {
  const { owner, repo } = ownerRepoFromEnv();

  let raw;
  try {
    raw = await realFetchPipelineState(owner, repo, credential);
  } catch (err) {
    if (/404/.test(err.message)) throw new ExportNotFoundError(slug);
    if (/403/.test(err.message) || /401/.test(err.message)) throw new ExportAccessDeniedError(slug);
    throw err;
  }

  const decoded = Buffer.from(raw.content.replace(/\n/g, ''), 'base64').toString('utf8');
  const pipelineState = JSON.parse(decoded);
  const feature = (pipelineState.features || []).find(f => f.slug === slug);

  if (!feature) throw new ExportNotFoundError(slug);

  const story = findDorApprovedStory(feature);
  if (!story) throw new ExportNotDorApprovedError(slug);

  const artefactType = toArtefactType(story.dorArtefact, slug);

  let artefactContent;
  try {
    artefactContent = await fetchArtefact(slug, artefactType, credential);
  } catch (err) {
    if (err instanceof ArtefactNotFoundError || err.name === 'ArtefactNotFoundError') {
      throw new ExportNotFoundError(slug);
    }
    throw err;
  }

  return { artefactContent, pipelineStateEntry: feature };
}

module.exports = {
  realExportDataSource,
  findDorApprovedStory,
  ExportNotDorApprovedError,
  ExportAccessDeniedError,
  ExportNotFoundError
};
