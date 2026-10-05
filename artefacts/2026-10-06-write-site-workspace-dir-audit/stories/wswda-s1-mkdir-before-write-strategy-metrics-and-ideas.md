# Story: Create the target directory before writing strategy-metrics and file-backed ideas data

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real, code-confirmed findings below, from the `/improve` audit named in `dswf-s1`'s own Out of Scope and DoD Observations (`artefacts/2026-10-06-dismiss-store-workspace-dir-fix/`)
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator completing a real `/ideate` or `/discovery` session, or using the file-backed ideas fallback, in any real deployed environment**,
I want **the resulting metric/data write to actually succeed**,
So that **the callout-rate metric and the file-backed ideas fallback behave the same in production as they do locally, instead of silently failing every time**.

## Benefit Linkage

**No formal benefit-metric is moved** (short-track, no user-facing behaviour change for the primary flows involved) — this is a reliability fix for two write paths that already exist and are already supposed to work, following the exact precedent and benefit rationale of `dswf-s1` (`artefacts/2026-10-06-dismiss-store-workspace-dir-fix/`), which is itself the direct prior occurrence of this exact root cause.
**How:** Confirmed by direct code read, not guessed:
1. `src/web-ui/modules/strategy-metrics.js`'s `initMetricsFile`/`recordMetrics` write to `path.join(workspaceDir, 'strategy-metrics.json')` with no `mkdirSync` guard. Both real call sites — `routes/journey.js:2630` and `routes/skills.js:5504` — pass `path.join(repoRoot, 'workspace')` as `workspaceDir` and run on every real `/ideate`/`/discovery` completion. Both wrap the call in try/catch and only `console.error` the failure (`'[strategy-metrics] recordMetrics failed:'`), so the resulting `ENOENT` (identical in shape to `dswf-s1`'s own confirmed production error — `workspace/` is not in the Dockerfile's production-stage `COPY` allowlist) is silently swallowed on every single real deployment. The callout-rate metric this code exists to collect has in all likelihood never recorded one real entry outside a local dev checkout.
2. `src/web-ui/routes/features.js`'s `_writeIdeasFile` writes to `IDEAS_PATH = path.join(__dirname, '..', '..', '..', 'workspace', 'ideas.json')` with no `mkdirSync` guard. This path is currently **dormant** in production: `server.js` (~line 916) wires `setIdeasStore()` to the real Postgres-backed adapter whenever `process.env.DATABASE_URL` is set, which it is on `wuce-staging` — so the file-backed fallback is dead code there today. It is the same root-cause class and would fail identically (silent in `createIdea`/`deleteIdea`'s callers, since neither route handler using it wraps the call — see AC2) the moment this code runs in any environment without `DATABASE_URL` configured.

## Architecture Constraints

**Root cause — the same class, now its 3rd and 4th occurrence in this codebase.** `fs.writeFileSync()` does not create missing parent directories. `workspace/` is not in the Dockerfile's production-stage `COPY` allowlist (confirmed in `dswf-s1`'s own story, itself following the `daga-s1`-documented `artefacts/`/`.github/` precedent). Any code that writes a runtime-generated file under `workspace/` without first creating that directory will throw `ENOENT` in any environment built from this Dockerfile.

**The correct fix pattern is already established three times in this codebase** — `server.js:2750`, `modules/reference-validator.js:54`, and `web-ui/modules/dismissed-signals-store.js:88` (`dswf-s1`'s own fix) all call `fs.mkdirSync(path.dirname(filePath), { recursive: true })` (or the equivalent directory-only form) immediately before the write. Both findings in this story follow the same pattern.

**Explicitly NOT the fix:** adding `workspace/` to the Dockerfile's `COPY` allowlist — same rejection rationale as `dswf-s1`'s own `decisions.md` (copying this repo's own local session-artifact directory into the production image is a different and much larger architectural change than this bug warrants, with real content-leakage implications).

**Scope boundary for finding 2 (`features.js`):** since the file-backed ideas path is reachable in principle (any environment without `DATABASE_URL`, including a possible future local-no-DB deployment tier), this story fixes the write-site defensively but does not change the DB-vs-file selection logic itself — that selection (`idp-s1`'s own D37 design) is correct and unrelated to this bug.

## Dependencies

- **Upstream:** `dswf-s1` (`artefacts/2026-10-06-dismiss-store-workspace-dir-fix/`) — merged, PR #943, DoD-marked COMPLETE 2026-10-06. This story is the direct follow-up audit named in that story's own Out of Scope and DoD Observations.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `workspace/strategy-metrics.json`'s containing directory does not exist on disk, When `recordMetrics(workspaceDir, payload)` is called (directly, or via either of its two real call sites in `routes/journey.js` or `routes/skills.js`), Then the write succeeds (the directory is created first) rather than throwing `ENOENT`.

**AC2:** Given `workspace/ideas.json`'s containing directory does not exist on disk, When the default file-backed `_ideasStore.createIdea`/`deleteIdea` is invoked (i.e. `DATABASE_URL` unset), Then the write succeeds rather than throwing `ENOENT` — note neither `handlePostIdea` nor `handleDeleteIdea` in `routes/features.js` currently wraps this call in try/catch, so today this would be a genuine unhandled-exception 500, not a silently-swallowed failure like finding 1; this AC closes that path before it can ever manifest live.

**AC3:** Given the directory already exists (the common case — every local dev checkout, and every environment with `DATABASE_URL` set for finding 2's dead-code path), When either write path runs, Then behaviour is unchanged from before this fix — `mkdirSync` with `{ recursive: true }` is a safe, already-twice-tested no-op on an existing directory.

**AC4:** Given this repo's own real existing test suites that exercise these two modules (`strategy-metrics.js`'s own test file and `features.js`'s own ideas tests, enumerated at `/test-plan`), When this fix is applied, Then all pre-existing tests still pass unchanged — this is an additive safety fix, not a behavioural change to any already-tested path.

## Out of Scope

- Any change to the Dockerfile's `COPY` allowlist (see Architecture Constraints).
- Any change to `idp-s1`'s own DB-vs-file selection logic in `features.js`, or to the Postgres-backed ideas adapter itself.
- `skills.js:2907`'s `realApplyCanvasEdits` write — audited and confirmed NOT a gap: `session.artefactPath` is always first established via the already-guarded auto-save write at `skills.js:5474` (`fs.mkdirSync` already present there), so by the time a canvas edit can occur, the artefact's directory is already guaranteed to exist. No fix needed; recorded here so this audit's scope is traceable.
- `src/approval-channel/adapters/{jira,teams}-adapter.js` — audited and confirmed out of scope: neither module is required anywhere under `src/web-ui/`, only by `src/enforcement/mcp-adapter.js`, which is not required by the running web-ui server either. These run via CLI/agent tooling against a full git checkout, not inside the deployed production container, so they do not share this risk class.
- CLI-only tooling under `src/enforcement/cli-*`, `src/distribution/`, `src/improvement-agent/` — audited and confirmed out of scope for the same reason (operator/CI-invoked against a full checkout), with the single exception of `cli-advance.js`'s `tmpPath` write (used by `web-ui/adapters/pipeline-state-writer.js`, which IS required by the running server) — confirmed safe, since its target directory is `.github/`, which IS in the Dockerfile's `COPY` allowlist.
- A further, broader audit beyond `src/web-ui/**`'s own write call sites — this story's own audit was scoped to files reachable from the running production server process (traced via `require()` graph from `server.js`), which is the risk class that actually matters for this bug pattern. Any future write site added under `src/web-ui/**` should follow the same `mkdirSync`-before-write convention as a matter of course, not require a fresh audit each time.

## NFRs

- **Performance:** Negligible — same rationale as `dswf-s1`: `fs.mkdirSync` on an already-existing directory is a fast no-op, adding one syscall to each write path.
- **Security:** None identified — no new input surface; directories created with default inherited permissions, matching the existing three precedent call sites.
- **Accessibility:** N/A — no UI change.
- **Audit:** N/A — no new loggable event; this fix removes a class of silent failure rather than adding new logging.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
