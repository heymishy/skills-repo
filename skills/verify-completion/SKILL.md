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

## Step 0 — Fresh-session check (run when resuming work from a previous session)

**Applies when:** you are starting a new session and any of the following are true:
- `workspace/state.json` shows `currentPhase` or `checkpoint.resumeInstruction` from a session you did not run
- A previous session's closing message, PR comment, or artefact claims the story is complete or in progress
- You are picking up work after a context window reset or summarisation boundary

**Instructions:**

1. **Do NOT inherit the previous session's completion claim.** A prior session's "done", "all ACs pass", or "tests passing" declaration is not evidence — it is a statement that must be independently verified in this session.

2. **Read the prior state first:** Check `workspace/state.json` (`checkpoint.contextAtWrite`, `checkpoint.resumeInstruction`) and the story's DoR artefact to understand what was claimed as complete.

3. **Run Step 1 fresh regardless.** Even if the prior session's output looks complete, execute the full test suite in this message before making any claim. Do not skip Step 1 because "it passed last time".

4. **Surface any discrepancy before proceeding.** If the prior session claimed all ACs pass but fresh Step 1 results show failures, state the discrepancy explicitly:
   > ⚠️ **Session-boundary mismatch:** Prior session claimed [X] but fresh run shows [Y]. Investigating before proceeding.

   Then use /systematic-debugging to root-cause before continuing.

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

## Route/handler E2E coverage check (mandatory when the diff touches route/handler files)

`npm test` (or the configured test command above) does not run this repo's E2E Playwright suite — `test:e2e` is a separate command. A story whose diff adds, wires, or modifies anything under `src/web-ui/routes/` (or a middleware that wraps a route handler) can pass Step 1's full-suite evidence cleanly and still break a CI-only E2E gate, because the routes it touches may have Playwright coverage that Step 1 never runs. (Source: `evcg-s1`, found when `rcfc-s1`'s clean local full-suite result was followed by two CI-only E2E failures neither Step 1 nor Step 4 as originally written could have caught.)

**When this diff touches any file under `src/web-ui/routes/` or a middleware wrapping a route handler:**

1. Identify every route path or handler function this diff adds, wires, or changes.
2. Grep `tests/*.js` for any pre-existing test file that calls the touched handler(s) directly or dispatches through the router to the touched route path(s) — not just this story's own new test files. Treat any fixture gap found the same as a failing test (blocking, not optional).
3. Grep `tests/e2e/*.spec.js` for any spec file that references the touched route path(s) (a raw `.post(...)`/`.get(...)` call, or a page interaction with a form/link targeting that path).
   - For each match **not** tagged `@real-staging` (i.e. `@mocked` or untagged, defaulting to the local `webServer`): run it locally — `npx playwright test tests/e2e/<file> --repeat-each=1`, no `E2E_STAGING_BASE_URL` override. A failure here blocks completion exactly like a failing unit test — fix it before proceeding to Step 2.
   - For each match tagged `@real-staging`: it depends on currently-deployed staging state, not this branch's own code, and cannot be verified pre-merge by design — do not attempt to run it locally against real staging. Instead, name it explicitly in Step 4's completion report as a residual risk — never omit it silently.

**Do not run the full, unscoped `npm run test:e2e` suite as a substitute for this check** — it includes `@real-staging` specs that require secrets and hit real external infrastructure; this is exactly why the CI-side "Playwright E2E smoke tests" job is itself opt-in (`audit.e2e_tests` flag) and `continue-on-error: true`. Only the specific matched spec file(s) found above.

If the diff touches no route/handler file: state this explicitly ("Route/handler E2E coverage check: N/A — no route/handler files touched") and move on — do not run this check unconditionally.

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
> E2E route coverage: [N/A — no route/handler files touched] / [N local specs run, N/N passing] / [N @real-staging specs found — cannot verify locally, residual risk: file1.spec.js, file2.spec.js]
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

**Pipeline-state write safety (psms-s1):** This write happens after `/subagent-execution`'s own per-task local writes have already accumulated this story's `tasks[]` array, still pre-push, same branch, no concurrent-worktree-collision risk yet. Write to the **local worktree file directly** (`fs.readFileSync` then `fs.writeFileSync`, no `git fetch`) — `origin/master` does not have this branch's own unmerged local writes yet, so fetching it and using it as the write base would silently discard everything `/subagent-execution` already accumulated locally this session. This mirrors `subagent-execution/SKILL.md`'s own per-task Step 2d local-only writes, not its checkpoint writes — see that skill's Pipeline-state write safety section for the fuller explanation of this failure mode and why it matters here too.

Update `.github/pipeline-state.json` in the **project repository** after running the verification command and walking all ACs:

- Set story `stage: "verify-completion"`, `updatedAt: [now]`
- Set `acVerified: [count of ✅ ACs]`, `acTotal: [total ACs]`
- Set `testPlan.passing: [count of passing tests]`
- If all ACs pass and all tests pass: set `health: "green"`, `verifyStatus: "passed"`, clear `blocker`
- If any AC fails or any test fails: set `health: "red"`, `verifyStatus: "failed"`, `blocker: "[first failing AC or test suite]"`
- If verification is started but not yet complete: set `verifyStatus: "running"`

**Parent propagation (apply to every inner loop state write):**
- Do **not** bump the feature-level `updatedAt` from this per-story write. Only a genuine feature-level milestone (`/discovery`, `/benefit-metric`, `/definition`) bumps it, via a `feature.<field>=...` argument to `bin/skills advance`/`gate-advance` — that is the only write path that touches `feature.updatedAt`. `bin/skills advance` stamps this story's own `updatedAt` automatically; you do not need to pass it explicitly. Unconditionally bumping `feature.updatedAt` on every per-story write was the root cause of concurrent same-feature stories colliding on that one shared JSON line — see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` (pcr-s1, AC3/AC4).
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`
