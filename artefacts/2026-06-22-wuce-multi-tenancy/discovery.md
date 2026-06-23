# Discovery: WUCE Multi-Tenancy — Authorization Guard and Tenant Isolation

**Status:** Approved
**Feature slug:** wuce-multi-tenancy
**Date:** 2026-06-22
**Skill version:** /discovery

---

## Codebase verification — confirmed vs. brief

The brief's architecture description was verified against the actual repo state. The following confirms, corrects, or flags each claim.

### Confirmed exactly as described

- `src/web-ui/middleware/session.js` — in-process `Map`, keyed by 32-byte hex session ID, HttpOnly SameSite=Strict cookie. Session shape on login: `{ accessToken, userId, login }` (set in `auth.js` lines 64–65). No `tenantId` field. Does not survive restart.
- `src/web-ui/auth/oauth-adapter.js` — scope line 40: `'repo,read:user'`. `getUserIdentity()` calls GET `/user` only. No org fetch.
- `src/web-ui/adapters/session-store.js` — flat `SESSION_STORE_PATH/<sessionId>.json`, no tenant namespacing. `accessToken` stripped before write. Eviction by `SESSION_MAX_AGE_DAYS`.
- `_viewerActivity` — confirmed at `journey.js` line 1720: `var _viewerActivity = new Map()` (module-level, journeyId → Map<login, lastSeenMs>).
- Path-traversal guards — confirmed present throughout journey.js. Pattern is `path.resolve(input)` + startsWith(`repoRoot + path.sep`) assertion before every fs write.
- `repoRoot` — resolved once in server.js line 95: `process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(...)`. Single static value per process.
- KNOWN BUG confirmed — see section below.

### Discrepancies found — correct the brief

**1. Route function names differ from the brief's list.**
The brief names `handleGetJourneyStage` and `handleGetJourneyStageControls` as separate missing-auth routes. The actual exported names are:
- `handleGetJourneyStageView` (not `handleGetJourneyStage`) — checks only `accessToken`
- `handleGetStageControls` (also aliased as `handleGetJourneyStageControls` in the export object — confirm on implementation) — checks only `accessToken`

All other named routes in the KNOWN BUG section (`handleGetJourneyState`, `handleGetTrace`, `handleGetJourneyById`, `handleGetJourneyViewers`, `handlePostSideTripClarify`, `handleDeleteSideTrip`) are confirmed as described.

**2. `handleGetJourney` (the HTML journey overview page, not `handleGetJourneyById`) also only checks `accessToken`.**
The brief mentions `handleGetJourneyById` but not `handleGetJourney`. Both are HTML-rendering routes and both check only `req.session.accessToken`. Both need the guard.

**3. `handlePostJourneyStageCommit` ownerId check — pattern differs slightly.**
`handlePostJourneyRecommit` uses `journey.ownerId && journey.ownerId !== req.session.login` — the `&&` means `ownerId === null` bypasses the check (permissive for legacy journeys). `handlePostJourneyStageCommit` should be verified to use the same pattern — it was not directly read; confirm during Phase 0 implementation.

**4. GHE `GITHUB_API_BASE_URL` also controls the OAuth authorize URL** — confirmed. `oauth-adapter.js` lines 33–35 swap both the authorize base and implicitly the token URL uses a separate constant (`GITHUB_TOKEN_URL`). Token URL is NOT swapped via `GITHUB_API_BASE_URL`. This is a latent GHE incompatibility (token exchange would fail against a GHE instance) but is out of scope for this feature.

**5. Test framework — no test runner.**
Tests are plain Node.js `assert` with a hand-rolled async queue (`test(name, fn)` + promise chain). No Jest, Mocha, or Vitest. The convention is: files named `tests/check-[story-id]-description.js`, run with `node tests/check-...js`. `freshRequire()` pattern for module isolation. `makeReq({ session: { accessToken, userId, login } })` is the universal session fixture shape across all journey/skills tests.

---

## KNOWN BUG — confirmed in code

Any authenticated user can currently read any other user's journey by guessing or observing a `journeyId`. The following handlers check only `req.session && req.session.accessToken` ("is anyone logged in") with no ownership or tenant check:

| Route handler | HTTP method | Path pattern | Risk |
|--------------|-------------|--------------|------|
| `handleGetJourney` | GET | `/journey/:journeyId` (HTML) | Full journey HTML visible to any auth'd user |
| `handleGetJourneyById` | GET | `/journey/:id` (HTML, by slug) | Same |
| `handleGetJourneyState` | GET | `/api/journey/:journeyId` (JSON) | Full turns + stage state JSON |
| `handleGetJourneyViewers` | GET | `/api/journey/:journeyId/viewers` | Viewer activity |
| `handleGetJourneyStageView` | GET/POST | `/api/journey/:journeyId/stage/:stageName/...` | Artefact content |
| `handleGetStageControls` | GET | `/api/journey/:journeyId/stage-controls` | Side-trip availability |
| `handlePostSideTripClarify` | POST | `/api/journey/:journeyId/side-trip/clarify` | Opens new session with prior discovery.md content |
| `handleDeleteSideTrip` | DELETE | `/api/journey/:journeyId/side-trip` | Mutates journey state |
| `handleGetTrace` | GET | `/api/journey/:journeyId/trace` | Full artefact directory scan result |

Only these two check `journey.ownerId !== req.session.login`:
- `handlePostJourneyRecommit` — returns 403 if owned by someone else
- `handlePostJourneyStageCommit` — returns 403 if owned by someone else

This bug is real and present today, independent of multi-tenancy. It is the highest-priority fix in this feature and must ship as a standalone PR (Phase 0) before any tenancy work begins.

---

## Problem statement

The web UI is single-tenant by design: one process, one filesystem root, one GitHub OAuth app, no concept of organisation membership or data isolation in any part of the stack. Two real problems exist today, and a third must be solved before commercial operation:

**P1 (present, confirmed): Any authenticated user can read any other user's journey.** The authorization model checks "is someone logged in" but not "is this person allowed to see this resource." `journeyId` is a UUID — predictable from the URL bar of a shared browser, or guessable if a journey was ever shared in a Slack message. The attack surface is the full list of routes above.

**P2 (present, confirmed): Journey data does not survive process restart** except for the disk-persisted metadata subset loaded via `journey-disk`. Auth sessions are entirely in-memory and lost on restart. For a single-developer tool this is tolerable today; for a multi-user deployment it is a data durability gap that will manifest as lost in-flight work.

**P3 (architectural): The system has no tenant concept** — no org-based isolation, no per-tenant storage scoping, no per-tenant rate-limit or API-key isolation. Any multi-user deployment is today implicitly sharing all data across all users with no boundary other than the single-user trust model of a solo operator.

---

## Personas

| Persona | Role | Stake |
|---------|------|-------|
| Solo founder / operator | Delivers and operates the platform | All phases must be deliverable by one person; no phase may require dedicated platform engineering |
| Developer user (tenant member) | Uses the web UI to run the pipeline for their feature | Expects their journey/artefact data to be isolated from other organisations' data |
| Organisation (tenant) | GitHub org whose members use the platform | Expects data isolation from other orgs; represented by a GitHub org login |
| Future security auditor | Reviews the platform for a customer's security assessment | Will require evidence that cross-tenant data access is architecturally impossible, not just process-gated |

---

## MVP scope

### Phase 0 — Authorization guard (no infrastructure dependency, standalone PR)

Add `src/web-ui/middleware/journey-access.js` exposing:
- `requireJourneyAccess(journey, session, policy)` — throws typed error (`UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND`); no res object, unit-testable without HTTP harness
- `isOwner(journey, session)` — true if `journey.ownerId` is null/undefined (legacy) OR matches `session.login`
- `isSameTenant(journey, session)` — always returns true until `tenantId` exists on both sides (Phase 1); becomes a real boundary once tenantId is populated, with no further call-site changes
- `asHttpResponse(err)` — maps error codes to HTTP status integers for JSON routes
- FORBIDDEN vs NOT_FOUND policy: cross-tenant/cross-owner journeys that exist respond identically to journeys that do not exist (404) to prevent existence leak — except for the two mutating routes (recommit/stage-commit) where 403 is acceptable since prior reads already revealed existence

Wire this guard into all routes in the KNOWN BUG table using `POLICY.TENANT`. Replace the existing inline ownerId checks in `handlePostJourneyRecommit` and `handlePostJourneyStageCommit` with `POLICY.OWNER` via the same guard.

### Phase 1 — Identity: tenant resolution

- Add `read:org` scope to OAuth adapter
- Resolve `tenantId` at OAuth callback: fetch `/user/orgs`, find first match in `TENANT_ORG_ALLOWLIST` env var (comma-separated org logins). Zero matching orgs → reject login with clear error, no silent default-tenant fallback
- Extend session shape to `{ accessToken, userId, login, tenantId }`
- Update `journey.ownerId` creation to also store `journey.tenantId` at create time
- Update all test session fixtures from 3-field to 4-field shape

### Phase 2 — Storage scoping

- Repo-root resolution becomes `${TENANT_ROOT_BASE}/${tenantId}` — thread through all callers of `getRepoRoot()`
- Disk session store becomes `SESSION_STORE_PATH/${tenantId}/${sessionId}.json`
- featureSlug collision guard: prefix with `${tenantId}-` or include tenantId in the slug generation
- Tenant-isolation test suite at adapter/filesystem level (two tenants, assert zero cross-read)

### Phase 3 — State migration off in-process stores

- Journey store → Postgres (injectable adapter, same interface as current in-memory store)
- Auth sessions + viewer-activity → Redis (TTL eviction replaces manual Map cleanup)
- Concurrency tests and restart-survival tests

### Phase 4 — Performance isolation

- Prompt-cache keys are per-tenant+session
- Per-tenant API rate-limit isolation

### Phase 5 — Security hardening

- Re-audit all path-traversal guards now that `repoRoot` is derived from `tenantId` (an externally-influenced value)
- Adversarial test suite: malicious `tenantId`, `journeyId`, `featureSlug` attempting cross-tenant traversal

**Out of scope:** Container-per-tenant deployment, Kubernetes, GHE token URL fix, customer notification flows, billing/metering.

---

## Success indicators

1. **Phase 0 shipped standalone:** Any authenticated user calling `GET /api/journey/:id` for a journey they do not own receives 404 — not the journey state JSON.
2. **Phase 1 complete:** A user who belongs to zero allowlisted orgs cannot complete the OAuth flow. A user who belongs to org A cannot create or read journeys belonging to org B.
3. **Phase 2 complete:** Two tenants' artefacts and sessions exist in separate directory trees. A filesystem scan of tenant A's tree reveals zero files belonging to tenant B.
4. **Phase 3 complete:** Restarting the process does not lose any in-flight journey or active session. Two concurrent requests from different tenants produce no state bleed observable at the adapter level.

---

## Constraints

| ID | Constraint | Applies to |
|----|-----------|------------|
| C1 | No phase may require dedicated platform engineering or self-managed infrastructure | All phases |
| C2 | `accessToken` must never be written to disk — preserve the strip-before-write invariant in session-store | Phase 2+ |
| C3 | Path-traversal guards must not be weakened — all guards must remain in place; Phase 2 and Phase 5 must re-audit them with `tenantId` as a variable input | Phase 2, Phase 5 |
| C4 | Phase 0 must not be blocked by or bundled with Phases 1–3 | Phase 0 |
| C5 | Chain-hash trace emission on DoR gate-confirm and validate-before-state-write ordering must be preserved through all refactors | All phases |
| C6 | Any infra/deployment change (Postgres provisioning, Redis, cloud platform migration) must itself be produced as an artefact through the governed pipeline | Phase 3+ |

---

## Assumptions

1. GitHub org login is a stable, unique, platform-enforced identifier suitable for use as a tenant key — true for github.com; GHE org login stability is assumed but not confirmed
2. `TENANT_ORG_ALLOWLIST` is operator-configured per deployment — no self-registration of tenants in Phase 1
3. Fly.io or Render managed Postgres and Redis (Phase 3 target) are accessible from a single Node process without VPC configuration — needs operator confirmation before Phase 3 implementation begins
4. The `read:org` scope addition will not break existing single-user deployments where the operator belongs to at least one org — needs confirmation that GitHub doesn't change token behaviour when org scope is added
5. `journey.ownerId = null` (set for journeys created before Phase 0) remains readable by any authenticated user in the same tenant — this is the intended permissive-legacy behaviour, not a bug

---

## Open questions for definition

1. **Exact route list for Phase 0 guard:** Is `handleGetJourneyStageView` correctly named in the export? Does `handleGetStageControls` export under both names? A grep of `module.exports` in `journey.js` is needed to confirm the complete export list before the Phase 0 story ACs can be fully specified.

2. **`handleGetJourney` (HTML) scope:** The brief did not include the HTML journey page (`/journey/:journeyId`) in the KNOWN BUG list, but it also only checks `accessToken`. Should it return a 404 HTML page or redirect to `/` for cross-user access? The guard design says HTML routes should switch on `err.code` directly — confirm the intended UX.

3. **`handlePostJourneyStageCommit` ownerId check:** This handler was not directly read. Confirm it uses the same `journey.ownerId && journey.ownerId !== session.login` pattern as `handlePostJourneyRecommit` before writing the Phase 0 AC that replaces it.

4. **Org membership API pagination:** `GET /user/orgs` returns max 30 orgs per page. If a user belongs to >30 orgs, the allowlist check may silently miss a match. Phase 1 story AC must specify whether pagination is required (defensive: yes).

5. **Multi-org membership policy:** Brief states "first matching org in allowlist wins." Confirm: if a user belongs to two allowlisted orgs (e.g. a consultant), should they be assigned to the first match in allowlist order, or should multi-org membership be a login-time error requiring the operator to configure a disambiguating rule?

6. **Test fixture migration scope:** `makeReq({ session: { accessToken, userId, login } })` appears in at minimum: `check-cdg4`, `check-cdg5`, `check-wsm2`, `check-ougl7`, `artefact-writeback.test.js`, `artefact-preview.test.js`. A full grep of all test files is needed before Phase 1 story ACs can specify the complete update scope. Phase 0 tests should be written to the 3-field shape to avoid pre-empting Phase 1.

7. **Postgres/Redis vendor selection:** Phase 3 stories cannot be fully specified until the operator confirms the managed service vendor (Fly Postgres + Upstash Redis? Render Postgres + Render Redis?). Phase 3 definition should be deferred until after Phase 2 ships and the operator has selected a deployment platform.

---

## Story breakdown — proposed

Sequencing dependencies are hard unless noted otherwise.

### Phase 0 (no dependency on Phases 1–3)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p0.1 | Authorization guard module — `journey-access.js` with typed error throwing, unit tests | 2 | Stable |
| p0.2 | Wire guard into all buggy read routes (POLICY.TENANT); replace inline ownerId checks in recommit/stage-commit (POLICY.OWNER); integration tests proving cross-user leak closed | 2 | Stable |

p0.2 depends on p0.1.

### Phase 1 (depends on Phase 0)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p1.1 | Add `read:org` scope; resolve tenantId at OAuth callback; org allowlist with zero-match rejection | 2 | Stable (pending OQ4/OQ5 answers) |
| p1.2 | Add `tenantId` to session shape and journey creation; update `isSameTenant` to enforce real boundary; update all test session fixtures to 4-field shape | 2 | Stable (pending OQ6 fixture audit) |

p1.1 and p1.2 can be sequenced — p1.2 wires what p1.1 produces.

### Phase 2 (depends on Phase 1)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p2.1 | Tenant-parameterised repoRoot; `SESSION_STORE_PATH` namespacing; featureSlug collision guard | 3 | Stable |
| p2.2 | Tenant-isolation test suite at adapter/filesystem level (two tenants, zero cross-read assertion) | 2 | Stable |

p2.2 depends on p2.1.

### Phase 3 (depends on Phase 2; vendor selection OQ7 must be resolved first)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p3.1 | Postgres journey store adapter (injectable, same interface as in-memory store) | 3 | Unstable (pending vendor) |
| p3.2 | Redis auth-session and viewer-activity store adapter (injectable, TTL eviction) | 3 | Unstable (pending vendor) |
| p3.3 | Concurrency tests (two tenants interleaved, no state bleed) + restart-survival test | 2 | Stable |

p3.3 depends on p3.1 and p3.2.

### Phase 4 (depends on Phase 3)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p4.1 | Prompt-cache key scoping per tenant+session; per-tenant API rate-limit isolation | 2 | Stable |

### Phase 5 (depends on Phase 2)

| Story | Title | Complexity | Scope stability |
|-------|-------|-----------|----------------|
| p5.1 | tenantId validation before use in path construction; re-audit all traversal guards with variable repoRoot; adversarial test suite | 3 | Stable |

---

## Revised delivery sequencing

```
Phase 0 (P0.1 → P0.2)              ← ship standalone, no infra needed
     ↓
Phase 1 (P1.1 → P1.2)              ← identity only, no storage change
     ↓
Phase 2 (P2.1 → P2.2)              ← storage scoping + isolation proof
     ↓
Phase 5 (P5.1)                      ← security re-audit (can follow Phase 2 directly)
     ↓
[Operator confirms managed Postgres/Redis vendor — OQ7]
     ↓
Phase 3 (P3.1 + P3.2 → P3.3)       ← state persistence
     ↓
Phase 4 (P4.1)                      ← performance isolation
```

Phase 0 is independently shippable today. Phases 4 and 5 have no infra dependency and could be parallelised with Phase 3 if needed.
