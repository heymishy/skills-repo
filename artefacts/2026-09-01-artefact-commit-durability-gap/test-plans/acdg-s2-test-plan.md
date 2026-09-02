## Test Plan: Add a Distinguishable Durability Signal for Stage-Completion Commits

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s2.md
**Epic reference:** artefacts/2026-09-01-artefact-commit-durability-gap/epics/stage-completion-artefact-durability.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Commit succeeds → `artefact_commit_succeeded` event logged with base fields | 1 | — | — | — | — | 🟢 |
| AC2 | Commit fails → `artefact_commit_failed` event logged with base fields + reason | 2 | — | — | — | — | 🟢 |
| AC3 | Genuinely no repo → `artefact_commit_skipped` event logged with base fields + reason | 1 | — | — | — | — | 🟢 |
| AC4 | All 3 events parse as valid JSON immediately after the `[cross-channel] ` prefix | 1 | — | — | — | — | 🟢 |

<!-- Revised 2026-09-02: AC2 has 2 unit tests, not 1 -- the real journey.js
     code has TWO distinct exit points that both produce a commit "failure"
     (the original commitArtefact-throw path, and acdg-s1's own new
     resolution-failure-with-productId-set path). Both are covered
     separately since they're different code branches, even though they
     map to the same event type. -->

---

## Coverage gaps

None — all 4 ACs directly mirror `ep1-s6`'s own already-proven test pattern (`tests/check-ep1-s6-instrumentation.js`) for the same shared `_logCrossChannelEvent` helper, applied to 3 new event types.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — mirrors `ep1-s6`'s own fixture approach (console.log capture, monkey-patched `posthog-server.capture`)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A stage-completion call site with `ownerRepoForFeature`/`commitArtefact` both succeeding | Synthetic, in-test | None | |
| AC2 | Same call site, with the failure mode confirmed and fixed by `acdg-s1` | Synthetic, in-test | None | Depends on `acdg-s1`'s DoD — see story Dependencies |
| AC3 | Same call site, with `ownerRepoForFeature` resolving `null` (genuine no-repo) | Synthetic, in-test | None | |
| AC4 | Any of the 3 captured log lines above | Synthetic, in-test | None | Reuses AC1–AC3's own fixtures — no new data needed |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### artefact_commit_succeeded is logged with base fields on a successful commit
- **Verifies:** AC1
- **Precondition:** Stage-completion call site with both adapters succeeding
- **Action:** Trigger stage completion; capture `console.log` output
- **Expected result:** A `[cross-channel]` log line with `eventType: "artefact_commit_succeeded"`, `featureSlug`, `stage`, `timestamp` present
- **Edge case:** No

### artefact_commit_failed is logged with base fields plus a reason on a commit failure
- **Verifies:** AC2
- **Precondition:** Stage-completion call site with the confirmed failure mode from `acdg-s1` reproduced
- **Action:** Trigger stage completion; capture `console.log` output
- **Expected result:** A `[cross-channel]` log line with `eventType: "artefact_commit_failed"`, `featureSlug`, `stage`, `timestamp`, and a `reason` field describing the failure
- **Edge case:** No

### artefact_commit_skipped is logged with base fields plus reason on a genuine no-repo skip
- **Verifies:** AC3
- **Precondition:** Stage-completion call site with `ownerRepoForFeature` resolving `null`
- **Action:** Trigger stage completion; capture `console.log` output
- **Expected result:** A `[cross-channel]` log line with `eventType: "artefact_commit_skipped"`, `featureSlug`, `stage`, `timestamp`, and `reason: "no connected repo"`
- **Edge case:** No

### All 3 event log lines parse as valid JSON after the [cross-channel] prefix
- **Verifies:** AC4
- **Precondition:** Reuses the 3 captured log lines from the tests above
- **Action:** Strip the `[cross-channel] ` prefix from each line and attempt `JSON.parse`
- **Expected result:** All 3 parse successfully with no thrown exception
- **Edge case:** No

---

## Integration Tests

### A full gate-confirm request emits exactly one durability event per stage completion
- **Verifies:** AC1, AC2, AC3 (whichever path is exercised)
- **Components involved:** `handlePostGateConfirm`, `_logCrossChannelEvent`, `export-data-source.js`, `artefact-commit-writer.js`
- **Precondition:** A real (in-memory) journey with an active session
- **Action:** Send a full stage-completion request under each of the 3 outcome conditions in turn
- **Expected result:** Exactly one durability event fires per request — never zero, never more than one

---

## NFR Tests

### PostHog call failure does not block or throw during stage completion
- **NFR addressed:** Performance / fire-and-forget
- **Measurement method:** Monkey-patch `posthog-server.capture` to throw; trigger stage completion; assert no exception propagates and the stage-completion response still succeeds
- **Pass threshold:** No exception; response unaffected
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

### Log lines contain no credentials or full artefact content
- **NFR addressed:** Security
- **Measurement method:** Assert the captured log line's JSON keys are limited to the documented set (`eventType`, `featureSlug`, `stage`, `timestamp`, `reason`, `operatorId` when present) — no `accessToken`, no artefact body content
- **Pass threshold:** No unexpected keys present
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Testing `acdg-s1`'s own guard-fix behaviour — covered by that story's own test plan; this plan assumes `acdg-s1` is DoD-complete and its confirmed failure mode is known.
- Live production PostHog dashboard verification — deferred to DoD's own manual smoke-test step (grep production logs for the new event types).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2's exact `reason` string content isn't fixed until `acdg-s1` ships | This story's Dependencies field already declares this upstream requirement | Implement `acdg-s2` after `acdg-s1` is DoD-complete, as sequenced by the epic's risk-first slicing strategy |
