# Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure — Implementation Plan

> **For agent execution:** Single session — use /tdd task by task (no subagents dispatched this run).

**Goal:** Make every test in fpd-s3-test-plan.md pass. Build a new read-only route under `src/web-ui/routes/` listing DoD-validated features with a playback package, plus a per-feature review page with scope/benefit summary and per-story AC sections — reusing `buildArtefactTrace` (ADR-028, already-canonical traversal, see `decisions.md` 2026-10-16) and `parseDodAcCoverage`/`parseBenefitMetricTargets` (ADR-026, `fpd-s1`'s own `scripts/playback-capture.js`), not re-deriving either.
**Branch:** `feature/fpd-s3`
**Worktree:** `.worktrees/fpd-s3`
**Test command:** `node scripts/run-all-tests.js`

---

## File map

```
Create:
  src/web-ui/routes/playback.js                                — route handlers + pure logic functions (AC1-AC5)
  tests/check-fpd-s3-viewer-route-and-traceability-structure.js — unit + integration tests

Modify:
  src/web-ui/server.js — register GET /playback and GET /playback/:slug
```

---

## Task 1: List DoD-validated features with a playback package (AC1, AC5)

**Files:**
- Create: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s3-viewer-route-and-traceability-structure.js`

- [ ] **Step 1: Write the failing test**

```js
// AC1 (unit) + AC5 (unit): viewer lists only DoD-validated features with a playback package
(function () {
  const { listPlaybackFeatures } = require('../src/web-ui/routes/playback');
  const state = {
    features: [
      { slug: 'has-package', name: 'Has Package' },
      { slug: 'no-package', name: 'No Package' },
    ],
  };
  const fakeExistsSync = (p) => p.includes('has-package') && p.includes('walkthrough.md');
  try {
    const result = listPlaybackFeatures('/repo', state, fakeExistsSync);
    assert.strictEqual(result.length, 1, 'expected exactly 1 feature listed');
    assert.strictEqual(result[0].slug, 'has-package');
    pass('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package');
  } catch (e) { fail('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `Error: Cannot find module '../src/web-ui/routes/playback'`

- [ ] **Step 3: Write minimal implementation**

```js
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

module.exports = { listPlaybackFeatures };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `[PASS] AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s3-viewer-route-and-traceability-structure.js
git commit -m "feat(fpd-s3): list DoD-validated features with a playback package"
```

---

## Task 2: Scope/benefit summary — problem statement + named metrics, verbatim (AC2)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s3-viewer-route-and-traceability-structure.js`

- [ ] **Step 1: Write the failing test**

```js
// AC2 (unit): review page opens with the scope/benefit summary, not re-authored
(function () {
  const { extractMarkdownSection } = require('../src/web-ui/routes/playback');
  const { parseBenefitMetricTargets } = require('../scripts/playback-capture');
  const discoveryContent = [
    '# Discovery: Thing', '', '## Problem statement', '', 'Engineers waste time doing X by hand.', '',
    '## Who it affects', '', 'Everyone.',
  ].join('\n');
  const benefitMetricContent = [
    '### Metric 1: Widget load time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤500ms p95 |',
    '### Metric 2: Setup time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤10min |',
  ].join('\n');
  try {
    const problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
    assert.strictEqual(problemStatement, 'Engineers waste time doing X by hand.');
    const targets = parseBenefitMetricTargets(benefitMetricContent);
    assert.strictEqual(targets['Widget load time'], '≤500ms p95');
    assert.strictEqual(targets['Setup time'], '≤10min');
    pass('AC2 (unit): review page scope/benefit summary sourced verbatim, not re-authored');
  } catch (e) { fail('AC2 (unit): review page scope/benefit summary', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `TypeError: extractMarkdownSection is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
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

module.exports = { listPlaybackFeatures, extractMarkdownSection };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `[PASS] AC2 (unit): review page scope/benefit summary sourced verbatim, not re-authored`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s3-viewer-route-and-traceability-structure.js
git commit -m "feat(fpd-s3): extract discovery problem statement verbatim for the review page summary"
```

---

## Task 3: Per-story AC sections from the DoD Coverage table, in real epic/story order (AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s3-viewer-route-and-traceability-structure.js`

- [ ] **Step 1: Write the failing test**

```js
// AC3 (unit) + AC4 (unit): per-story AC sections, sourced from the DoD table, real epic/story order
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const path = require('path');
  const store = {};
  // Fixture: 2 epics, story slugs chosen so alphabetical order would differ
  // from pipeline-state.json's own real array order (AC4's own deliberate check).
  const state = {
    features: [{
      slug: 'f1',
      epics: [
        { slug: 'epic-z', name: 'Epic Z (first in real order)', stories: [{ slug: 'story-z', name: 'Story Z' }] },
        { slug: 'epic-a', name: 'Epic A (second in real order)', stories: [{ slug: 'story-a', name: 'Story A' }] },
      ],
    }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  const dodZ = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — Z does a thing | ✅ | Z evidence | Automated test | None |'].join('\n');
  const dodA = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — A does a thing | ✅ | A evidence | Automated test | None |'].join('\n');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 'story-z-dod.md')] = dodZ;
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 'story-a-dod.md')] = dodA;
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === path.join('/repo', 'artefacts', 'f1'),
    readdirSync: (dir, opts) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [
        { name: 'story-z-dod.md', isDirectory: () => false, isFile: () => true },
        { name: 'story-a-dod.md', isDirectory: () => false, isFile: () => true },
      ];
      return [];
    },
    readFileSync: (p) => {
      if (store[p] !== undefined) return store[p];
      throw new Error('ENOENT: ' + p);
    },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    assert.strictEqual(structure.stories.length, 2, 'expected 2 stories');
    assert.strictEqual(structure.stories[0].slug, 'story-z', 'expected story-z first -- real pipeline-state.json order, not alphabetical');
    assert.strictEqual(structure.stories[1].slug, 'story-a', 'expected story-a second');
    assert.strictEqual(structure.stories[0].acRows[0].description, 'Z does a thing', 'expected AC text sourced verbatim from the DoD table');
    assert.strictEqual(structure.stories[1].acRows[0].description, 'A does a thing');
    pass('AC3+AC4 (unit): per-story AC sections from the DoD table, real epic/story order preserved');
  } catch (e) { fail('AC3+AC4 (unit): per-story AC sections', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `TypeError: buildFeaturePlaybackStructure is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
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

module.exports = { listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure };
```

**Note:** `buildArtefactTrace` itself does not currently accept an injectable `fsImpl` parameter -- it calls `fs`/`path` directly as module-level requires. Step 3a (next) adds this parameter to `artefact-trace.js` *additively* (default `fs` when omitted) so this test's fixture filesystem can reach it, without changing behaviour for `features.js`'s own existing call site (which omits the new parameter).

- [ ] **Step 3a: Add an optional `fsImpl` parameter to `buildArtefactTrace`** (additive, backward-compatible)

In `src/web-ui/adapters/artefact-trace.js`, thread an optional `fsImpl` parameter through `walkDir`, `readPipelineStateForSlug`, and `buildArtefactTrace` itself, defaulting to the real `fs` module when omitted -- every existing call site (`features.js`) continues to work unchanged.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `[PASS] AC3+AC4 (unit): per-story AC sections from the DoD table, real epic/story order preserved`

- [ ] **Step 5: Run full suite — no regressions** (confirms the additive `fsImpl` parameter on `buildArtefactTrace` didn't break `features.js`'s own existing tests)

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-trace.js src/web-ui/routes/playback.js tests/check-fpd-s3-viewer-route-and-traceability-structure.js
git commit -m "feat(fpd-s3): build per-story AC structure on top of buildArtefactTrace, real order preserved"
```

---

## Task 4: ADR-028 compliance check (integration)

**Files:**
- Test: `tests/check-fpd-s3-viewer-route-and-traceability-structure.js`

- [ ] **Step 1: Write the failing test**

```js
// ADR-028 compliance (integration): one canonical traversal, reused not re-derived
(function () {
  const fs = require('fs');
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/playback'), 'utf8');
    assert.ok(/require\(['"]\.\.\/adapters\/artefact-trace['"]\)/.test(source), 'expected playback.js to call buildArtefactTrace, not re-derive its own feature/epic/story traversal');
    assert.ok(!/\(feature\.epics\s*\|\|\s*\[\]\)\.forEach/.test(source), 'expected no second independent epics[].forEach traversal in playback.js');
    pass('ADR-028 compliance (integration): playback.js reuses buildArtefactTrace, no second derivation');
  } catch (e) { fail('ADR-028 compliance (integration)', e); }
})();
```

- [ ] **Step 2: Run test — expect pass** (Task 3's implementation already satisfies this; if it fails, the implementation drifted from the reuse decision in `decisions.md`)

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `[PASS] ADR-028 compliance (integration): playback.js reuses buildArtefactTrace, no second derivation`

- [ ] **Step 3: Commit**

```bash
git add tests/check-fpd-s3-viewer-route-and-traceability-structure.js
git commit -m "test(fpd-s3): verify ADR-028 compliance -- one canonical traversal, not re-derived"
```

---

## Task 5: HTML rendering + route handlers + server.js registration

**Files:**
- Modify: `src/web-ui/routes/playback.js`, `src/web-ui/server.js`
- Test: `tests/check-fpd-s3-viewer-route-and-traceability-structure.js`

- [ ] **Step 1: Write the failing test**

```js
// Rendering (unit): list HTML and review-page HTML contain the expected content
(function () {
  const { renderPlaybackListHtml, renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  try {
    const listHtml = renderPlaybackListHtml([{ slug: 'f1', name: 'Feature One' }]);
    assert.ok(listHtml.includes('Feature One'), 'expected feature name in list HTML');
    assert.ok(listHtml.includes('/playback/f1'), 'expected a link to the review page');

    const reviewHtml = renderPlaybackReviewHtml('f1', 'Engineers waste time doing X.', { 'Widget load time': '≤500ms p95' }, {
      epics: [{ slug: 'e1', name: 'Epic One' }],
      stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [{ acId: 'AC1', description: 'Thing works', evidence: 'proof' }] }],
    });
    assert.ok(reviewHtml.includes('Engineers waste time doing X.'), 'expected verbatim problem statement in review HTML');
    assert.ok(reviewHtml.includes('≤500ms p95'), 'expected verbatim metric target in review HTML');
    assert.ok(reviewHtml.includes('Story One'), 'expected story section');
    assert.ok(reviewHtml.includes('Thing works'), 'expected AC text from the DoD table');
    pass('Rendering (unit): list and review-page HTML contain expected content');
  } catch (e) { fail('Rendering (unit): list and review-page HTML', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `TypeError: renderPlaybackListHtml is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
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

module.exports = {
  listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure,
  renderPlaybackListHtml, renderPlaybackReviewHtml,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: `[PASS] Rendering (unit): list and review-page HTML contain expected content`

- [ ] **Step 5: Add the route handlers**

```js
async function handleGetPlaybackList(req, res, pool) {
  const token = req.session && req.session.accessToken;
  if (!token) { res.writeHead(302, { Location: '/auth/github' }); res.end(); return; }
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
  const token = req.session && req.session.accessToken;
  if (!token) { res.writeHead(302, { Location: '/auth/github' }); res.end(); return; }
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
```

- [ ] **Step 6: Register the routes in `server.js`**

```js
const { handleGetPlaybackList, handleGetPlaybackReview } = require('./routes/playback'); // fpd-s3

// Near the /features route dispatch:
} else if (pathname === '/playback' && req.method === 'GET') {
  await handleGetPlaybackList(req, res, _pshPool);
} else if (pathname.startsWith('/playback/') && req.method === 'GET') {
  const featureSlug = pathname.slice('/playback/'.length);
  await handleGetPlaybackReview(req, res, featureSlug, _pshPool);
}
```

- [ ] **Step 7: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/routes/playback.js src/web-ui/server.js tests/check-fpd-s3-viewer-route-and-traceability-structure.js
git commit -m "feat(fpd-s3): add playback viewer route handlers, register in server.js"
```
