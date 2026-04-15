---
name: verify-completion
description: >
  Evidence gate before claiming any work is complete. No completion claims
  without fresh verification evidence. The iron law: run the verification
  command in this message, read the full output, then make the claim.
  Use before opening a PR, committing final work, or claiming any AC is
  satisfied. Pairs with the AC verification script produced by /test-plan.
triggers:
  - "verify completion"
  - "is this done"
  - "ready to open a PR"
  - "verify the ACs"
  - "confirm completion"
  - "all done"
---

# Verify Completion Skill

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

---

## The gate function

Before claiming any status:

1. **IDENTIFY** — What command proves this claim?
2. **RUN** — Execute the full command fresh (not a previous run's output)
3. **READ** — Read the full output, check the exit code, count failures
4. **VERIFY** — Does the output confirm the claim?
   - If NO → state actual status with evidence
   - If YES → state claim WITH evidence quoted from the output
5. **ONLY THEN** — Make the claim

Skip any step = making an unsupported claim.

Before Step 1, read `.github/context.yml` and apply policy overlays:

- `optimization.token_policy`: keep verification summaries concise and evidence-first
- `mapping.artefact_aliases`: include org artefact names in headings where useful,
  while still referencing canonical verification script paths

---

## Step 1 — Run the full test suite

```bash
[test command]
```

Read the full output. Report:

> Tests: [N]/[N] passing
> Failures: [list any failures with test names]
> Warnings: [list any warnings]

**If failures exist:** do not proceed to Step 2. Fix failures first using /tdd or /systematic-debugging.

---

## Step 2 — Walk through the AC verification script

Read `artefacts/[feature]/verification-scripts/[story-slug]-verification.md`.

For each scenario:

- State the AC being verified
- State the test(s) that cover it
- Confirm the test output demonstrates it passes
- Mark: ✅ Verified / ❌ Not verified

Report using the AC verification table from `templates/verify-completion.md`.

If any AC is ❌: stop. Do not open a PR. Fix and re-run from Step 1.

---

## Step 3 — Check for scope creep

Review commits on this branch:

```bash
git log --oneline [base-branch]..HEAD
```

*(Use `source_control.base_branch` from `context.yml`. Default: `main`.)*

For each commit: does it correspond to an AC or a task in the implementation plan?

If a commit exists that doesn't correspond to either:

> ⚠️ **Scope found outside DoR:** `[commit message]`
>
> This was not in the story ACs or implementation plan.
> Log in /decisions and add a PR comment describing it.

---

## Step 4 — Final confirmation

> ✅ **Verification complete**
>
> Tests: [N]/[N] passing, 0 failures
> ACs verified: [N]/[N]
> Scope: [clean / N items noted in /decisions]
>
> Ready to run /branch-complete and open a draft PR.

---

### Traces Branch Health

If `npm test` fails with a stale-traces error, run:

```bash
git log origin/traces --oneline -5
```

Expected output: recent commits within the last 24 hours. If the last commit is >24h ago, or the branch is absent, the post-merge trace workflow has not run since the last story merge. Re-trigger the workflow or push a trace manually to resolve.

To see the exact timestamp of the last commit:

```bash
git log origin/traces -1 --format="%ci %s"
```

If `check-trace-commit.js` exits 1 with a stale message, the hours-elapsed value in its output indicates how long the traces branch has been idle.

---

## Common failures

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | "Should pass", previous run |
| AC satisfied | AC verification: ✅ with test name and output | "Tests pass, so ACs are met" |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Failing test now passes | Code was changed |
| Implementation complete | All ACs ✅, all tests passing | "Looks right", subagent said done |

---

## Red flags — stop

- Using "should", "probably", "seems to"
- Expressing satisfaction before running commands ("looks good!", "done!", etc.)
- About to open a PR without running Steps 1–3
- Trusting a subagent's self-report without independent verification
- Running only a subset of the test suite

---

## Integration

**Use before:** /branch-complete — required before opening a PR
**Uses:** AC verification script produced by /test-plan
**Follows:** /subagent-execution or /tdd
**Blocked by:** failing tests, any ❌ AC
**When fixing failures:** use /tdd (test first) or /systematic-debugging

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** after running the verification command and walking all ACs:

- Set story `stage: "verify-completion"`, `updatedAt: [now]`
- Set `acVerified: [count of ✅ ACs]`, `acTotal: [total ACs]`
- Set `testPlan.passing: [count of passing tests]`
- If all ACs pass and all tests pass: set `health: "green"`, `verifyStatus: "passed"`, clear `blocker`
- If any AC fails or any test fails: set `health: "red"`, `verifyStatus: "failed"`, `blocker: "[first failing AC or test suite]"`
- If verification is started but not yet complete: set `verifyStatus: "running"`

**Parent propagation (apply to every inner loop state write):**
- Always update the feature-level `updatedAt: [now]` — the visualiser staleness timer reads this field; if only the story `updatedAt` is written the feature card shows "STALE PROC"
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`
