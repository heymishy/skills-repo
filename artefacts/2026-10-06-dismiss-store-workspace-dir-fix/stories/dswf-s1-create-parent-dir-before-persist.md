# Story: dismissed-signals-store's _persist() must create its parent directory before writing

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real, live-confirmed production incident below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator (or any real user) clicking "Dismiss" on a signal in a real deployed environment (staging or production)**,
I want **the dismiss action to actually succeed and persist**,
So that **`sptu-s4`'s own dismiss/mark-reviewed feature (merged, DoD-marked COMPLETE 2026-10-05) works at all outside a local dev checkout — right now it 500s on every real deployment**.

## Benefit Linkage

**Metric moved:** Metric 3 — Dismiss retention (`artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md`). `sptu-s4`'s own DoD marked this `on-track` based on local/integration-real-code evidence only; a real live-staging check (2026-10-05, via Claude-in-Chrome against `https://wuce-staging.fly.dev`, at the operator's explicit request) found the feature completely non-functional in that environment — every dismiss attempt returns a bare, unstyled "Internal Server Error". This story restores the metric's real-world validity, not just its locally-measured value.
**How:** Confirmed via real `fly logs --app wuce-staging --no-tail` output, not guessed:
```
[authGuard] unhandled error in protected route handler: Error: ENOENT: no such file or directory, open '/app/workspace/dismissed-signals.json'
    at Object.writeFileSync (node:fs:2380:20)
    at _persist (/app/src/web-ui/modules/dismissed-signals-store.js:81:8)
    at Object.dismiss (/app/src/web-ui/modules/dismissed-signals-store.js:85:48)
    at Object.dismiss (/app/src/web-ui/modules/dismissed-signals-store.js:49:18)
    at handlePostDismissSignal (/app/src/web-ui/routes/signals-panel.js:125:19)
```

## Architecture Constraints

**Root cause, fully confirmed (not speculative):** `Dockerfile`'s production stage (lines 25-59) uses an explicit `COPY` allowlist — `src/`, `skills/`, `product/`, `artefacts/`, `.github/`, plus a few named files. `workspace/` is not in that list. `fs.writeFileSync()` does not create missing parent directories, so `dismissed-signals-store.js`'s `_persist()` (line 81) throws `ENOENT` the instant it's called in any environment built from this Dockerfile — staging and production alike, since both use the same image.

**This is a recurring, already-documented pattern in this exact codebase, not a novel failure mode.** The Dockerfile's own comment above the `artefacts/`/`.github/` `COPY` lines (added by `daga-s1`, confirmed by a real authenticated production check 2026-09-05) states explicitly: "`.dockerignore` only governs the build CONTEXT; it does not put anything into the image by itself" — a prior story hit this identical class of bug for a different pair of directories. This story is the same root cause recurring for `workspace/`.

**The correct fix pattern is already established twice in this codebase** — `server.js:2750` (`_fsForDurable.mkdirSync(_path.dirname(durableArtefactAbsPath), { recursive: true })`) and `modules/reference-validator.js:54` (`fs.mkdirSync(refDir, { recursive: true })`) both create their target's parent directory immediately before writing a runtime-generated file. `dismissed-signals-store.js`'s `_persist()` must follow the same pattern.

**Explicitly NOT the fix:** adding `workspace/` to the Dockerfile's `COPY` allowlist. `workspace/` is this repo's own local development/session-artifact directory (`capture-log.md`, `learnings.md`, `state.json`, etc.) — copying it wholesale into the production image would bake this repo's own meta-development history into the deployed app, which is a different and much larger architectural change than this bug warrants. The runtime-writable state file needs to ensure its own directory exists at write-time; it does not need its (irrelevant, local-only) sibling files to be deployed.

## Dependencies

- **Upstream:** `sptu-s4` (`artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md`) — merged, PR #942, DoD-marked COMPLETE 2026-10-05. This story is a direct follow-up fix to that story's own shipped code.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `workspace/dismissed-signals.json`'s containing directory does not exist on disk, When `createFsDismissedSignalsStoreAdapter(filePath)`'s returned `dismiss(key)` or `undismiss(key)` is called, Then the write succeeds (the directory is created first) rather than throwing `ENOENT` — matching the existing `mkdirSync({recursive:true})`-before-write pattern already used in `server.js`/`reference-validator.js`.

**AC2:** Given the directory already exists (the common case — every local dev checkout), When `dismiss`/`undismiss` is called, Then behaviour is unchanged from before this fix — `mkdirSync` with `{ recursive: true }` is a safe no-op when the target already exists, confirmed by Node's own documented behaviour and by a dedicated test.

**AC3:** Given this repo's own real `sptu-s4` test suite (`tests/check-sptu-s4-signals-dismiss.js`, 14 tests, all currently passing), When this fix is applied, Then all 14 tests still pass unchanged — this is an additive safety fix, not a behavioural change to any already-tested path.

**AC4:** Given the fixed code deployed to real `wuce-staging` (re-verified live via Claude-in-Chrome, not just CI), When an operator clicks "Dismiss" on a real signal, Then the signal is actually removed from the default view (not a 500), and this is confirmed by checking real `fly logs` for the absence of any new `ENOENT`/`dismissed-signals-store` error after the fix is live.

## Out of Scope

- Any change to the Dockerfile's `COPY` allowlist (see Architecture Constraints — explicitly rejected approach for this bug).
- Any change to `dismissed-signals-store.js`'s own D37 stub-throws-when-unwired behaviour — that is correct and unrelated to this bug.
- A broader audit of every other file-write call site in this codebase for the same missing-`mkdirSync` gap — worth a dedicated `/improve` pass given this is now a 3rd occurrence of the same root-cause class (artefacts/.github via `daga-s1`, now workspace/ via this story), but that audit is a separate, larger piece of work than this one-line fix.

## NFRs

- **Performance:** Negligible — `fs.mkdirSync` with an already-existing directory is a fast stat-and-return; this adds one syscall to the existing write path, not a new I/O round-trip class.
- **Security:** None identified — no new input surface, no new file permissions; the directory is created with default (inherited) permissions matching every other `mkdirSync({recursive:true})` call already in this codebase.
- **Accessibility:** N/A — no UI change.
- **Audit:** N/A — no new loggable event beyond the fix itself resolving the existing error log noise.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
