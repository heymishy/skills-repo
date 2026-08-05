## Test Plan: Connect a repo by picking from your own accessible repos

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Epic reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/epics/mtrr-e1-multi-tenant-repo-resolution-and-ux.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Picker lists operator's accessible repos as primary path | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Selection populates the same repo-association columns as the URL flow | 1 test | — | — | — | — | 🟢 |
| AC3 | Rate-limit/scope failure falls back to URL entry | 1 test | — | — | — | — | 🟢 |
| AC4 | Search/filter narrows a large repo list | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Per review's LOW finding (1-L2), AC1/AC4 were checked against this repo's CSS-layout-dependence trigger list (drag-drop, pointer coordinates, `getBoundingClientRect`, visual rendering) — neither applies; both are DOM-state concerns (list contents, filtered results) testable in a jsdom-style environment. No E2E/manual classification needed.

---

## Test Data Strategy

**Source:** Mocked external services
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mocked GitHub "list accessible repos" API response with several repos | Mocked, following this repo's existing `setFetcher`-style injectable mock pattern | None | |
| AC2 | Fixture repo selection; assert resulting DB row shape matches the existing URL-entry flow's shape | Synthetic | None | |
| AC3 | Mocked rate-limit/403-scope error from the GitHub API | Mocked | None | |
| AC4 | Fixture list of 20+ repos with varying names | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### pickerListsAccessibleRepos_asPrimaryPath

- **Verifies:** AC1
- **Precondition:** Mocked GitHub API returns a fixture list of repos for the operator's credential
- **Action:** Render the repo-connection flow
- **Expected result:** The rendered output shows the fixture repo list as the primary interaction, not a bare URL input as the first/only option
- **Edge case:** No

### selectingRepoPopulatesSameColumnsAsUrlFlow

- **Verifies:** AC2
- **Precondition:** Operator selects a fixture repo from the list
- **Action:** Submit the selection
- **Expected result:** The resulting product row's repo-association columns (owner, repo name) match exactly what the existing URL-entry flow would have written for the same repo
- **Edge case:** No

### rateLimitOrScopeFailure_fallsBackToUrlEntry

- **Verifies:** AC3
- **Precondition:** Mocked GitHub API returns a rate-limit or insufficient-scope error
- **Action:** Render the repo-connection flow
- **Expected result:** The URL-entry field is shown instead of the picker, with a message explaining why the picker isn't available
- **Edge case:** Yes — failure-path test

### searchFilterNarrowsLargeRepoList

- **Verifies:** AC4
- **Precondition:** Fixture list of 20+ repos
- **Action:** Type a partial repo name into the search/filter input
- **Expected result:** The visible list narrows to only repos matching the typed text
- **Edge case:** No

---

## Integration Tests

### repoConnectionEndToEnd_pickAndPersist

- **Verifies:** AC1, AC2
- **Components involved:** Repo-connection UI, mocked GitHub API, products table
- **Precondition:** Mocked repo list; a real (test) product row to connect
- **Action:** Load the flow, select a repo, submit
- **Expected result:** The product row is updated with the correct owner/repo, matching what a direct URL-entry submission would produce for the same repo

---

## NFR Tests

### repoListLoadUnder2SecondsCached

- **NFR addressed:** Performance
- **Measurement method:** Time from flow load to list render; confirm a second render within the same session doesn't re-call the mocked API (cache-hit assertion)
- **Pass threshold:** < 2 seconds; zero additional API calls on re-render within session
- **Tool:** `console.time`/`console.timeEnd` wrapper + mock call-count assertion

---

## Out of Scope for This Test Plan

- Testing `mtrr-s1`'s export resolution logic — separate test plan.
- Testing the real (non-mocked) GitHub API's actual rate-limit behavior — mocked only, per Test Data Strategy.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
