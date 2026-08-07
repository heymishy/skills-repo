'use strict';

// src/web-ui/modules/roadmap-scan.js -- a5
//
// Read-only scan of a connected repo's artefacts/ directory for
// discovery-only and ideate-only feature folders -- work that only exists as
// a discovery or ideation artefact and has no corresponding entry in
// pipeline-state.json yet, so it is otherwise invisible in the product view.
//
// Per the story's Architecture Constraints: this reads artefacts directly at
// render time. It does NOT build the full sync/cache pipeline (a new
// product_rollups column computed by an extended /product-sync) -- that is
// explicitly deferred per discovery's Out of Scope. This module never writes
// to any file.

var fs = require('fs');
var path = require('path');

var TITLE_PREFIX_RE = /^(Discovery Artefact|Discovery|Ideation Artefact|Ideate)\s*[:—-]\s*/i;
var DATE_PATTERNS = [
  /\*\*Created:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  /\*\*Discovery started:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  /\*\*Session date:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i
];
var FOLDER_DATE_RE = /^([0-9]{4}-[0-9]{2}-[0-9]{2})-/;

/**
 * Pulls a human-readable title out of a discovery/ideate artefact's first
 * heading line, stripping the conventional "Discovery: " / "Discovery
 * Artefact -- " / "Ideation Artefact -- " prefix. Falls back to the folder
 * slug if no heading is found.
 * @param {string} mdContent
 * @param {string} fallback
 * @returns {string}
 */
function _extractTitle(mdContent, fallback) {
  var lines = String(mdContent || '').split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.charAt(0) === '#') {
      var heading = line.replace(/^#+\s*/, '').replace(TITLE_PREFIX_RE, '').trim();
      return heading || fallback;
    }
  }
  return fallback;
}

/**
 * Pulls a Created/Discovery-started/Session-date field out of the artefact
 * content. Falls back to the date embedded in the folder name
 * (artefacts/YYYY-MM-DD-slug/) when no explicit field is found -- this
 * fallback keeps the date populated even for artefact formats that vary in
 * their metadata field naming (this repo's own real artefacts use several
 * different labels across older and newer discovery.md files).
 * @param {string} mdContent
 * @param {string} folderName
 * @returns {string|null}
 */
function _extractDate(mdContent, folderName) {
  for (var i = 0; i < DATE_PATTERNS.length; i++) {
    var m = String(mdContent || '').match(DATE_PATTERNS[i]);
    if (m) return m[1];
  }
  var folderMatch = folderName.match(FOLDER_DATE_RE);
  return folderMatch ? folderMatch[1] : null;
}

/**
 * @param {object} pipelineState - parsed pipeline-state.json content (or null)
 * @returns {Object<string, boolean>} set of feature slugs already tracked
 */
function _trackedSlugSet(pipelineState) {
  var set = {};
  var features = (pipelineState && pipelineState.features) || [];
  features.forEach(function(f) {
    if (f && f.slug) { set[f.slug] = true; }
  });
  return set;
}

/**
 * Scans `artefactsDir` for feature folders that have a discovery.md and/or
 * ideate.md but no corresponding entry in pipeline-state.json (AC1, AC2,
 * AC3). Never throws -- a missing or unreadable directory, or zero
 * early-stage folders, both resolve to an empty array (AC4).
 *
 * Folders with an ideate.md are always labelled "Ideate only", whether or
 * not a discovery.md also exists alongside it (AC2) -- a distinct label
 * from plain "Discovery", never conflated with it.
 *
 * @param {string} artefactsDir - absolute path to the repo's artefacts/ directory
 * @param {object} pipelineState - parsed pipeline-state.json content (or null)
 * @returns {Array<{slug: string, title: string, stage: ('Discovery'|'Ideate only'), date: (string|null)}>}
 */
function scanRoadmapArtefacts(artefactsDir, pipelineState) {
  var results = [];
  var trackedSlugs = _trackedSlugSet(pipelineState);

  var entries;
  try {
    entries = fs.readdirSync(artefactsDir, { withFileTypes: true });
  } catch (_) {
    return results; // AC4 -- missing/unreadable dir behaves like "nothing early-stage"
  }

  entries.forEach(function(entry) {
    if (!entry.isDirectory()) { return; }
    var slug = entry.name;
    if (trackedSlugs[slug]) { return; } // AC3 -- already-tracked features are excluded

    var folderPath = path.join(artefactsDir, slug);
    var discoveryPath = path.join(folderPath, 'discovery.md');
    var ideatePath = path.join(folderPath, 'ideate.md');
    var hasDiscovery = fs.existsSync(discoveryPath);
    var hasIdeate = fs.existsSync(ideatePath);
    if (!hasDiscovery && !hasIdeate) { return; }

    var stage, sourcePath;
    if (hasIdeate) {
      stage = 'Ideate only';
      sourcePath = ideatePath;
    } else {
      stage = 'Discovery';
      sourcePath = discoveryPath;
    }

    var content = '';
    try { content = fs.readFileSync(sourcePath, 'utf8'); } catch (_) { content = ''; }

    results.push({
      slug: slug,
      title: _extractTitle(content, slug),
      stage: stage,
      date: _extractDate(content, slug)
    });
  });

  return results;
}

module.exports = { scanRoadmapArtefacts: scanRoadmapArtefacts };
