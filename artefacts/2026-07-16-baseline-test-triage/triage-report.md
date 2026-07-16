# Triage Report: Pre-existing baseline test failures (tst-s1)

**Story:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Date:** 2026-07-16
**Baseline verified against:** `node scripts/run-all-tests.js` fresh run on this worktree — 69 failing files out of 337 run, exactly matching the story's documented "Current, freshly-verified state" list (confirmed byte-for-byte against the story's own diff).

Every failing file was run standalone (`node <file>`) and its actual output read before categorization — none of the 69 entries below are filename-only guesses. Categories: **(a) Fixed** — small bounded fix made, now passes standalone AND does not reappear as a failure in a fresh full-suite run. **(b) Deferred** — RISK-ACCEPT logged in `decisions.md`, root cause understood but the fix is out of proportion for this story (a real product/architecture decision, or a multi-file feature gap). **(c) Investigated-and-classified** — `tests/check-md-3-adr.js` only, per the story's AC3 (folds into Deferred here — see below for why).

## Summary

| Category | Count |
|---|---|
| (a) Fixed | 2 |
| (b) Deferred (including `check-md-3-adr.js`, category c) | 67 |
| **Total** | **69** |

Net: 2 files fixed and removed from the baseline; 67 files remain deferred and documented (66 (b) + `check-md-3-adr.js` (c), which is genuinely improved but cannot be removed from the baseline — see its dedicated section below) — plus the 5 already-confirmed-now-passing files removed separately per AC4 (see `tests/known-baseline-failures.json`).

**Correction note (post-verification):** an earlier draft of this report classified `check-md-3-adr.js` as Fixed after it passed 9/9 standalone with no time limit. A subsequent full `node scripts/run-all-tests.js` run showed it *still* appears in the failed-files list — not because the logic fix is wrong, but because `run-all-tests.js`'s own `spawnSync` call applies a 120-second timeout per child process, and this file's T4 check (which runs a full nested `npm test`) takes several minutes to complete. It is killed by that timeout every time it runs inside the aggregate suite, regardless of the correctness of its internal comparison logic. Recorded here rather than silently corrected, per this story's own standard: never present a categorization that hasn't been verified against the real, full-suite signal that `scripts/ci-test-regression-check.js` actually gates on.

---

## (a) Fixed — 2 files

| File | Reason |
|---|---|
| `tests/check-bee1-landing-page.js` | T11's "zero posthog packages" NFR assertion was invalidated by bri-s1.2's later, separately-decided `posthog-node` dependency (added for feature-flag evaluation, a different purpose than bee.1's own hand-rolled analytics — see `artefacts/2026-07-09-beta-readiness-infra/decisions.md`, 2026-07-10 ARCH entry). Updated the check to allow only the specific, documented `posthog-node` package rather than asserting zero PostHog packages forever. Verified: 25/25 passing standalone, and does not reappear in a fresh full-suite run. |
| `tests/check-ilc1-capture-schema.js` | The "no new dependencies" NFR asserted a point-in-time snapshot (`ALLOWED_PROD_DEPS = ['pino']`) that later, unrelated, already-decided stories legitimately grew past (`@upstash/redis`, `bcrypt`, `pg`, `posthog-node`, `stripe` — each from its own documented story). Refreshed the allowlist to the current, documented dependency set. Verified: 12/12 passing standalone, and does not reappear in a fresh full-suite run. |

### AC3 classification: `tests/check-md-3-adr.js` (category c, folds into Deferred)

Determined to be a **pre-existing gap, not a genuinely new regression**. Evidence: (1) `package.json`'s `scripts.test` is `node scripts/run-all-tests.js` (pcr-s1) — when invoked via `npm test`, npm sets `npm_lifecycle_event=test`, which propagates to every spawned child test file (including this one when it's discovered inside a run), causing T4's guard to skip the check entirely and the file to pass. (2) When invoked directly via `node scripts/run-all-tests.js` (bypassing npm) — the exact method both this story's canonical baseline and my fresh 2026-07-16 run use — that env var is never set, so T4 actually fires. (3) The recursion guard and its narrow `KNOWN_FAILURE_PATTERNS` allowlist were added in commit `1c440375`, well before pcr-s1 (PR #455, 2026-07-11) unmasked the real ~69-file baseline — so the failure mode has existed, latent, since before pcr-s1 and was never a function of any change introduced after that. The 2026-07-12 baseline snapshot's own note ("passes on Linux CI") reflects CI's real invocation path (`npm test`), not an OS difference as originally assumed — the true cause is the invocation-method-dependent guard, and it was simply never tested against the direct-invocation path this triage story uses.

**Why this stays in the baseline despite a genuine logic fix:** T4's comparison logic was corrected (it now checks failures against `scripts/ci-test-regression-check.js`'s real baseline instead of a stale 4-pattern allowlist — kept in the code, a real improvement, see the source comment in `tests/check-md-3-adr.js`) and verified 9/9 passing when run standalone with no imposed time limit. However, T4's design requires a full nested `npm test` run to complete (several minutes) whenever the `npm_lifecycle_event` guard doesn't fire — and `scripts/run-all-tests.js`'s own `spawnSync` call applies a hard 120-second timeout per child process. That means this file is *always* killed by the runner's own timeout when run as part of the aggregate suite (`node scripts/run-all-tests.js`), independent of whether T4's internal logic is now correct. Confirmed directly: a full suite run after the logic fix still lists `tests/check-md-3-adr.js` as failed, with no completed T4 output — the process was killed mid-check, not failed on a real assertion. Resolving this fully would require either (i) increasing `run-all-tests.js`'s per-file timeout (explicitly out of scope — owned by pcr-s1), or (ii) redesigning T4 to not require a multi-minute recursive `npm test` call at all (a larger architectural change than this bounded triage story should make unilaterally). Deferred as category (b)/(c), logged in `decisions.md`.

---

## (b) Deferred — grouped RISK-ACCEPT buckets (66 files, including `check-md-3-adr.js`)

### GROUP 1 — Missing `.github/skills/<name>/SKILL.md` (or `.github/templates/<name>.md`) mirror — 34 files

Root cause: these test files read skill/template content from `.github/skills/<name>/SKILL.md` or `.github/templates/<name>.md`, but the real, current files live at the top-level `skills/<name>/SKILL.md` (confirmed: `skills/` contains all 41 core pipeline skills including `discovery`, `definition`, `benefit-metric`, `orient`, `ideate`, `prioritise`, `modernisation-decompose`, etc.) — `.github/skills/` only holds 5 special-purpose mirrors (`infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`). This exact gap has already been independently found and RISK-ACCEPTed 3 times (`bri-s1.2`, `bri-s1.4`, `bri-s2.2` — see `artefacts/2026-07-09-beta-readiness-infra/decisions.md`), each time deferred as out-of-scope for that story. Whether the correct fix is (i) mirroring all of `skills/` into `.github/skills/`, or (ii) repointing all 34 affected test files at `skills/`, is a real repo-structure decision this triage story should not invent unilaterally — per the DoR's own guidance ("a missing skill file whose correct location or content is ambiguous... do NOT invent a fix").

Files: `tests/check-challenger.js`, `tests/check-definition-skill.js`, `tests/check-discovery-skill.js`, `tests/check-i2.1-entry-a-story-first.js`, `tests/check-i2.2-entry-b-code-first.js`, `tests/check-i2.3-entry-c-no-history.js`, `tests/check-i3.1-discovery-attribution.js`, `tests/check-i3.2-benefit-metric-attribution.js`, `tests/check-i3.3-dor-h-gov.js`, `tests/check-ilc2-agent-selfrecord.js`, `tests/check-inc2.2-condition-marker-instruction.js`, `tests/check-inc3-question-cadence.js`, `tests/check-inc5-canvas-skill-instruction.js`, `tests/check-iwu6-skillmd.js`, `tests/check-md-1-skill-md.js`, `tests/check-md-2-skill-contracts.js`, `tests/check-p11-attribution.js`, `tests/check-p11-hgov.js`, `tests/check-p11-start.js`, `tests/check-p3.6-dispatch.js`, `tests/check-pr.1.js`, `tests/check-pr.2.js`, `tests/check-pr.3.js`, `tests/check-pr.4.js`, `tests/check-pr.5.js`, `tests/check-rrc1-discovery-seed.js`, `tests/check-rrc2-constraint-index.js`, `tests/check-rrc3-discovery-integration.js`, `tests/check-rrc4-corpus-update-skill.js`, `tests/check-sfa1-state-schema.js`, `tests/check-spc2-capture-block-template.js`, `tests/check-sro1-skill-routing.js`, `tests/check-srt1-status-report-template.js`, `tests/check-trace-commit.js`.

### GROUP 2 — Missing `ANTHROPIC_API_KEY` in this dev environment — 1 file

Already documented in `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` (pcr-s1). Not a code defect — the test correctly reports the env var is absent locally.

Files: `tests/check-mfc1-model-first-chat-session.js`.

### GROUP 3 — Canvas panel / assumption cards UI feature incomplete — 4 files

Root cause: `#canvas-panel`, `#condition-items`, `#assumption-cards` and their associated `renderCanvasBlock`/handler logic are asserted as present in the chat UI's rendered HTML/inline script, but are only partially implemented — real feature-completeness gaps spanning multiple related stories (`inc2`, `inc4`, `iwu2`, `mfc2`), not independent bugs. Fixing any one in isolation risks an inconsistent partial UI; needs a dedicated feature pass across all four together.

Files: `tests/check-inc2.1-conditions-panel.js`, `tests/check-inc4-canvas-panel.js`, `tests/check-iwu2-right-panel-layout.js`, `tests/check-mfc2-chat-ux-improvements.js`.

### GROUP 4 — Auth/session flow: expected redirects and session fields not observed — 3 files

Root cause: all three (`check-s0.2-tenant-login-fallback.js`, `check-sec3-return-to.js`, `check-sec5-session-rotation.js`) show the same shape of failure — expected 302 redirects and session field values (`session.tenantId`, `session.login`, `session.accessToken`) not materializing in the test harness. This strongly suggests one shared root cause (a shared auth-flow mock/helper or session-middleware behavioural drift) rather than three independent bugs. Investigating the shared cause is out of proportion for this triage story's bounded scope; needs a dedicated auth-flow investigation.

Files: `tests/check-s0.2-tenant-login-fallback.js`, `tests/check-sec3-return-to.js`, `tests/check-sec5-session-rotation.js`.

### GROUP 5 — Journey `STAGE_SEQUENCE` includes a `design` step not reflected in some tests/routing — 5 files

Root cause: `src/web-ui/modules/journey-store.js`'s `STAGE_SEQUENCE` includes `'design'` between `'benefit-metric'` and `'definition'`, but `check-ougl2-journey-state-store.js` asserts `getNextStage('benefit-metric')` returns `'definition'` directly, and downstream routing tests (`ougl3`, `ougl4`, `ougl6`) show consistent redirect/routing mismatches plausibly stemming from the same sequence question. `check-ougl5-gate-confirm-feature-stages.js`'s 2 failures also touch the "read priorArtefacts from disk, not session.artefactContent" disk-canonicity rule (CLAUDE.md's `ougl` ADR-023) and may be a distinct, related regression. Whether `'design'` belongs in the mandatory linear sequence (making the tests stale) or was inserted in error (making production code wrong) is a product decision this story should not make unilaterally.

Files: `tests/check-ougl2-journey-state-store.js`, `tests/check-ougl3-journey-entry-and-start.js`, `tests/check-ougl4-journey-aware-chat-button.js`, `tests/check-ougl5-gate-confirm-feature-stages.js`, `tests/check-ougl6-perstory-stage-routing.js`.

### GROUP 6 — Stripe placeholder price ID not configured in this environment — 1 file

`STRIPE_PRICE_ID_STARTER` is still set to its placeholder value in this dev environment; this is an environment/config gap (a real Stripe price ID must be provisioned), not a code defect — consistent with the existing pattern already excluding the sibling `lab-s3.2`/`lab-s3.4` Stripe tests from the baseline once genuinely configured.

Files: `tests/check-lab-s3.5-billing-portal.js`.

### GROUP 7 — Stale `testPlan.passing` bookkeeping across multiple already-merged stories — 1 file

11 previously-merged stories (`lab-s1.1` through `lab-s3.5`, `arl-s1`–`arl-s3`, `bri-s2.2`) have `testPlan.passing` values in `.github/pipeline-state.json` that don't match `testPlan.totalTests`. This is accumulated pipeline-state bookkeeping debt across many unrelated, already-shipped features — correcting 11 stories' historical pass counts (which requires re-confirming each story's actual final test count, not something this triage story can responsibly invent) is out of proportion for this story's scope.

Files: `scripts/check-pipeline-state-integrity.js`.

### GROUP 8 — Skill session creation returns `SKILL_NOT_FOUND` — 2 files

Both `artefact-preview.test.js` and `artefact-writeback.test.js` fail their session-creation-dependent assertions with the same `{"error":"SKILL_NOT_FOUND"}` response (400 instead of 201). This is very likely related to GROUP 1's missing-skill-file/registry gap (a session-creation route presumably resolves the skill name against the same `.github/skills/`-vs-`skills/` location this story is already deferring as an architecture decision), but the exact resolution path wasn't traced within this story's time budget — logged separately in case the root cause differs.

Files: `tests/artefact-preview.test.js`, `tests/artefact-writeback.test.js`.

### GROUP 9 — `check-wuce4-docker-deployment.js` hangs after completion, does not fail — 1 file

All 14 real assertions pass (`14 passed, 0 failed` printed before the process hangs); a lingering PostHog config validation call (`POSTHOG_KEY_PROD is missing or empty`) after test completion appears to leave an open handle preventing clean process exit. This matches the pre-existing "hangs, not fails" category already established for this exact file in `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` (out of scope for a test-runner/content story per that story's own precedent).

Files: `tests/check-wuce4-docker-deployment.js`.

---

## (b) Deferred — individually investigated, no shared group (15 files)

| File | Root cause (one sentence) |
|---|---|
| `tests/check-md-3-adr.js` | (c) AC3: determined to be a pre-existing gap, not a genuinely new regression (see the dedicated AC3 classification section above). T4's stale comparison logic was fixed and verified 9/9 passing standalone with no imposed time limit, but the file cannot be removed from the baseline: `scripts/run-all-tests.js`'s own 120-second per-file `spawnSync` timeout always kills T4's nested `npm test` check (which takes several minutes) before it can complete, so this file is killed (not failed on a real assertion) every time it runs inside the aggregate suite. |
| `tests/check-artefact-coverage.js` | 5 `src/` module slugs are uncovered by any story artefact and not yet exempted in `artefact-coverage-exemptions.json`; needs a per-slug decision (retrospective story vs. exemption), not invented here. |
| `tests/check-bee3-posthog.js` | 2 of 27 assertions fail on `posthog.capture('journey_created')` presence/ordering in the chat page's rendered HTML; needs a dedicated PostHog-instrumentation review to confirm whether the event was renamed, moved, or genuinely dropped. |
| `tests/check-bri-s2.2-neon-staging-branch.js` | Already documented: `artefacts/2026-07-09-beta-readiness-infra/decisions.md` (bri-s2.4, 2026-07-11 RISK-ACCEPT) — T1's expected-diff string collides with later, legitimate Google OAuth provider-registry additions to `auth.js`/`server.js`. |
| `tests/check-cli-outer-loop.js` | 1 of 33 checks fails; root cause not isolated within this story's time budget (the failing assertion falls after the tail of standalone output captured during batch triage). |
| `tests/check-i1.1-orient-skill.js` | 28 of 29 checks fail — `skills/orient/SKILL.md` (found; not a path issue, unlike `i2.1`–`i2.3`) is missing several routing-target entries (`/discovery`, `/clarify`, `/benefit-metric`, etc.) and canonical-field-name references; a real content-authoring gap needing a dedicated pass, not a bounded fix. |
| `tests/check-i1.2-platform-init-fetch.js` | 2 of 20 checks fail — the `platform-init` script doesn't report skipped files in stdout and `--force` doesn't overwrite an existing file as expected; a real script-behaviour gap needing dedicated investigation of the install script. |
| `tests/check-model-routing.js` | 5 of 30 checks fail; root cause not isolated within this story's time budget. |
| `tests/check-ougl1-buildsystemprompt-handoff.js` | 1 of 8 checks fails — the handoff-prompt builder renders 3 `PRIOR ARTEFACT` blocks when exactly 2 prior artefacts are supplied (an apparent off-by-one); the specific code path wasn't isolated within this story's time budget. |
| `tests/check-p4-enf-decision.js` | 5 of 25 checks fail — the ADR-phase4-enforcement entry in `architecture-guardrails.md` is missing its `file`/`status` fields and unexpectedly contains a `tenantId` reference the NFR check disallows; needs a dedicated content fix to that guardrails entry. |
| `tests/check-wsm2-collaborative-sessions.js` | 5 of 22 checks fail — viewer-access endpoints return 404 instead of 200 and turn data isn't returned in the expected array shape; a real collaborative-session feature regression not isolated within this story's time budget. |
| `tests/check-wuce24-guided-question-form.js` | 2 of 43 checks fail (inline `onclick=`/`addEventListener` presence assertions); root cause not isolated within this story's time budget. |
| `tests/check-wuce3-attributed-signoff.js` | 13 of 49 checks fail, including uncaught exceptions reading properties of `undefined` (`'opts'`, `'data'`) — indicates a real regression in the sign-off flow's GitHub Contents API integration, needing dedicated investigation beyond this story's bounded scope. |
| `tests/check-wucp1-context-autoloader.js` | 4 of 20 checks fail — the assembled context prompt is missing `context.yml` labelling and doesn't enforce the "first 50 lines of `learnings.md`, truncate at line 51" rule; a real content-assembly gap. Note: this file completed in 654ms in this run, contradicting the previously-documented "hangs standalone" classification (`pcr-s1` decisions.md) — that prior classification appears to be stale; this is a genuine content failure, not a hang. |
| `tests/check-wusl1-chat-streaming.js` | 1 of 7 checks fails — the chat page's inline script removes the "thinking" indicator before the first model-signal chunk arrives rather than after (`removeIdx=69001` < `firstSignalIdx=69507`); a specific, likely small ordering bug not isolated within this story's time budget. |

---

## GROUP 10: locally-passing, CI-failing (correction, 5 files — 3 now resolved by cfg-s1)

**Correction (post-merge, real GitHub Actions CI run on PR #484):** these 5 files were initially found "confirmed now-passing" and removed from `tests/known-baseline-failures.json`, based on local test runs (both this agent's and an earlier independent operator sweep) on a Windows dev machine. The actual CI run on this PR showed all 5 still genuinely failing on the real Linux GitHub Actions runner, correctly triggering `scripts/ci-test-regression-check.js`'s regression gate. CI is the authoritative environment for this repo's gate, not a local machine — restored to the baseline.

**Update (cfg-s1, 2026-07-16 follow-up):** root cause confirmed and fixed for 3 of the 5 — `tests/check-bri-s3.5-nfr-stripe-keys.js`, `tests/check-lab-s3.2-stripe-checkout.js`, `tests/check-lab-s3.4-stripe-webhook.js` each ran an unscoped `git grep -n "<pattern>" -- .` via `execSync` with no explicit shell option. On Windows, `execSync` defaults to `cmd.exe`, which cannot parse the POSIX `2>/dev/null` redirect — the command silently errors and the check trivially passes without the grep ever running. On real CI (a POSIX shell), the grep runs correctly and finds real but harmless matches against documentation and the checking scripts' own source, which legitimately discuss these pattern strings as examples — a genuine false-positive bug in the check's own scope, not a real security gap. Fixed by narrowing the grep to runtime-relevant paths only; these 3 files are now genuinely fixed, correctly removed from `tests/known-baseline-failures.json`, and moved to category (a) Fixed (see `artefacts/2026-07-16-ci-flake-grep-fix/` for the full story).

**Still deferred (2 of 5):** `tests/check-gpa-sc06-source-path-guard.js` and `tests/run-gpa-tests.js` — no similar defect found on inspection during cfg-s1's investigation. Leading unconfirmed hypothesis: CI pins Node 20 exactly, this local dev machine runs Node 22 — installing Node 20 locally to confirm was blocked by an unresponsive `nvm` prompt and not pursued further. Remain in `tests/known-baseline-failures.json`.
