---
name: branch-complete
description: >
  Completes a development branch: runs final test verification, presents four
  structured options (merge locally, open draft PR, keep branch, discard),
  executes the chosen option, and cleans up the worktree. PRs are always opened
  as drafts — never mark ready for review. Use when implementation is done and
  /verify-completion has passed in this session.
triggers:
  - "complete the branch"
  - "open a PR"
  - "finish the implementation"
  - "wrap up the branch"
  - "branch complete"
  - "ready to PR"
---

# Branch Complete Skill

## Entry condition

/verify-completion must have passed in this session.

If not:

> ❌ Run /verify-completion first.
> Do not open a PR against failing tests or unverified ACs.

---

## Step 1 — Final test verification

```bash
[test command]
```

**If tests fail:**

> Tests failing ([N] failures). Must fix before completing.
>
> [Show failures]
>
> Cannot proceed with merge or PR until all tests pass.

Stop. Do not present options.

**If tests pass:** continue to Step 2.

---

## Step 2 — Determine base branch

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

---

## Step 3 — Present options

```
Implementation complete. What would you like to do?

1. Merge back to [base-branch] locally
2. Push and open a draft PR (recommended for this pipeline)
3. Keep the branch as-is for now
4. Discard this work

Reply: 1, 2, 3, or 4
```

---

## Step 4 — Execute choice

### Option 1 — Merge locally

```bash
git checkout [base-branch]
git pull
git merge feature/[story-slug]
[test command]
```

If tests pass after merge:

```bash
git branch -d feature/[story-slug]
```

Then: cleanup worktree (Step 5).

---

### Option 2 — Push and open a draft PR (default)

```bash
git push -u origin feature/[story-slug]
```

Create the draft PR:

```bash
gh pr create \
  --title "[story title]" \
  --draft \
  --body "$(cat <<'EOF'
## Story
[Path: .github/artefacts/[feature]/stories/[story-slug].md]

## ACs satisfied
[List each AC from the story with ✅]

## Test plan
[Path: .github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md]

## DoR
[Path: .github/artefacts/[feature]/dor/[story-slug]-dor.md]

## Notes
[Any ambiguities encountered during implementation — if none, write "None"]
EOF
)"
```

**Draft only. Do not mark ready for review.** That is a human action.

Report:

> ✅ Draft PR opened: [PR URL]
>
> Next: after the PR is merged, run /definition-of-done.

Then: cleanup worktree (Step 5).

---

### Option 3 — Keep as-is

> Branch `feature/[story-slug]` kept at [path].
> Worktree preserved.

Do not cleanup worktree.

---

### Option 4 — Discard

**Confirm first:**

> This will permanently delete:
> - Branch `feature/[story-slug]`
> - All commits: [git log --oneline output]
> - Worktree at: [path]
>
> Type **discard** to confirm.

Wait for the exact word "discard". Do not proceed on "yes" or any other input.

If confirmed:

```bash
git checkout [base-branch]
git branch -D feature/[story-slug]
```

Then: cleanup worktree (Step 5).

---

## Step 5 — Cleanup worktree

**For Options 1, 2, and 4 only:**

```bash
git worktree list | grep feature/[story-slug]
git worktree remove [worktree-path]
```

**For Option 3:** keep the worktree.

---

## Quick reference

| Option | Merge | Push | Draft PR | Keep worktree | Remove branch |
|--------|-------|------|----------|---------------|---------------|
| 1. Merge locally | ✓ | — | — | — | ✓ |
| 2. Draft PR | — | ✓ | ✓ (draft) | — | — |
| 3. Keep branch | — | — | — | ✓ | — |
| 4. Discard | — | — | — | — | ✓ (force) |

---

## Red flags

**Never:**

- Open a PR without /verify-completion passing in this session
- Mark a PR as ready for review (always draft — merge is a human action)
- Merge without verifying tests on the merged result
- Delete work without explicit typed confirmation ("discard")
- Force-push without explicit request

---

## Integration

**Requires:** /verify-completion passed in this session
**Follows:** /verify-completion
**Precedes:** /definition-of-done (run after the PR is merged)
**Cleanup for:** /branch-setup worktree

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** after the chosen option is executed:

- **Draft PR opened:** set story `stage: "branch-complete"`, `prStatus: "draft"`, `prUrl: "[url]"`, `health: "green"`, `updatedAt: [now]`
- **PR opened (ready for review):** set `prStatus: "open"`, `prUrl: "[url]"`
- **Merged locally:** set `stage: "branch-complete"`, `prStatus: "merged"`, `health: "green"`
- **Branch kept / discarded:** set `stage: "verify-completion"` (no PR yet)

**Human action note:** When a human merges the PR, update `prStatus: "merged"` in the state file, or run `/workflow` to reconcile — it will detect the merge from artefacts.
