# Test Plan: ep1-s1 — Feature Discovery from Pipeline-State Index

**Story:** ep1-s1 — Feature Discovery from Pipeline-State Index
**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Test Plan Status:** TDD — tests written to fail before implementation
**Date:** 2026-05-16 (original) / **revised 2026-09-01**

> ⚠️ **Revised 2026-09-01.** The section below (E2E scenarios, AC coverage, unit/integration test list) originally targeted a new `/api/features` endpoint and a new skill-picker UI component. That target is superseded — see `stories/ep1-s1.md`'s Revision Note and `decisions.md`. This test plan is rewritten in full below to target extending the existing Journeys page (`/journey`) instead; nothing from the original 2026-05-16 version remains applicable, since both the data source and the UI surface changed.

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/definition.md` ✅
- Review report: Not applicable — definition artefact reviewed in prior phase ✅
- Story has 3+ ACs in Given/When/Then format: 1 AC present ✅

**Proceeding with test plan for ep1-s1.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:**
- Test runner: `npm test` (Node.js assert-based custom test helper in `tests/unit/test-helper.js`)
- Framework: Node.js built-in `assert` module + async `test()` helper
- E2E framework: Playwright (`npm run test:e2e`)

**AC Analysis:**
This story contains one AC that describes a **UI-rendering and interaction behaviour** — displaying a feature list with name, stage badge, date, and a "Continue" button. This requires:
- The skill picker renders a list of features
- Each feature displays name, stage badge (styled element), date, and button
- The button is clickable and triggers the selection flow

This cannot be tested at unit or integration level because correctness depends on DOM rendering and element presence. A unit test that mocks the DOM would not verify actual rendering.

**Decision:**
✅ **E2E browser test required (Playwright)** — The AC must be verified in a real browser via `npm run test:e2e`.

E2E tooling is already configured (Playwright is a devDependency). No tooling gap.

---

## Test Data Strategy

**Test Data Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `.github/pipeline-state.json` with test feature records in memory
- Mock `fs.readFileSync()` in Node.js to return synthetic JSON
- In E2E tests, mock the HTTP response from the web UI server (`/api/features`) with a fixed set of test feature records, e.g. `'Test Feature 002'` at stage `benefit-metric`, plus an archived control record excluded by the filter

**Sensitivity:** None — synthetic test data, no real credentials, no PII.

**Data Availability:** Ready — no external dependencies; generated in test setup.

---

## Test Environment and Framework (revised 2026-09-01)

**Confirmed from `package.json` scripts:** `npm test` (Node.js assert-based custom test helper). E2E framework: Playwright (`npm run test:e2e`) — already configured.

**AC Analysis:** Both ACs describe rendered UI behaviour (a card appearing or not appearing on `/journey`, with specific visible fields). Card *presence/absence* and *field content* are verifiable by rendering `_renderJourneyHome`'s output HTML directly (no real browser needed — this is server-rendered HTML, not client-side DOM interaction). The existing "Continue →" click-through behaviour itself is NOT retested here — it is explicitly out of scope (reused unchanged) and already has its own coverage from whatever story originally built the Journeys page.

**Decision:** No new E2E test required. Server-rendered HTML assertions (unit + integration) fully cover both ACs.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `listFeatures()` (or the underlying `setFetchPipelineState`) to return a fixture set of pipeline-state.json features spanning every stage, including terminal ones
- Mock the journey-store list already passed into `_renderJourneyHome` with a fixture that deliberately overlaps one slug with the pipeline-state.json fixture (to exercise the "journey-store wins" exclusion rule) and omits others (to exercise the merge)

**Sensitivity:** None — synthetic test data.

**Data Availability:** Ready.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Notes |
|---|---|---|---|---|---|---|---|
| AC1 | CLI-only non-terminal feature appears on /journey with correct badge/date/Continue | 4 | 2 | — | — | None | Covered by unit (merge function) and integration (full render) |
| AC2 | Terminal-stage features excluded, from both sources | 3 | 1 | — | — | None | Covered by unit (filter logic) and integration (mixed-source render) |

---

## Unit Tests

### mergeStateFeaturesIntoJourneyList includes a non-terminal pipeline-state.json feature with no journey record
- **Verifies:** AC1
- **Precondition:** Fixture pipeline-state.json feature at `stage: 'definition'`, journey-store list has no entry for its slug
- **Action:** Call the merge function
- **Expected result:** Returned list includes one synthesized entry for that feature

### mergeStateFeaturesIntoJourneyList excludes a feature already present in journey-store
- **Verifies:** AC1 (journey-store-wins rule)
- **Precondition:** Fixture pipeline-state.json feature and a journey-store entry sharing the same slug
- **Action:** Call the merge function
- **Expected result:** No duplicate/synthesized entry is added for that slug — the existing journey-store entry is left as the only representation

### mergeStateFeaturesIntoJourneyList excludes completed/archived/released features
- **Verifies:** AC2
- **Precondition:** Fixture pipeline-state.json features at each of `completed`, `archived`, `released`, plus one at `review` (control)
- **Action:** Call the merge function
- **Expected result:** Only the `review`-stage feature appears in the result; the 3 terminal-stage features are excluded

### mergeStateFeaturesIntoJourneyList maps updatedAt to the same date field journey-store entries use
- **Verifies:** AC1
- **Precondition:** Fixture pipeline-state.json feature with a known `updatedAt` value
- **Action:** Call the merge function
- **Expected result:** Synthesized entry's date field equals `updatedAt`, not any `createdAt`-shaped value

### listFeatures() failure does not throw out of the merge function
- **Verifies:** AC1, AC2 (NFR: graceful degradation)
- **Precondition:** Mock `listFeatures()`/`setFetchPipelineState` to throw
- **Action:** Call the merge function
- **Expected result:** Returns an empty array (or the journey-store list unmodified), does not throw

### Terminal-stage filter list matches pipeline-state.json's documented vocabulary
- **Verifies:** AC2
- **Precondition:** None
- **Action:** Inspect the terminal-stage constant used by the filter
- **Expected result:** Exactly `['completed', 'archived', 'released']` — no more, no fewer

### mergeStateFeaturesIntoJourneyList preserves journey-store entries unmodified
- **Verifies:** AC1, AC2 (regression safety)
- **Precondition:** Fixture journey-store list with 2 existing entries, no pipeline-state.json overlap
- **Action:** Call the merge function
- **Expected result:** Both original journey-store entries are present in the output, byte-identical to their input shape

---

## Integration Tests

### _renderJourneyHome renders a merged-in CLI-only feature with the same card markup as a journey-store card
- **Verifies:** AC1
- **Components involved:** `_renderJourneyHome`, merge function, `listFeatures()`
- **Precondition:** Fixture: 1 journey-store card, 1 pipeline-state.json-only feature at a non-terminal stage
- **Action:** Render `_renderJourneyHome`'s HTML output
- **Expected result:** HTML contains 2 cards total; the merged-in card has the `jh-stage-badge`, `jh-continue` class, and correct date — visually indistinguishable in markup shape from a journey-store card

### _renderJourneyHome excludes a terminal-stage pipeline-state.json feature that has no journey record
- **Verifies:** AC2
- **Components involved:** `_renderJourneyHome`, merge function
- **Precondition:** Fixture: 1 pipeline-state.json feature at `stage: 'released'`, no journey-store entry
- **Action:** Render `_renderJourneyHome`
- **Expected result:** HTML contains 0 cards for that feature

### Continue → resume still works for a merged-in feature (regression, existing mechanism)
- **Verifies:** Out-of-scope confirmation (this story does not change `handleGetJourneyResume`)
- **Components involved:** `handleGetJourneyResume`
- **Precondition:** A merged-in feature card exists, operator clicks Continue
- **Action:** `GET /journey/:slug/resume`
- **Expected result:** Behaves exactly as it already does for any feature with no active session — creates/resumes a session and redirects to chat. This test exists to prove this story introduced no regression here, not to test new behaviour.

---

## Out of Scope for This Test Plan

- `handleGetJourneyResume`'s own session-creation/redirect logic — reused unchanged, only regression-checked (see integration test 3 above)
- `/skills` (literal skill picker) — confirmed out of scope for this story
- ep1-s3's journey-backfill logic itself — tested in its own test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Original 2026-05-16 test plan was backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). That backfilled content targeted a since-superseded `/api/features` + skill-picker design and has been fully replaced by the revision above, written 2026-09-01 after investigation confirmed the codebase had moved on since original sign-off — see `stories/ep1-s1.md`'s Revision Note and `decisions.md`.*
