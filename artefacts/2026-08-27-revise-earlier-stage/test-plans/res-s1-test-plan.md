## Test Plan: Reopen a completed stage's live session from the step-nav

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
**Epic reference:** artefacts/2026-08-27-revise-earlier-stage/epics/reopen-and-revise-earlier-stage.md
**Test plan author:** Copilot
**Date:** 2026-08-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Completed stage with a live in-memory session links directly to its chat, not the static view | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Completed stage with no in-memory session creates a fresh session with priorArtefacts injected | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | GET /api/journey/:id shape (completedStages, stage, stages[]) unchanged by a reopen | — | 2 tests | — | — | — | 🟢 |
| AC4 | Not-yet-completed stage's step-nav link is unaffected by this change | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey fixture with `completedStages` containing a stage entry carrying a `sessionId`; a stubbed `getGetHtmlSession()` that resolves that id to an in-memory session object | Synthetic, built in test setup | None | Mirrors `handleGetJourneyStage`'s existing lookup shape (`journey-store.js` `completeStage()` docstring, `frsr-s1`) |
| AC2 | Same journey fixture, but `getGetHtmlSession()` stub returns `null` for the target sessionId (simulating a pruned/restarted session); an on-disk artefact fixture at the stage's `artefactPath` | Synthetic | None | Artefact content must be a real small markdown fixture so `priorArtefacts` injection has real content to assert against |
| AC3 | Journey fixture as above, before/after snapshots of a `GET /api/journey/:id` response | Synthetic | None | Deep-equal comparison of `completedStages`/`stage`/`stages[]` pre- and post-reopen |
| AC4 | Journey fixture with one completed stage and one not-yet-completed stage | Synthetic | None | |

### PCI / sensitivity constraints

None — pipeline artefact content only, no customer or payment data.

### Gaps

None.

---

## Unit Tests

### rendersDirectChatLinkForCompletedStageWithLiveSession

- **Verifies:** AC1
- **Precondition:** `journey.completedStages` includes an entry `{ skillName: 'discovery', sessionId: 'sess-1', artefactPath: '...' }`; `setGetHtmlSession(sid => sid === 'sess-1' ? { skillName: 'discovery', turns: [] } : null)` stubs the session as live.
- **Action:** Render the step-nav's completed-stage (`isDone && !isViewing`) entry for the `discovery` stage.
- **Expected result:** Rendered `href` is `/skills/discovery/sessions/sess-1/chat` — not `/journey/:id/stage/discovery`.
- **Edge case:** No.

### fallsThroughToStaticViewUrlWhenSessionLookupUnavailable

- **Verifies:** AC1 (negative control)
- **Precondition:** Same fixture, but `getGetHtmlSession()` is unset (returns `undefined`/throws per the injectable-adapter stub-must-throw rule).
- **Action:** Attempt to render the completed-stage step-nav entry.
- **Expected result:** Adapter-not-wired error is thrown per CLAUDE.md's injectable adapter rule (D37) — proves the story's code path actually calls the adapter rather than silently falling back.
- **Edge case:** Yes — verifies the D37 stub-must-throw discipline is honoured for this new call site.

### createsFreshSessionWithPriorArtefactsWhenNoLiveSessionExists

- **Verifies:** AC2
- **Precondition:** `journey.completedStages` entry for `benefit-metric` with `sessionId: 'sess-2'`; `getGetHtmlSession()` stub returns `null` for `'sess-2'`; on-disk fixture at the stage's `artefactPath` contains known markdown content.
- **Action:** Render/resolve the completed-stage link for `benefit-metric`.
- **Expected result:** A new session is created; the `buildSystemPrompt` call underlying it receives a `priorArtefacts` array containing `{ path: <artefactPath>, content: <the exact fixture markdown> }`, read via `fs.readFileSync` (not from any cached in-memory value).
- **Edge case:** No.

### stepNavLinkForNotYetCompletedStageIsUnchangedByThisStory

- **Verifies:** AC4
- **Precondition:** Journey fixture with one completed stage (`discovery`) and one not-yet-reached stage (`definition`).
- **Action:** Render the full step-nav.
- **Expected result:** The `definition` stage's rendered `href` and CSS class are byte-identical to the pre-change baseline (same fixture rendered against the pre-story code path) — this story's change touches only the `isDone` branch.
- **Edge case:** No.

---

## Integration Tests

### completedStageReopenEndToEndViaExistingSession

- **Verifies:** AC1
- **Components involved:** `journey.js` step-nav handler → `getGetHtmlSession()` → chat route
- **Precondition:** Full journey + session fixtures as above, real (non-stubbed) chat route wiring.
- **Action:** Simulate a GET request equivalent to clicking the completed-stage step-nav link.
- **Expected result:** Response resolves to the live chat page for `sess-1`, HTTP 200, containing the existing turn history from the stubbed session.

### completedStageReopenEndToEndViaFreshSession

- **Verifies:** AC2
- **Components involved:** `journey.js` step-nav handler → `getGetHtmlSession()` (returns null) → session-creation path → `buildSystemPrompt`
- **Precondition:** Same as AC2 unit test, at the route level.
- **Action:** Simulate the completed-stage step-nav request with no live session available.
- **Expected result:** A new session is created and the response is a redirect/render to that new session's chat URL; the created session's system prompt includes the injected `priorArtefacts` content.

### journeyStateShapeUnchangedAfterReopen

- **Verifies:** AC3
- **Components involved:** `handleGetJourneyState` (`GET /api/journey/:id`)
- **Precondition:** Journey fixture, snapshot the full GET response before the reopen action.
- **Action:** Perform the reopen (AC1's existing-session path), then GET `/api/journey/:id` again.
- **Expected result:** `completedStages`, `stage`, and `stages[]` are deep-equal to the pre-reopen snapshot — no new entry added, no entry mutated, per ADR-024's governed shape contract.

### journeyStateShapeUnchangedAfterFreshSessionReopen

- **Verifies:** AC3 (fresh-session variant)
- **Components involved:** Same as above, but exercising AC2's fresh-session path.
- **Precondition:** Journey fixture with no live session for the target stage.
- **Action:** Perform the reopen (AC2's fresh-session path), then GET `/api/journey/:id`.
- **Expected result:** `completedStages`'s existing entry for that stage is unchanged (same `artefactPath`, same `completedAt`) — only `sessionId` may be updated to the new session, per the existing `completeStage()` contract; `stage` and `stages[]` are unchanged.

---

## NFR Tests

### noExtraSessionCreatedWhenLiveSessionAlreadyExists

- **NFR addressed:** Performance
- **Measurement method:** Count calls to the session-creation function during the AC1 (existing-session) path.
- **Pass threshold:** Zero new sessions created — the count before and after the reopen action is identical.
- **Tool:** Node test runner (`scripts/run-all-tests.js`), spy/counter on the session-creation function.

### reopenUsesExistingReadOnlySessionLookupOnly

- **NFR addressed:** Security
- **Measurement method:** Static assertion that the reopen path calls only `getGetHtmlSession()` (already used by `handleGetJourneyById`) — no new input-accepting endpoint or parameter is introduced.
- **Pass threshold:** No new route registered; no new unvalidated request parameter read.
- **Tool:** Node test runner — source-level assertion (matching this repo's precedent for shared-mechanism proof via source assertion).

### stageReopenFiresAuditEvent

- **NFR addressed:** Audit
- **Measurement method:** Assert a `earlier_stage_reopened` event (or equivalent named event) is emitted with `journeyId` and `stageName` when either AC1 or AC2's path fires.
- **Pass threshold:** Exactly one audit event per reopen action, with both fields populated.
- **Tool:** Node test runner, stubbed event/PostHog sink.

---

## Out of Scope for This Test Plan

- Testing the artefact-index page's "View" link (out of scope for res-s1 itself, per the story's own Out of Scope section)
- Testing what happens to the artefact content after a revision turn — covered by res-s2's own test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
