# Design: Web UI Pipeline-State Durability

**Status:** Approved
**Date:** 2026-09-15
**Feature slug:** 2026-09-15-web-ui-pipeline-state-durability

---

## Reference Materials

None in `artefacts/[feature]/reference/` — this feature originates from direct investigation this session (live-tested against production), not from a pre-existing wireframe or spec.

---

## Solution Architecture

### System Components

A second implementation of the existing `pipelineStateWriter(featureSlug, storyId, stateUpdate)` contract already defined and called by `src/web-ui/routes/journey.js:2577`. No call-site change. `server.js` selects which implementation to wire at startup, based on the same `isRealCheckout` signal `pipeline-state-writer.js` already computes:

```
journey.js (unchanged call site)
  │
  │ _pipelineStateWriter(featureSlug, storyId, stateUpdate)
  ▼
server.js startup wiring (new: environment-based selection)
  │
  ├─ isRealCheckout === true  (local dev / CLI worktree)
  │    → existing pipeline-state-writer.js (fs.readFileSync/writeFileSync, unchanged)
  │
  └─ isRealCheckout === false (production container, no .git/)
       → NEW: pipeline-state-github-writer.js
            │
            ├─ 1. GET /repos/:owner/:repo/contents/.github/pipeline-state.json
            │      (via octokit, same client artefact-commit-writer.js already
            │      constructs from req.session.accessToken)
            ├─ 2. base64-decode, JSON.parse
            ├─ 3. apply the SAME field-update logic pipeline-state-writer.js
            │      already has (feature-level fields directly; story-level
            │      fields via the existing advance() validation/enum-check
            │      logic, now operating on the in-memory object instead of
            │      reading from disk)
            ├─ 4. JSON.stringify, base64-encode
            ├─ 5. PUT /repos/:owner/:repo/contents/.github/pipeline-state.json
            │      { content, sha: <the sha from step 1>, message }
            │
            └─ on 409/422 (sha mismatch -- someone else wrote first):
                 retry from step 1, up to 3 attempts, short backoff
                 (150ms, 400ms) -- mirrors the retry-on-pre-first-chunk-
                 failure precedent already in this codebase (sstr-s1)
                 rather than inventing a new backoff shape
```

### Data and State

No schema change. Same `.github/pipeline-state.json` shape, same `advance()` validation rules (enum checks, prototype-pollution guard, epic-nested vs flat story lookup) — reused, not reimplemented, by extracting `advance()`'s core mutation logic into a form that can operate on an already-in-memory state object as well as a file path. `cli-advance.js`'s existing file-based entry point becomes a thin wrapper around that shared core, so CLI behaviour is provably unchanged (same function, same tests, just no longer the *only* caller).

### Hosting / Runtime

No new service. Runs inside the existing web UI process, invoked from the same `journey.js` code path that already calls the local-fs writer today.

### Key Build Decisions

See Decisions and Rationale below — the central choice is GitHub Contents API (stateless, per-operator-authenticated, safe under N concurrent container replicas) over either re-provisioning the container with a real local git checkout, or a queue-plus-background-drain architecture.

### Non-Functional Requirements

- **Concurrency safety:** the GitHub API's `sha`-based optimistic concurrency check is the sole safety mechanism (no additional distributed lock) — judged sufficient given real write concurrency on a single feature's state is low (one operator's session at a time, in practice), and a retried write is strictly safer than a queue-based approach's silent staleness.
- **Latency:** the write already happens off the user-visible response path today (fire-and-forget from `journey.js`'s own `try/catch`) and stays that way — a slower (network-bound, ~1-2s typical) write is invisible to the operator, same as the existing fast local-fs write already is.
- **Observability:** a write that exhausts its retries must produce a signal beyond the existing server-only `console.error` — see Category: Silent-Failure Elimination below.

---

## UX / Interaction Design

Not applicable — no new operator-facing UI. This is a backend persistence-path fix; the operator's experience (create/progress a feature in the web UI) is unchanged. The only observable difference is that pipeline-state.json now actually gets updated, and that a genuine failure becomes visible via the new capture signal instead of vanishing into a server log.

---

## Key Decisions and Open Questions

### Decisions Made

1. **GitHub Contents API over a local git checkout in the container.** Reintroducing `.git/` into the production image (or cloning at container boot) would resurrect exactly the failure mode `isRealCheckout`'s own comment already documents as the reason for the current safety check: multiple container instances each holding independently-mutable local git state, with no coordination between them, risking lost commits on restart/redeploy and divergent local history across replicas. The GitHub API approach holds no local mutable state at all — every write is a single, atomic, remotely-authoritative operation, safe by construction across any number of replicas.
2. **GitHub Contents API over a queue + background drain worker.** A queue decouples the write from the request path (already achieved today via fire-and-forget) but trades a hard, retryable, visible failure for silent eventual-consistency staleness, and adds a new component (queue table, drain worker, its own monitoring) this MVP does not need. Rejected.
3. **Reuse `req.session.accessToken` — no new credential.** `artefact-commit-writer.js` already authenticates GitHub Contents API writes this way for artefact files; the same operator identity and permission scope apply directly to `.github/pipeline-state.json`, a file in the same repository.
4. **Full-file read-modify-write, not a JSON-patch/diff approach.** GitHub's Contents API operates on whole file contents; this repo's own CLI-side `advance()` already does full-file read-modify-write locally for every single field update. This feature extends that same granularity to a second write path rather than introducing a different one — consistent, not a new inconsistency.
5. **Silent-failure fix: PostHog capture on exhausted retry**, consistent with the precedent this session already established for a different silent-failure class (`ltd-s1`, `$ai_is_error`/`$ai_error` on an unparseable LLM verdict) — reuses an existing, already-wired capture mechanism rather than introducing a new alerting channel.

### Open Questions / Deferred

1. **Real-time alerting on a write failure** (vs. "findable after the fact" via PostHog) — deferred; the benefit-metric's own Minimum Signal only requires the failure to be queryable, not immediately pushed to the operator. Revisit if production experience shows failures are frequent enough to need faster visibility.
2. **`pipeline-state.json` file-size growth over time** (currently ~1.5MB, full-file-rewritten on every write, on two write paths now instead of one) — explicitly out of scope for this feature (see discovery's Out of Scope); a real concern for a future "split into per-feature files" initiative, not blocking here since this feature does not make the existing characteristic worse.

### Assumptions Taken

1. **GitHub API rate limits are not a practical concern at current write volume** — this repo's own artefact-commit-writer.js already performs comparable per-turn API writes for story/review files without rate-limit issues observed; pipeline-state writes add to that same budget, not a new one.
2. **`advance()`'s core mutation logic can be extracted from its current file-path-only interface without behavioural change** — verified feasible by reading the actual implementation (`src/enforcement/cli-advance.js`) during this design pass; confirmed at implementation time via the existing CLI-side test suite passing unchanged.

---

## Decisions and Rationale

| Decision | Rationale |
|----------|-----------|
| GitHub Contents API, not local git in the container | Stateless per-write, safe under N replicas, no lost-commit risk on restart |
| GitHub Contents API, not a queue + drain worker | Hard, retryable failure beats silent eventual-consistency staleness; no new infrastructure |
| Reuse `req.session.accessToken` | Same credential and permission scope already used for artefact commits — no new secret |
| Retry-on-409 with short backoff (150ms/400ms, 3 attempts) | Mirrors the existing `sstr-s1` retry precedent in this codebase rather than inventing a new shape |
| PostHog capture on exhausted retry | Reuses the exact silent-failure-fix pattern already shipped this session for `ltd-s1` |
