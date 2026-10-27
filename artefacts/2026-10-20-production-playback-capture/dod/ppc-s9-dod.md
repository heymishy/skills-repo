# Definition of Done: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch

**PR:** https://github.com/heymishy/skills-repo/pull/1028 (merged) | **Merged:** 2026-10-27
**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s9-github-actions-capture-worker.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s9-test-plan.md
**DoR artefact:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s9-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handlePostCaptureTrigger returns immediately (never waits for the dispatched workflow to finish)`; `handlePostCaptureTrigger returns 502 (never a bare 500) when dispatch itself fails, and nothing is marked in-progress`; existing CSRF/rate-limit/target/DoD/repo-connected regression fixtures preserved via the 5 migrated test files (`check-ppc-s1-playback-evidence-route.js` 21/21, `check-ppc-s2-capture-all-route.js` 17/17, `check-ppc-s3-capture-rate-limit.js` 6/6) | `integration-real-code` | None |
| AC2 (nonce exchange, D37 adapter) | ✅ | `check-ppc-s9-capture-nonce-store.js`: single-use exchange, replay fails, expired nonce fails, D37 stub-throws, two sessions issue two distinct nonces; `check-ppc-s9-capture-worker-auth.js`: `handleCaptureExchange` 403 on wrong secret, 404 on already-used nonce (no session_id echoed), 400 on missing nonce (store never consulted), 200 with sessionId on success | `unit` + `integration-real-code` | None |
| AC3 (worker uploads a named artifact, never references accessToken) | ⚠️ | `captureWorkerScript_neverReferencesAccessToken`; `captureWorkerScript_outputDir_containsRealScreenshotAndVideoBytes_notJustAManifest`; `captureWorkerScript_closesBrowserInFinally_*` (2 tests) confirm the script's own logic and that `outputDir` is populated with real bytes before `upload-artifact` runs. **The actual real-GitHub-Actions upload step itself has not been live-verified** — the test plan's own `workflow_uploadsNamedArtifact_realGitHubActionsRun` manual/live scenario requires triggering a real dispatch against the deployed app, which has not happened yet (no production deploy has occurred since merge — see AC8). | `unit` + `integration-real-code` (claim partially unverified — see Verification strength note below) | **Deviation:** live-verified evidence for the real artifact-upload step is outstanding, same evidence-class gap as AC8. Not blocking per this story's own test plan (named as a pre-accepted manual/live gap, same convention as `ppc-s8`'s AC1-AC3 Docker verification), but recorded here rather than silently marked ✅. |
| AC4 | ✅ | `handleGetPlaybackEvidence, artifact found -- commits screenshot+video via the exact real tenant token/owner/repo/base64 shape, updates journey fields, clears captureInProgress, renders the normal completed state`; `..., artifact not found but still within the wait window -- renders the in-progress fragment, makes no commitArtefact call`; `..., artifact not found past the wait window -- writes the EXACT captureAllFailed timeout shape` (all in `check-ppc-s9-capture-dispatch-wiring.js`) | `integration-real-code` | None |
| AC5 | ✅ | Same timeout-to-named-failure-state tests as AC4, plus the two spec-compliance-fix regression tests (`...stays in-progress (not failed, not silently cleared) while still within the wait window`; `...is bounded by CAPTURE_WAIT_WINDOW_MS, not retried forever`) added after the unbounded-retry bug (see DoD Observations) was found and fixed | `integration-real-code` | None |
| AC6 | ✅ | `handlePostCaptureAll dispatches exactly ONE dispatchCaptureWorkflow call covering every AC in the group`; `...releases the capture-all lock even on a dispatch failure`; `a capture-all-shaped captureInProgress with 2 acIds sharing ONE correlationId calls checkCaptureArtifact exactly once for that correlationId, not once per acId`; `a found capture-all group with 2 ACs commits EACH AC its OWN distinct screenshot buffer from result.screenshots -- not the same buffer twice` (the multi-screenshot-overwrite bug fix — see DoD Observations) | `integration-real-code` | None |
| AC7 | ✅ | Directly re-confirmed on `master` post-merge: `test -f src/web-ui/adapters/session-page-adapter.js` → absent; `test -f tests/check-ppc-s1-session-page-adapter.js` → absent; `grep -rl "chromiumSandbox\|PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH\|ttf-freefont" src/ Dockerfile` → zero matches. The 5 migrated test files preserve their exact pre-migration test counts (21, 6, 17, 6, 13 = 63 tests), each still verifying the same real behaviour (CSRF, rate-limiting, tenant isolation, combined-video grouping) now against the dispatch-based mocks instead of `session-page-adapter.js` mocks | `integration-real-code` + direct repo-state check | None |
| AC8 | ⚠️ (pending) | Not yet performed. This story's own test plan and `ppc-s8`'s precedent both scope this as manual/live-only, post-merge, post-deploy verification — and no production deploy has occurred since PR #1028 merged (this repo's own `staging-deploy.yml` is the only deploy workflow present; production promotion is a separate, explicitly gated human action per `decisions.md`'s own "Platform Owner approved the promote-to-prod gate" precedent from `ppc-s8`). | — (not yet attempted) | **Deviation:** AC8 is not satisfied yet. This is the same open-AC pattern `ppc-s8` itself left behind (its own AC3), which this story was explicitly built to finally close — but closing it requires an actual production deploy + a real triggered capture, neither of which has happened in this session. Recorded as a Follow-up Action, not reverted or blocked. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**Verification strength:** 6 `integration-real-code` (AC1, AC4, AC5, AC6, AC7 + AC2's integration layer), 1 `unit`-heavy with partial `integration-real-code` but an outstanding real-world-effect gap (AC3), 0 `live-verified`, 0 `production-observed`, 1 not yet attempted (AC8).

**UI-evidence gate:** N/A — no browser-observable AC. This story's only user-visible surface is the existing in-progress/failure state text, reusing `_renderPlaybackEvidenceHtml`'s unchanged rendering conventions (no new component, no new layout, confirmed by the story's own NFR "Design system: N/A").

---

## Scope Deviations

None. The merged PR left `src/utils/capture-video.js`/`capture-screenshots.js` untouched (confirmed by the story's own Architecture Constraints and re-confirmed by this DoD not finding any diff against them in the PR's file list), did not add any real-time progress UI, did not implement either of the two alternative compute backends documented in `decisions.md`, and did not retrofit this pattern onto any other in-process browser-automation code — all four items named in the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** All named unit/integration scenarios implemented (AC1 x2, AC2 x3 + 1 D37/behavioural-correctness test, AC3 x1 structural + worker-script coverage, AC4 x2, AC5 x1 + 2 regression tests from the mid-story bug fixes, AC6 x1, AC7 x5 migrated files). AC3's and AC8's manual/live scenarios are the two named test-plan gaps — both explicitly scoped as post-merge/live-only from the outset, neither implementable by the unit/integration chain.
**Tests passing in CI:** 803 files, 0 failed — full suite, confirmed on PR #1028's own CI run and independently re-run against `master` post-merge (see below).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-ppc-s9-capture-nonce-store.js` (4 tests) | ✅ | ✅ | AC2 |
| `check-ppc-s9-capture-worker-auth.js` (5 tests) | ✅ | ✅ | AC2 |
| `check-ppc-s9-capture-dispatch-adapter.js` (8 tests) | ✅ | ✅ | AC3, D37 |
| `check-ppc-s9-capture-worker-script.js` (7 tests) | ✅ | ✅ | AC3 |
| `check-ppc-s9-capture-dispatch-wiring.js` (12 tests) | ✅ | ✅ | AC1, AC4, AC5, AC6 |
| `check-ppc-s9-capture-adapters-server-wiring.js` (3 tests) | ✅ | ✅ | D37 rule 4 — server.js production wiring (added at final cross-task review, not in the original 8-task plan — see DoD Observations) |
| `check-ppc-s1-playback-evidence-route.js` (migrated) | ✅ | ✅ (21/21) | AC7 |
| `check-ppc-s1-ui-layer.js` (migrated) | ✅ | ✅ (6/6) | AC7 |
| `check-ppc-s2-capture-all-route.js` (migrated) | ✅ | ✅ (17/17) | AC7 |
| `check-ppc-s3-capture-rate-limit.js` (migrated) | ✅ | ✅ (6/6) | AC7 |
| `check-ppc-s5-video-capture.js` (migrated) | ✅ | ✅ (13/13) | AC7 — rewritten to assert the current, RISK-ACCEPTed video-failure regression (see DoD Observations), not the old behaviour |

**Gaps (tests not implemented):**
- `workflow_uploadsNamedArtifact_realGitHubActionsRun` (AC3) — manual/live, not yet executed. Risk: AC3's real-upload claim is unverified by live evidence. Mitigation: execute once a production deploy + real trigger happens (same action as AC8 below).
- `realCapture_succeedsEndToEnd_postMerge` (AC8) — manual/live, not yet executed, pending a production deploy. Risk: this story's own stated purpose (closing `ppc-s8`'s AC3) remains formally open until this runs. Mitigation: Follow-up Action below.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (dispatch-to-completion latency now 30s-2min vs. old ~15-60s) | ✅ | Explicit, accepted tradeoff recorded in the story's own NFRs and `decisions.md`'s cost/latency comparison; AC4's "reload to see result" UX already designed to tolerate it. Not yet measured against a real dispatch (requires AC8's own live trigger) — real-world timing confirmation is bundled into the same Follow-up Action as AC8. |
| Security (nonce-exchange endpoint scoped to one single-use, short-TTL value; `req.session.accessToken` never leaves the server process) | ✅ | Threat model in story's Architecture Constraints; `check-ppc-s9-capture-worker-auth.js`'s 403/404/400 tests confirm the double-gate (secret check before store consultation); `captureWorkerScript_neverReferencesAccessToken` confirms the worker script's own API surface; `check-ppc-s9-capture-dispatch-adapter.js`'s `realDispatchCaptureWorkflow: call body contains the nonce and never contains a raw session-like fixture value` test directly asserts the credential-boundary design |
| Reliability (removes blast-radius risk of a hung Chromium process affecting the whole app) | ✅ | Structural — `session-page-adapter.js`'s in-process Chromium launch is fully removed (AC7), confirmed by direct repo-state check above. The actual production reliability improvement is only fully confirmed once a real production trigger runs without ever invoking a Chromium-launch flag again (AC8) |
| Cost (~$0-1/mo marginal vs. ~$17.55/mo always-on alternative) | ✅ | Cost comparison documented in `decisions.md`'s superseding-decision entry (2026-10-26); not independently re-verified here (not a testable code claim) |
| Design system | ✅ N/A | Confirmed — no UI/rendering change beyond existing in-progress/failure state text, reusing unchanged rendering conventions; `hasDesignSystemTrack` is correctly absent from this story's `pipeline-state.json` entry |

**Note:** `artefacts/2026-10-20-production-playback-capture/nfr-profile.md` (the feature-level profile) has no `ppc-s9`-specific rows — it was last updated 2026-10-26 for `ppc-s5`/`ppc-s6`/`ppc-s7` and predates this story's own architecture redesign. The checks above were performed against the story's own NFRs section directly (DoD Step 5's documented fallback when the feature-level profile doesn't cover the story). Flagged as a DoD Observation below — the profile should gain a `ppc-s9` row for consistency with every other story in this feature.

---

## Metric Signal

**No metric signal captured.** `pipeline-state.json`'s `metrics` array (m1, m2, m3) does not list `ppc-s9` in any `contributingStories` array — the array was last updated when `ppc-s5` was defined and was never revisited for `ppc-s8` or `ppc-s9`, even though this story's own Benefit Linkage section explicitly states "Metric moved: m1 ..., m3 ... — same linkage as `ppc-s8`." This is a real tracking gap, not a judgement that this story doesn't matter to those metrics — recorded as a DoD Observation below rather than fabricating a signal against a metric array entry that doesn't name this story.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

6 of 8 ACs (AC1, AC2, AC4, AC5, AC6, AC7) are fully satisfied with `integration-real-code` or stronger evidence. AC3 and AC8 both depend on a real, live-triggered capture against the deployed production app, which has not happened yet — no production deploy has occurred since this PR merged. This mirrors `ppc-s8`'s own precedent of leaving an AC open pending a live production confirmation, and was explicitly scoped this way from the story/test-plan stage onward, not discovered as a surprise at DoD time.

**Follow-up actions:**
1. **Deploy to production, then trigger one real capture** (against `feature-playback-demo`'s existing AC1 target, same as every `ppc-s8` live-verification round) to close AC3 (real artifact upload confirmed) and AC8 (end-to-end production confirmation, the story's own stated purpose). Owner: Hamish King (Platform Owner) — requires an explicit deploy action this session has not taken. Once done, update this DoD artefact's AC3/AC8 rows to ✅ and re-run Step 6's metric-signal check if real usage data becomes available.
2. **Add a `ppc-s9` row to `nfr-profile.md`** so the feature-level profile covers this story like every other `ppc-*` story. Owner: next `/trace` or `/improve` pass.
3. **Reconcile `pipeline-state.json`'s `metrics[].contributingStories`** to include `ppc-s8`/`ppc-s9` (both claim metric linkage in their own Benefit Linkage sections but are absent from the tracked array) — or explicitly record why they were intentionally left out. Owner: next `/trace` pass.
4. **Open the already-identified follow-up story** for the worker-side video-failure regression (screenshots lost when video recording fails) — already has its own `decisions.md` RISK-ACCEPT entry (2026-10-27) naming the exact fix scope (`ppc-capture-worker.js` try/catch + `_finaliseInProgressCaptures` partial-result recognition). Not yet created as a story artefact.
5. **Revisit `capture-all-lock.js`'s stale synchronous-completion assumption** if real tenant usage shows duplicate capture-all dispatches — already has its own `decisions.md` RISK-ACCEPT entry (2026-10-27) with a named revisit trigger. No action needed until that trigger condition is observed.

---

## DoD Observations

1. **A real, severe D37 compliance gap was caught only at final cross-task review, not by the 8-task implementation plan itself** — despite the DoR explicitly flagging this exact risk in advance (`H-ADAPTER`, requiring wiring to be "named as its own implementation-plan task distinct from the handler work"). Neither `capture-nonce-store.js` nor `capture-dispatch-adapter.js` was ever wired into `src/web-ui/server.js` by any of the 8 planned tasks — only test files ever called their `set*Adapter` functions. Had this shipped unfixed, the entire feature would have been non-functional in production despite a fully green, 803-file test suite. **Tag: `/improve` candidate** — the implementation-plan skill (or its own review step) should have a mechanical check that cross-references every `H-ADAPTER`-flagged DoR line against the plan's own task list for a literal "wire `set<Name>Adapter` in `server.js`" task, not just a "write the handler" task that happens to mention wiring in passing.
2. **Two further real bugs were found and fixed during task-level review, before merge** (not post-merge deviations, recorded here for completeness since they materially shaped the final AC4-AC6 test set): a multi-AC capture-all archive-extraction bug that would have silently committed the WRONG screenshot as every AC's own evidence (production data corruption, fixed in the adapter + route layer), and that fix's own follow-on unbounded-retry regression for a permanently-missing per-AC screenshot (fixed by bounding both the found- and not-found branches identically against `CAPTURE_WAIT_WINDOW_MS`).
3. **Metric-tracking drift**: see Metric Signal section above — `pipeline-state.json`'s `metrics[].contributingStories` has not been kept in sync with stories' own Benefit Linkage claims since `ppc-s5`. Tag: `/improve` candidate for `/trace`'s own existing metric-orphan check, which should also catch the inverse case (a story claiming metric linkage that the metric itself doesn't list), not just metrics with no contributing stories at all.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch" (ppc-s9).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
