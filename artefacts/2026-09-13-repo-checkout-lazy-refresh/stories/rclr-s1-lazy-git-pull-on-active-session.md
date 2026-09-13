## Story: Lazily refresh a tenant's local repo checkout on active web UI access, instead of only at deploy time

**Epic reference:** None — short-track (bounded backend fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator viewing pipeline-state-derived data (the `/journey` "No product work" list, `/dashboard`'s no-product-work indicator) in the live web app**,
I want **that data to reflect a recent `git pull` of the connected repo, refreshed lazily when I'm actually using the app — not only when the app itself gets redeployed**,
So that **a feature I create or advance via the CLI/git (e.g. a new discovery artefact, a story reaching `definition-of-done`) becomes visible in the web UI within minutes, not only after the next production deploy**.

## Benefit Linkage

**Metric moved:** None formal — operational/infrastructure fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap the operator found first-hand (2026-09-13): a discovery artefact created and pushed to GitHub did not appear anywhere in the live `skills-framework.fly.dev` app. Root-caused to `_readPipelineFeatures()` (`journey.js`) reading a local git checkout on the server that is never told to `git pull` — it only ever advances via a full app redeploy, and production deploys to `skills-framework` require the operator's own manual approval (`bri-s2.6`'s environment-protection gate). Several real merges (PR #877, plus multiple bookkeeping-only commits) were sitting unseen in the live app at the time this was found.

## Architecture Constraints

- **Single point of control**: wire the refresh into `_readPipelineFeatures(root)` in `src/web-ui/routes/journey.js` — the one function both `/journey`'s listing (via `_mergeStateFeaturesIntoJourneyList`) and `/dashboard`'s no-product-work indicator (via `_hasUnbackfilledCliFeatures` in `products.js`) already funnel through. No other call site needs to change.
- **New module**: `src/web-ui/adapters/repo-freshness.js`, exporting `ensureRepoFresh(repoRoot, deps)`. `deps` (all optional, for testability) may override `now` (clock function), `exec` (command-runner function), and `ttlMs` (refresh interval, default 2 minutes).
- **Lazy, per-repo, request-triggered only — no background poller.** The operator specifically asked for this: refresh cadence applies "for that repo connected, and only [while a] user is active on a web UI session with that repo." `ensureRepoFresh` must only ever be invoked from the real request-serving read path (inside `_readPipelineFeatures`) — never from a standalone timer, cron job, or startup task. An idle tenant's repo is never pulled. Each distinct `repoRoot` value tracks its own last-refresh time independently (an in-memory map keyed by the resolved path) — refreshing tenant A's checkout must never suppress or trigger a refresh for tenant B's.
- **Safety-critical: `git pull --ff-only`, never a destructive reset or rebase.** `src/web-ui/routes/skills.js` already runs real `git add`/`git commit` against this exact same local checkout when a skill session saves an artefact (line ~1480-1481) — meaning the checkout can legitimately hold real, locally-committed-but-not-yet-pushed work at the moment a refresh is attempted. `--ff-only` fails safely (non-zero exit, caught and logged) rather than discarding anything when the local branch has diverged from `origin` for this reason. Do not use `--rebase`, `reset --hard`, or any other flag/strategy that could rewrite or discard local commits.
- **Never throws to the caller.** A failed pull (network failure, diverged history, no repo present, `git` not installed) must be caught inside `ensureRepoFresh` and returned as a result value, never thrown — `_readPipelineFeatures` must still attempt to read and return whatever `pipeline-state.json` currently exists on disk, exactly as it does today, regardless of whether the refresh succeeded.
- **No change to `skills.js`'s own git add/commit flow, or to `getRepoRoot`'s own resolution logic** — this story only adds a refresh check ahead of one existing read, it does not change how the repo root path itself is determined.

## Dependencies

- **Upstream:** None — `_readPipelineFeatures` and the tenant-scoped local checkout both already exist.
- **Downstream:** None known. Both real callers (`/journey`, `/dashboard`) already tolerate `_readPipelineFeatures` returning `null` or stale data (that's today's behaviour) — this story only narrows the staleness window, it does not change either caller's own handling of the result.

## Acceptance Criteria

**AC1:** Given `ensureRepoFresh(repoRoot)` is called for a `repoRoot` with no prior recorded refresh attempt, When invoked, Then it runs `git pull --ff-only` with `cwd: repoRoot`.

**AC2:** Given `ensureRepoFresh(repoRoot)` was already called for that same `repoRoot` less than `ttlMs` ago (regardless of whether that attempt succeeded), When called again within the TTL window, Then it does NOT run `git pull` again.

**AC3:** Given the underlying `git pull` command fails (throws), When `ensureRepoFresh` is called, Then the failure is caught and returned as a result value (e.g. `{ pulled: false, reason: 'pull-failed' }`) — it is never thrown to the caller.

**AC4:** Given any successful or failed refresh attempt, When inspecting the exact command executed, Then it is `git pull --ff-only` — never a rebase, a hard reset, or any other history-rewriting strategy.

**AC5:** Given `ensureRepoFresh` is called for two different `repoRoot` values in quick succession, When the first call triggers a real pull, Then the second call (a different `repoRoot`) is unaffected by the first's refresh timestamp and evaluates independently.

**AC6:** Given `_readPipelineFeatures(root)` is called, When it executes, Then it calls `ensureRepoFresh` before reading `pipeline-state.json` from disk, and a failure from `ensureRepoFresh` never prevents the subsequent file read from still being attempted.

## Out of Scope

- Any background/scheduled polling mechanism — explicitly rejected per the operator's own framing ("only user is active on a web ui session with that repo").
- Changing `getRepoRoot`'s own path-resolution logic, or `skills.js`'s existing git add/commit artefact-save flow.
- Refreshing any repo the operator is not actively viewing via a live web UI request.
- A UI-visible "last synced" indicator for this specific refresh (the existing `sync-freshness.js`/`synced_at` mechanism is a separate, Postgres-backed product-rollup concept, not part of this story).

## NFRs

- **Performance:** the TTL check itself must be a cheap in-memory lookup; only a stale `repoRoot` triggers an actual (bounded, timeout-protected) `git pull`. The default 2-minute TTL and a short process timeout on the `git pull` call keep worst-case added request latency bounded and infrequent.
- **Security:** no new external input surface — `repoRoot` is already a server-resolved, tenant-scoped path (from `getRepoRoot`), never taken directly from request data.
- **Availability:** a failing or slow `git pull` must never take down the `/journey` or `/dashboard` page — AC3 and AC6 together guarantee the page still renders using whatever is currently on disk.

## Complexity Rating

**Rating:** 2 — small in code size, but the safety constraint (never touching a checkout that may hold real local-only commits from an in-progress skill session) requires real care in the git invocation and test coverage.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
