# Phase 3 Backlog — Trace-commit Workflow Observability

**Status:** Backlog (discovered 2026-04-13 post-Phase-2)  
**Origin:** Root cause analysis of PR #51–#57 trace-commit.yml silent failures  
**Learnings reference:** workspace/learnings.md — "Workflow health visibility gap"  
**Component:** `.github/workflows/trace-commit.yml`, `npm test` chain, `/trace` skill, `/verify-completion` skill

---

## Context

Phase 2 delivery completed with a critical gap: post-merge workflow failures do not surface to operators or block delivery. The trace-commit.yml workflow (responsible for persisting assurance gate traces to the traces branch) experienced four failed runs (PR #51, #52, #56) due to a git fetch ordering bug. The failures were silent — no alert, no visible CI failure signal, no test gate blocking the PR. Root cause discovered only by manual verification attempt.

The primary bug (checking remote refs before fetching) was fixed in PR #55. However, the **observability gap** remains: no mechanism exists to automatically detect, alert, or prevent recurrence of post-merge workflow failures.

---

## Problem Statement

After a PR is merged to master, the trace-commit.yml workflow runs to persist the assurance gate trace to the traces branch. If this workflow fails (for any reason):

- ❌ The operator has no way to know without manually checking GitHub Actions tab
- ❌ No governance check prevents the PR from being considered "complete"
- ❌ The `/verify-completion` skill does not warn about post-merge health
- ❌ The `/trace` skill does not validate traces branch state
- ❌ No `npm test` gate asserts workflow health post-merge

This creates a class of "silent delivery failures" — the PR is closed, the code is on master, but the trace record was never created. The absence of the trace goes unnoticed.

---

## Scope — Four Acceptance Criteria

### AC1 — Governance test: check-trace-commit.js

**Requirement:** Add `tests/check-trace-commit.js` to the `npm test` suite.

**Acceptance:**
- [ ] Script asserts that `origin/traces` branch exists on remote
- [ ] Script lists the 5 most recent commits on `origin/traces` and passes if at least one commit is from trace-commit.yml (identified by commit message pattern `chore: assurance trace`)
- [ ] Script reports the age of the most recent trace commit (e.g. "latest trace: 2 hours ago")
- [ ] Script runs successfully after any PR merge that includes a successful post-merge trace-commit workflow
- [ ] Script is invoked in `npm test` chain (included in the default test run)
- [ ] Script exits 0 (pass) if traces branch is healthy; exits 1 (fail) if branch missing or stale (no commits in last 24 hours)

**Example output:**
```
[traces-health] origin/traces branch exists ✓
[traces-health] Recent commits:
  - 2026-04-13T00:25:21Z chore: assurance trace [post-merge] 67a6c25a7e54
  - 2026-04-13T00:15:40Z chore: assurance trace [post-merge] a29ffd57ce05
  - 2026-04-12T23:01:54Z test: verify traces branch accepts direct push
[traces-health] Latest trace is 15 minutes old ✓
```

### AC2 — Post-merge health check integration into verification

**Requirement:** Provide an operator-facing mechanism to verify that a post-merge workflow succeeded.

**Option A (Skill update):**
- [ ] Update `/verify-completion` SKILL.md with new section: "Post-merge workflow verification"
- [ ] Section provides command to manually check: `git fetch origin traces; git log origin/traces -1 --oneline`
- [ ] Section documents expected output pattern: commit message starting with "chore: assurance trace [post-merge]"
- [ ] Section warns: "If the most recent trace is older than the PR merge timestamp, trace-commit.yml may have failed"

**Option B (New workflow):**
- [ ] Create `.github/workflows/post-merge-health-check.yml` (fires on `push` to master after merge)
- [ ] Workflow queries recent trace commits and fails if latest trace is >30 minutes old
- [ ] Workflow provides no-op success if traces branch is current, fail if stale
- [ ] Does NOT block merge (post-merge check only); used for observability dashboards

**Acceptance (either option):**
- [ ] Operator has a documented way to verify trace-commit succeeded post-merge
- [ ] Operator receives explicit guidance on what to check and what success looks like
- [ ] Guidance is findable from `/verify-completion` skill context

### AC3 — /trace skill enhancement: validate traces branch health

**Requirement:** Update `/trace` skill to include traces branch health in its traceability validation output.

**Acceptance:**
- [ ] `/trace` command now outputs a "Traces Branch Health" section
- [ ] Section reports: branch exists, most recent commit, commit age, success/failure pattern
- [ ] Section runs `git fetch origin traces` before checking (ensures current state)
- [ ] Section detects and reports if recent trace-commit.yml runs failed (via workflow name pattern in git log)
- [ ] Section recommendation: "If traces branch has no commits in last 12 hours and merges have occurred, check if trace-commit.yml workflows are failing in Actions tab"
- [ ] Trace report includes this section when run on master branch; sections is marked "N/A — not on master" on feature branches

**Example output section:**
```
## Traces Branch Health

origin/traces branch exists ✓
Most recent commit: 2026-04-13T00:25:21Z chore: assurance trace [post-merge] 67a6c25a7
Commit age: 15 minutes
Recent pattern: 6 traces in last 24 hours (expected)
Status: ✓ Healthy

Recommendation: None — traces branch is current.
```

### AC4 — Defensive documentation: /verify-completion skill update

**Requirement:** Update `/verify-completion` SKILL.md with post-merge workflow awareness.

**Acceptance:**
- [ ] New section: "Post-merge workflow verification — required reading before claiming AC is complete"
- [ ] Section explains: trace-commit.yml runs post-merge and persists assurance records; silent failures are possible
- [ ] Section provides diagnostic commands:
  - `git fetch origin traces && git log origin/traces -5`
  - `gh run list --workflow trace-commit.yml --limit 3`
- [ ] Section directs operator to: "If your PR merged but traces are not appearing, check Actions tab trace-commit.yml run"
- [ ] Section links to learnings.md entry on trace-commit silent failures (for historical context)
- [ ] Section is visible in terminal output when `/verify-completion` is invoked as context setter

---

## Out of Scope (Phase 3 exploration, not this story)

- Automatic workflow re-triggering if trace-commit fails
- Slack/email alerting for workflow failures
- Blocking PRs on trace-commit health (post-merge, so cannot block)
- Auditing why specific trace-commit runs fail (per-run root cause logging)

---

## Definition of Done Acceptance

- [ ] All four ACs fully satisfied
- [ ] check-trace-commit.js runs in `npm test` suite; 70 tests + traces-health test
- [ ] `/trace` command updated and tested against master branch
- [ ] `/verify-completion` SKILL.md updated with post-merge section
- [ ] Confirmation: run a test PR, merge it, verify traces land on origin/traces branch AND all three verification mechanisms report success
- [ ] No regression: existing tests still pass (70 smoke tests, governance gates, trace validation)

---

## Registration for Phase 3 Discovery

**Story slug:** p3-trace-commit-observability  
**Feature:** 2026-04-13-trace-observability  
**Add to workspace/state.json:** Register under Phase 3 backlog  
**For /discovery intake:** This is a full story — discovery already complete via learnings analysis. Ready for `/definition` immediately if Phase 3 capacity allows.

---

## Related Artifacts

- **learnings.md:** workspace/learnings.md — "Workflow health visibility gap" section (line ~*)
- **Root fix:** PR #55 — fixed trace-commit.yml git fetch ordering
- **Discovery date:** 2026-04-13 (post-Phase-2, prior to Phase 3 start)
