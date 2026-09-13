# Test Plan: Lazily refresh a tenant's local repo checkout on active web UI access (rclr-s1)

**Story:** artefacts/2026-09-13-repo-checkout-lazy-refresh/stories/rclr-s1-lazy-git-pull-on-active-session.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-rclr-s1-repo-freshness.js`, unit-testing the new `repo-freshness.js` module directly (injecting a fake `exec`/`now`), plus an integration-style test on `journey.js`'s `_readPipelineFeatures` confirming it calls the refresh hook.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | First call for a fresh `repoRoot` runs `git pull --ff-only` with the correct `cwd` |
| T2 | AC2 | Behavioural | A second call for the same `repoRoot` within `ttlMs` does not invoke `exec` again |
| T3 | AC2 | Behavioural | A call for the same `repoRoot` after `ttlMs` has elapsed (using an injected fake clock) DOES invoke `exec` again |
| T4 | AC3 | Behavioural | An `exec` that throws is caught; `ensureRepoFresh` returns `{ pulled: false, reason: 'pull-failed', ... }` and does not throw |
| T5 | AC4 | Behavioural | The exact command string passed to `exec` is `git pull --ff-only` (never `--rebase`, `reset --hard`, or any other variant) |
| T6 | AC5 | Behavioural | Refreshing `repoRoot` A does not affect the TTL state for a different `repoRoot` B — B still triggers its own first pull |
| T7 | AC6 | Integration | `_readPipelineFeatures(root)` (via `journey.js`, with `repo-freshness.js`'s `ensureRepoFresh` monkey-patched in the require cache) calls the refresh hook before reading the file |
| T8 | AC6 | Integration | When the monkey-patched `ensureRepoFresh` throws, `_readPipelineFeatures` still successfully reads and returns the file's real contents (never propagates the refresh failure) |

## Regression coverage

- Full existing `journey.js`-touching test suites re-run unmodified (no existing test asserts on `_readPipelineFeatures`'s exact internals beyond its return value, so no changes expected there).

## Out of Scope (per story)

- Background/scheduled polling.
- `getRepoRoot`'s own resolution logic.
- `skills.js`'s existing git add/commit flow.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
