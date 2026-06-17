# kfd1 — Kanban Card and Detail Page CX — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-kfd1-kanban-card-and-detail-page-cx.js` pass (38 assertions, 23 currently failing) without breaking existing suites.
**Branch:** `feature/kfd1-kanban-card-and-detail-page-cx`
**Worktree:** `.worktrees/kfd1`
**Test command:** `node tests/check-kfd1-kanban-card-and-detail-page-cx.js`
**Full suite:** `npm test`

---

## File map

```
Modify:
  src/web-ui/views/kanban-view.js         — add ideation to LANES; truncate featureCard title; add artefact-count badge
  src/web-ui/adapters/artefact-list.js   — add + export listLocalArtefacts (recursive local fs walk)
  src/web-ui/routes/features.js          — wire artefact-count in board view; rewrite renderArtefactIndexHtml to group by stage
  src/web-ui/routes/artefact.js          — wrap all three response paths in renderShell
  src/web-ui/utils/html-shell.js         — append CSS for sw-doc table/badge/artefact-list/feature-detail
  src/web-ui/server.js                   — add local-first branch to setFetchArtefactDirectory callback
  .github/pipeline-state.json            — fix mojibake name fields for 3 features
```

---

## Task 1: kanban-view.js — ideation lane fix, title truncation + tooltip, artefact-count badge

**Files:** `src/web-ui/views/kanban-view.js`
**Covers:** AC5a, AC5b, AC1a–AC1e (unit), AC2a–AC2c

- [ ] **Step 1: Run failing tests to confirm baseline**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: AC1a-e, AC2a-c, AC5a-b all fail.

- [ ] **Step 2: Apply changes to `src/web-ui/views/kanban-view.js`**

**Change 1 — Add `'ideation'` to Discovery lane (line 10):**
```js
{ id: 'discovery',  label: 'Discovery',   stages: ['discovery', 'benefit-metric', 'ideation'] },
```

**Change 2 — Rewrite `featureCard(f)` (lines 34–49):**
```js
function featureCard(f) {
  const age = ageDays(f.updated || f.lastUpdated);
  const dot = '<span class="kb-dot" style="background:' + healthColor(f.health) + '"></span>';

  const fullTitle   = f.title || f.slug;
  const displayTitle = fullTitle.length > 48
    ? fullTitle.slice(0, 48) + '…'
    : fullTitle;

  const count = (f.artefactCount != null) ? f.artefactCount : 0;
  const badge = count > 0
    ? '<span class="kb-artefact-badge">' + count + ' artefacts</span>'
    : '<span class="kb-artefact-badge kb-artefact-badge--empty">No artefacts yet</span>';

  return [
    '<a class="kb-card" href="/features/' + escHtml(f.slug) + '" title="' + escHtml(fullTitle) + '">',
      '<div class="kb-card-head">',
        dot,
        '<span class="kb-card-title">' + escHtml(displayTitle) + '</span>',
      '</div>',
      '<div class="kb-card-meta">',
        '<span class="kb-slug">' + escHtml(f.slug) + '</span>',
        age ? (' · <span class="kb-age">' + escHtml(age) + '</span>') : '',
      '</div>',
      badge,
    '</a>'
  ].join('');
}
```

- [ ] **Step 3: Run target tests — must pass AC1, AC2 unit, AC5**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: all AC1a-e, AC2a-c, AC5a-b lines show `✓`. AC2d-f (integration), AC3, AC4, AC6 still fail.

- [ ] **Step 4: Run existing kanban suite — no regressions**

```bash
node tests/check-kanban-view.js
```

Expected: all tests pass (6 lanes in order, renderKanban works, XSS escaping).

- [ ] **Step 5: Commit**

```
git add src/web-ui/views/kanban-view.js
git commit -m "feat(kfd1): add ideation to discovery lane; truncate titles; add artefact-count badge"
```

---

## Task 2: pipeline-state.json — fix mojibake name fields

**Files:** `.github/pipeline-state.json`
**Covers:** AC1f–AC1h (data correction for 3 features)

- [ ] **Step 1: Apply exact string replacements**

For `2026-04-19-skills-platform-phase4-opus`, change `name` from:
```
"Skills Platform ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase 4 (Opus 4.6 arm): Distribution, Structural Enforcement, and Non-Technical Access"
```
to:
```
"Skills Platform — Phase 4 (Opus 4.6 arm): Distribution, Structural Enforcement, and Non-Technical Access"
```

For `2026-04-14-skills-platform-phase3`, change `name` from:
```
"Skills Platform ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase 3: Governance Hardening, T3M1 Close, and Enterprise Scale"
```
to:
```
"Skills Platform — Phase 3: Governance Hardening, T3M1 Close, and Enterprise Scale"
```

For `2026-04-23-non-technical-channel`, change `name` from:
```
"Non-Technical Channel â€" Framework Adoption Friction (Phase 5 WS0 / G0b)"
```
to:
```
"Non-Technical Channel — Framework Adoption Friction (Phase 5 WS0 / G0b)"
```

- [ ] **Step 2: Run integrity check**

```bash
node scripts/check-pipeline-state-integrity.js
```

Expected: `116 stories checked — 0 fail ✓` (count may differ slightly).

- [ ] **Step 3: Run kfd1 AC1 tests**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: AC1f–AC1h (all 9 data-integrity assertions) show `✓`.

- [ ] **Step 4: Commit**

```
git add .github/pipeline-state.json
git commit -m "fix(kfd1): correct mojibake em-dash encoding in pipeline-state.json for 3 features"
```

---

## Task 3: artefact-list.js — add `listLocalArtefacts` export (AC6)

**Files:** `src/web-ui/adapters/artefact-list.js`
**Covers:** AC6a–AC6g

- [ ] **Step 1: Add `fs` and `path` imports at the top of the file**

Add after `'use strict';`:
```js
const fs   = require('fs');
const path = require('path');
```

- [ ] **Step 2: Add `listLocalArtefacts` function before `module.exports`**

```js
/**
 * Recursively list .md files under <repoRoot>/artefacts/<featureSlug>/.
 * Returns an array of { path, type: 'file' } or null when the directory
 * does not exist (caller should fall back to GitHub API).
 * @param {string} repoRoot    - absolute path to the repo root
 * @param {string} featureSlug - feature slug, e.g. "2026-06-17-kanban-feature-detail-cx"
 * @returns {Array<{path:string,type:'file'}>|null}
 */
function listLocalArtefacts(repoRoot, featureSlug) {
  const featDir = path.join(repoRoot, 'artefacts', featureSlug);
  if (!fs.existsSync(featDir)) return null;

  const result = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        result.push({ path: fullPath, type: 'file' });
      }
    }
  }

  walk(featDir);
  return result;
}
```

- [ ] **Step 3: Add `listLocalArtefacts` to `module.exports`**

Change:
```js
module.exports = {
  listArtefacts,
  setFetchArtefactDirectory,
  setConfiguredRepositories,
  setValidateRepositoryAccess,
  deriveTypeFromPath
};
```
To:
```js
module.exports = {
  listArtefacts,
  listLocalArtefacts,
  setFetchArtefactDirectory,
  setConfiguredRepositories,
  setValidateRepositoryAccess,
  deriveTypeFromPath
};
```

- [ ] **Step 4: Run AC6 tests**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: AC6a–AC6g all show `✓`.

- [ ] **Step 5: Commit**

```
git add src/web-ui/adapters/artefact-list.js
git commit -m "feat(kfd1): add listLocalArtefacts recursive local fs walk to artefact-list adapter"
```

---

## Task 4: features.js — artefact-count board wiring + grouped detail page (AC2 integration + AC3)

**Files:** `src/web-ui/routes/features.js`
**Covers:** AC2d–AC2f (board count wiring), AC3a–AC3h (grouped detail page)

### Part A — Board view artefact-count wiring

- [ ] **Step 1: Replace the board-view branch in `handleGetFeatures` (lines 145–154)**

Find:
```js
    const view = (req.query && req.query.view) || '';
    let bodyContent;
    if (view === 'board') {
      const { ideas } = _readIdeas();
      bodyContent = renderKanban({ features: viewFeatures, ideas });
    } else {
```

Replace with:
```js
    const view = (req.query && req.query.view) || '';
    let bodyContent;
    if (view === 'board') {
      const { ideas } = _readIdeas();
      const viewFeaturesWithCounts = await Promise.all(viewFeatures.map(async function(f) {
        try {
          const result = await _listArtefacts(f.slug, token);
          const count = result && Array.isArray(result.artefacts) ? result.artefacts.length : 0;
          return Object.assign({}, f, { artefactCount: count });
        } catch (_) {
          return f;
        }
      }));
      bodyContent = renderKanban({ features: viewFeaturesWithCounts, ideas });
    } else {
```

### Part B — Rewrite `renderArtefactIndexHtml` to use grouped sw-card layout

Find the existing `renderArtefactIndexHtml` function (lines 172–189) and replace with:

```js
function renderArtefactIndexHtml(artefacts, featureSlug) {
  if (!artefacts || artefacts.length === 0) {
    return '<p class="artefact-list__empty">No artefacts found for this feature</p>';
  }

  // Group by human-readable label (derived from type field)
  const groups = Object.create(null);
  const groupOrder = [];
  artefacts.forEach(function(a) {
    const label = getLabel(a.type || '');
    if (!groups[label]) {
      groups[label] = [];
      groupOrder.push(label);
    }
    groups[label].push(a);
  });

  return groupOrder.map(function(label) {
    const items = groups[label].map(function(a) {
      const fileSlug = (a.path || '').split('/').pop().replace(/\.md$/, '') || (a.type || '');
      const viewUrl  = `/artefact/${featureSlug}/${fileSlug}`;
      const base = renderArtefactItem({ type: label, name: a.path || '', viewUrl });
      const date = shellEscHtml(a.createdAt || '');
      return base.slice(0, -5) + `<time class="artefact-list__date">${date}</time></li>`;
    }).join('');
    return `<div class="sw-card"><h2 class="sw-section-title">${shellEscHtml(label)}</h2><ul class="artefact-list">${items}</ul></div>`;
  }).join('');
}
```

- [ ] **Step 2: Run AC2 integration + AC3 tests**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: AC2d–AC2f and AC3a–AC3h all show `✓`.

- [ ] **Step 3: Run existing wuce20 suite — no regressions**

```bash
node tests/check-wuce20-artefact-index-html.js
```

Expected: all wuce20 tests pass (label text, dates, hrefs, nav, audit log all still present).

- [ ] **Step 4: Commit**

```
git add src/web-ui/routes/features.js
git commit -m "feat(kfd1): wire artefact-count in board view; group detail page by stage using sw-card"
```

---

## Task 5: artefact.js — wrap all response paths in renderShell (AC4)

**Files:** `src/web-ui/routes/artefact.js`
**Covers:** AC4a–AC4h

- [ ] **Step 1: Add `renderShell` import at the top of the file**

After line 1 (`'use strict';`), add:
```js
const { renderShell, escHtml: shellEscHtml } = require('../utils/html-shell');
```

- [ ] **Step 2: Replace the three `res.end(...)` calls in `handleArtefactRoute`**

Replace the success path (line 56):
```js
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
```
With:
```js
    const page = renderShell({
      title:       shellEscHtml(artefactType) + ' — ' + shellEscHtml(slug),
      bodyContent: '<div class="sw-doc">' + html + '</div>',
      user:        { login: req.session.login || '' }
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
```

Replace the 404 path (line 61):
```js
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body><p>artefact not found</p></body></html>');
```
With:
```js
      const page404 = renderShell({
        title:       'Artefact not found',
        bodyContent: '<p>artefact not found</p>',
        user:        { login: (req.session && req.session.login) || '' }
      });
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page404);
```

Replace the 503 path (line 66):
```js
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body><p>Unable to load artefact — please try again</p></body></html>');
```
With:
```js
      const page503 = renderShell({
        title:       'Error',
        bodyContent: '<p>Unable to load artefact — please try again</p>',
        user:        { login: (req.session && req.session.login) || '' }
      });
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page503);
```

- [ ] **Step 3: Run AC4 tests**

```bash
node tests/check-kfd1-kanban-card-and-detail-page-cx.js
```

Expected: AC4a–AC4h all show `✓`.

- [ ] **Step 4: Run existing wuce2 suite — no regressions**

```bash
node tests/check-wuce2-read-render-artefact.js
```

Expected: all wuce2 tests pass — specifically T4.2 `'artefact not found'` and T4.3 `'Unable to load artefact'` substrings preserved.

- [ ] **Step 5: Commit**

```
git add src/web-ui/routes/artefact.js
git commit -m "feat(kfd1): wrap artefact route responses in renderShell for design-system consistency"
```

---

## Task 6: html-shell.js CSS additions + server.js local-first wiring

**Files:** `src/web-ui/utils/html-shell.js`, `src/web-ui/server.js`
**Covers:** Support tasks — production completeness (not directly tested by kfd1 test file but required for the feature to work in a live browser)

### Part A — html-shell.js: append CSS before closing backtick of `DESIGN_SYSTEM_CSS`

Find the closing responsive block in `DESIGN_SYSTEM_CSS` (near line 404):
```
  body[style*="overflow"] .sw-main { pointer-events: none; }
}
`;
```

Insert BEFORE the closing `` ` ``:
```css

/* ── Document prose additions (tables, metadata bar) ─────────────────────── */
.sw-doc table { width: 100%; border-collapse: collapse; margin: 0 0 14px; font-size: 15px; }
.sw-doc th, .sw-doc td { padding: 8px 12px; border: 1px solid var(--line); text-align: left; }
.sw-doc th { background: var(--line-2); font-weight: 600; }
.metadata-bar { display: flex; flex-wrap: wrap; gap: 12px; margin: 0 0 24px; padding: 10px 14px; background: var(--line-2); border-radius: 6px; font-size: 13px; }
.meta-status, .meta-approved-by, .meta-created { color: var(--muted); }
.meta-status strong, .meta-approved-by strong, .meta-created strong { color: var(--ink); }

/* ── Feature detail grouped artefact list ───────────────────────────────── */
.feature-detail__groups { display: flex; flex-direction: column; gap: 16px; }
.artefact-list { list-style: none; margin: 8px 0 0; padding: 0; }
.artefact-list__item { display: flex; align-items: baseline; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-2); }
.artefact-list__item:last-child { border-bottom: none; }
.artefact-list__type { font-size: 12px; font-weight: 500; color: var(--muted); flex-shrink: 0; width: 100px; }
.artefact-list__link { font-size: 14px; color: var(--accent); text-decoration: none; flex: 1; word-break: break-all; }
.artefact-list__link:hover { text-decoration: underline; }
.artefact-list__date { font-size: 12px; color: var(--muted); flex-shrink: 0; font-family: var(--mono); }

/* ── Artefact-count badge ────────────────────────────────────────────────── */
.kb-artefact-badge { display: inline-block; margin-top: 6px; font-size: 11px; padding: 2px 7px; border-radius: 10px; background: var(--accent-soft); color: var(--accent-ink); font-weight: 500; }
.kb-artefact-badge--empty { background: var(--line-2); color: var(--muted); }
```

### Part B — server.js: add local-first branch to `setFetchArtefactDirectory`

Find the server.js `setFetchArtefactDirectory` setup. It currently passes a GitHub-API-only callback. Add a local-first check before the API call:

```js
const { listLocalArtefacts } = require('./adapters/artefact-list');

// In the setFetchArtefactDirectory callback, add local-first check:
setFetchArtefactDirectory(async function(owner, repo, featureSlug, token) {
  // Local-first: if COPILOT_REPO_PATH is set and artefacts directory exists, use it
  const repoPath = process.env.COPILOT_REPO_PATH;
  if (repoPath) {
    const localItems = listLocalArtefacts(repoPath, featureSlug);
    if (localItems !== null) {
      return localItems;
    }
  }
  // Fallback: GitHub Contents API
  return fetchArtefactDirectoryFromGitHub(owner, repo, featureSlug, token);
});
```

(Adapt to the actual variable names in server.js — the local-first pattern mirrors the existing pipeline-state local-first code.)

- [ ] **Step 1: Apply both changes**

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass including `check-kfd1-kanban-card-and-detail-page-cx.js` (38/38).

- [ ] **Step 3: Commit**

```
git add src/web-ui/utils/html-shell.js src/web-ui/server.js
git commit -m "feat(kfd1): add prose/table/badge CSS and local-first artefact listing in server.js"
```

---

## Final: run full suite

```bash
npm test
```

Expected: all tests pass. Then run `/verify-completion` before opening the draft PR.
