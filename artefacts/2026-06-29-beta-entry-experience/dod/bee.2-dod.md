# Definition of Done: bee.2 — First-run empty-state experience

**PR:** #421 feat(bee.2): first-run empty-state experience for /journeys | **Merged:** 2026-06-29
**Story:** artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md
**Test plan:** artefacts/2026-06-29-beta-entry-experience/test-plans/bee.2-test-plan.md
**DoR artefact:** artefacts/2026-06-29-beta-entry-experience/dor/bee.2-dor.md
**Assessed by:** /definition-of-done skill (agent-auto)
**Date:** 2026-06-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1 (200 + empty-state block), T2 (empty-state present, no journey card), T11 (dispatch integration → empty-state) | Automated — check-bee2-empty-state.js | None |
| AC2 | ✅ | T3 ("haven't started" text), T4 ("governed artefact" description), T5 (href="/skills" link) | Automated — check-bee2-empty-state.js | None |
| AC3 | ✅ | T6 (2 journey cards for 2 journeys), T7 (empty-state absent when journeys present), + assertion in T6 of data-journey-id presence | Automated — check-bee2-empty-state.js | None |
| AC4 | ✅ | NFR-T1 (empty-state text present in raw res.body string, no JS execution), T11 (dispatch-level integration confirms SSR) | Automated — check-bee2-empty-state.js | None |
| AC5 | ✅ | T8 (500 status on adapter throw), T9 (empty-state absent from 500 response), T12 (dispatch integration → 500 on error) | Automated — check-bee2-empty-state.js | None |
| D37 | ✅ | T10 — default _listJourneys stub throws with "Adapter not wired" message; does not silently return [] | Automated — check-bee2-empty-state.js | None |

---

## Scope Deviations

None. PostHog instrumentation (bee.3 scope), interactive onboarding, dismiss mechanism, and changes to the skill picker itself were all absent from the merged implementation, as required.

---

## Test Plan Coverage

**Tests from plan implemented:** 12/12 unit+integration tests + 2 NFR tests
**Tests passing in CI:** 12/12 (17 assertions)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — empty listJourneys → 200 + empty-state | ✅ | ✅ | |
| T2 — empty-state present, no journey card | ✅ | ✅ | |
| T3 — "haven't started" explanation | ✅ | ✅ | |
| T4 — governed artefact description | ✅ | ✅ | |
| T5 — skill picker link /skills | ✅ | ✅ | |
| T6 — 2 journey cards for 2 journeys | ✅ | ✅ | |
| T7 — populated list: empty-state absent | ✅ | ✅ | |
| T8 — adapter throws → 500 | ✅ | ✅ | |
| T9 — 500 response: no empty-state | ✅ | ✅ | |
| T10 — D37: default stub throws | ✅ | ✅ | |
| T11 — dispatch integration: empty-state | ✅ | ✅ | |
| T12 — dispatch integration: 500 on error | ✅ | ✅ | |
| NFR-T1 — SSR: content in raw body | ✅ | ✅ | Rolled into assertions |
| NFR-T2 — latency <50ms | ✅ | ✅ | Rolled into assertions |

**Gaps:** The [journey-store] console.error assertion (noted in T8/T9 gap at plan time) was not separately automated due to test-runner variability in spy setup. Verified by code inspection: `console.error('[journey-store]', err.message)` is present in the error path.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No additional latency beyond listJourneys call | ✅ | Empty-state branch is synchronous after adapter returns; NFR-T2 asserts <50ms with sync stub |
| Empty-state renders without JavaScript | ✅ | AC4/NFR-T1 confirmed by raw string assertion — no DOM or script execution required |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Beta activation rate | not-yet-measured | Feature deployed 2026-06-30. Empty-state experience is in place to guide new users. No external users have signed up yet; measurement will begin once PostHog account is created and the first external user reaches the dashboard. | null |
| M2 — Cross-tenant isolation confirmed | not-yet-measured | Requires two distinct tenant_ids in the Postgres journey store simultaneously. No external users exist yet. Verification procedure: once first external user signs up, Hamish logs in as himself, attempts to access that user's journey by URL, confirms 404. | null |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- M2 verification: once first external user signs up and creates a journey, Hamish performs the cross-tenant access test (log in, attempt to access external user's journey URL, confirm 404). Record result in wuce-multi-tenancy M2 signal. (owner: Hamish King)
- Monitor console.error output in Fly logs after first real error hits /journeys for [journey-store] prefix confirmation. (owner: Hamish King)

---

## DoD Observations

1. D37 (default stub throws, not returns empty) is enforced and verified by T10. This is the pattern that would catch misconfiguration at startup rather than returning a silent empty list that could mask a broken production wiring.
2. The bee.2 + bee.1 sequence was critical: bee.1 established the unauthenticated surface, bee.2 established the authenticated surface. The route dispatch integration (T11, T12) confirmed both layers work together via server.js dispatch, not just at the handler level.
