# Test Plan: Concurrent Write Merge for Artefact Edits (ep2-s4)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep2-s4.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Domain:** web-ui, software-engineering
**Date:** 2026-09-16

---

## User Story
As a **Team collaborator (any role editing an artefact)**,
I want **my edits to merge automatically with a teammate's simultaneous edits to the same artefact**,
So that **we can both work on the same stage at once without overwriting each other**.

---

## Acceptance Criteria

**AC1:** Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story, When both save requests hit the server within 100ms of each other, Then the server detects this as a concurrent edit rather than processing them as two independent sequential saves.

**AC2:** Given a concurrent edit has been detected, When the three-way merge runs (base + Susan's version + Darren's version), Then the merged result contains both Susan's AC revision and Darren's architecture constraint change, and both Susan and Darren see the merged version immediately.

**AC3:** Given the merge has completed, When feature_edits is inspected, Then a record exists with operation: "merge" and lineAttributions correctly showing which lines came from Susan and which from Darren.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`
- Fixture artefact: Story S1 file with initial content (base version): 10-line story specification
- Two concurrent sessions: Susan (userId = 'user-susan', roleId = 'engineer'), Darren (userId = 'user-darren', roleId = 'engineer')
- Base version established and committed before concurrent edits
- No production data required; all test data is synthetic and disposable post-test
- Database: test instance or in-memory mock with feature_edits table

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration | Concurrent request detection within 100ms window | No |
| AC2 | Unit + integration + E2E | Three-way merge correctness; both clients see merged result | No |
| AC3 | Unit + integration | feature_edits record created with operation and lineAttributions | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Concurrent Request Detection

**Test name:** `merge.detection.concurrent-requests-detected-within-100ms-window`

**What it tests:** AC1 — server detects two save requests arriving within 100ms as concurrent, not sequential.

**Setup:**
- Mock session contexts for Susan and Darren with identical `featureId`
- Fixture story S1 with base content established
- Mock clock or timestamp control for precise 100ms window simulation

**Action:**
- Susan's save request queued at t=0ms (revised AC text)
- Darren's save request queued at t=50ms (revised architecture text)
- Both requests submitted to the server
- Check server's detection logic

**Expected result:**
- Server marks both requests as arriving within the 100ms concurrency window
- Both are queued for merge processing, not treated as sequential (second overwriting first)
- A concurrency flag is set on the save response or in the merge record

---

### AC2: Three-Way Merge Correctness

**Test name:** `merge.correctness.three-way-merge-produces-correct-result`

**What it tests:** AC2 — three-way merge combines edits from both users correctly, with both seeing the merged result.

**Setup:**
- Base version (committed):
  ```
  Line 1: AC1: Some requirement
  Line 2: AC2: Another requirement
  Line 3: (blank)
  Line 4: Architecture constraint: design pattern X
  Line 5: (blank)
  ```
- Susan's version (revises lines 1–2):
  ```
  Line 1: AC1: Some requirement [REVISED BY SUSAN]
  Line 2: AC2: Another requirement [REVISED BY SUSAN]
  Line 3: (blank)
  Line 4: Architecture constraint: design pattern X
  Line 5: (blank)
  ```
- Darren's version (revises lines 4–5):
  ```
  Line 1: AC1: Some requirement
  Line 2: AC2: Another requirement
  Line 3: (blank)
  Line 4: Architecture constraint: design pattern X [REVISED BY DARREN]
  Line 5: [NEW LINE FROM DARREN: Additional architecture note]
  ```

**Action:**
1. Call `mergeArtefactEdits(base, susan_version, darren_version)`
2. Capture the merged result
3. Verify both clients receive the result
4. Inspect the merged content

**Expected result:**
- Merged result contains both Susan's AC revisions (lines 1–2) AND Darren's architecture revision (line 4) and addition (line 5)
- No lines are lost; both contributors' edits are preserved
- Both Susan and Darren's sessions receive the merged content within 500ms of the merge completing
- No merge conflict error is thrown (three-way merge succeeds)

---

### AC3: feature_edits Record with Attribution

**Test name:** `merge.attribution.feature-edits-record-created-with-line-attribution`

**What it tests:** AC3 — feature_edits record created with operation: "merge" and lineAttributions mapping each line to its source user.

**Setup:**
- Same base, Susan, Darren versions as AC2 test
- Merge has just completed
- `feature_edits` table is empty

**Action:**
1. Call merge (as in AC2)
2. Query `feature_edits` for a record matching `featureId = 'feat-a1-uuid'` and `operation = 'merge'`
3. Inspect the `lineAttributions` field

**Expected result:**
- Exactly one record in `feature_edits` with:
  - `featureId = 'feat-a1-uuid'`
  - `operation = 'merge'`
  - `mergedWith` containing identifiers for Susan and Darren's versions
  - `lineAttributions` (JSON) showing:
    - Lines 1–2: `"user-susan"`
    - Lines 3–4: mixed or base (no change)
    - Line 5: `"user-darren"` (new line)
  - `timestamp` is recent (within last 5 seconds)
- Attribution is accurate to the exact lines each user modified

---

## Integration Tests

### Full Merge Flow: Concurrent Detection → Merge → Attribution

**Test name:** `merge.integration.full-concurrent-merge-flow-end-to-end`

**What it tests:** Complete merge flow — detect concurrency, perform merge, record attribution, return merged content to both clients, all in one coordinated sequence.

**Setup:**
- Feature A1, story S1 with base content established
- Two active sessions: Susan and Darren, both logged in and viewing S1
- No prior merge records for this feature/artefact

**Action:**
1. Susan submits save request at t=0ms (AC revisions)
2. Darren submits save request at t=75ms (architecture revisions)
3. Server detects concurrency
4. Three-way merge executes
5. `feature_edits` record created
6. Both clients notified of merged result
7. Each client's state is updated

**Expected result:**
- AC1 conditions met: concurrency detected within 100ms
- AC2 conditions met: merged result contains both edits, both clients see it
- AC3 conditions met: `feature_edits` record has operation: "merge" and lineAttributions
- No orphaned records (merge without attribution, or attribution without merge)
- Both clients' final state is identical (no divergence)

---

### Merge Success Rate and Edge Cases

**Test name:** `merge.integration.merge-success-rate-and-edge-cases`

**What it tests:** Merge algorithm stability and handling of edge cases (overlapping edits, additions at boundaries, etc.)

**Setup:**
- 10 different test cases with varying edit patterns:
  - Case 1: Non-overlapping edits (Susan in AC section, Darren in architecture section) — baseline success case
  - Case 2: Both users edit adjacent lines (lines 4–5) — boundary case
  - Case 3: Both users delete the same line — hard conflict case (expected: fail gracefully with error, not silent)
  - Case 4: Susan adds a line, Darren adds a line in different sections — dual addition
  - Case 5: Very large artefacts (1000+ lines) — scalability check

**Action:**
1. For each test case, run `mergeArtefactEdits(base, user_a_version, user_b_version)`
2. Record success/failure
3. If failure, record error type
4. Capture merge execution time

**Expected result:**
- Cases 1, 2, 4: Merge succeeds (output contains both edits)
- Case 3: Merge fails gracefully with a specific error code (e.g., `MERGE_CONFLICT_HARD`), not a crash
- Case 5: Merge completes within 1s and produces correct result
- Overall success rate: ≥99% (13 of 14 runs succeed; 1 hard conflict fails gracefully)
- No timeouts or unhandled exceptions

---

### Tenant Isolation on Merged Edits

**Test name:** `merge.integration.merged-edits-respect-tenant-isolation`

**What it tests:** ADR-025 — merged edits and attribution respect tenant boundaries.

**Setup:**
- Tenant A: Feature A1, story S1
- Tenant B: Feature A1 (same slug, different tenant), story S1
- Susan and Darren assigned to Tenant A only

**Action:**
1. Susan and Darren both submit concurrent edits to Tenant A's Feature A1, S1
2. Merge completes and `feature_edits` record created
3. Query `feature_edits` for Tenant A's records
4. Attempt to query Tenant B's records (should be empty)
5. Switch context to Tenant B; verify its Feature A1, S1 is unaffected

**Expected result:**
- Tenant A's merge succeeds; `feature_edits` record has `tenantId = 'tenant-a'`
- Tenant B's Feature A1, S1 has no merge records and is unchanged
- Query filtering by `tenantId` is enforced in all merge operations

---

## E2E Tests (Browser)

### AC1: Concurrent Request Detection in Browser

**Test name:** `merge.e2e.concurrent-requests-detected-in-browser-save`

**Setup:**
- Auth bypass fixture (NODE_ENV=test) with synthetic sessions for Susan and Darren
- Feature A1, story S1 loaded and ready for editing in two separate browser windows/tabs
- Base content is the same in both

**Action:**
- Susan opens the S1 editor in Tab 1
- Darren opens the S1 editor in Tab 2 (simultaneous session)
- Susan begins typing a revision to AC1 (line 1)
- Darren simultaneously begins typing a revision to Architecture (line 4)
- Susan clicks "Save" at t=0ms
- Darren clicks "Save" at t=80ms (within 100ms window)
- Both save requests fire

**Expected result:**
- Both saves complete without error
- Neither user sees a conflict/overwrite error message
- The server internal state shows concurrency was detected (verified via feature_edits record)

---

### AC2: Merged Result Visible to Both Clients

**Test name:** `merge.e2e.merged-result-visible-to-both-clients-in-browser`

**Setup:**
- Same setup as AC1 E2E
- Both browsers are still open and connected to their sessions

**Action:**
1. After both saves complete, each browser client waits for the merge to finish (up to 2s)
2. The editor content on both tabs should update
3. Inspect the rendered content in both tabs
4. Compare them for equality

**Expected result:**
- Both tabs show identical merged content (both Susan's AC revision and Darren's architecture revision are present)
- No "refresh to see latest" prompt appears (result is pushed to client, not required to poll)
- Merge latency as seen from browser: within 1s of the second save completing

---

### AC3: feature_edits Record Visible After Merge

**Test name:** `merge.e2e.feature-edits-record-queryable-after-merge`

**Setup:**
- Merge has just completed (from AC2 E2E)
- Test has access to query the database or an admin endpoint that exposes `feature_edits`

**Action:**
1. Query `feature_edits` for `featureId = 'feat-a1-uuid'`, `storyId = 's1'`, `operation = 'merge'`
2. Inspect the returned record
3. Verify `lineAttributions` is present and parseable JSON

**Expected result:**
- Record is found immediately (no delay or polling needed)
- `lineAttributions` JSON contains mappings for at least lines 1, 4, 5 to the correct user IDs (Susan, Darren)
- Record timestamps are consistent with the save times

---

## NFR Tests

### NFR-Perf-1: Merge Completes Within 1 Second

**Test name:** `merge.nfr.merge-latency-under-1s`

**Setup:** Three-way merge ready to run with base, Susan, Darren versions (1000-line artefacts)

**Action:** Call `mergeArtefactEdits()` and measure elapsed time from call to result return

**Expected result:** Merge completes in ≤1s

---

### NFR-Perf-2: Line-Level Attribution Accuracy

**Test name:** `merge.nfr.line-attribution-accuracy-within-1-char`

**Setup:** Merge with known line edit boundaries

**Action:** Inspect `lineAttributions` and verify each entry

**Expected result:** Attribution is accurate to within 1 character of the intended change boundary (no off-by-one line misattributions)

---

### NFR-Perf-3: Merge Success Rate

**Test name:** `merge.nfr.merge-success-rate-99-percent`

**Setup:** 100 randomly-generated concurrent edit scenarios

**Action:** Run merge on each scenario and track success count

**Expected result:** ≥99 succeed; ≤1 hard conflict (fails gracefully, not with exception)

---

## Test Summary

- **Unit tests:** 3 (AC1 concurrency detection, AC2 merge correctness, AC3 attribution record)
- **Integration tests:** 3 (full merge flow, success rate + edge cases, tenant isolation)
- **E2E tests:** 3 (concurrent detection in browser, merged result visible to both, feature_edits queryable)
- **NFR tests:** 3 (latency ≤1s, attribution accuracy, ≥99% success rate)
- **Total:** 12 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Concurrent Write Merge for Artefact Edits (ep2-s4)

**Setup:** You are Susan (engineer) and Darren (engineer), both assigned to Feature A1. The feature is at the discovery stage. You both have write access to the story artefacts.

---

### Scenario AC1: Concurrent Save Requests Are Detected

**Expected outcome:** When Susan and Darren submit save requests within 100ms of each other, the server recognizes this as a concurrent edit event.

1. Open Feature A1 in your browser.
2. **Verify:** The story S1 artefact is loaded and ready for editing.
3. (Coordination step) Agree with your partner on a test window: Susan will start typing at t=0, Darren will start typing at t=50ms.
4. Susan: Begin editing line 1 of S1 (AC section) — type a revision to AC1 text.
5. Darren: Begin editing line 4 of S1 (Architecture section) — type a revision to the architecture constraint.
6. At t=0ms (as agreed), Susan clicks "Save".
7. At t=80ms, Darren clicks "Save" (within the 100ms concurrency window).
8. **Verify:** Both saves complete without an error message saying "your changes were overwritten" or "conflict detected". Both clients received an acknowledgement.
9. (Operator-only verification) Query the server logs or `feature_edits` table: confirm a merge event was recorded (operation: "merge"), not two sequential saves.

---

### Scenario AC2: Merged Result Is Visible to Both Clients

**Expected outcome:** After the concurrent saves, both Susan and Darren see the merged version of S1, containing both their edits.

1. From Scenario AC1, the saves have just completed.
2. **Verify:** Susan's browser shows the merged content. Both the AC revision (Susan's edit, line 1) and the architecture revision (Darren's edit, line 4) are present on screen.
3. **Verify:** Darren's browser shows the same merged content without requiring a page refresh. Darren can read Susan's AC revision in his current view.
4. (Timing check) The merged content appeared within 1 second of Darren's save click — no noticeable delay or polling loop visible to the user.

---

### Scenario AC3: feature_edits Record with Attribution

**Expected outcome:** The merge is recorded in `feature_edits` with accurate line-by-line attribution to each contributor.

1. From Scenario AC2, the merge is complete and both clients show the merged result.
2. (Operator-only verification) Query `feature_edits` for the record matching Feature A1, story S1, with `operation = 'merge'`.
3. **Verify:** The record exists and contains:
   - `featureId = 'feat-a1-uuid'` (or equivalent ID for Feature A1)
   - `operation = 'merge'`
   - `lineAttributions` field with JSON content
4. **Verify:** The JSON shows at least:
   - Lines 1–2: attributed to Susan (user ID visible)
   - Lines 4–5: attributed to Darren (user ID visible)
5. **Verify:** No placeholder or missing values in the attribution — every modified line has a user ID recorded.

---