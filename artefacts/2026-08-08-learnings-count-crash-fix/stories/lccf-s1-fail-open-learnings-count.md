## Story: Make the landing page's learnings counter fail open instead of crashing the server

**Epic reference:** None — short-track (bounded bug fix, active production incident)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator of the deployed skills-platform web app (and every visitor to its landing page)**,
I want to **the server to stay up even if the optional "learnings captured" counter can't read its source file**,
So that **a missing non-essential data file never takes down the entire application**.

## Benefit Linkage

**Metric moved:** Direct correctness/availability fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-08) that `wuce-staging` has been crash-looping and returning 502 on every request since `2026-08-08-landing-page-hero-features` story `lphf-s4` (PR #686) merged.

**How:** Direct source inspection and live log inspection both confirm the root cause. `src/web-ui/content/learnings-count.js` (`getLearningsCount()`) calls `fs.readFileSync(path.join(__dirname, '..', '..', '..', 'workspace', 'learnings.md'), 'utf8')` with no error handling. `src/web-ui/routes/public.js` calls `getLearningsCount()` synchronously at **module load time**, while building `_LANDING_HTML`. `Dockerfile` only ever `COPY`s `src/` into both the builder and production images (confirmed by direct inspection — `workspace/` is never copied at any stage). So in every deployed environment, `require('./routes/public')` throws `ENOENT` before the server can even start listening. `flyctl logs --app wuce-staging` confirms this exact stack: `Error: ENOENT: no such file or directory, open '/app/workspace/learnings.md'` at `learnings-count.js:13`, required transitively from `public.js:31`, with the process exiting and the machine repeating this until Fly's max-restart-count (10) is hit and the machine is left `stopped`. This is not a transient flake or a cold-start — it is a deterministic, permanent startup crash in every deployed environment, and it has been live since `lphf-s4` merged.

## Architecture Constraints

- **Do not remove the learnings-count feature.** The counter itself (`lphf-s4`, AC-covered, already reviewed and shipped) is a valid, wanted landing-page element — the defect is purely that a missing/unreadable source file must not crash the whole process.
- **Match the existing pattern for optional/best-effort data:** other non-critical read paths in this codebase (e.g. the CSRF-token splice in `handleRoot`) already tolerate absence gracefully; this fix brings `getLearningsCount()` in line with "never let a cosmetic data source crash core routing," not a new convention.
- **No change to `_LANDING_HTML`'s module-load-time construction strategy** for the golden-trace or CSRF splices — those are unaffected and already safe (neither reads from the filesystem at request time in a way that can throw on a missing file).
- **No D37/adapter concern:** this is not an injectable adapter — it is a single pure function whose only failure mode is a missing/unreadable file.

## Dependencies

- **Upstream:** None (fixes already-shipped, already-merged code from `lphf-s4`, PR #686).
- **Downstream:** Unblocks `lphf-s5` (PR #687), whose `Scenario A E2E (staging)` check cannot complete because staging itself cannot start.

## Acceptance Criteria

**AC1:** Given `workspace/learnings.md` does not exist at the resolved path (the real condition in every deployed environment today), When `getLearningsCount()` is called, Then it returns a fallback value (a non-negative integer) instead of throwing, and no exception propagates out of the function.

**AC2:** Given `workspace/learnings.md` does not exist, When `src/web-ui/routes/public.js` is `require()`'d (i.e. the module-load-time construction of `_LANDING_HTML` runs), Then the require succeeds without throwing, and `_LANDING_HTML` contains a valid numeric string in place of `<!--LEARNINGS_COUNT-->`.

**AC3:** Given `workspace/learnings.md` DOES exist and is readable (the local-dev/CI condition), When `getLearningsCount()` is called, Then it returns the same real, correctly-computed count as before this fix — the happy path is unchanged.

**AC4:** Given the existing `lphf-s4` test suite (`tests/check-lphf-s4-*.js` or equivalent) asserting the learnings-count feature's happy-path behaviour, When re-run after this fix, Then it still passes unchanged.

## Out of Scope

- **Fixing the Dockerfile to include `workspace/`.** `workspace/` contains repo-management/pipeline-bookkeeping content (state files, capture logs, experiment artefacts) that has no reason to ship inside the production application image — bundling it would be scope creep in the wrong direction, not a fix. The correct shape is a server that doesn't depend on it being present at all.
- **Changing where/how the real count is sourced long-term** (e.g. computing it at build time and baking it into the image, or exposing it via an API instead of a filesystem read). A reasonable follow-on, but not required to stop the active outage — the immediate, minimal, safe fix is to make the existing function fail open.
- **Any other content or styling in `landing.html`.** Unaffected by this fix.

## NFRs

- **Performance:** Negligible — same one-time module-load-time cost as today, just wrapped in a try/catch.
- **Security:** None identified — no new user input handling.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.
- **Availability:** This IS the availability fix — the defect this story closes is a 100%-reproducible startup crash in every deployed environment.

## Complexity Rating

**Rating:** 1 — a single function gets a try/catch and a fallback value; no architectural change.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

## Addendum (2026-08-08, during PR #688's CI run)

While getting this hotfix's own PR green, `tests/check-p4-enf-second-line.js` failed CI twice in a row (T6 sub-check). Confirmed via standalone run (22/22 passing, zero file overlap with this story's diff) that the fix itself introduces no regression. Root cause investigation found this is not random flakiness: T6 shells out to `scripts/validate-trace.sh`, which scans the full `artefacts/` tree (149 feature directories as of this date, up from far fewer when T6's hardcoded 15-second `spawnSync` timeout was originally set) and invokes `python3` nine separate times. As the repo's artefact count has grown, `validate-trace.sh`'s real runtime has grown past that fixed margin, so this test now intermittently times out under CI load, independent of any specific PR's content — it will keep blocking unrelated PRs until fixed. Bumped the timeout to 60000ms (matching `run-all-tests.js`'s own 120s per-file budget with headroom) in the same commit as this story's fix, since it was directly blocking this active-outage hotfix from merging. Confirmed still passing (22/22) after the change. This is a test-infrastructure correction, not a scope change to this story's own ACs.
