## Test Plan: Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**Story reference:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-26

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Site 1 (stage-view): Postgres fallback renders content when disk+git both miss | 1 test | — | — | — | — | 🔴 |
| AC2 | Site 2 (story-list): Postgres fallback populates auto-IDs when disk misses | 1 test | — | — | — | — | 🟡 |
| AC3 | Site 3 (review-session context): Postgres fallback fills priorArtefacts when disk misses | 1 test | — | — | — | — | 🔴 |
| AC4 | Site 4 (clarify side-trip): Postgres fallback fills pre-loaded context when disk misses | 1 test | — | — | — | — | 🟡 |
| AC5 | Regression: disk content still wins over Postgres at all 4 sites | 4 tests | — | — | — | — | 🟢 |
| AC6 | Regression: site 1's existing git-fallback still works when Postgres also has nothing | 1 test | — | — | — | — | 🟢 |
| AC7 | True-empty case unchanged at all 4 sites | 4 tests | — | — | — | — | 🟢 |
| AC8 | Postgres-lookup-throws degrades safely at all 4 sites | 4 tests | — | — | — | — | 🟡 |

---

## Coverage gaps

None. AC1/AC3 marked 🔴 since these are the two sites with user-visible/AI-context-corrupting impact (the reported bug, and the most functionally serious of the 3 audit-found sites). AC2/AC4/AC8 marked 🟡 (softer-impact usability/robustness gaps, still fully covered by tests).

---

## Test Data Strategy

**Source:** Synthetic — minimal `journey`/`req`/`res` fixtures, following the exact mocking pattern already established in `tests/check-avpf-s1-postgres-fallback.js` (`mockReq`/`mockRes`) and `tests/check-p3.1-pg-journey-adapter.js` (`_setPoolForTesting` + `process.env.DATABASE_URL` save/restore).
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in a new file, `tests/check-jspf-s1-journey-postgres-fallback.js`, using this repo's plain-Node assert-based runner (no external deps), requiring `src/web-ui/routes/journey.js`'s handlers directly and `src/web-ui/adapters/journey-store-pg.js`'s `_setPoolForTesting` to stub the Postgres layer.

**Shared setup (all tests):**
- `process.env.DATABASE_URL` set to a dummy truthy value before each test that needs the Postgres tier active, restored after.
- `journey-store-pg._setPoolForTesting({ query: async (sql, params) => ({ rows: [...] }) })` — the fake pool's `query` mock returns rows shaped `{ skill_name, artefact_path, content }` matching the real `getArtefactsForJourney` SQL shape.
- A fake `_journeyStore` (via `journey.js`'s existing `setJourneyStoreModule`) providing `getJourney(journeyId)` returning a minimal journey fixture (`{ journeyId, featureSlug, tenantId, completedStages: [...] }`) with `requireJourneyAccess`'s tenant check satisfied by matching `req.session.tenantId`.
- Disk misses are simulated by pointing `repoRoot`/`getRepoRoot(req)` at a nonexistent directory, or by using a `artefactPath` that does not resolve to a real file on disk (both approaches already used by this repo's existing journey.js tests — implementer's choice, whichever is less brittle for each specific handler).

### AC1: stage-view (site 1) — Postgres fallback renders content when disk and git both miss

- **Verifies:** AC1.
- **Action:** Call `handleGetJourneyStageView` with a journey whose `completedStages` includes a `discovery` stage pointing at a nonexistent disk path, the `_dasOwnerRepo`/git-fetch path resolving to no connected repo (throws/resolves nothing, matching the existing `_dasResolveErr` catch), and the fake Postgres pool returning a `discovery` row with real content.
- **Expected result:** Response body contains the real Postgres-sourced content; does not contain "No artefact content found."

### AC2: story-list auto-populate (site 2) — Postgres fallback fills autoIds when disk misses

- **Verifies:** AC2.
- **Action:** Call `handleGetStories` with a journey whose `completedStages` includes a `definition` stage pointing at a nonexistent disk path, and the fake Postgres pool returning a `definition` row whose content contains 2-3 parseable story IDs (matching `extractStoryIdsFromDefinitionArtefact`'s existing expected input shape, reused from `tests/check-dsda-s1-*.js` if such a fixture already exists — otherwise a minimal inline fixture).
- **Expected result:** The rendered textarea's value contains the story IDs extracted from the Postgres-sourced content — not an empty textarea.

### AC3: review-session context (site 3, highest severity) — Postgres fallback fills priorArtefacts when disk misses

- **Verifies:** AC3.
- **Action:** Call `handlePostStories` with a journey whose `completedStages` includes 2 completed stages (e.g. `discovery`, `definition`) both pointing at nonexistent disk paths, and the fake Postgres pool returning rows with real content for both. Intercept the call into `_startReviewSessionForJourney` (via whatever seam this repo's existing tests for this function already use — check `tests/check-*-startReviewSessionForJourney*.js` or the nearest existing coverage of `handlePostStories` for the established interception pattern) to capture the `priorArtefacts` argument passed in.
- **Expected result:** Captured `priorArtefacts` contains non-empty `content` for both stages, sourced from Postgres — not empty strings.

### AC4: clarify side-trip context (site 4) — Postgres fallback fills pre-loaded context when disk misses

- **Verifies:** AC4.
- **Action:** Call `handlePostSideTripClarify` with a journey whose `featureSlug` resolves to a nonexistent `discovery.md` disk path, and the fake Postgres pool returning a `discovery` row with real content. Inspect whatever mechanism this handler uses to seed the new session's context (`getRegisterHtmlSession`/session content, per the existing code around line 3296-3299) to confirm the real content was used.
- **Expected result:** The side-trip session's seeded context contains the real Postgres-sourced discovery content — not empty.

### AC5: regression — disk content still wins at all 4 sites (4 sub-tests)

- **Verifies:** AC5.
- **Action:** For each of the 4 handlers, provide a real, readable disk file with distinct "DISK-CONTENT" marker text, and a fake Postgres pool returning a different "PG-CANARY — should never appear" marker for the same stage. Call each handler.
- **Expected result:** Each handler's output/captured argument contains "DISK-CONTENT" and never contains "PG-CANARY" — confirms the Postgres tier is never even consulted when disk succeeds (matching `avpf-s1`'s own `pgCalled` assertion pattern, reused here as a spy on the fake pool's `query` method).

### AC6: regression — site 1's git-fallback still works (unaffected by new Postgres tier)

- **Verifies:** AC6.
- **Action:** Call `handleGetJourneyStageView` with disk missing, fake Postgres pool returning `rows: []` (nothing for this stage), and the existing git-fallback mocked to succeed (reusing whatever fixture/mock this repo's existing `das-s1` tests already use for `export-data-source`/`artefact-fetcher`).
- **Expected result:** Response body contains the git-sourced content, exactly as `das-s1`'s own existing passing test already confirms — this AC is a regression guard confirming the new Postgres tier's insertion point doesn't disturb it.

### AC7: true-empty case unchanged at all 4 sites (4 sub-tests)

- **Verifies:** AC7.
- **Action:** For each of the 4 handlers, disk missing, fake Postgres pool returning `rows: []`, and (for site 1 only) git-fallback also resolving nothing.
- **Expected result:** Site 1: response body contains "No artefact content found" exactly as today. Sites 2-4: empty textarea / empty `priorArtefacts` content / empty seeded context, exactly as today's pre-fix behaviour (proving no regression to the already-existing default).

### AC8: Postgres-lookup-throws degrades safely at all 4 sites (4 sub-tests)

- **Verifies:** AC8.
- **Action:** For each of the 4 handlers, disk missing, fake Postgres pool's `query` method throws (`async () => { throw new Error('DB connection failed'); }`).
- **Expected result:** No handler throws an unhandled exception; each falls through to its AC7 true-empty behaviour (or, for site 1, to AC6's git-fallback behaviour if that mock is also active in a given sub-test).

---

## Integration Tests

None beyond the existing regression suites confirmed unaffected — `tests/check-alrf-s4-postgres-artefact-fallback.js`, `tests/check-avpf-s1-postgres-fallback.js`, and journey.js's own existing test files covering `handleGetJourneyStageView`/`handleGetStories`/`handlePostStories`/`handlePostSideTripClarify` (identify exact file names during implementation and re-run all of them fresh) must all still pass unchanged.

---

## E2E Tests

None. This story's fix is a server-side content-resolution change verifiable via direct handler calls with mocked disk/Postgres/git state, matching the precedent set by `alrf-s4`/`avpf-s1`'s own test plans (neither used E2E tooling either).

---

## NFR Tests

None named — the story's own NFR section states "None new" for Security/Accessibility/Audit and "Negligible" for Performance.

---

## Out of Scope for This Test Plan

- The spikes-directory listing and any other site the story's own Out of Scope section excludes — not tested here, no behaviour change.
- The 2 already-correct session-resume context-rebuild code paths (~line 1500, ~line 2255) — not modified by this story, not re-tested beyond confirming their existing test coverage still passes.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3's exact interception mechanism for `priorArtefacts` depends on `handlePostStories`'s current internals (`_startReviewSessionForJourney`) | Not fully confirmed until implementation — this function may need a test seam (e.g. an injectable spy) if none exists today | Implementer to check for existing test coverage of `handlePostStories`/`_startReviewSessionForJourney` first and reuse its existing interception pattern before adding a new one |
