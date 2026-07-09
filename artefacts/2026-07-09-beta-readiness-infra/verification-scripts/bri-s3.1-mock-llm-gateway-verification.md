# AC Verification Script: Build the mock LLM gateway and fixture set

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.1-mock-llm-gateway-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the app with `NODE_ENV=test` set, so the mock gateway is reachable.
2. Confirm the fixture folder `tests/e2e/fixtures/llm-gateway/` exists and has files in it.
3. No browser needed for most scenarios below — these are backend checks. Scenario 4 and the Edge case involve running a real journey stage.

**Reset between scenarios:** No reset needed — each scenario reads fixtures or runs a single stage call independently.

---

## Scenarios

---

### Scenario 1: The mock gateway gives the same answer every time for the same question

**Covers:** AC1

**Steps:**
1. With the app running in test mode, ask the mock gateway for the `discovery` stage's "success" scenario response, for the currently configured model.
2. Ask it the exact same question again.

**Expected outcome:**
> Both answers are identical, word for word. Asking for a different scenario (for example, "failure" instead of "success") gives back a different, clearly distinct answer — it is not the same fixture reused by mistake.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every pipeline stage has both a working example and a failing example on file

**Covers:** AC2

**Steps:**
1. Open the folder `tests/e2e/fixtures/llm-gateway/`.
2. Count the fixture files, grouping them by stage: discovery, benefit-metric, definition, test-plan, definition-of-ready, branch-setup, branch-complete.

**Expected outcome:**
> All 7 stages are represented. Each stage has at least one fixture file showing a successful response and at least one fixture file showing a failure or edge-case response. The total count across all stages is 14 or more files.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Refreshing a fixture from a real response doesn't need manual editing

**Covers:** AC3

**Steps:**
1. Run the fixture regeneration script, pointing it at a real (or stand-in) dev/staging response for one fixture.
2. Open that fixture file afterward.

**Expected outcome:**
> The fixture file's content has been updated automatically to match the new response — no one needed to open the file and hand-edit the JSON. A log message says which fixture file changed and where the new content came from.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The two build/finish stages are covered too, not just the ones already known about

**Covers:** AC4

**Steps:**
1. Look in the fixture folder for `branch-setup` and `branch-complete` fixture files.
2. Run a `@mocked` journey through those two stages.

**Expected outcome:**
> Fixture files exist for both `branch-setup` and `branch-complete`, each with a success and a failure example. The journey completes both stages using the canned fixture answers — it does not pause waiting for a real AI response.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Mocked test runs never actually call the real AI service

**Covers:** AC5

**Steps:**
1. Run any `@mocked`-tagged journey spec while watching for outgoing network calls (for example, with network monitoring turned on, or a call-counter watching the real AI service's connection).
2. Check how many real calls were made once the spec finishes.

**Expected outcome:**
> Zero real network calls were made to the GitHub Copilot Chat Completions API. The spec still finishes successfully, using only fixture answers.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Trying to switch on the mock gateway outside test mode

**Covers:** NFR — Security

**Steps:**
1. Start the app without the test-mode flag set (i.e. not `NODE_ENV=test`).
2. Try to make a call that would normally go to the mock gateway.

**Expected outcome:**
> The mock gateway does not activate. The call either falls through to the real service or is refused outright — there is no way a configuration mistake could accidentally turn on mocked answers in a real environment.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Scenario 5 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
