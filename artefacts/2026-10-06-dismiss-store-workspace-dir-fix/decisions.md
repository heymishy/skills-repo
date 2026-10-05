# Decisions: dismiss-store workspace-dir fix

## Short-track exemption (2026-10-06)

**Context:** A production-breaking bug was found via a real, live, authenticated Claude-in-Chrome check against `wuce-staging` (at the operator's explicit request, following their "Validated on Chrome? On staging?" question) — dismissing a signal 500s on every real deployed environment, confirmed via real `fly logs` output showing `ENOENT: ... open '/app/workspace/dismissed-signals.json'`.
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`), per CLAUDE.md's own short-track path for "bugs, small fixes, bounded refactors" — this is a one-line, well-understood fix (add `fs.mkdirSync(path.dirname(filePath), { recursive: true })` before the existing `fs.writeFileSync` call in `_persist()`), not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent (`tvpf-s1`, 2026-10-04) for exactly this class of situation — a real, root-caused, narrowly-scoped bug found mid-session, fixed immediately rather than deferred, following the governed short-track path rather than skipping process entirely.
**Made by:** Hamish King (operator decision, "Fix now as a short-track story"), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## Architectural choice: fix the write-site, not the Dockerfile's COPY allowlist (2026-10-06)

**Context:** Two fixes were possible: (a) add `workspace/` to the Dockerfile's production-stage `COPY` allowlist, making the directory exist at image-build time; or (b) make `dismissed-signals-store.js`'s own `_persist()` create its target's parent directory defensively at write-time, matching the `mkdirSync({recursive:true})` pattern already used in `server.js:2750` and `modules/reference-validator.js:54`.
**Decision:** Option (b) — fix the write-site only. No Dockerfile change.
**Rationale:** `workspace/` is this repo's own local development/session-artifact directory (`capture-log.md`, `learnings.md`, `state.json`, design docs, etc.) — copying it wholesale into the production image would bake this repo's entire meta-development history into the deployed app, a much larger and architecturally different change than this bug warrants, and one with real content-leakage implications (internal session notes, decisions, learnings shipped in a production container image). The runtime-writable state file this story actually cares about needs only its own directory to exist; it does not need any of its irrelevant sibling files deployed. This also matches the already-established, twice-precedented pattern in this exact codebase for "a runtime-generated file's directory may not exist in a fresh/minimal deployment — create it defensively at write-time," rather than reopening the Dockerfile's own curated-allowlist design (itself a deliberate choice, per the `daga-s1`-authored comment directly above the `COPY artefacts/`/`COPY .github/` lines).
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## RISK-ACCEPT: pre-existing, unrelated discovery_approved failure (2026-10-06, dswf-s1 branch-setup)

**Context:** `/branch-setup`'s clean-baseline run for `dswf-s1` (`.worktrees/dswf-s1`, freshly created from `master`, zero diff) found 1 failing file: `tests/check-p3.5-validate-trace.js`, specifically `ps1-real-repo-discovery-approved-has-no-known-false-positives` and `ps1-exits-0-on-valid-repo-with-ci-flag`. Both fail for the same real, already-identified reason: `2026-10-05-customer-journey-as-first-class`'s `discovery.md` genuinely still says `Status: Draft` — this is the same feature whose `pipeline-state.json` schema fields were patched earlier in this session (at the operator's explicit instruction to patch only those fields, not touch the feature's own `discovery.md` content or status). This is unrelated to `dswf-s1`'s own scope (a one-line fix to `dismissed-signals-store.js`).
**Decision:** Acknowledge as pre-existing/unrelated and proceed with the inner coding loop for `dswf-s1` without attempting to resolve that other feature's own Draft status — that remains out of scope per the operator's own earlier explicit instruction.
**Rationale:** Consistent with this session's own established RISK-ACCEPT pattern for pre-existing, unrelated baseline failures (`sptu-s1`/`sptu-s3`/`sptu-s4`'s own branch-setup entries). The failure is real and already understood, not a new or mysterious regression.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found during `/branch-setup`, 2026-10-06.

## RISK-ACCEPT: pre-existing, environment-load perf-floor flake recurred during Task 1's full-suite run (2026-10-06)

**Context:** `tests/check-pcr-s1-test-runner.js`'s `N1-perf-per-file-average-within-110pct` NFR test failed during Task 1's `npm test` run (threshold 749.8ms/file; measured 769.1ms/file, ~2.6% over) — the same recurring environmental flake already RISK-ACCEPTed multiple times earlier in this session (`sptu-s1`/`sptu-s3`/`sptu-s4` branch-setups), confirmed by re-running the test in isolation and seeing the same marginal-overage pattern.
**Decision:** Acknowledge as pre-existing/environmental, consistent with every prior occurrence this session. Not caused by `dswf-s1`'s own one-line diff.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found during Task 1's full-suite regression check, 2026-10-06.
