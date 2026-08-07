# Client-org lightweight collaboration — comments only — Implementation Plan

> **For agent execution:** Executed directly in this session (/tdd per task, no subagent fan-out — single coding agent dispatch).

**Goal:** Build one new append-only `comments` table and comment-creation/comment-list route handlers that reuse Story 2's existing `checkGrantAccess` grant-check adapter directly on the Client-org side (never a parallel access-control path), plus a `client_agency_comment_created` PostHog event fired on every comment creation with a correctly-computed (never hardcoded) `thread_has_both_org_types` boolean.

**Branch:** `feature/story-5-client-agency-comments`
**Worktree:** current worktree (already isolated)
**Test command:** `node tests/check-story5-client-agency-comments.js` (single file); `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  src/web-ui/modules/agency-client-comments.js       — schema migration, comment CRUD (create/list only — append-only), thread org-type computation, benefit-metric measurement function
  tests/check-story5-client-agency-comments.js        — 13 tests across 4 ACs + 4 NFR tests (per test plan)
  artefacts/2026-07-30-agency-client-organisations/plans/story-5-client-agency-comments-plan.md — this file

Modify:
  src/web-ui/routes/products.js                       — add handleCreateSharedComment/handleListSharedComments (Client-side, gated by Story 2's checkGrantAccess/requireGrantAccess), handleCreateAgencyComment/handleListAgencyComments (Agency-side, no grant check — own resource), renderCommentThreadHtml (accessibility NFR), _createCommentAndFireEvent (shared posthog-firing helper)
  .github/pipeline-state.json                          — mandatory state update at branch-complete
  artefacts/2026-07-30-agency-client-organisations/decisions.md — log the no-live-routing-yet scope decision (mirrors Story 2's own) and the organisations-table JOIN design choice for thread_has_both_org_types
```

Not touched: `src/web-ui/middleware/journey-access.js` (reused as-is — `requireGrantAccess`/`asHttpResponse`/`POLICY` already exist from Story 2, no new export needed), `src/web-ui/modules/agency-client-grants.js` (reused as-is — `checkGrantAccess`/`logDeniedAccess` already exist).

---

## Task 1: Schema migration + append-only comment adapter core (AC1)

**Files:**
- Create: `src/web-ui/modules/agency-client-comments.js`
- Test: `tests/check-story5-client-agency-comments.js`

- [ ] **Step 1: Write the failing test** — `savesCommentWithAuthorMetadataVisibleToBothSides` (AC1): seed a grant fixture (reusing Story 2's `agency-client-grants` module + a fake pool that also holds `organisations` rows), call `createComment(pool, 'product', 'product-x', 'client-1', 'alice', 'nice work')`, assert the returned row carries `org_id`, `user_id`, resource reference, `created_at`; then call `listCommentsForResource` and assert it appears.
- [ ] **Step 2: Run test — must fail** (module does not exist yet)
- [ ] **Step 3: Write implementation** — `migrateCommentsSchema(pool)` (`CREATE TABLE IF NOT EXISTS comments` matching the story's ERD exactly: `comment_id PK, resource_type, resource_id, org_id, user_id, body, created_at`), `createComment` (audit-logs `comment_created`), `listCommentsForResource` (ONE batched SELECT, ordered oldest-first).
- [ ] **Step 4: Run test — must pass**

---

## Task 2: No-grant rejection reusing Story 2's guard exactly (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-story5-client-agency-comments.js`

- [ ] **Step 1: Write the failing tests** — `rejectsCommentSubmissionWithNoGrant` (AC2, unit: call `_agencyClientGrants.checkGrantAccess` directly for an ungranted resource, assert null, assert `requireGrantAccess` throws and `asHttpResponse` resolves to 404) and `commentFlowRejectedAtRouteLevelWithNoGrant` (AC2, integration: full handler call with no grant seeded).
- [ ] **Step 2: Run — must fail** (`handleCreateSharedComment` does not exist yet)
- [ ] **Step 3: Implement** `handleCreateSharedComment`/`handleListSharedComments` in `products.js` — call `_agencyClientGrants.checkGrantAccess` then `_journeyAccess.requireGrantAccess`/`asHttpResponse` (the SAME function references Story 2's own handlers use, not a copy), 404 with `{error:'not found'}` body shape identical to Story 2's on denial, audit-log the denial via `_agencyClientGrants.logDeniedAccess`.
- [ ] **Step 4: Run — must pass**

---

## Task 3: Agency-side reply visibility (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-story5-client-agency-comments.js`

- [ ] **Step 1: Write the failing tests** — `agencyUserSeesClientCommentsAndCanReply` (AC3, unit: list as Agency user sees the Client comment, then create a reply as the Agency user, then list again and assert the reply itself is present — not just that the Client comment is visible) and `agencyReplyFlowEndToEnd` (AC3, integration, full route stack: GET then POST then GET).
- [ ] **Step 2: Run — must fail** (`handleCreateAgencyComment`/`handleListAgencyComments` do not exist yet)
- [ ] **Step 3: Implement** `handleCreateAgencyComment`/`handleListAgencyComments` — no grant check (Agency accessing its own resource), same underlying `createComment`/`listCommentsForResource` write/read path as the Client side, so a reply is immediately visible in the very next read.
- [ ] **Step 4: Run — must pass**

---

## Task 4: `thread_has_both_org_types` computation + `client_agency_comment_created` event (AC4)

**Files:**
- Modify: `src/web-ui/modules/agency-client-comments.js` (`getThreadOrgTypes`, `threadHasBothOrgTypes`, `countQualifyingThreads`)
- Modify: `src/web-ui/routes/products.js` (`_createCommentAndFireEvent`)
- Test: `tests/check-story5-client-agency-comments.js`

- [ ] **Step 1: Write the failing tests** — `firesClientAgencyCommentCreatedEventOnEveryComment` (AC4, unit: mock `posthog-server.capture`, create a Client-side comment first — assert `thread_has_both_org_types === false` — then an Agency-side comment on the same thread — assert `true`), `bidirectionalThreadSatisfiesMetricDataCondition` (AC4, unit: seed a bidirectional thread, call `countQualifyingThreads`, assert it counts), `benefitMetricMeasurementCountsQualifyingThread` (AC4, integration, end-to-end through the route handlers).
- [ ] **Step 2: Run — must fail** (`getThreadOrgTypes`/`threadHasBothOrgTypes`/`countQualifyingThreads` do not exist yet; `client_agency_comment_created` never fired)
- [ ] **Step 3: Implement** — `getThreadOrgTypes(pool, resourceType, resourceId)` (JOIN `comments`+`organisations`, `DISTINCT org_type`), `threadHasBothOrgTypes(orgTypes)` (real boolean predicate, not hardcoded), `countQualifyingThreads(pool)` (benefit-metric.md Metric 2's measurement function — GROUP BY resource, HAVING both org types present). Wire `_createCommentAndFireEvent` in `products.js` to call these AFTER the insert (so the just-created comment's own org_type is already reflected) and fire `_posthog.capture(..., 'client_agency_comment_created', {org_id, resource_type, resource_id, thread_has_both_org_types})`.
- [ ] **Step 4: Run — must pass**

---

## Task 5: NFR tests (Performance, Security, Accessibility, Audit) + full suite + wiring decision

**Files:**
- Modify: `src/web-ui/routes/products.js` (`renderCommentThreadHtml` accessibility helper, if not already added in Task 3)
- Test: `tests/check-story5-client-agency-comments.js`

- [ ] **Step 1: Write the failing tests** — `commentListUsesBatchedQueryNotN1` (spy on fake-pool query count when listing a resource with multiple comments — must be 1, not N), `commentEndpointsGoThroughSameGrantCheckGuardAsStory2` (structural: source-scan `products.js`'s comment section, assert it calls `_agencyClientGrants.checkGrantAccess`/`_journeyAccess.requireGrantAccess`, same function references as Story 2's own section), `commentFormIsKeyboardNavigable` (assert `renderCommentThreadHtml` output contains real `<form`, `<textarea`, `<ul`/`<li` markup), `commentCreationIsAudited` (injectable logger stub, assert `org_id`/`user_id`/resource reference/`timestamp` all present in the `comment_created` log entry).
- [ ] **Step 2: Run — must fail**
- [ ] **Step 3: Implement/confirm** — all four NFR behaviours should already be satisfied by Tasks 1-4's implementation; this task is primarily about writing the assertions and closing any gap found.
- [ ] **Step 4: Run — must pass**
- [ ] **Step 5:** Run `node tests/check-story5-client-agency-comments.js` standalone — all 13 test-plan tests + 4 NFR tests pass.
- [ ] **Step 6:** Run `node scripts/run-all-tests.js` (full suite) — compare failure count against the pre-implementation baseline (451 files run, 38 failed, captured before any code was written on this branch); zero NEW failures.
- [ ] **Step 7:** Log the "no live URL routing yet" scope decision (mirrors Story 2's own — Story 3/4 own the real user-facing URL/session contract) and the organisations-table JOIN design choice in `decisions.md`.
- [ ] **Step 8:** Update `.github/pipeline-state.json` for this story (branch-complete gate).
- [ ] **Step 9:** Commit, push, open draft PR.

---

<!-- Task granularity note: this plan groups AC1/AC2/AC3/AC4/NFRs into 5 tasks rather than 13 micro-tasks (one per individual test-plan test row), because most tests share one of two implementation units (the comments adapter module, or the route-handler pair) — splitting further would not change what code gets written per step. Each task above still follows RED-GREEN per its own scope. -->
