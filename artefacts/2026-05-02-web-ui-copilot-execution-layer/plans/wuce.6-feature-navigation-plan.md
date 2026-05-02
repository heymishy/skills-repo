# Implementation Plan: wuce.6 — Multi-feature navigation and artefact browser

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.6
**Plan date:** 2026-05-03
**Model class:** balanced

---

## Loaded context

**Story:** Multi-feature navigation and artefact browser
ACs: 5 | Tests: 19 (13 unit, 4 integration, 2 NFR) | Arch constraints: ADR-012 (listFeatures/listArtefacts adapters), ADR-004 (WUCE_REPOSITORIES env config), server-side repo access validation, plain-language labels mandatory

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/utils/plain-language-labels.js` | Create | `labelArtefactType`, `labelFromPath`, `groupArtefactsByStage` |
| `src/web-ui/adapters/feature-list.js` | Create | `listFeatures(token)` — scans repos, validates access, returns feature array |
| `src/web-ui/adapters/artefact-list.js` | Create | `listArtefacts(featureSlug, token)` — returns artefacts with plain-language types |
| `src/web-ui/routes/features.js` | Create | `handleGetFeatures`, `handleGetFeatureArtefacts`, `renderFeatureList`, `renderArtefactItem` |
| `src/web-ui/server.js` | Extend | Mount `GET /features` and `GET /features/:slug` |
| `tests/check-wuce6-feature-navigation.js` | Create | 19 AC verification tests (70 assertions) |
| `tests/fixtures/github/pipeline-state-feature.json` | Create | Fixture: feature with slug/stage/updatedAt/stories |
| `tests/fixtures/github/contents-api-artefact-list.json` | Create | Fixture: GitHub Contents API response with 5 artefact types |
| `tests/fixtures/github/contents-api-empty-artefacts.json` | Create | Fixture: GitHub 404 response for missing artefacts dir |
| `package.json` | Extend | Add `node tests/check-wuce6-feature-navigation.js` to test chain |
| `CHANGELOG.md` | Extend | Add wuce.6 entry |

---

## Tasks

### Task 1 — Plain-language label utility (AC2)
**File:** `src/web-ui/utils/plain-language-labels.js`
**TDD:** Write T1.1–T1.6 first; all fail; then write module; all pass.

Key mappings:
- `dor` → `"Ready Check"`
- `benefit-metric` → `"Benefit Metric"`
- `story`/`stories` → `"Stories"`
- `test-plan`/`test-plans` → `"Test Plan"`
- `discovery` → `"Discovery"`
- Unknown → title-cased fallback with `(Artefact)` suffix; never throw

Exports: `labelArtefactType(type)`, `labelFromPath(path)`, `groupArtefactsByStage(artefacts)`

**Commit:** `feat(wuce.6): plain-language label utility — labelArtefactType, groupArtefactsByStage`

---

### Task 2 — `listFeatures` adapter (AC1, NFR1, NFR2)
**File:** `src/web-ui/adapters/feature-list.js`
**TDD:** Write T3.1–T3.2 first; then implement.

Injected dependencies (for test doubles):
- `_validateRepositoryAccess(owner, repo, token)` → bool
- `_fetchPipelineState(owner, repo, token)` → `{ features: [] }`
- `_getConfiguredRepositories()` → `string[]` (from `WUCE_REPOSITORIES` env)
- `_auditLogger` → `{ info(event, data) }`

Security: `validateRepositoryAccess` called per repo before any data returned (NFR2).
Audit: logs `feature_list_loaded` with `featureCount` and `timestamp`; never token (NFR1).

**Commit:** `feat(wuce.6): listFeatures adapter — server-side access validation, audit log`

---

### Task 3 — `listArtefacts` adapter (AC2, AC4, AC5)
**File:** `src/web-ui/adapters/artefact-list.js`
**TDD:** Write T4.1–T4.2 and IT3 first; then implement.

Key constraint: `deriveTypeFromPath` uses a `SUBDIR_TYPE_MAP` keyed on directory name (not
`labelArtefactType`), so `dor/` → `"Ready Check"`, `stories/` → `"Stories"`, etc. without
relying on comparison fallthrough.

AC5: when `_fetchArtefactDirectory` returns `{ message: "Not Found" }` or any non-array,
return `{ artefacts: [], grouped: {}, noArtefacts: true }`.

**Commit:** `feat(wuce.6): listArtefacts adapter — plain-language types, AC5 no-artefacts handling`

---

### Task 4 — Route handlers and render functions (AC1–AC5)
**File:** `src/web-ui/routes/features.js`
**TDD:** Write IT1, IT2, IT3, IT4, T5.1, T5.2 first; then implement.

`handleGetFeatures`: 401 when no `req.session.accessToken`; calls `listFeatures(token)`;
audit logs `feature_list_accessed` with `userId`, `featureCount`, `timestamp`.

`handleGetFeatureArtefacts`: 401 guard; calls `listArtefacts`; returns
`{ message: "No artefacts found" }` when `noArtefacts: true`.

`renderFeatureList(features)`: returns HTML string; escapes all content.
`renderArtefactItem(artefact)`: type field must already be plain-language label.
`escHtml(str)`: minimal XSS-safe escape (`&`, `<`, `>`, `"`).

**Commit:** `feat(wuce.6): features routes — GET /features, GET /features/:slug, render helpers`

---

### Task 5 — Mount routes in server.js
**File:** `src/web-ui/server.js`
**TDD:** routes are exercised via IT tests above; this task is glue only.

Add to `router()`:
```
} else if (pathname === '/features' && req.method === 'GET') {
  authGuard(req, res, async () => { await handleGetFeatures(req, res); });
} else if (pathname.startsWith('/features/') && req.method === 'GET') {
  const featureSlug = pathname.slice('/features/'.length);
  authGuard(req, res, async () => { await handleGetFeatureArtefacts(req, res, featureSlug); });
}
```

**Commit:** included in Task 4 commit (server.js is glue for this story)

---

### Task 6 — Wire test chain, fixtures, CHANGELOG
Add `node tests/check-wuce6-feature-navigation.js` to `package.json` test script.
Add wuce.6 CHANGELOG entry.
Add fixtures: `pipeline-state-feature.json`, `contents-api-artefact-list.json`,
`contents-api-empty-artefacts.json`.

**Final commit:** `feat: wuce.6 — Multi-feature navigation and artefact browser (70/70 tests passing)`

---

## Verification command

```powershell
node tests/check-wuce6-feature-navigation.js
# Expected: 70 passed, 0 failed
```

## NFR compliance notes

- **Security (NFR2):** `_validateRepositoryAccess` called for every configured repo before any features returned. Inaccessible repos silently skipped (no 403 propagated to client).
- **Audit (NFR1):** `feature_list_accessed` event logged per request; `userId`, `featureCount`, `timestamp` only. Token never appears in any log line.
- **Plain language (AC2):** No internal type identifier (`dor`, `benefit-metric`, `story`, `test-plan`) appears in any JSON response `type` field or rendered HTML.
- **AC5:** HTTP 404 from GitHub API for missing artefacts dir → `{ message: "No artefacts found" }` with status 200; no 500.
