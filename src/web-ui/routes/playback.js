'use strict';
// playback.js -- fpd-s3: read-only viewer route for a DoD-validated
// feature's own playback package (walkthrough doc + screenshots from
// fpd-s1, video + captions/transcript from fpd-s2). Lists features with a
// package, and renders one feature's own scope/benefit/per-story-AC
// traceability structure. No new persisted data (Architecture Constraints).

const fs = require('fs');
const path = require('path');
const { buildArtefactTrace } = require('../adapters/artefact-trace');
const { parseDodAcCoverage, parseBenefitMetricTargets } = require('../../../scripts/playback-capture');
const { escHtml } = require('../utils/html-shell');
const { renderShellWithNav } = require('./products');
const { getRepoRoot } = require('../adapters/repo-root');

// AC1, AC5: "has a package" = artefacts/[slug]/playback/walkthrough.md
// exists on disk -- the one file every package is guaranteed to have, per
// fpd-s1's own AC1 (decisions.md / dor-contract assumption).
function listPlaybackFeatures(repoRoot, state, existsSyncFn) {
  const exists = existsSyncFn || fs.existsSync;
  return (state.features || [])
    .filter((f) => exists(path.join(repoRoot, 'artefacts', f.slug, 'playback', 'walkthrough.md')))
    .map((f) => ({ slug: f.slug, name: f.name || f.slug }));
}

// AC2: extracts one ## heading's own content verbatim, case-insensitive
// (real discovery.md files use "## Problem statement"; templates/discovery.md
// uses "## Problem Statement" -- confirmed case drift by direct comparison).
function extractMarkdownSection(markdown, headingText) {
  const lines = markdown.split('\n');
  const headingRe = new RegExp(`^##\\s+${headingText}\\s*$`, 'i');
  const startIdx = lines.findIndex((l) => headingRe.test(l.trim()));
  if (startIdx === -1) return '';
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) { endIdx = i; break; }
  }
  return lines.slice(startIdx + 1, endIdx).join('\n').trim();
}

// AC3, AC4: the one new, genuinely-incremental layer on top of
// buildArtefactTrace (ADR-028, already canonical) -- resolves each story's
// own DoD artefact and parses its AC Coverage table (parseDodAcCoverage,
// ADR-026, fpd-s1's own scripts/playback-capture.js). buildArtefactTrace's
// own epics/stories arrays already preserve real pipeline-state.json order
// (no re-sort) -- this function must not re-sort them either.
function buildFeaturePlaybackStructure(repoRoot, featureSlug, fsImpl) {
  const impl = fsImpl || fs;
  const trace = buildArtefactTrace(repoRoot, featureSlug, impl);
  if (trace.status !== 'found') return { epics: [], stories: [] };
  const stories = trace.stories.map((story) => {
    const dodArtefact = trace.artefacts.find((a) => a.storySlug === story.slug && a.type === 'dod');
    let acRows = [];
    if (dodArtefact) {
      const content = impl.readFileSync(path.join(trace.resolvedDir, dodArtefact.path), 'utf8');
      acRows = parseDodAcCoverage(content);
    }
    return Object.assign({}, story, { acRows });
  });
  return { epics: trace.epics, stories };
}

function renderPlaybackListHtml(features) {
  if (!features || features.length === 0) {
    return '<p class="playback-list__empty">No DoD-validated features with a playback package yet.</p>';
  }
  const items = features.map((f) =>
    `<li><a href="/playback/${encodeURIComponent(f.slug)}">${escHtml(f.name)}</a></li>`
  ).join('');
  return `<ul class="playback-list">${items}</ul>`;
}

function renderPlaybackReviewHtml(featureSlug, problemStatement, metricTargets, structure) {
  const summaryHtml =
    `<section class="playback-summary"><h2>Scope</h2><p>${escHtml(problemStatement || 'No problem statement on file.')}</p>` +
    `<h2>Benefit</h2><ul>${Object.keys(metricTargets || {}).map((name) =>
      `<li>${escHtml(name)}: ${escHtml(metricTargets[name])}</li>`
    ).join('')}</ul></section>`;

  const epicsBySlug = {};
  (structure.epics || []).forEach((e) => { epicsBySlug[e.slug] = { name: e.name, stories: [] }; });
  const flatStories = [];
  (structure.stories || []).forEach((s) => {
    if (s.epicSlug && epicsBySlug[s.epicSlug]) epicsBySlug[s.epicSlug].stories.push(s);
    else flatStories.push(s);
  });

  const renderStorySection = (story) => {
    const acHtml = (story.acRows || []).length === 0
      ? '<p class="playback-story__no-acs">No AC Coverage data available for this story yet.</p>'
      : story.acRows.map((ac) =>
          `<div class="playback-ac"><h4>${escHtml(ac.acId)} — ${escHtml(ac.description)}</h4><p>${escHtml(ac.evidence)}</p></div>`
        ).join('');
    return `<section class="playback-story"><h3>${escHtml(story.name || story.slug)}</h3>${acHtml}</section>`;
  };

  const epicSections = (structure.epics || []).map((e) => {
    const stories = epicsBySlug[e.slug].stories;
    if (stories.length === 0) return '';
    return `<section class="playback-epic"><h2>${escHtml(e.name || e.slug)}</h2>${stories.map(renderStorySection).join('')}</section>`;
  }).join('');
  const flatSections = flatStories.map(renderStorySection).join('');

  return `<h1>${escHtml(featureSlug)}</h1>${summaryHtml}${epicSections}${flatSections}`;
}

async function handleGetPlaybackList(req, res, pool) {
  const repoRoot = getRepoRoot(req);
  const state = JSON.parse(fs.readFileSync(path.join(repoRoot, '.github', 'pipeline-state.json'), 'utf8'));
  const features = listPlaybackFeatures(repoRoot, state);
  const html = await renderShellWithNav(pool, req.session.tenantId, {
    title: 'Feature Playback',
    bodyContent: renderPlaybackListHtml(features),
    user: { login: req.session.login || '' },
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function handleGetPlaybackReview(req, res, featureSlug, pool) {
  const repoRoot = getRepoRoot(req);
  const state = JSON.parse(fs.readFileSync(path.join(repoRoot, '.github', 'pipeline-state.json'), 'utf8'));
  const feature = (state.features || []).find((f) => f.slug === featureSlug);
  if (!feature) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('Feature not found'); return; }
  const discoveryContent = fs.readFileSync(path.join(repoRoot, 'artefacts', featureSlug, 'discovery.md'), 'utf8');
  const benefitMetricContent = fs.readFileSync(path.join(repoRoot, 'artefacts', featureSlug, 'benefit-metric.md'), 'utf8');
  const problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
  const metricTargets = parseBenefitMetricTargets(benefitMetricContent);
  const structure = buildFeaturePlaybackStructure(repoRoot, featureSlug);
  const html = await renderShellWithNav(pool, req.session.tenantId, {
    title: `Playback — ${feature.name || featureSlug}`,
    bodyContent: renderPlaybackReviewHtml(featureSlug, problemStatement, metricTargets, structure),
    user: { login: req.session.login || '' },
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure,
  renderPlaybackListHtml, renderPlaybackReviewHtml,
  handleGetPlaybackList, handleGetPlaybackReview,
};
