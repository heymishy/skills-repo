# AC Verification Script: Build the branch + PR creation adapter for guardrail/standard edits

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s6-branch-pr-creation-adapter.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s6-branch-pr-creation-adapter-test-plan.md
**Script version:** 1
**Verified by:** Hamish King — Platform owner | **Date:** 2026-08-14 | **Context:** [ ] Pre-code  [x] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a real, disposable sandbox GitHub repo you can safely write test branches/PRs to (this scenario writes real data — do not use a production repo).

**Reset between scenarios:** Delete any test branches/PRs created in the sandbox repo between runs.

---

## Scenarios

---

### 🔴 Scenario 1: Submitting a new guardrail creates a real branch and PR, never touches the main branch directly

**Covers:** AC1

**Steps:**
1. Submit a new guardrail/standard through the create form, targeting your sandbox repo.
2. Open the sandbox repo on GitHub.

**Expected outcome:**
> A new branch exists with your submitted content committed to it. A pull request is open from that branch. The main/default branch itself was NOT changed — check its own commit history has nothing new.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified 2026-08-14 via the reference script (`reference/wugs-s6-manual-verification.js`) against a real sandbox repo (`heymishy/skills-repo-sandbox`) with a freshly-generated PAT. Real evidence: https://github.com/heymishy/skills-repo-sandbox/pull/1 (independently confirmed OPEN via `gh pr view`). This scenario is the one the reference script's own procedure exercises (branch-ref read, branch create, Contents PUT, PR create) — Scenarios 2 and 3 below were not exercised by this run and remain unverified.

---

### 🔴 Scenario 2: Editing an existing guardrail correctly updates it via a new PR, and a stale edit is rejected clearly

**Covers:** AC2

**Steps:**
1. Edit an existing guardrail/standard entry and submit.
2. Open the resulting PR and confirm the diff shows exactly your change.
3. Try editing the same entry again in a second browser tab without refreshing, submit both — see what happens to the second one.

**Expected outcome:**
> The first edit produces a correct PR with just your change in the diff. The second, stale edit either fails with a clear "this was already changed" message, or the platform handles it gracefully — it does not silently overwrite or corrupt content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A failed step gives you a clear, specific error

**Covers:** AC4

**Steps:**
1. Attempt to submit a guardrail edit against a repo the platform doesn't actually have write access to (e.g. revoke access first, or use an invalid repo name).

**Expected outcome:**
> You see a specific error message telling you what went wrong (e.g. "couldn't create branch" or "couldn't open PR") — not a generic "something went wrong" message, and not a silent failure with no PR and no error at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Verified 2026-08-14 — see notes above |
| Scenario 2 | Not run | Edit/stale-edit path not exercised |
| Scenario 3 | Not run | Failure/error-path not exercised |

**Overall verdict:** [ ] All pass — ready to proceed
[x] Partial — Scenario 1 (the specific gap the wugs-s6 RISK-ACCEPT entry flagged: real API shapes vs. mocks) is verified and closed. Scenarios 2 and 3 remain open findings, not currently blocking anything, but not yet independently verified against a real sandbox repo.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
