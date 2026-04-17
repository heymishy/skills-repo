---
name: issue-dispatch
description: >
  Creates GitHub issues for DoR-signed-off stories to trigger the GitHub Copilot
  coding agent. Reads pipeline-state.json to find stories with dorStatus: signed-off
  that have not yet been dispatched. Supports two issue body targets:
  --target github-agent (rich inlined body, default) and --target vscode (minimal stub, explicit opt-in only).
  Updates pipeline-state.json with issueUrl, dispatchedAt, and dispatchTarget after
  each issue is created.
triggers:
  - "/issue-dispatch"
  - "/issue-dispatch --target github-agent"
  - "/issue-dispatch --target vscode"
  - "dispatch stories to github"
  - "create issues for ready stories"
  - "create github issues"
  - "dispatch to agent"
---

# Issue Dispatch Skill

## Entry condition

At least one story must have `dorStatus: "signed-off"` in `.github/pipeline-state.json`
with no `issueUrl` recorded. If all signed-off stories already have `issueUrl` values,
report this and stop — there is nothing to dispatch.

---

## Step 0 — Preflight: verify remote is up to date

**Run before creating any issues:**

```bash
git status
git log --oneline origin/HEAD..HEAD 2>/dev/null || git log --oneline @{u}..HEAD 2>/dev/null
```

If any commits are shown (local commits not yet pushed to the remote), **stop and warn the operator:**

> ⚠️ **Unpushed commits detected.** The agent clones at assignment time — anything not pushed is invisible to it. Push first, then re-run `/issue-dispatch`.
>
> Commits not yet on remote:
> [list the commit hashes and messages]

Do not create issues until the operator confirms all relevant commits are pushed.

**Rationale:** The GitHub Copilot coding agent clones the remote at the moment the issue is assigned. Any local commits — including fixes, artefact changes, decisions, or rule updates — that have not been pushed are invisible to the agent. This causes stale-clone runs that block for reasons the operator has already resolved locally, producing throwaway PRs and wasted agent cycles.

---

## Step 1 — Read pipeline state

Read `.github/pipeline-state.json`. Identify all stories where:
- `dorStatus: "signed-off"`
- `issueUrl` is absent or null

These are the dispatchable stories. Report the count and list the story IDs.

If none found: report "No undispatched DoR-signed-off stories found." and stop.

---

## Step 2 — Determine target

Check for a `--target` parameter in the invocation:

- `--target github-agent` — rich inlined body drawn from artefacts (default)
- `--target vscode` — minimal stub issue body (explicit opt-in only — see warning below)

If no parameter is given, use `--target github-agent`.

> **Warning — `--target vscode`:** The minimal stub body contains only artefact paths. The GitHub Copilot SWE agent (GitHub Actions) receives no task list, no file touchpoints, and no implementation context — it will produce an empty "Initial plan" commit with zero file changes. Use `--target vscode` only when the agent runtime is VS Code inline chat with confirmed full workspace access and the operator has verified the agent reads artefact files independently during the session. For all standard inner loop dispatches to GitHub Actions / SWE agent, use `--target github-agent`.

---

## Step 3 — Read artefacts

For each dispatchable story, determine the feature slug from the story ID or
`pipeline-state.json`, then read:

**Always required (both targets):**
- `artefacts/[feature-slug]/dor/[story-slug]-dor.md` — for the Coding Agent Instructions block

**Required for `--target github-agent` only:**
- `artefacts/[feature-slug]/stories/[story-slug].md` — title and one-line summary
- `artefacts/[feature-slug]/plans/[story-slug]-plan.md` — implementation plan tasks (if it exists; otherwise use the Coding Agent Instructions block from the DoR as the task list)
- `artefacts/[feature-slug]/decisions.md` — extract entries tagged to this story's ID or its epic ID
- `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md` — artefacts reference table only

---

## Step 4 — Generate issue body

### `--target vscode` body format

```
Implement [story-id]: [story title]

**DoR artefact:** `artefacts/[feature-slug]/dor/[story-slug]-dor.md`
**Story artefact:** `artefacts/[feature-slug]/stories/[story-slug].md`
**Test plan:** `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md`
[**Implementation plan:** `artefacts/[feature-slug]/plans/[story-slug]-plan.md`]  ← include only if file exists

Read the **Coding Agent Instructions** block in the DoR artefact before writing any code.

Closes #[issueNumber]
<!-- GitHub auto-close: when this PR is merged, GitHub automatically closes issue #[issueNumber].
     Reference: https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue
     The [issueNumber] placeholder is replaced with the actual issue number at dispatch time. -->
```

### `--target github-agent` body format

```
Implement [story-id]: [story title]

[One-line summary from story.md]

## Implementation tasks

[Full task list from plans/[story-slug]-plan.md if it exists, otherwise from
the Coding Agent Instructions block in the DoR artefact. Preserve task numbering
and file paths exactly as written.]

## Key decisions already made

[Entries from decisions.md tagged to this story ID or its epic ID, formatted as
a bullet list: "- [date] [CATEGORY]: [decision one-line summary]". If none, write
"None recorded — read decisions.md for feature-level decisions."]

## File touchpoints

[Files to create and modify, from the implementation plan or DoR contract.
One item per line: "- CREATE: path/to/file" or "- MODIFY: path/to/file".]

## Non-negotiable rules

- Read the Coding Agent Instructions block in the DoR artefact before writing any code.
- Verify the baseline passes before making any changes: `npm test` and `bash scripts/validate-trace.sh --ci`
- Open PRs as drafts only. Never mark ready for review. Never merge.
- If any blocker is not resolvable from the artefact files: leave a PR comment describing the blocker and stop. Do not improvise a workaround.
- Do not modify any file under `artefacts/`. These are read-only pipeline inputs.
- **Governance sync:** Before committing any new check script, gate reference, or standard entry: run `node .github/scripts/check-governance-sync.js` and confirm it passes. If you add anything to `governance-gates.yml`, you must add the matching entry to `DEFAULT_GOVERNANCE_GATES` in `pipeline-viz.html` in the same commit, and vice versa.
- **Cross-platform:** All scripts in `.github/scripts/` must run correctly on both Windows and Linux. Use `process.platform === 'win32'` guards for platform-specific behaviour. Never hardcode shell paths (e.g. `/bin/bash`, `C:\Program Files\Git\bin\bash.exe`).

## Artefacts reference

| Artefact | Path |
|----------|------|
| Story | `artefacts/[feature-slug]/stories/[story-slug].md` |
| DoR | `artefacts/[feature-slug]/dor/[story-slug]-dor.md` |
| DoR contract | `artefacts/[feature-slug]/dor/[story-slug]-dor-contract.md` |
| Test plan | `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md` |
| Verification script | `artefacts/[feature-slug]/verification-scripts/[story-slug]-verification.md` |
| Implementation plan | `artefacts/[feature-slug]/plans/[story-slug]-plan.md` *(if exists)* |
```

---

## Step 5 — Create issues

For each story, output the `gh` CLI command:

```bash
gh issue create \
  --title "[story-id]: [story title]" \
  --body "[body from Step 4]"
```

If running in agent mode with `gh` available, create the issues directly rather
than outputting commands. Confirm each creation with the returned URL.

Add a note for any dependency-gated story found in the DoR: append this line to
the body before creation:

> **Note:** One or more ACs in this story are dependency-gated. See the DoR
> artefact for detail — do not attempt gated ACs until the stated prerequisites
> are DoD-complete.

---

## Step 6 — Record dispatch

After each issue is created, update `.github/pipeline-state.json` for that story:

```json
"issueUrl": "https://github.com/[owner]/[repo]/issues/[number]",
"dispatchedAt": "[ISO 8601 timestamp]",
"dispatchTarget": "vscode | github-agent"
```

Do not change `stage` or `dorStatus`. This is a dispatch record only.

Commit the updated `pipeline-state.json` with message:
`chore: record issue dispatch for [story-id(s)] [date]`

---

## Delivery order note

Dispatch issues in delivery order as recorded in `workspace/state.json`
(`resumeInstruction` or `pendingActions`). If no order is recorded, dispatch
in the order stories appear in `pipeline-state.json`. Advise the operator to
assign issues in that order to minimise merge conflicts between concurrent agent
runs.

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅."

For each dispatched story, update `.github/pipeline-state.json`:

- Set `issueUrl: [url]`
- Set `dispatchedAt: [timestamp]`
- Set `dispatchTarget: [vscode | github-agent]`
- Set `updatedAt: [now]` on the feature record

Do not change `stage` or `dorStatus`.
