'use strict';

const zlib = require('zlib');

// capture-dispatch-adapter.js -- ppc-s9 Task 3: GitHub Actions dispatch +
// artifact-check adapter. This is the boundary the capture-trigger route
// (ppc-s9 Task 5) calls to kick off a capture-worker GitHub Actions workflow
// run, and that handleGetPlaybackEvidence (Task 6) polls to find and
// download its resulting artifact once the run finishes.
//
// D37 (CLAUDE.md, mandatory): a proper injectable adapter --
// setCaptureDispatchAdapter/getCaptureDispatchAdapter with a throw-on-unwired
// default stub for all three functions -- mirroring artefact-commit-writer.js's
// own setArtefactCommitAdapter/getArtefactCommitAdapter shape and
// capture-nonce-store.js's {set, get, del}-object-adapter convention (one
// set/get pair, several methods on the adapter object). Production wiring
// happens in server.js, as its own, separate task from this module and the
// route-handler changes that call it (D37 rule 3).
//
// Security boundary: dispatchCaptureWorkflow authenticates with a NEW,
// PLATFORM-level GitHub token (process.env.PLATFORM_GITHUB_TOKEN) that only
// needs actions:write on THIS platform's own repo. It is completely distinct
// from any tenant's own req.session.accessToken, which must NEVER be
// referenced anywhere in this file -- the dispatch inputs carry the nonce
// (ppc-s9 Task 1/2) as the only auth-adjacent value, and the nonce is
// meaningless without the Task-2 exchange endpoint.

function _throwUnwired(name) {
  return function() {
    throw new Error('Adapter not wired: ' + name + '. Call setCaptureDispatchAdapter() with a real implementation before use.');
  };
}

// Default stub exposes the same {dispatchCaptureWorkflow, checkCaptureArtifact,
// downloadCaptureArtifact} contract the real adapter uses, but every method
// throws -- never silently no-ops -- per D37 rule 1 (CLAUDE.md).
let _captureDispatchAdapter = {
  dispatchCaptureWorkflow: _throwUnwired('dispatchCaptureWorkflow'),
  checkCaptureArtifact:    _throwUnwired('checkCaptureArtifact'),
  downloadCaptureArtifact: _throwUnwired('downloadCaptureArtifact')
};

/**
 * Replace the capture-dispatch adapter (used in tests and production startup).
 * @param {{ dispatchCaptureWorkflow: Function, checkCaptureArtifact: Function, downloadCaptureArtifact: Function }} adapter
 */
function setCaptureDispatchAdapter(adapter) {
  _captureDispatchAdapter = adapter;
}

/**
 * Retrieve the currently wired capture-dispatch adapter. Callers invoke
 * getCaptureDispatchAdapter() rather than holding a captured reference, so
 * rewiring (e.g. setCaptureDispatchAdapter() in a test) always takes effect
 * for the next call -- mirrors artefact-commit-writer.js's
 * getArtefactCommitAdapter() convention.
 * @returns {object}
 */
function getCaptureDispatchAdapter() {
  return _captureDispatchAdapter;
}

/**
 * Dispatch the platform's capture-worker GitHub Actions workflow for one or
 * more ACs that share a single correlationId. Route code calls this -- NOT
 * realDispatchCaptureWorkflow directly -- so the implementation can be
 * swapped in tests without touching call sites.
 * @param {{ nonce: string, baseUrl: string, featureSlug: string, acIds: string[], targets: Array<{acId:string,url:string,selector:string}>, correlationId: string }} args
 * @returns {Promise<void>}
 */
async function dispatchCaptureWorkflow(args) {
  return getCaptureDispatchAdapter().dispatchCaptureWorkflow(args);
}

/**
 * Check whether the capture-worker run for a given correlationId has
 * finished and uploaded its result artifact yet.
 * @param {string} correlationId
 * @returns {Promise<{found: boolean, archiveDownloadUrl?: string}>}
 */
async function checkCaptureArtifact(correlationId) {
  return getCaptureDispatchAdapter().checkCaptureArtifact(correlationId);
}

/**
 * Download and unzip a found capture-result artifact in-memory.
 * @param {string} archiveDownloadUrl
 * @returns {Promise<{screenshots?: Object<string, Buffer>, videoBuffer?: Buffer}>}
 */
async function downloadCaptureArtifact(archiveDownloadUrl) {
  return getCaptureDispatchAdapter().downloadCaptureArtifact(archiveDownloadUrl);
}

// --- Real production implementations ---

function _apiBase() {
  return (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
}

/**
 * Resolve + validate the four platform-level env vars every real capture-
 * dispatch call needs. Fail-closed (throw) if any is missing -- mirrors
 * realCommitArtefact's own "owner and repo parameters are required"
 * fail-closed convention (artefact-commit-writer.js).
 * @returns {{ token: string, owner: string, repo: string, workflowId: string }}
 */
function _requirePlatformConfig() {
  const token      = process.env.PLATFORM_GITHUB_TOKEN;
  const owner      = process.env.PLATFORM_REPO_OWNER;
  const repo       = process.env.PLATFORM_REPO_NAME;
  const workflowId = process.env.PLATFORM_CAPTURE_WORKFLOW_ID;
  if (!token || !owner || !repo || !workflowId) {
    throw new Error(
      'realDispatchCaptureWorkflow/realCheckCaptureArtifact/realDownloadCaptureArtifact: ' +
      'PLATFORM_GITHUB_TOKEN, PLATFORM_REPO_OWNER, PLATFORM_REPO_NAME and PLATFORM_CAPTURE_WORKFLOW_ID ' +
      'must all be configured (the platform has no capture-dispatch target configured)'
    );
  }
  return { token: token, owner: owner, repo: repo, workflowId: workflowId };
}

/**
 * Real production implementation of dispatchCaptureWorkflow -- POSTs a
 * workflow_dispatch to this platform's own repo's capture-worker workflow.
 *
 * Only the fields named below are ever copied into the request `inputs` --
 * deliberately NOT a blind spread/Object.assign of the whole `args` object --
 * so a future caller that accidentally attaches a session/token-shaped field
 * to `args` can never leak it into the dispatch body. The nonce is the only
 * auth-adjacent value present, and it is meaningless without the Task-2
 * exchange endpoint. `req.session.accessToken` (or any tenant token) must
 * NEVER be read or referenced here.
 *
 * @param {{ nonce: string, baseUrl: string, featureSlug: string, acIds: string[], targets: Array<{acId:string,url:string,selector:string}>, correlationId: string }} args
 * @returns {Promise<void>}
 * @throws {Error} if any PLATFORM_* env var is missing (fail-closed), or the dispatch request fails
 */
async function realDispatchCaptureWorkflow(args) {
  const cfg = _requirePlatformConfig();
  const apiBase = _apiBase();
  const url = apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/actions/workflows/' + cfg.workflowId + '/dispatches';

  const bodyPayload = {
    ref: 'master',
    inputs: {
      nonce:         args.nonce,
      baseUrl:       args.baseUrl,
      featureSlug:   args.featureSlug,
      acIds:         JSON.stringify(args.acIds || []),
      targetsJson:   JSON.stringify(args.targets || []),
      correlationId: args.correlationId
    }
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  'Bearer ' + cfg.token,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    throw new Error('realDispatchCaptureWorkflow: GitHub workflow_dispatch failed: ' + res.status);
  }
}

/**
 * Parse the `link` response header for a `rel="next"` page number -- the
 * exact same pagination-parsing pattern server.js's own setFetchOrgs/
 * setFetchOrgMembers wiring already uses (don't invent a new parser), per
 * the plan's own instruction to reuse github-org-bulk-add.js's precedent.
 * @param {string} linkHeader
 * @returns {number|null}
 */
function _nextPageFromLinkHeader(linkHeader) {
  const link = linkHeader || '';
  const nextMatch = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="next"/);
  return nextMatch ? parseInt(nextMatch[1], 10) : null;
}

/**
 * Real production implementation of checkCaptureArtifact -- pages through
 * this platform repo's own Actions artifacts list (GET .../actions/artifacts),
 * filtering for an EXACT name match on 'capture-result-' + correlationId
 * (never a substring/prefix match, which could false-positive on a
 * similarly-named correlation id -- e.g. a retry suffix).
 * @param {string} correlationId
 * @returns {Promise<{found: boolean, archiveDownloadUrl?: string}>}
 * @throws {Error} if any PLATFORM_* env var is missing (fail-closed), or the list request fails
 */
async function realCheckCaptureArtifact(correlationId) {
  const cfg = _requirePlatformConfig();
  const apiBase = _apiBase();
  const targetName = 'capture-result-' + correlationId;

  let page = 1;
  while (true) {
    const url = apiBase + '/repos/' + cfg.owner + '/' + cfg.repo + '/actions/artifacts?per_page=100&page=' + page;
    const res = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + cfg.token,
        Accept:        'application/vnd.github+json'
      }
    });
    if (!res.ok) {
      throw new Error('realCheckCaptureArtifact: GitHub artifacts list fetch failed: ' + res.status);
    }
    const data = await res.json();
    const artifacts = data.artifacts || [];
    const match = artifacts.find(function(a) { return a.name === targetName; });
    if (match) {
      return { found: true, archiveDownloadUrl: match.archive_download_url };
    }

    const nextPage = _nextPageFromLinkHeader(res.headers.get('link'));
    if (!nextPage) break;
    page = nextPage;
  }

  return { found: false };
}

/**
 * Minimal manual ZIP parse -- central-directory walk + zlib raw-inflate for
 * DEFLATE entries (method 8) / passthrough for STORED entries (method 0).
 * No new npm dependency was added for this (none already existed in
 * package.json, and this repo's own web-ui-patterns.md convention is "no new
 * npm dependencies" -- the same guard that blocked playwright-core during
 * ppc-s8). GitHub Actions artifact archives are plain, single/few-file ZIPs
 * with no encryption/multi-disk/Zip64 complexity, so this minimal parser is
 * sufficient for this use case; it is NOT a general-purpose ZIP reader.
 * @param {Buffer} zipBuffer
 * @returns {Array<{name: string, data: Buffer}>}
 */
function _unzipEntries(zipBuffer) {
  const EOCD_SIG = 0x06054b50;
  const CDH_SIG  = 0x02014b50;
  const LFH_SIG  = 0x04034b50;

  // The EOCD record is always within the last 22 + 65535 (max comment) bytes.
  const searchStart = Math.max(0, zipBuffer.length - (22 + 65535));
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= searchStart; i--) {
    if (zipBuffer.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('_unzipEntries: no End Of Central Directory record found -- not a valid zip archive');
  }

  const totalEntries  = zipBuffer.readUInt16LE(eocdOffset + 10);
  const cdOffset      = zipBuffer.readUInt32LE(eocdOffset + 16);

  const entries = [];
  let offset = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (zipBuffer.readUInt32LE(offset) !== CDH_SIG) {
      throw new Error('_unzipEntries: central directory file header signature mismatch at offset ' + offset);
    }
    const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize    = zipBuffer.readUInt32LE(offset + 20);
    const fileNameLength    = zipBuffer.readUInt16LE(offset + 28);
    const extraFieldLength  = zipBuffer.readUInt16LE(offset + 30);
    const fileCommentLength = zipBuffer.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
    const fileName = zipBuffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

    // Only descend into the local header for actual files (skip directory entries).
    if (!/\/$/.test(fileName)) {
      if (zipBuffer.readUInt32LE(localHeaderOffset) !== LFH_SIG) {
        throw new Error('_unzipEntries: local file header signature mismatch at offset ' + localHeaderOffset);
      }
      const localFileNameLength   = zipBuffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraFieldLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
      const compressedData = zipBuffer.subarray(dataStart, dataStart + compressedSize);

      let data;
      if (compressionMethod === 0) {
        data = Buffer.from(compressedData);
      } else if (compressionMethod === 8) {
        data = zlib.inflateRawSync(compressedData);
      } else {
        throw new Error('_unzipEntries: unsupported compression method ' + compressionMethod + ' for entry ' + fileName);
      }

      entries.push({ name: fileName, data: data });
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

/**
 * Real production implementation of downloadCaptureArtifact -- fetches the
 * zip archive (following GitHub's redirect to blob storage; `fetch` follows
 * redirects by default, so a single call is sufficient for the documented
 * Actions artifact download flow) and unzips it in-memory via _unzipEntries.
 *
 * Screenshots are returned as `screenshots`, an object keyed by each .png
 * entry's own acId (its filename minus the '.png' extension -- e.g.
 * 'AC1.png' -> key 'AC1'), NOT a single shared screenshotBuffer. Task 4's
 * own worker script (.github/scripts/ppc-capture-worker.js) writes one
 * distinctly-named '<acId>.png' file per AC in a capture-all group
 * (confirmed by reading its own screenshots.map(...) destName logic), so
 * collapsing every .png entry into one overwritten buffer silently dropped
 * every AC's screenshot but the last one found in the archive -- this is
 * the exact bug this shape change exists to fix (spec-compliance review
 * finding, AC6).
 *
 * Video stays a single shared `videoBuffer`: Task 4's own script always
 * writes exactly one combined video file per group, named 'video.webm' (or
 * .mp4), never a per-AC name -- so no per-AC keying is needed on this side.
 *
 * This has not been exercised against a real GitHub artifact archive in
 * this session (no live credentials available) -- flagged for the
 * orchestrator to verify empirically against a real workflow run before
 * this path is relied on in production, per the plan's own instruction.
 * @param {string} archiveDownloadUrl
 * @returns {Promise<{screenshots?: Object<string, Buffer>, videoBuffer?: Buffer}>}
 * @throws {Error} if any PLATFORM_* env var is missing (fail-closed), or the download fails
 */
async function realDownloadCaptureArtifact(archiveDownloadUrl) {
  const cfg = _requirePlatformConfig();

  const res = await fetch(archiveDownloadUrl, {
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      Accept:        'application/vnd.github+json'
    },
    redirect: 'follow'
  });
  if (!res.ok) {
    throw new Error('realDownloadCaptureArtifact: artifact download failed: ' + res.status);
  }

  const arrayBuffer = await res.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);
  const entries = _unzipEntries(zipBuffer);

  const result = {};
  entries.forEach(function(entry) {
    if (/\.png$/i.test(entry.name)) {
      // basename-minus-extension, not the raw entry.name -- robust to the
      // (currently unused, but not guaranteed by the zip format itself) case
      // of a nested path inside the archive, e.g. 'shots/AC1.png' -> 'AC1'.
      const baseName = entry.name.split('/').pop();
      const acId = baseName.replace(/\.png$/i, '');
      if (!result.screenshots) result.screenshots = {};
      result.screenshots[acId] = entry.data;
    } else if (/\.(webm|mp4)$/i.test(entry.name)) {
      result.videoBuffer = entry.data;
    }
  });
  return result;
}

module.exports = {
  setCaptureDispatchAdapter,
  getCaptureDispatchAdapter,
  dispatchCaptureWorkflow,
  checkCaptureArtifact,
  downloadCaptureArtifact,
  realDispatchCaptureWorkflow,
  realCheckCaptureArtifact,
  realDownloadCaptureArtifact
};
