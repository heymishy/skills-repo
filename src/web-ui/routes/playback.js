'use strict';
// playback.js -- fpd-s3: read-only viewer route for a DoD-validated
// feature's own playback package (walkthrough doc + screenshots from
// fpd-s1, video + captions/transcript from fpd-s2). Lists features with a
// package, and renders one feature's own scope/benefit/per-story-AC
// traceability structure. No new persisted data (Architecture Constraints).

const fs = require('fs');
const path = require('path');
const { buildArtefactTrace } = require('../adapters/artefact-trace');
// fpd-s3 hotfix: was requiring ../../../scripts/playback-capture -- scripts/
// is never copied into the production Docker image (Dockerfile's own
// explicit COPY allowlist: src/, skills/, product/, artefacts/, .github/
// only), so this crashed staging on boot with MODULE_NOT_FOUND. Moved the
// two functions this route actually needs into src/utils/dod-parsing.js
// (always deployed); scripts/playback-capture.js now re-exports from there
// unchanged for its own existing callers.
const { parseDodAcCoverage, parseBenefitMetricTargets } = require('../../utils/dod-parsing');
const { captionTranscriptPaths } = require('../../utils/playback-paths');
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
      // fpd-s4: attach each AC's own resolved media -- the one new,
      // genuinely-incremental layer on top of this already-canonical
      // structure (ADR-028), not a second traversal.
      acRows = parseDodAcCoverage(content).map((ac) => Object.assign({}, ac, {
        media: resolveAcMedia(repoRoot, featureSlug, story.slug, ac.acId, impl),
      }));
    }
    return Object.assign({}, story, { acRows });
  });
  return { epics: trace.epics, stories };
}

// Reuses the shared .sw-card/.sw-section-title classes already defined in
// html-shell.js's own injected stylesheet (features.js's own established
// convention) rather than inventing unstyled, CSS-less class names -- the
// page gets baseline visual consistency with the rest of the app for free.
function renderPlaybackListHtml(features) {
  if (!features || features.length === 0) {
    return '<div class="sw-card playback-list"><p>No DoD-validated features with a playback package yet.</p></div>';
  }
  const items = features.map((f) =>
    `<li><a href="/playback/${encodeURIComponent(f.slug)}">${escHtml(f.name)}</a></li>`
  ).join('');
  return `<div class="sw-card playback-list"><h2 class="sw-section-title">Playback packages</h2><ul class="sw-list">${items}</ul></div>`;
}

// fpd-s6: counts total ACs across every story in a playback structure, and
// how many already have captured evidence (screenshot or video). Walks
// structure.stories directly -- that array already holds every story once
// (epicSlug is grouping metadata consumed separately by
// renderPlaybackReviewHtml, not a second data source), so no double-count
// risk from also walking structure.epics.
function computeAcCoverageSummary(structure) {
  let total = 0;
  let captured = 0;
  (structure.stories || []).forEach((story) => {
    (story.acRows || []).forEach((ac) => {
      total += 1;
      const media = ac.media;
      if (media && (media.screenshotPath || media.videoPath)) captured += 1;
    });
  });
  return { total, captured };
}

// fpd-s6: renders the coverage summary with three text-distinct states.
// Per MC-A11Y-02 (architecture-guardrails.md), the full-vs-partial
// distinction is carried by wording ("Full coverage" prefix), not by a
// CSS class or colour alone.
function renderCoverageSummaryHtml({ total, captured }) {
  if (captured === total && total > 0) {
    return `<p class="playback-coverage-summary playback-coverage-summary--full">Full coverage — ${captured} of ${total} ACs have captured evidence.</p>`;
  }
  if (captured === 0) {
    return `<p class="playback-coverage-summary playback-coverage-summary--none">0 of ${total} ACs have captured evidence yet.</p>`;
  }
  return `<p class="playback-coverage-summary playback-coverage-summary--partial">${captured} of ${total} ACs have captured evidence.</p>`;
}

function renderPlaybackReviewHtml(featureSlug, problemStatement, metricTargets, structure) {
  const summaryHtml =
    `<div class="sw-card playback-summary"><h2 class="sw-section-title">Scope</h2><p>${escHtml(problemStatement || 'No problem statement on file.')}</p>` +
    `<h2 class="sw-section-title">Benefit</h2><ul class="sw-list">${Object.keys(metricTargets || {}).map((name) =>
      `<li>${escHtml(name)}: ${escHtml(metricTargets[name])}</li>`
    ).join('')}</ul></div>`;

  const epicsBySlug = {};
  (structure.epics || []).forEach((e) => { epicsBySlug[e.slug] = { name: e.name, stories: [] }; });
  const flatStories = [];
  (structure.stories || []).forEach((s) => {
    if (s.epicSlug && epicsBySlug[s.epicSlug]) epicsBySlug[s.epicSlug].stories.push(s);
    else flatStories.push(s);
  });

  // fpd-s4: renders an AC's own screenshot/video/captions/transcript into
  // its existing section (ADR-028 -- not a second structure). Native
  // <video> only, no third-party player (Architecture Constraints).
  const renderAcMediaHtml = (media) => {
    if (!media || (!media.screenshotPath && !media.videoPath)) {
      return '<p class="playback-ac__empty">No evidence captured for this AC yet.</p>';
    }
    const imgHtml = media.screenshotPath
      ? `<img class="playback-ac__screenshot" src="/playback-media/${encodeURIComponent(media.screenshotPath)}" alt="Screenshot evidence" style="max-width:100%;border-radius:6px;border:1px solid var(--line)">`
      : '';
    const trackHtml = media.captionPath
      ? `<track kind="captions" src="/playback-media/${encodeURIComponent(media.captionPath)}" default>`
      : '';
    const videoHtml = media.videoPath
      ? `<video class="playback-ac__video" controls style="max-width:100%;border-radius:6px"><source src="/playback-media/${encodeURIComponent(media.videoPath)}" type="video/webm">${trackHtml}</video>`
      : '';
    const transcriptHtml = media.transcriptPath
      ? `<p><a class="playback-ac__transcript-link" href="/playback-media/${encodeURIComponent(media.transcriptPath)}" target="_blank" rel="noopener">View transcript</a></p>`
      : '';
    return imgHtml + videoHtml + transcriptHtml;
  };

  const renderStorySection = (story) => {
    const acHtml = (story.acRows || []).length === 0
      ? '<p class="playback-story__no-acs">No AC Coverage data available for this story yet.</p>'
      : story.acRows.map((ac) =>
          `<div class="playback-ac"><h4>${escHtml(ac.acId)} — ${escHtml(ac.description)}</h4><p>${escHtml(ac.evidence)}</p>${renderAcMediaHtml(ac.media)}</div>`
        ).join('');
    return `<div class="sw-card playback-story"><h3 class="sw-section-title">${escHtml(story.name || story.slug)}</h3>${acHtml}</div>`;
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

// AC1, AC5: screenshot path for one AC, if the file actually exists.
// fpd-s5: namespaced by storySlug -- artefacts/<featureSlug>/playback/<storySlug>/screenshots/<acId>.png
// -- fixes a real cross-story collision: AC numbering restarts per story, so
// two different stories' own "AC1" would otherwise share the same file.
function resolveScreenshotPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${acId}.png`;
  return impl.existsSync(path.join(repoRoot, relPath)) ? relPath : null;
}

// AC2, AC5: video path for one AC -- a per-AC-named clip if one exists,
// else the single combined walkthrough file if the video/ directory
// contains exactly one .webm (AC2's own "or is covered by the feature's
// single combined walkthrough" case), else null (no evidence yet).
// fpd-s5: namespaced by storySlug, same reasoning as resolveScreenshotPathForAc above.
function resolveVideoPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const videoDir = path.join(repoRoot, 'artefacts', featureSlug, 'playback', storySlug, 'video');
  if (!impl.existsSync(videoDir)) return null;
  const perAcRel = `artefacts/${featureSlug}/playback/${storySlug}/video/${acId}.webm`;
  if (impl.existsSync(path.join(repoRoot, perAcRel))) return perAcRel;
  const files = impl.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 1) return `artefacts/${featureSlug}/playback/${storySlug}/video/${files[0]}`;
  return null;
}

// AC3, AC4: given a resolved video path, derive caption/transcript paths
// (ADR-026 -- reuses fpd-s2's own naming convention) and confirm they
// actually exist on disk -- never render a reference to a file that isn't
// really there.
function resolveCaptionTranscriptForVideo(repoRoot, videoPath, fsImpl) {
  const impl = fsImpl || fs;
  if (!videoPath) return { captionPath: null, transcriptPath: null };
  const { captionPath, transcriptPath } = captionTranscriptPaths(videoPath);
  return {
    captionPath: impl.existsSync(path.join(repoRoot, captionPath)) ? captionPath : null,
    transcriptPath: impl.existsSync(path.join(repoRoot, transcriptPath)) ? transcriptPath : null,
  };
}

function resolveAcMedia(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const screenshotPath = resolveScreenshotPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl);
  const videoPath = resolveVideoPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl);
  const { captionPath, transcriptPath } = resolveCaptionTranscriptForVideo(repoRoot, videoPath, fsImpl);
  return { screenshotPath, videoPath, captionPath, transcriptPath };
}

// Task 5: media-serving route. CLAUDE.md path traversal guard (ougl) is
// mandatory here -- requestedPath comes straight off the URL. Two layers:
// (1) an allowlist shape, since only files resolveAcMedia itself would ever
// hand back are servable (screenshots/video/captions/transcripts under a
// feature's own playback/ dir) -- rejects e.g. discovery.md even though it
// resolves inside repoRoot; (2) path.resolve + startsWith(repoRoot) against
// that same traversal class CLAUDE.md names explicitly (../secret.txt).
const MEDIA_PATH_RE = /^artefacts\/[^/]+\/playback\/[^/]+\/(screenshots|video)\/[^/]+\.(png|webm|vtt|txt)$/;
const MEDIA_CONTENT_TYPES = { '.png': 'image/png', '.webm': 'video/webm', '.vtt': 'text/vtt', '.txt': 'text/plain' };

async function handleGetPlaybackMedia(req, res, requestedPath) {
  if (!MEDIA_PATH_RE.test(requestedPath)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid media path');
    return;
  }
  const repoRoot = getRepoRoot(req);
  const resolved = path.resolve(repoRoot, requestedPath);
  if (!resolved.startsWith(repoRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid media path');
    return;
  }
  if (!fs.existsSync(resolved)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const contentType = MEDIA_CONTENT_TYPES[path.extname(resolved)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolved).pipe(res);
}

module.exports = {
  listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure,
  renderPlaybackListHtml, renderPlaybackReviewHtml,
  handleGetPlaybackList, handleGetPlaybackReview,
  resolveAcMedia, handleGetPlaybackMedia,
  computeAcCoverageSummary, renderCoverageSummaryHtml,
};
