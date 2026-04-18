/**
 * artefact-fetcher.js
 * Fetches real .md artefact files from the artefacts/ directory.
 * Caches results. Falls back gracefully when files do not exist.
 *
 * Exposes window.ArtefactFetcher with:
 *   fetch(path)                    → Promise<string|null>
 *   storyPaths(featureSlug, slug)  → [{label, path, phase}]
 *   featurePaths(featureSlug)      → [{label, path, phase}]
 *   buildTraceLinks(story, feat)   → markdown string of traceability links
 */
(function () {
  'use strict';
  var cache = {};
  var BASE = '../artefacts/';

  function fetchMd(relPath) {
    if (cache[relPath] !== undefined) return Promise.resolve(cache[relPath]);
    return fetch(BASE + relPath)
      .then(function (r) {
        if (!r.ok) { cache[relPath] = null; return null; }
        return r.text();
      })
      .then(function (text) { cache[relPath] = text; return text; })
      .catch(function () { cache[relPath] = null; return null; });
  }

  /** Top-level artefact paths for a feature (discovery, benefit-metric, etc.) */
  function featurePaths(featureSlug) {
    return [
      { label: 'Discovery',      path: featureSlug + '/discovery.md',       phase: 'discovery' },
      { label: 'Benefit metric',  path: featureSlug + '/benefit-metric.md',  phase: 'benefit' },
      { label: 'Decisions',       path: featureSlug + '/decisions.md',       phase: 'definition' },
      { label: 'NFR profile',     path: featureSlug + '/nfr-profile.md',     phase: 'definition' },
    ];
  }

  /** Per-story artefact paths (story .md, test plan, DoR, DoR contract, verification, DoD). */
  function storyPaths(featureSlug, storySlug) {
    var s = storySlug;
    return [
      { label: s + ' — story',         path: featureSlug + '/stories/' + s + '.md',                   phase: 'definition' },
      { label: s + ' — test plan',     path: featureSlug + '/test-plans/' + s + '-test-plan.md',       phase: 'testplan' },
      { label: s + ' — DoR',           path: featureSlug + '/dor/' + s + '-dor.md',                    phase: 'dor' },
      { label: s + ' — DoR contract',  path: featureSlug + '/dor/' + s + '-dor-contract.md',           phase: 'dor' },
      { label: s + ' — verification',  path: featureSlug + '/verification-scripts/' + s + '-verification.md', phase: 'testplan' },
      { label: s + ' — DoD',           path: featureSlug + '/dod/' + s + '-dod.md',                    phase: 'dod' },
    ];
  }

  /**
   * Build a traceability-links markdown section for a story.
   * story: enriched story object from pipeline-adapter
   * featureSlug: e.g. "2026-04-14-skills-platform-phase3"
   * epicName: string
   */
  function buildTraceLinks(story, featureSlug, epicName) {
    var lines = [];
    lines.push('## Traceability');
    lines.push('');
    lines.push('| Element | Link |');
    lines.push('|---|---|');
    if (epicName) {
      lines.push('| Epic | ' + epicName + ' |');
    }
    if (featureSlug) {
      lines.push('| Discovery | [discovery.md](../artefacts/' + featureSlug + '/discovery.md) |');
      lines.push('| Benefit metric | [benefit-metric.md](../artefacts/' + featureSlug + '/benefit-metric.md) |');
    }
    var slug = story.id || story.slug || '';
    if (slug && featureSlug) {
      lines.push('| Story | [' + slug + '.md](../artefacts/' + featureSlug + '/stories/' + slug + '.md) |');
      lines.push('| Test plan | [' + slug + '-test-plan.md](../artefacts/' + featureSlug + '/test-plans/' + slug + '-test-plan.md) |');
      lines.push('| DoR | [' + slug + '-dor.md](../artefacts/' + featureSlug + '/dor/' + slug + '-dor.md) |');
    }
    if (story.prUrl) {
      lines.push('| Pull request | [' + story.prUrl + '](' + story.prUrl + ') |');
    }
    if (story.issueUrl) {
      lines.push('| Issue | [' + story.issueUrl + '](' + story.issueUrl + ') |');
    }
    lines.push('');
    return lines.join('\n');
  }

  /**
   * Build a metadata summary markdown section for a story.
   */
  function buildStoryMeta(story) {
    var lines = [];
    lines.push('## Status');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|---|---|');
    if (story.name) lines.push('| Name | ' + story.name + ' |');
    lines.push('| Stage | ' + (story.stageRaw || story.phase || '—') + ' |');
    lines.push('| Health | ' + (story.health || '—') + ' |');
    lines.push('| State | ' + (story.state || '—') + ' |');
    if (story.dodStatus) lines.push('| DoD status | ' + story.dodStatus + ' |');
    if (story.reviewStatus) lines.push('| Review | ' + story.reviewStatus + ' |');
    if (story.acTotal) lines.push('| ACs | ' + (story.acVerified || 0) + '/' + story.acTotal + ' verified |');
    if (story.testPlan) {
      lines.push('| Test plan | ' + story.testPlan.status + ' · ' + (story.testPlan.passing || 0) + '/' + (story.testPlan.totalTests || 0) + ' passing |');
    }
    if (story.mergedAt) lines.push('| Merged | ' + story.mergedAt + ' |');
    lines.push('');
    return lines.join('\n');
  }

  window.ArtefactFetcher = {
    fetch: fetchMd,
    featurePaths: featurePaths,
    storyPaths: storyPaths,
    buildTraceLinks: buildTraceLinks,
    buildStoryMeta: buildStoryMeta,
    cache: cache,
  };
})();
