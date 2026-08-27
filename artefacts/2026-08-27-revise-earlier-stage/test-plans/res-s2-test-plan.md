## Test Plan: Overwrite a reopened stage's artefact in place on revision

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Epic reference:** artefacts/2026-08-27-revise-earlier-stage/epics/reopen-and-revise-earlier-stage.md
**Test plan author:** Copilot
**Date:** 2026-08-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A revision turn overwrites the artefact file in place, no new/dated copy | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Downstream readers (later stage, /trace) see the new content, not stale content | — | 2 tests | — | — | — | 🟢 |
| AC3 | A reopen with no revision leaves the artefact byte-identical | 1 test | — | — | — | — | 🟢 |
| AC4 | A write failure surfaces an explicit error, no partial/corrupt artefact | 2 tests | — | — | — | — | 🟢 |
| AC5 | Pre-revision content is captured in memory before the write and handed forward to res-s3 | 1 test | 1 test | — | — | — | 🟢 |

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
| AC1 | An on-disk artefact fixture at a known path; a mock model response containing revised markdown content | Synthetic | None | Path must resolve within the test's own tmp/fixture directory, never the real `artefacts/` tree |
| AC2 | Same fixture, plus a second reader (simulated later-stage session, or a direct `fs.readFileSync` standing in for `/trace`) | Synthetic | None | |
| AC3 | Same fixture; a reopened session that only asks a question (no revision) | Synthetic | None | Byte-for-byte comparison before/after |
| AC4 | A write path that is deliberately made to fail (e.g. read-only fixture directory, or a stubbed `fs.writeFileSync` that throws) | Synthetic | None | |
| AC5 | Same fixture as AC1, with a spy on the function/parameter that receives the pre-revision content | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### overwritesArtefactFileInPlaceOnRevision

- **Verifies:** AC1
- **Precondition:** Fixture artefact file exists at a known path with known content A.
- **Action:** Simulate a revision turn producing new content B for that stage.
- **Expected result:** The file at the same path now contains content B; no second file exists in the directory (directory listing count unchanged).
- **Edge case:** No.

### pathTraversalGuardRejectsOutOfRepoWritePath

- **Verifies:** AC1 (NFR-adjacent, path traversal guard)
- **Precondition:** A crafted artefact path containing `../` segments intended to resolve outside the repo root.
- **Action:** Attempt the overwrite with that path.
- **Expected result:** The write is rejected before touching disk; the resolved path is asserted to fail `startsWith(repoRoot)`.
- **Edge case:** Yes — security boundary case.

### noArtefactChangeWhenReopenedSessionSendsNoRevision

- **Verifies:** AC3
- **Precondition:** Fixture artefact file with known content and a known mtime/hash.
- **Action:** Reopen the stage's session and send a turn that only asks a question (model response contains no artefact-signal marker).
- **Expected result:** File content and hash are byte-identical to before; no write call was made at all (not just "wrote the same content").
- **Edge case:** No.

### writeFailureSurfacesExplicitErrorNoPartialFile

- **Verifies:** AC4
- **Precondition:** `fs.writeFileSync` (or the equivalent write call) stubbed to throw mid-write.
- **Action:** Simulate a revision turn.
- **Expected result:** The chat session receives an explicit error turn/message (not a silent success); the original file content is untouched (no partial/truncated write left on disk).
- **Edge case:** Yes — failure-path test.

### writeFailureDoesNotAdvanceCompletedStagesEntry

- **Verifies:** AC4
- **Precondition:** Same as above.
- **Action:** Simulate the failing write.
- **Expected result:** `journey.completedStages`' entry for this stage (`completedAt`, `artefactPath`) is unchanged — a failed write does not get recorded as if it succeeded.
- **Edge case:** Yes.

### preRevisionContentCapturedBeforeWriteExecutes

- **Verifies:** AC5
- **Precondition:** Fixture artefact file with known content A; a spy/capture point on the function res-s3 will consume.
- **Action:** Simulate a revision turn producing content B.
- **Expected result:** The captured "pre-revision content" value passed forward equals content A (the value read before the write), not content B and not a re-read of the (now-overwritten) disk file.
- **Edge case:** No.

---

## Integration Tests

### downstreamReadOfArtefactPathReturnsNewContentAfterOverwrite

- **Verifies:** AC2
- **Components involved:** Overwrite handler → disk → a later-stage session's `priorArtefacts` injection (or `/trace`'s disk read)
- **Precondition:** Fixture artefact overwritten via AC1's flow.
- **Action:** Trigger a downstream read of the same artefact path (simulate opening a later stage, or run the equivalent of `/trace`'s artefact hash step).
- **Expected result:** The downstream reader receives content B (post-revision), proving the write-then-read sequencing holds — matches ADR-023's disk canonicity companion rule.

### noStaleReadEvenWhenDownstreamReadIsImmediate

- **Verifies:** AC2 (race-condition variant)
- **Components involved:** Same as above, triggered with zero delay after the write.
- **Precondition:** Same fixture.
- **Action:** Immediately (same tick/next tick) trigger the downstream read after the write call resolves.
- **Expected result:** Still returns content B — proves the write is awaited/synchronous from the caller's perspective before any handoff proceeds, not fire-and-forget.

### preRevisionContentReachesRes-s3MaterialityCheckInput

- **Verifies:** AC5
- **Components involved:** Overwrite handler → in-memory handoff → the entry point res-s3's materiality check will read from (see res-s3 test plan for the consumer-side assertion)
- **Precondition:** Fixture artefact, revision turn producing new content.
- **Action:** Run the full overwrite flow.
- **Expected result:** The handoff value available to the next step in the same turn-handling flow equals the pre-revision content — this test asserts the *producer* side of the contract res-s3's own tests assert the *consumer* side of.

---

## NFR Tests

### pathTraversalGuardBlocksResolvedPathOutsideRepoRoot

- **NFR addressed:** Security
- **Measurement method:** Assert `path.resolve(inputPath).startsWith(repoRoot + path.sep)` is checked before every write in this story's code path, and that a crafted `../`-containing path is rejected with HTTP 400 (or equivalent) and no disk write.
- **Pass threshold:** 100% of traversal-attempt fixtures rejected; zero files written outside repo root.
- **Tool:** Node test runner (`scripts/run-all-tests.js`).

---

## Out of Scope for This Test Plan

- Deciding whether a revision is material to downstream stages — that's res-s3's own test plan
- Any versioning/diffing test — explicitly out of scope for this story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
