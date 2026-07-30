# Test Plan: Client-org lightweight collaboration — comments only

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Comment saved with author metadata, visible to both sides | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | No grant → comment submission rejected (404, matches AC4 policy) | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Agency user sees Client comments and can reply | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Bidirectional thread satisfies metric's data condition; `client_agency_comment_created` event fired | 2 tests | 1 test | — | — | — | 🟢 |

Previously flagged as 🟡 (review run 1's MEDIUM finding [1-M1], PostHog event unnamed). Resolved 2026-07-31 — the story now names `client_agency_comment_created` directly; see Unit Tests below.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A Client-org user with a valid grant (reuses Story 2's grant fixture) | Synthetic | None | |
| AC2 | A Client-org user with NO grant | Synthetic | None | |
| AC3 | An Agency-org user with access to the shared resource | Synthetic | None | |
| AC4 | A comment thread with one Agency-side and one Client-side comment | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None at the data level — see Coverage gaps above for the separate PostHog-event gap.

---

## Unit Tests

### `savesCommentWithAuthorMetadataVisibleToBothSides`

- **Verifies:** AC1
- **Precondition:** A Client-org user with a valid grant on a resource
- **Action:** Call the comment-creation adapter
- **Expected result:** Comment persisted with `org_id`, `user_id`, resource reference, timestamp; retrievable by both the Client-org author and an Agency-org user with access to the same resource
- **Edge case:** No

### `rejectsCommentSubmissionWithNoGrant`

- **Verifies:** AC2
- **Precondition:** A Client-org user with NO grant on the target resource
- **Action:** Call the comment-creation adapter directly
- **Expected result:** Rejected — matches Story 2 AC4's 404 (not 403) policy; no comment row created
- **Edge case:** No

### `agencyUserSeesClientCommentsAndCanReply`

- **Verifies:** AC3
- **Precondition:** A Client-org comment exists on a resource the Agency org has access to
- **Action:** Call the comment-list adapter as the Agency-org user, then call comment-creation as the same user (a reply)
- **Expected result:** Client comment visible; Agency reply persists and is itself visible in the thread (closes review's LOW-1 — explicit assertion of bidirectional visibility, not just the Agency side reading the Client's comment)
- **Edge case:** No

### `bidirectionalThreadSatisfiesMetricDataCondition`

- **Verifies:** AC4 (data condition)
- **Precondition:** A thread with at least one Agency-side comment and one Client-side comment
- **Action:** Run the benefit-metric measurement query/function against this thread
- **Expected result:** Thread is counted as satisfying the minimum validation signal
- **Edge case:** No

### `firesClientAgencyCommentCreatedEventOnEveryComment`

- **Verifies:** AC4 (event condition, resolves review [1-M1])
- **Precondition:** A mocked PostHog capture function
- **Action:** Create a comment, first as the Client-org user (no Agency comment yet), then as the Agency-org user (completing the bidirectional thread)
- **Expected result:** `client_agency_comment_created` fired both times with `org_id`, `resource_type`, `resource_id`; `thread_has_both_org_types` is `false` on the first comment and `true` on the second
- **Edge case:** Yes — the boolean flag must flip correctly based on thread state at the moment of firing, not always `true`

---

## Integration Tests

### `commentFlowEndToEndForClientUserWithGrant`

- **Verifies:** AC1
- **Components involved:** Comment route, grant-check guard (Story 2), comment adapter
- **Precondition:** Client-org user with a valid grant
- **Action:** Full HTTP-level POST to the comment route
- **Expected result:** 200/success; comment persisted and retrievable via the resource's comment-list route

### `commentFlowRejectedAtRouteLevelWithNoGrant`

- **Verifies:** AC2
- **Components involved:** Full route stack (comment route → grant-check guard)
- **Precondition:** Client-org user with no grant
- **Action:** Full HTTP-level POST, crafted directly (not via UI)
- **Expected result:** 404, matching Story 2 AC4's policy exactly — same guard, not a parallel access-control path

### `agencyReplyFlowEndToEnd`

- **Verifies:** AC3
- **Components involved:** Comment route, comment-list route
- **Precondition:** Existing Client comment on a shared resource
- **Action:** Full HTTP-level GET (list) then POST (reply) as the Agency-org user
- **Expected result:** Client comment visible in the GET response; Agency reply persists and appears in a subsequent GET

### `benefitMetricMeasurementCountsQualifyingThread`

- **Verifies:** AC4 (data condition)
- **Components involved:** Comment adapter, benefit-metric measurement function
- **Precondition:** A qualifying bidirectional thread
- **Action:** Run the measurement path end-to-end against the seeded thread
- **Expected result:** Thread counted correctly

---

## NFR Tests

### `commentListUsesBatchedQueryNotN1`

- **NFR addressed:** Performance
- **Measurement method:** Count queries issued by the fake pool when retrieving a comment list for a resource with multiple comments
- **Pass threshold:** One batched query, not one query per comment — matching `_getArtefactCountsBulk`'s precedent
- **Tool:** Node (query-count assertion)

### `commentEndpointsGoThroughSameGrantCheckGuardAsStory2`

- **NFR addressed:** Security
- **Measurement method:** Structural assertion that the comment route imports and calls the SAME grant-check adapter function Story 2's tests exercise, not a duplicated/parallel implementation
- **Pass threshold:** Same function reference used by both route handlers
- **Tool:** Node (module-reference assertion)

### `commentFormIsKeyboardNavigable`

- **NFR addressed:** Accessibility
- **Measurement method:** Static assertion that the rendered form/thread uses real `<form>`/`<textarea>`/semantic list markup
- **Pass threshold:** Real elements present in rendered HTML
- **Tool:** Node (HTML-string assertion)

### `commentCreationIsAudited`

- **NFR addressed:** Audit
- **Measurement method:** Assert a log entry is emitted on comment creation containing author `org_id`, `user_id`, resource reference, and timestamp
- **Pass threshold:** All four fields present
- **Tool:** Node (injectable logger stub)

---

## Out of Scope for This Test Plan

- Editing or deleting comments — append-only in this MVP
- Real-time push notifications — not built
- Comment moderation/reporting — not built
- Comments on non-shared-grant resources — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | Review [1-M1] resolved 2026-07-31 — `client_agency_comment_created` named directly in AC4 and covered by `firesClientAgencyCommentCreatedEventOnEveryComment` | — |
