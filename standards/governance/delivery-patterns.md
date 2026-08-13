# Governance Delivery Patterns

**Status:** Active
**Owned by:** Platform team
**Source:** GPA feature delivery (2026-05-24-governance-platform-architecture), extracted via /improve

These patterns are established from delivery experience. Follow them when planning or implementing governance-touching features.

---

## Wave-Gate Delivery Pattern (A1)

**Context:** A feature that spans multiple stories touching two or more high-churn shared files (e.g. `governance-package.js` and `run-assurance-gate.js`).

**Problem:** Without explicit ordering, stories that touch the same files create cascading rebase conflicts. A "unify" or "consolidate" story that depends on upstream foundation being stable will require multiple rebases if upstream is still being merged.

**Pattern:** Structure the feature into three explicit waves with a gate between each:

1. **Wave 1 — Documents/Foundation:** Write standards documents, trace contracts, and architectural patterns. These stories modify no shared logic files and can be parallelised freely.
2. **Wave 2 — CI wiring:** Wire CI checks, validate gates, and establish enforcement. These stories modify workflows and check scripts but do not consolidate logic.
3. **Wave 3 — Unification/consolidation:** Consolidate verdict logic, replace inline implementations with shared modules, enforce ADR compliance. These stories gate on Wave 2 stories being `stage: definition-of-done`.

**How to express this in the DoR:** The Wave 3 story's DoR hard-block H6 (dependency check) must name each Wave 2 story's `dorStatus: signed-off` as a prerequisite. Example:

> H6 dependency: gpa-sc-07, gpa-sc-03, gpa-sc-06 must all be `stage: definition-of-done` before SC-02 is dispatched.

**Why it works:** Wave gates ensure the shared files are stable before the unification story opens its branch. No rebase conflicts on the merge because all upstream stories have already been merged to master.

---

## Inline JS Extraction Pattern (A4)

**Context:** A GitHub Actions workflow contains a `github-script` inline JS block that implements non-trivial logic (audit comments, slug extraction, story crosschecks, path guards).

**Problem:** Inline `github-script` JS is untested. Tests can only grep the YAML for string presence — they cannot exercise the JS logic, catch variable ordering bugs, or cover regex edge cases. Any logic inside a `github-script` block is a blind spot.

**Pattern:** Extract the inline JS to a `scripts/` module:

1. Create `scripts/<name>.js` that exports the function: `module.exports = { buildComment, extractPRSlug, ... }`
2. In the workflow, call the module via a `run:` step: `node -e "require('./scripts/<name>').myFn(inputs)"`
3. Write unit tests that import and exercise the module directly with fixture data.

**What the test suite should cover:**
- Happy path with a real-looking fixture
- Edge cases (empty input, glob paths, backtick-wrapped paths, table cells)
- The function loads without syntax errors

**Source:** SC-07 (gpa-sc-07-inline-js-extraction). Established in `standards/governance/trace-contract.md` P08.

---

## Documents-First Wave Ordering for Governance Features (C1)

**Canonical ordering:** When a feature introduces both documentation (standards, ADRs, trace contracts) and enforcement (CI gates, schema validation, verdict logic), always deliver in this order:

1. Standards documents and design principles → `standards/governance/`
2. CI enforcement and gate wiring
3. ADR compliance and consolidated verdict logic

**Rationale:** The standards documents are the specification that CI enforcement checks against. Delivering CI before the standards means the CI is checking an undocumented contract — any gap found in CI review cannot be cross-referenced to a written principle. The inverse risk: delivering standards without CI means the standard is advisory only and will drift.

**This ordering is mandatory for governance-touching features.** It is the delivery expression of PRINCIPLE-01 (pure function enforcement surface) — the pure function must be specified before it is enforced.

**Applies to:** Any feature in which one or more stories write to `standards/`, `standards/governance/`, `.github/architecture-guardrails.md`, or any file that defines what the CI gate checks.

---

## Epic-Nested Story State Bookkeeping (B2/D1)

**HARD RULE: NEVER run `bin/skills advance` for epic-nested story state updates on a feature branch. Always apply state advances on master after the PR merges.**

**Why this is a hard rule:** When a feature uses epics (`feature.epics[].stories[]` rather than flat `feature.stories[]`), the `bin/skills advance` harness correctly modifies the epic-nested story in the in-memory state object. However, if the PR is merged and the merge resolution uses the branch version of `pipeline-state.json` (which can happen when master has advanced since the branch was last rebased), the advances applied on the branch are silently reverted.

**The failure mode:**
1. Branch: run `advance` for SC-01/04/05 → pipeline-state.json updated on branch
2. PR opened → master advances again (other story merges)
3. PR merged → merge resolution uses branch's pipeline-state.json (older)
4. On master: SC-01/04/05 state reverted to `definition-of-ready / prStatus: none`
5. Advance for SC-02 (the story being merged) is run on master → SC-01/04/05 changes not included

**Correct procedure for epic-nested story state:**

```
# 1. Merge the PR normally
# 2. Pull master
git pull origin master

# 3. Apply advances for ALL stories being bookmarked as merged
node bin/skills advance <feature-slug> <story-id> prStatus=merged stage=definition-of-done

# 4. Validate + commit directly on master
python -c "import json,jsonschema; ..."  # 0 errors
git add .github/pipeline-state.json
git commit -m "chore: <story-id> prStatus=merged stage=definition-of-done"
git push origin master
```

**Diagnosis check:** If stories show `stage: definition-of-ready, prStatus: none` after their PRs have merged, run the above procedure. The DoD observation for this pattern: "Epic-nested story state persistence gap — advance on branch, reverted at merge."

**See also:** `copilot-instructions.md` cdg.6 rule; the `bin/skills advance` harness searches epic-nested stories correctly — the failure is in the timing of when the advance is applied, not in the harness itself.

---

## Diff-Before-Resolve Merge Verification (D40 companion)

**Context:** Resolving merge conflicts across sibling branches stacked on one shared foundation branch, where master has advanced with a prior sibling's merge.

**Pattern:** Before resolving a conflicted file, diff the current branch's version against master's version. If master contains a strict superset of the branch's lines (zero lines exist only in the branch), the conflict is a pure fast-path — safe to resolve with `git checkout --ours <file>`. If master is missing lines the branch has, this is a genuine two-sided merge: the same functions/columns/render-blocks/tests from BOTH sides must be preserved and combined (reordered into consistent numbering, shared resource lists like SQL column sets or `module.exports` updated to include all dimensions, not just one side).

**Why it matters:** Early rounds in a stacked-sibling merge sequence (fewer merged siblings so far) tend to be pure supersets; later rounds (more siblings already merged) are much more likely to require genuine combination. Treating every round the same way — either always taking `--ours` or always hand-merging — produces either silently dropped code or unnecessary rework.

**Verification gate:** After any resolution, run a conflict-marker scan (`grep -c "<<<<<<<\|=======\|>>>>>>>"`, must return 0 — see D40) before staging, then rerun the affected story's test suite before pushing.

**Source:** product-rollup epic (2026-07-16-product-rollup), pr-s6/pr-s7 merge-conflict resolution across PRs #498–#500.

---

## Stacked-PR Base-Deletion Auto-Close Gotcha (GitHub platform behaviour)

**The gotcha:** Merging a PR that deletes its head branch (via GitHub's "delete branch on merge") auto-CLOSES — not retargets — every other open PR whose base is that same branch. `gh pr reopen` and `gh pr edit --base` both fail afterward with "Cannot change the base branch of a closed pull request" — there is no API recovery path for the original PR object.

**Recovery:** Open a fresh PR from the surviving head branch (only the shared base was deleted, the sibling's own branch and commits still exist), retargeted directly at the new final base (e.g. master).

**Prevention for future stacked epics:** Either (a) merge the foundation PR only after ALL its siblings have merged into it first (fully linearise the stack before deletion), or (b) if siblings must stay open independently, retarget every sibling PR's base to the final target BEFORE merging/deleting the shared foundation branch.

**Source:** product-rollup epic, PRs #495/#496/#497 auto-closed when PR #490 merged; recovered as #498/#499/#500.

---

## Confirm CI-Flake Root Cause Before Patching (anti-pattern)

**Anti-pattern:** Patching a plausible-looking cause for an intermittent CI failure (e.g. bumping a timeout) without first confirming the hypothesis against a clean-diff baseline.

**What went wrong:** A CI job repeatedly failed on unrelated PRs pairing `check-md-3-adr.js` (flips to passing) with `check-p3.5-validate-trace.js` (fails) — the first hypothesis (growing test suite crowding a fixed 15s timeout) was patched by doubling the timeout (15s → 30s) before confirming it against a trivial-diff PR. The patch PR's own CI showed the identical failure, disproving the hypothesis and costing a full CI cycle. The real root cause was resource contention: `check-md-3-adr.js`'s T4 check spawns a nested full `npm test` recursion that, when it happens to finish inside its own timeout window, starves `check-p3.5-validate-trace.js`'s `pwsh` subprocess spawn of CPU at the critical moment.

**Correct approach:** Before patching a suspected timing/resource cause, open a throwaway PR with a trivial diff against the current baseline and confirm the failure reproduces identically. If it does, the cause isn't the diff — investigate resource contention or environment factors instead of iterating on values in the suspected file.

**Source:** product-rollup epic, PRs #489/#490/#492 (`tests/known-baseline-failures.json`'s own note documents the full mechanism).

---

## Deferred Review-Finding Splits Must Name an Owner

**The gap:** A review finding split an AC into a self-contained story-level AC (kept and tested) plus a cross-story consistency check explicitly "deferred to the epic level" — but no artefact (epic file, a specific story, or a named test) was ever assigned ownership of actually performing that deferred check. It silently never happened across the whole epic.

**Rule:** Whenever a review finding splits an AC and defers part of it to "the epic level" (or any level beyond the current story), the review or DoR artefact must name the specific mechanism that will perform the deferred check — a dedicated test, a manual verification step, or an explicit epic-level story. An implicit expectation with no assigned owner is equivalent to the check never happening.

**Source:** product-rollup epic, pr-s7 review finding 7-M1 (AC4 split), surfaced at `/definition-of-done`.

---

## New-Endpoint Same-PR Real-Staging E2E Bootstrapping Gap (D44)

**The gap:** A PR that both introduces a new staging-safe endpoint AND adds a real-staging E2E test of that same endpoint in the same PR cannot pass that check on its own pre-merge CI run. `staging-deploy.yml` only deploys to `wuce-staging` on push to master — there is no PR-preview deploy mechanism anywhere in `.github/workflows/` — so the new endpoint genuinely is not live on staging until after the PR merges.

**How to recognise it in CI output:** the failure does not look like a real assertion failure. Typical symptoms: a JSON-parse error where the test expected a JSON response but got the generic sign-in page HTML back, or a 404/redirect where the test expected the new route. If the endpoint's own dedicated unit test already passes (proving the logic is correct in isolation) but the same-PR real-staging E2E test of that endpoint fails with one of these shapes, this is almost certainly the bootstrapping gap, not a real defect.

**The manual workaround (for the window between merge and the automated confirmation below):** merge the PR with the one known-red check — do not hold the merge hostage to a check that structurally cannot pass yet. After merge, confirm the endpoint's real behaviour via a direct local run of the spec file from a worktree/checkout, targeting the real deployed `wuce-staging` URL directly (with any required secret retrieved via `flyctl ssh console --app wuce-staging -C "printenv <VAR>"`, piped to a job-scoped temp file, used inline, then deleted — never printed or committed). **Do not use `gh run rerun` for this** — once GitHub deletes the merged PR's source branch (its default post-merge behaviour), `gh run rerun` fails at the checkout step trying to fetch the now-nonexistent branch ref, which looks like a fast failure but is unrelated to the code under test.

**The automated confirmation (primary mechanism going forward):** `staging-deploy.yml`'s `post-deploy-e2e-confirm` job (pmec-s1) re-runs the exact same Scenario A/B real-staging spec files, behind the exact same `audit.staging_e2e_scenario_a`/`audit.staging_e2e_scenario_b` flags, immediately after every real deploy (`needs: deploy-staging`). This closes the gap automatically — a newly-merged endpoint's spec gets its first genuine confirmation the same day, without depending on a human remembering to do the manual re-run above. The job is deliberately non-blocking (not a dependency of `promote-to-prod`, which continues to depend on `smoke-test` alone) — a failure here is a same-day investigation signal, not an automatic release block.

**Source:** durable-session-history epic, dsh-s4 (`workspace/capture-log.md`, 2026-07-28, two entries: the pattern itself and the `gh run rerun` gap); closed by `post-merge-e2e-confirmation` (pmec-s1, 2026-07-29).

---

## Two-Reviewer-Per-Task Discipline Earns Its Cost Regardless of Story Size

**Pattern:** Dispatch a spec-compliance reviewer and a code-quality reviewer as two separate subagents per implementation task (not one combined reviewer), with a fix-and-re-review cycle for any genuine finding.

**Evidence:** Across a 12-story feature, at least one round found a real, legitimate finding on nearly every task in nearly every story — including the lowest-complexity story in the feature (Complexity Rating 1), where the finding rate did not drop relative to higher-complexity stories. The one story where two full review rounds found zero blocking findings across all tasks was a story that was purely additive on top of three already-reviewed, already-hardened handlers — the absence of findings correlated with the absence of new surface area, not with review being unnecessary.

**Companion pattern — final story-level synthesis review is not redundant with per-task review.** A final review pass across the complete diff (not just each task's own slice) caught a genuine functional gap that none of the individual task-level reviews caught, because each task reviewed its own diff in isolation and the gap was only visible when reasoning about the complete user-facing flow end-to-end.

**Source:** web-ui-guardrails-standards-surface epic (2026-08-11), observed consistently across wugs-s3 through wugs-s10's own DoD Observations.

---

## Read the Real, Merged Upstream Code Before Writing an Implementation Plan

**Pattern:** Before drafting an implementation plan for a story that builds on or removes previously-shipped code, read the actual current state of that code directly (not just the story/DoR text's description of it) — grep for the real function/export names, the real route table, the real schema, the real call sites.

**Why this belongs here, not just as generic advice:** A feature's own story text is written at `/definition` time, before any of the code it describes exists yet in its final, real-and-merged shape. By the time a downstream story's implementation plan is drafted, the story text it's building on may already be stale relative to what actually shipped (renamed functions, review-added fields, additional test coverage that shifted a "predicted" count). Adopting the discipline of re-deriving the real shape from the merged code — rather than trusting the story text as if it were live documentation — correlated directly with cleaner review outcomes: the one story in a 10-story run with zero blocking findings across two full review rounds was the first to consistently apply this discipline from its own planning stage onward.

**Source:** web-ui-guardrails-standards-surface epic, adopted from wugs-s9 onward; explicitly credited in wugs-s10's DoD Observation #1.

---

## Removal/Deletion Stories Systematically Undercount Real Scope — Investigate Before Planning

**Context:** A story framed as "remove X" or "delete Y" (routes, DB tables, dead code paths).

**Pattern found:** Across three independent removal stories in the same epic, each story's own AC text named fewer real cross-references than actually existed in the codebase — not once, but every time, and the gap grew each time it recurred:
- Story 1: AC text used incorrect function names for 2 of 5 real functions being removed.
- Story 2: AC text named 3 of 7 real routes and 2 of 5 real test files needing changes.
- Story 3: AC text named 1 of 3 real code paths still referencing the data being removed — one of the missed references was in a *different epic's* script entirely.

**Why this is systematically harder to catch than it sounds:** A story that gets a function *name* wrong produces an obvious signal (a grep for that name returns zero hits, prompting a second look). A story that *undercounts scope* produces no such signal — the named references are all real and all correct, so nothing prompts a search for what else might be missing. Only an unprompted, exhaustive investigation (not triggered by any single AC's own wording) surfaces the gap.

**Rule:** Before finalizing an implementation plan for any removal/deletion-framed story, run an exhaustive `grep -rln` sweep for the real symbol/route/table names being removed across the *whole* repository — not just the files or exports the story's own AC text names. Document the real, complete scope in the plan's own Design note, and log any material expansion beyond the story's literal text as a SCOPE-EXPANSION decision before implementation begins, not after.

**Companion gap — identifier-based lock-in tests cannot see this class of dangling reference.** An automated `grep`-based regression test verifying "zero remaining references" can only match literal identifier/table names within the directories it scans. It structurally cannot catch: (a) references in directories outside its scan scope (e.g. `tests/e2e/*.spec.js`, if the lock-in test only scans `src/`/`tests/*.js`), or (b) references that hit removed functionality via a raw string (an HTTP route path, a SQL table name inside a string literal) rather than a JS identifier. Extending the grep pattern to catch raw-string usage was tested in this epic and confirmed too noisy (matches unrelated legitimate uses of the same substring elsewhere in the codebase) — the reliable mitigation is a manual, human/agent-read scan of `tests/e2e/*.spec.js` for the literal old path/table strings as an explicit pre-PR step, and an explicit reviewer instruction to check that directory (not just `src/`/`tests/*.js`) during removal-story code review.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s9 (incorrect function names), wugs-s11 (undercounted routes/tests, plus a real CI-caught regression from exactly this blind spot), wugs-s12 (undercounted cross-references spanning a different epic's script).

---

## DoR-Required Manual Verification Steps Need Mechanical Enforcement, Not Just a Checkbox

**The gap:** A DoR artefact named a REQUIRED pre-merge manual step (verifying a mocked external API's real response shape against the actual live API before trusting the mock in production). The only trace of this requirement in the delivery flow was an unchecked markdown checkbox in the PR description — nothing in the branch-complete gate validation checked for it, and the PR merged with the step never performed.

**Rule:** When a DoR names a REQUIRED manual verification step, the branch-complete artefact (or its own gate validation) should carry an explicit machine-checkable field — e.g. `manualVerificationRequired: true` / `manualVerificationRecorded: <url-or-null>` — so the gate can refuse to pass silently on an unrecorded requirement, rather than relying entirely on a human noticing an unchecked box in a PR description template.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s6 (PR merged without the DoR's own required sandbox-GitHub mock-shape verification; recorded as a RISK-ACCEPT and still open as of this note).

---

## Verification-Script AC-Scenario Gaps Recur Until Named as a Cross-Check, Not an Incidental Catch

**The gap:** A story's own AC verification script was missing a scenario for one of its named ACs — found and fixed at `/verify-completion`, independently, on three separate stories in the same feature before the pattern was explicitly named.

**Rule:** Before DoR sign-off, cross-check that every AC number appearing in a story has a corresponding "Covers: ACn" scenario in that story's verification script. This is a mechanical, five-minute check that eliminates a defect class currently being caught three separate times by three separate final-review passes, at three separate later stages of the pipeline, at three separate additional review-time costs.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s1, wugs-s2, wugs-s5 (same gap class, each caught independently at `/verify-completion` before being named as systemic in wugs-s5's own DoD).

---

## Same-Feature Shared-Render-Function Merge Conflicts Are Expected When Worktrees Overlap

**Context:** Two stories in the same feature both modify the same shared render/handler functions, and their git worktrees have overlapping lifetimes (both branched from master before either merged).

**Pattern:** This produces a real, expected merge conflict when both PRs land close together — correctly resolving it requires understanding both stories' full intent well enough to combine their logic, not just mechanically pick one side. This is process friction inherent to genuinely-parallel delivery on shared files, not a defect in either story. By contrast, sequencing a story's worktree creation *after* its shared-code siblings have already merged reliably avoids this class of conflict — confirmed by direct comparison within the same feature (one pair of stories hit the conflict; a later pair touching the same shared functions, but sequenced after the first pair merged, did not).

**Rule:** When two stories in the same feature are both known to touch the same named functions (visible from either story's Architecture Constraints or implementation-plan File Map sections), flag this at `/implementation-plan` time as an anticipated merge conflict regardless of implementation order — so it is expected at merge time, not discovered as a surprise. See also this document's own Wave-Gate Delivery Pattern (A1) for the structural version of this same problem at a larger, multi-wave scale.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s3/wugs-s7 (conflict occurred, overlapping worktree lifetimes), wugs-s4 (no conflict, sequenced after both prior siblings merged).

---

## `deploy-group` CI Concurrency Flake: Diagnosis and Mitigation

**The flake:** A PR's E2E checks fail on the first CI run with job conclusion `cancelled` (not `failure`), caused by two pushes to the same branch roughly 20-30 seconds apart both requesting the same CI `deploy-group` concurrency slot — the second push cancels the first's still-running E2E jobs. Recurred on three consecutive PRs within the same feature before the exact mechanism was pinned down.

**Root cause:** A `branch-complete` flow that (1) pushes the feature branch, (2) opens the PR, then (3) separately commits and pushes a branch-complete bookkeeping artefact once the real PR URL is known — structurally requires two pushes to the same branch close together in time.

**Mitigation confirmed effective:** When the bookkeeping write can be deferred to a direct-to-master commit instead of a second push to the feature branch itself, the flake does not reproduce — confirmed clean across four consecutive stories after this pattern was adopted.

**Standing mitigation until a structural fix exists:** Proactively check `gh pr checks <pr-number>` immediately after every `branch-complete`'s `gh pr create` call, before reporting branch-complete as done — do not wait for CI to finish or for a human to notice and report a failure.

**Diagnosis check:** Confirm via `gh api repos/.../actions/jobs/<id>` that the job `conclusion` is `cancelled`, not `failure`, and that a same-branch push landed 20-30 seconds after the first — this signature distinguishes the known flake from a genuine regression. Never assume the flake without checking; a real regression can look superficially similar.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s3/wugs-s4/wugs-s8 (flake occurred, root cause diagnosed), wugs-s9 through wugs-s12 (mitigation held, zero recurrences).

---

## Dispatch Transparency Norm: Report Plan-vs-Reality Mismatches, Don't Force-Match

**The norm:** When a dispatched implementer's actual observed result diverges from an implementation plan's own prediction (a predicted test-failure count that doesn't match, a test expected to fail RED that instead passes vacuously, a predicted total that's off by a few), the correct response is to report the discrepancy and its cause explicitly in the completion report — not to silently force the actual result to match the plan's prediction, and not to treat the mismatch as a defect requiring the plan to be "corrected" without explanation.

**Why this matters:** An implementation plan's own predictions are written before the code exists, based on the plan author's best understanding at that time — they are a sanity check the implementer verifies against reality, not a target the implementer's own report should be shaped to confirm. Transparent reporting of a mismatch (with root cause) is what allows a plan gap to be caught and fixed *during* delivery rather than silently accepted as if nothing were unusual.

**Companion rule for plan authors:** Implementation plans should phrase per-task expected test counts relatively ("N more than currently committed") rather than as absolute totals, since review-round test additions in earlier tasks routinely shift what a later task's own "expected count" should be — an absolute number written before Task 1 even starts cannot account for tasks 2-4's own review-driven growth.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s9 (a plan's own AC3 test design gap caught via a pre-dispatch sanity re-read, not a review round), wugs-s10 (a dispatched implementer explicitly reported and explained a plan-vs-reality test-count mismatch rather than silently matching it), wugs-s4 (named the relative-vs-absolute phrasing issue directly).

---

## Anti-pattern: A Subagent Waiting on Its Own Self-Spawned Background Process Will Never Be Notified

**What went wrong:** A dispatched implementer subagent spawned its own long-running background process (e.g. the full test suite) and then reported it would "wait for the background task to complete on its own" before continuing. It never did — and never could. Only the orchestrating session receives background-task completion notifications; a dispatched subagent has no channel to ever learn that a process it itself started has finished. This is a distinct failure mode from an agent falsely believing *it personally* will be notified of something external — here the agent's own understanding of the mechanism was correct, it simply had no way to close the loop on a task it initiated itself.

**Recovery:** Check the worktree's actual `git status`/`git diff` directly rather than waiting — if the implementation work is genuinely complete (just uncommitted, because the agent is stuck waiting on its own dead-end), complete verification and the commit directly rather than re-dispatching or waiting further.

**Rule:** Dispatch instructions for implementer subagents should explicitly forbid launching self-spawned background/detached processes — all commands, including long-running ones like a full test suite run, must run in the foreground within the single dispatch turn that started them.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s8 Task 4.

---

## Anti-pattern: A Session Checkpoint's Own Task-Count Is Not Ground Truth for Resuming

**What went wrong:** A background implementer subagent completed all of a story's implementation tasks — plus a full round of review-driven security hardening — entirely unattended, past the point where the last session checkpoint had been written. The checkpoint's own record (based on the state known at write time) significantly undersold actual progress. Resuming correctly required two independent checks, neither of which alone would have sufficed: (a) comparing the implementation plan's task list against `git log --oneline` in the worktree to find completed-but-unrecorded tasks, and (b) separately checking `git status` for completed-but-uncommitted work. Checking only one would have missed the other category.

**Rule:** When resuming a session after a background agent may have continued working past the last checkpoint, re-derive actual task state from `git log` *and* `git status` directly — never trust a checkpoint's own task-count as sufficient ground truth on its own, since a background agent can legitimately outrun the checkpoint that was supposed to describe it.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s6 (resumed from a checkpoint reading 3 of 7 tasks; actual state was all 7 tasks committed, plus uncommitted review-driven hardening on top).

---

## Anti-pattern: Non-Discriminating Test Assertions

**What went wrong:** A story's first five implementation tasks each drew a Critical or Important code-quality finding of the same defect class: a shipped conditional/branch whose own test didn't actually discriminate it — a mock that swallowed the exact failure it was meant to catch, or an assertion that would pass regardless of which branch of the code actually executed. Only the sixth task, after the pattern had been named and explicitly checked for five times running, passed code-quality review clean on the first attempt.

**Companion anti-pattern — redundant same-shape NFR tests.** A separate, smaller instance of the same underlying issue: an NFR test written with the exact same mock/assertion shape as an adjacent AC test next to it is a zero-signal duplicate, not real additional coverage — it was caught and merged into the AC test as a documented sub-assertion rather than shipped as a separate test.

**Rule:** When authoring or reviewing a task's tests, explicitly ask: "if I broke this specific branch, would this exact assertion actually fail?" — not just "does a test exist that touches this code path." A test that would pass identically whether the branch under test is correct or broken provides no real regression protection, regardless of how it reads.

**Source:** web-ui-guardrails-standards-surface epic, wugs-s5 (5 of 6 tasks hit this exact defect class before code-quality review stabilized it), wugs-s2 (redundant NFR-test-shape instance).
