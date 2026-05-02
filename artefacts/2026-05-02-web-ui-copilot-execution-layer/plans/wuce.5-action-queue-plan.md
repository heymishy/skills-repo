# Implementation Plan: wuce.5 — Action queue and pipeline state mutation

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.5-action-queue.md
**DoR:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.5-action-queue-dor.md
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.5-action-queue-test-plan.md
**Date:** 2026-05-03
**Oversight:** High

---

## Loaded context

**Story:** Personalised action queue — pending sign-offs and annotation requests
**ACs:** 5 | **Tests:** 18 (12 unit + 4 integration + 2 NFR) | **Arch constraints:** ADR-012 (adapter pattern), ADR-004 (config from env/context.yml), server-side repo access validation

---

## File map

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/config/repo-list.js` | Create | Repository list loader from `WUCE_REPOSITORIES` env var |
| `src/web-ui/adapters/action-queue.js` | Create | `getPendingActions` + `hasPendingSignOff` + `renderActionQueue` |
| `src/web-ui/routes/dashboard.js` | Create | `GET /api/actions` handler — 401 JSON for API consumers |
| `src/web-ui/server.js` | Extend | Mount `/api/actions` route |
| `tests/check-wuce5-action-queue.js` | Create | 46 assertions across 18 test cases |
| `tests/fixtures/markdown/artefact-pending-signoff.md` | Create | E2 canonical fixture — no `## Approved by` |
| `tests/fixtures/markdown/artefact-signed-off.md` | Create | E2 canonical fixture — with `## Approved by` |
| `tests/fixtures/github/pipeline-state-feature.json` | Create | E2 canonical pipeline-state feature object |
| `tests/fixtures/github/contents-api-artefact-pending.json` | Create | GitHub Contents API response with Base64 pending artefact |
| `tests/fixtures/github/repo-access-denied.json` | Create | 404 response from repo access validation |
| `package.json` | Extend | Add `node tests/check-wuce5-action-queue.js` to test chain |

---

## Tasks

### Task 1 — Fixtures (TDD RED prerequisite)

Create all 5 fixture files. The test file imports them at load time — must exist before the test runs.

**Files:** `tests/fixtures/markdown/artefact-pending-signoff.md`, `artefact-signed-off.md`, `tests/fixtures/github/pipeline-state-feature.json`, `contents-api-artefact-pending.json`, `repo-access-denied.json`

**Commit:** `test: add E2 canonical fixtures for wuce.5`

---

### Task 2 — `src/web-ui/config/repo-list.js`

```javascript
'use strict';
function getRepoList() {
  const envRepos = process.env.WUCE_REPOSITORIES;
  if (envRepos) return envRepos.split(',').map(r => r.trim()).filter(Boolean);
  return [];
}
module.exports = { getRepoList };
```

**Run:** `node -e "process.env.WUCE_REPOSITORIES='a/b,c/d'; const {getRepoList}=require('./src/web-ui/config/repo-list'); console.log(getRepoList())"`
**Expected output:** `[ 'a/b', 'c/d' ]`

**Commit:** `feat(wuce.5): repo-list config loader — reads WUCE_REPOSITORIES env var`

---

### Task 3 — `src/web-ui/adapters/action-queue.js`

Implements:
- `hasPendingSignOff(content)` — pure function, returns `true` if `## Approved by` absent
- `getPendingActions(userIdentity, token)` — validates repo access, fetches artefacts, filters pending
- `renderActionQueue(items, bannerMessage)` — HTML string renderer
- Injectable dependencies: `setValidateRepositoryAccess`, `setGetArtefactDescriptors`, `setFetchArtefact`

**Tests that must pass:** T1.1–T1.4, T2.1–T2.4, T3.1–T3.4, NFR2
**Run:** `node tests/check-wuce5-action-queue.js 2>&1 | grep -E "T[123]|NFR2"`

**Commit:** `feat(wuce.5): action-queue adapter — getPendingActions + hasPendingSignOff + render`

---

### Task 4 — `src/web-ui/routes/dashboard.js`

```javascript
// GET /api/actions — API endpoint (401 JSON, not redirect)
// Auth check: req.session.userId + req.session.accessToken
// Calls _getPendingActions, audit logs userId + itemCount (never token)
```

**Tests that must pass:** IT1–IT4, NFR1
**Run:** `node tests/check-wuce5-action-queue.js 2>&1 | grep -E "IT[1234]|NFR1"`

**Commit:** `feat(wuce.5): dashboard route handler — GET /api/actions with auth + audit log`

---

### Task 5 — Extend `src/web-ui/server.js`

Add `/api/actions` route before `/dashboard`.

**Commit:** `feat(wuce.5): mount /api/actions in server router`

---

### Task 6 — Add to test chain

```powershell
node -e "const fs=require('fs'),{execSync}=require('child_process');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.scripts.test+=' && node tests/check-wuce5-action-queue.js';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2),'utf8')"
```

**Verify:** `npm test 2>&1 | tail -5` — only pre-existing workspace-state failures

**Commit:** `test(wuce.5): add check-wuce5-action-queue to npm test chain`

---

## AC coverage

| AC | Tests | Status |
|----|-------|--------|
| AC1 | T2.1, T3.1, IT1 | Covered |
| AC2 | T2.2, T3.2, IT2 | Covered |
| AC3 | T1.2, T2.2 (unit); E2E deferred per test plan gap table | Partially covered (per plan) |
| AC4 | T3.1 (link href) | Covered |
| AC5 | T2.3, T2.4, T3.3, IT3 | Covered |

## NFR coverage

| NFR | Tests | Status |
|-----|-------|--------|
| Security (repo access validation) | NFR2, T2.3, T2.4 | Covered |
| Accessibility (descriptive links) | T3.4 | Covered |
| Audit (log without token) | NFR1 | Covered |
