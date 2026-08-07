## Test Plan: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Epic reference:** artefacts/2026-08-06-durable-artefact-storage/epics/das-e1-durable-artefact-storage.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dual-write: git commit + local disk both happen for a repo-connected product | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Git commit failure → stage NOT marked complete, clear error surfaced | 1 test | — | — | — | — | 🟢 |
| AC3 | Local file missing, git fetch succeeds → git-fallback renders content | 1 test | — | — | — | — | 🟢 |
| AC4 | No connected repo → local-disk-only write, no regression | 1 test | — | — | — | — | 🟢 |
| AC5 | Both local and git fetch fail → honest "not retrieved" message, no blank panel | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are server-side logic/text assertions, testable without a browser — no CSS-layout dependence (matches the H-E2E classification already confirmed at DoR: server-side logic, not visual rendering).

---

## Test Data Strategy

**Source:** Mocked Postgres pool (products/journeys tables) + mocked GitHub Contents API (via the new D37 `setArtefactCommitAdapter`) + a real temp directory standing in for local disk (matching this repo's existing `check-*` convention for filesystem-touching tests)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture product with `repo_owner`/`repo_name` set; fixture stage-completion payload | Synthetic (mocked pool + mocked adapter) | None | |
| AC2 | Mocked adapter configured to reject (simulating GitHub API error) | Synthetic | None | |
| AC3 | Fixture journey with a git-commit record but no local file present (temp dir with the file deleted) | Synthetic | None | |
| AC4 | Fixture product with `repo_owner`/`repo_name` both null | Synthetic | None | |
| AC5 | Local file absent AND mocked git fetch adapter rejecting | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### completedStage_withConnectedRepo_commitsToGitAndDisk

- **Verifies:** AC1
- **Precondition:** Fixture product with `repo_owner: 'acme', repo_name: 'widgets'`; mocked artefact-commit adapter
- **Action:** Complete a stage for this product's journey
- **Expected result:** The mocked commit adapter is called once with the artefact content and the path convention `artefacts/<slug>/<stage>.md`; the local disk file is also written at the same path (dual-write, not a replacement)
- **Edge case:** No

### artefactCommitAdapter_twoProductsResolveToTwoDifferentRepos

- **Verifies:** AC1 (D37 wiring test, mandated by Architecture Constraints — behavioural correctness, not just wiring)
- **Precondition:** Two fixture products, A (`owner-a/repo-a`) and B (`owner-b/repo-b`), each with a completed stage
- **Action:** Trigger stage completion for both products
- **Expected result:** The commit adapter is called with product A's owner/repo for product A's stage, and product B's owner/repo for product B's stage — two different inputs producing two different, individually-correct outputs, not merely proof the setter was called
- **Edge case:** No

### gitCommitFailure_stageNotMarkedComplete

- **Verifies:** AC2
- **Precondition:** Fixture product with a connected repo; mocked commit adapter configured to reject
- **Action:** Attempt to complete a stage
- **Expected result:** The journey store's stage is NOT marked complete; the operator-facing response is a clear, actionable error — never a silent "completed" state with no durable backing
- **Edge case:** Yes — failure-path test

### missingLocalFile_gitFallbackRendersContent

- **Verifies:** AC3
- **Precondition:** Fixture journey whose stage has a recorded git commit but whose local file has been deleted (simulating post-redeploy)
- **Action:** Request the "Resume conversation" / stage-view route for that stage
- **Expected result:** The rendered page shows the artefact content fetched from git, not "No artefact content found"
- **Edge case:** Yes — the core bug this story fixes

### noConnectedRepo_localDiskWriteOnlyUnchanged

- **Verifies:** AC4 (regression guard)
- **Precondition:** Fixture product with `repo_owner: null, repo_name: null`
- **Action:** Complete a stage for this product's journey
- **Expected result:** The local disk file is written exactly as before this story; the commit adapter is never called; no error is surfaced to the operator
- **Edge case:** Yes — regression guard for existing repo-less products

### bothLocalAndGitMissing_honestErrorMessage

- **Verifies:** AC5
- **Precondition:** Local file deleted; mocked git-fetch adapter configured to reject
- **Action:** Request the stage-view route
- **Expected result:** The rendered page displays an error message stating the artefact could not be retrieved — no blank or broken-looking panel
- **Edge case:** Yes — double-failure edge case

---

## Integration Tests

### stageCompletionEndToEnd_dualWriteThenResumeConversation

- **Verifies:** AC1, AC3
- **Components involved:** Stage-completion handler, the new artefact-commit D37 adapter, local disk write, `handleGetJourneyStageView`'s git-fallback read path
- **Precondition:** Fixture product with a connected repo
- **Action:** Complete a stage, then delete the local file (simulating a redeploy), then request the stage-view route
- **Expected result:** The stage-view route renders the artefact content correctly, proving the git commit made during completion is genuinely readable back via the fallback path — not just that the commit adapter was called

---

## NFR Tests

### gitCommitLatency_underTwoSeconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing around the stage-completion handler with the mocked commit adapter simulating realistic latency (~200-500ms, matching a real GitHub API round-trip)
- **Pass threshold:** Added latency from the git commit step is under ~2 seconds
- **Tool:** `Date.now()` timing wrapper around the handler call

### commitAuthor_neverServiceAccount

- **NFR addressed:** Security
- **Measurement method:** Assert the commit adapter is called with the operator's own session-derived identity/token, never a hardcoded or service-account credential
- **Pass threshold:** Commit author always traces to `req.session.accessToken`-derived identity
- **Tool:** Mocked adapter call-argument assertion

---

## Out of Scope for This Test Plan

- Testing the existing inline-edit-then-resave flow's behavior — unchanged by this story, remains local-disk-only per the story's own Out of Scope.
- Testing `mtrr-s1`'s `ownerRepoForFeature` correctness — already tested, this story only consumes it.
- Real (non-mocked) GitHub API behavior — mocked only, per Test Data Strategy.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
