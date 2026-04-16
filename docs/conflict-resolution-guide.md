# Conflict Resolution Guide

Patterns for resolving the most common PR merge conflicts in this repository. Each pattern includes the conflict shape, the safe resolution, and the rationale.

---

## Pattern 1 — `package.json` scripts (sequential additions)

### When it occurs

Two branches each add a new entry to the `scripts` block in `package.json`. On merge, git cannot determine which entry should be first.

### Conflict shape

```json
<<<<<<< HEAD
    "check-foo": "node tests/check-foo.js",
    "test": "..."
=======
    "check-bar": "node tests/check-bar.js",
    "test": "..."
>>>>>>> feature-branch
```

### Safe resolution

Keep **both** new script entries. Do not discard either. The `"test"` aggregate runner block (if present) must include both new scripts in the pipeline.

```json
    "check-foo": "node tests/check-foo.js",
    "check-bar": "node tests/check-bar.js",
    "test": "node tests/check-foo.js && node tests/check-bar.js && ..."
```

**Order:** if both scripts are new and order is not constrained by dependencies, append in merge-chronological order (master branch entry first, incoming branch entry second).

### Rationale

Each script is an independent governance check. Dropping either is a silent governance regression — the removed check stops running in CI without any visible error. Always include both.

---

## Pattern 2 — `.github/workflows/` filename collision

### When it occurs

Two branches each add a new workflow file with the same filename (e.g. both name their file `check-new-feature.yml`). On merge, git reports a conflict in the working tree (rather than a standard three-way conflict marker) because the files are binary-equivalent in structure but contain different content.

### Conflict shape

Git may report one of:
- `CONFLICT (add/add): Merge conflict in .github/workflows/check-new-feature.yml`
- Both versions left as `check-new-feature.yml` and `check-new-feature.yml~HEAD` in the working tree

### Safe resolution

1. Inspect both versions: `git show HEAD:.github/workflows/check-new-feature.yml` and `git show MERGE_HEAD:.github/workflows/check-new-feature.yml`
2. If the workflows serve different purposes: **rename one** to a unique name before staging (e.g. `check-new-feature-a.yml` and `check-new-feature-b.yml`), then update any cross-references.
3. If the workflows are duplicates (same intent, slight variation): keep the more complete version and discard the other. Add a PR comment explaining the decision.
4. Never silently overwrite — always confirm with the PR author before discarding a workflow.

### Rationale

Silently overwriting a workflow drops a CI gate with no visible failure. Duplicate filenames also create ambiguous trigger conditions in GitHub Actions. Name conflicts must be resolved explicitly, not by last-write-wins.

---

## General rules

- **Never discard without confirming.** If you are unsure which side to keep, add a PR comment asking the author before resolving.
- **Re-run `npm test` after resolving.** Merge conflicts in `package.json` or workflow files can introduce silent failures that only surface when the test suite runs.
- **Record unusual resolutions in `workspace/learnings.md`** if they required judgment calls not covered by this guide.
