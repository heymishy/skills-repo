# Definition of Done: Self-service video capture, combined across ACs where possible

**PR:** https://github.com/heymishy/skills-repo/pull/1024 (merged) | **Merged:** 2026-10-26
**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md
**DoR artefact:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s5-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips`; `handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc` | `unit` + `integration-real-code` | None |
| AC1-combined | ✅ | `handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc` (strengthened during Task 7 review to a real 2-AC fixture — the original 1-AC version could not distinguish "one context for the group" from "one context per AC") | `integration-real-code` | None |
| AC2 | ✅ | `handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded`; `handleGetCaptureVideo_crossTenantRequest_isDenied`; `renderEvidencePage_combinedVideo_showsAlsoCoversNoteNamingOtherAcs` (strengthened to assert the actual sibling AC id, not a bare substring); `renderEvidencePage_soloVideo_showsNoAlsoCoversNote`; E2E `page.locator('video')).toHaveCount(1)` against a real rendered page | `integration-real-code` + `live-verified` | None |
| AC3 | ✅ | `handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc` asserts the video context's re-seeded cookie carries the same `req.sessionId`; `_captureVideoForAcIds` only ever receives the already-authenticated `authed.browser`, never re-authenticates | `integration-real-code` | None |
| AC4 | ✅ | `handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected` (strengthened to a 2-AC fixture asserting both ACs land in `captureAllFailed`, both tagged `videoOnly: true`, both screenshots intact — covers the test plan's separately-named "all-or-nothing, not partial" scenario in the same test) | `integration-real-code` | None |
| AC5 | ✅ | `captureVideoRecording_midCaptureFailure_deletesPartialFileAndRethrowsOriginalErrorEvenWhenContextCloseAlsoThrows`; `videoCapture_midFailure_leavesNoPartialFileOnDisk` | `unit` | None |
| AC6 | ✅ | `renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted`; E2E `page.on('console')` zero-errors assertion against a real rendered page | `integration-real-code` + `live-verified` | None |
| AC7 | ✅ | `videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions`; E2E zero media-byte-request assertion + `document.body.scrollWidth` check at a real 375px viewport | `unit` + `live-verified` | **See below** — AC7's own E2E test caught a real regression (Task 6's `<video>` element had no responsive `max-width`, unlike the sibling `<img>`), fixed in commit `d753191d`. The fix (`max-width:100%;height:auto`) does not literally match the story's own Architecture Constraint text ("must match the existing `<img>`'s own current inline-style convention... exactly") — the `<img>`'s fixed `max-width:480px` is an upper bound, not a fluid constraint, and would not itself have prevented the overflow this AC7 test caught. Recorded as a necessary, deliberate deviation from the literal constraint text in order to actually satisfy AC7's real requirement — not reverted. Secondary observation: this suggests the `<img>`'s own `max-width:480px` convention may carry the same latent narrow-viewport overflow risk, never tested for the screenshot-only case. Not blocking (no AC claims this for the `<img>`), but worth a follow-up spike if a future story touches that element again. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Checked the merged PR's full commit range (`973cd4b7..75eeee8e`, 24 commits) against the story's own Out of Scope section: captions/transcript, redaction/PII handling, presentation polish (ffmpeg), per-AC timestamp seeking, and operator/PO manual grouping control are all untouched — confirmed by the final cross-task reviewer dispatched during `/subagent-execution` and independently re-checked here. `src/web-ui/adapters/session-page-adapter.js` (explicitly out-of-scope per the Architecture Constraints) was never touched across any of the 24 commits.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 of 16 named test-plan scenarios implemented as distinct tests (3 were deliberately consolidated into other tests, not dropped — see Gaps below); 2 E2E scenarios implemented as written; 1 NFR test (real-duration measurement) not implemented — see Gaps.
**Tests passing in CI:** 15/15 (13 unit/integration + 2 E2E), confirmed in this session's own fresh `/verify-completion` run and again via PR #1024's CI checks (all 8 green after a transient deploy-group-contention rerun).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips` | ✅ | ✅ | |
| `captureVideoForAcIds_combinedRun_visitsEveryAcsTargetInOneRecordingContext` | ✅ (as `handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc`) | ✅ | Implemented at the route-handler level rather than as a standalone unit test of `_captureVideoForAcIds` alone — equivalent coverage, different granularity |
| `captureVideoForAcIds_sessionReuse_usesTheSameAuthenticatedBrowserAsScreenshotCapture` | ✅ (folded into `handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc`) | ✅ | |
| `videoCapture_midFailure_leavesNoPartialFileOnDisk` | ✅ | ✅ | |
| `videoCapture_midFailure_doesNotDeleteAnAlreadySucceededScreenshotForTheSameAc` | ✅ (covered by `handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected`'s own screenshot-survives assertions) | ✅ | Folded into the AC4 integration test rather than a standalone unit test |
| `videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions` | ✅ | ✅ | |
| `handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc` | ✅ | ✅ | |
| `handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc` | ✅ | ✅ | |
| `handlePostCaptureAll_combinedVideo_onlyCoversAcsThatScreenshottedSuccessfully` | ❌ Not implemented as a standalone test | N/A | **Gap, not a functional defect** — code read confirms `capturedAcIds = captured.map(...)` and `captured` only receives entries on screenshot success, so a failed-screenshot AC structurally cannot enter the video group. Behaviour is correct by construction; no dedicated regression test exists for it. |
| `handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded` | ✅ | ✅ | |
| `handleGetCaptureVideo_crossTenantRequest_isDenied` | ✅ | ✅ | |
| `handleGetCaptureVideo_neverServedFromUntenantedPlaybackMediaRoute` | ❌ Not implemented as a standalone test | N/A | **Gap, not a functional defect** — code read confirms the video `src` always resolves through `baseUrl` + `_playbackEvidenceUrl` + `/video/`, never `/playback-media/`; no test asserts the negative directly. |
| `renderEvidencePage_combinedVideo_showsAlsoCoversNoteNamingOtherAcs` | ✅ | ✅ | |
| `handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected` | ✅ | ✅ | |
| `handlePostCaptureAll_combinedVideoFailure_isAllOrNothingForTheGroup_notPartial` | ✅ (merged into the test above — both ACs landing in `captureAllFailed` together is the same assertion as "not partial") | ✅ | Consolidated, not dropped — explicitly documented in `ppc-s5-plan.md`'s own Task 7 completion note |
| `renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted` | ✅ | ✅ | |
| `renderEvidencePage_mixedVideoAndNoVideoAcs_rendersBothStatesCorrectly` | ❌ Not implemented as a standalone test | N/A | **Gap, not a functional defect** — `acs.map(...)` processes each AC independently with no shared mutable state; no plausible cross-contamination mechanism exists between a video AC and a no-video AC on the same page render. |
| `video_pageLoad_doesNotEagerlyDownloadAnyClip_noConsoleError` | ✅ (E2E) | ✅ | |
| `video_viewportNarrowed_noLayoutShift` | ✅ (E2E) | ✅ | Caught and fixed the real AC7 regression — see AC Coverage table |
| `videoInclusiveCaptureAll_realDurationMeasured_thresholdConfirmedOrRevised` | ❌ Not implemented | N/A | **Real gap — see NFR Status and Follow-up Actions.** This NFR test's own plan explicitly required a manual timing measurement "during `/verify-completion`, same as `ppc-s2`'s own AC3/AC4 precedent" — not performed, same root cause as `ppc-s1`–`ppc-s4`'s own recurring staging-infrastructure gap (no live tenant with a connected repo exists yet). |
| `videoPageRender_noEagerDownload_boundedByPreloadNone` | ✅ (same E2E test as AC7) | ✅ | |
| `videoCapture_noNewExposureSurface_sameSessionBoundAsScreenshot` | ✅ (same unit test as AC3) | ✅ | |

**Gaps (tests not implemented):** 4 named scenarios above were not implemented as distinct tests. 3 of the 4 (the "only covers successfully-screenshotted ACs," "never served from `/playback-media/`," and "mixed video/no-video ACs" scenarios) are confirmed correct by direct code reading with no plausible failure mechanism — recorded as coverage gaps, not functional defects, consistent with this feature's own precedent of distinguishing the two. The 4th (`videoInclusiveCaptureAll_realDurationMeasured...`) is a genuine, unresolved NFR evidence gap — see below. Coverage gap audit (Step 4, CLAUDE.md B2): AC6/AC7 were correctly classified `CSS-layout-dependent` at test-plan time and closed via 2 new Playwright E2E specs (not RISK-ACCEPT) — no RISK-ACCEPT was needed or recorded for that category, and none was skipped.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — video-inclusive capture-all duration measured, threshold confirmed/revised | ⚠️ | **Recorded, not a failure.** The combining mechanism itself (one Playwright recording context per run, not N) is built and integration-tested (`handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc`), but no real wall-clock number has been recorded against a live, multi-AC tenant feature — same staging-infrastructure gap as `ppc-s1`'s Follow-up #1 and `ppc-s2`'s Follow-up #1, now extending to a 5th consecutive story (`ppc-s1`→`ppc-s2`→`ppc-s3`→`ppc-s4`→`ppc-s5`) with no staging tenant having become available in the interim. `nfr-profile.md`'s own Gap row for this NFR remains open, not closed by this DoD. |
| Performance — video page-render load (AC7: no eager download, no layout shift) | ✅ | E2E-verified: zero media-byte network requests pre-interaction; `document.body.scrollWidth` confirmed non-overflowing at 375px post-fix (see AC7 deviation note above for the regression this test caught) |
| Security — no new exposure surface (AC3) | ✅ | Confirmed by code reading (final cross-task review): `_captureVideoForAcIds` reuses the already-authenticated `browser`, never re-authenticates; `session-page-adapter.js` untouched; cookie `secure` flag derived from the real request protocol, matching the sibling adapter's own established logic exactly |
| Accessibility — no audio narration, not subject to WCAG caption requirement | ✅ | By design (automated UI interaction, no human narration) — documented in `decisions.md` 2026-10-25 DESIGN entry; transcript remains a named, not silently-dropped, fast-follow |
| Audit — no new audit requirement | ✅ N/A | Consistent with `nfr-profile.md`'s own "None identified for this feature at this stage" row |
| Design system — `hasDesignSystemTrack: true`, H-DESIGN scan | ✅ | `scripts/check-design-tokens.js` passed cleanly against this story's real touch points at `/definition-of-ready` (one pre-existing non-token color fixed via a separate PR #1023). The `<img>`/`<video>` evidence items' own non-compliance with `DESIGN.md`'s card/component pattern is a pre-existing, explicitly RISK-ACCEPTed gap (`decisions.md` 2026-10-26) — not reopened by this DoD, no change in compliance status from DoR to merge. |

---

## Metric Signal

**DoD-time correction (same pattern as `ppc-s1`'s and `ppc-s2`'s own DoD runs — see Observation 1 below):** `pipeline-state.json`'s `metrics[].contributingStories` for m1 and m3 did not include `ppc-s5`, despite `benefit-metric.md`'s own Coverage Matrix explicitly naming it for both ("`ppc-s5` (richer video evidence increases trust)" for m1; "`ppc-s5`/`ppc-s6` (directly address this metric's own named feedback-loop risk)" for m3). Fixed as part of this DoD's state write.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1 — Self-service DoD validation adoption | ❌ (0%, no live tenants yet) | Not yet — pending at least one real pilot tenant | Signal: `not-yet-measured`. Evidence note: "wuce has no live paying tenants yet; ppc-s5 adds richer (video, not just static-screenshot) evidence, structurally supporting adoption trust, but no real tenant usage exists yet to measure against — same root cause as ppc-s1/s2/s3's own recorded signal." |
| m3 — Engineer manual-demo load removed | ❌ (not yet established) | Not yet — pending real tenant usage | Signal: `not-yet-measured`. Evidence note: "ppc-s5's richer video evidence structurally strengthens the trust half of Metric 3's own named feedback-loop risk ('the gap is either trust in the captured evidence or a UX/discoverability problem for the PO'), but with no live tenants yet there is no real usage to measure the qualitative signal against." |

This section does not claim success — it records what is now observable (nothing new yet; the pre-launch, no-live-tenant condition is unchanged from `ppc-s1`–`ppc-s4`'s own recorded signals).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **AC7's `<video>` CSS deviation — consider whether the existing `<img>` screenshot's own `max-width:480px` convention carries the same latent narrow-viewport overflow risk**, since it was never tested for overflow (only AC7's new `<video>` element was, which is how this story's own regression was caught). Owner: Platform Owner, due: not urgent — no AC currently claims this for the `<img>`; worth a quick check if a future story touches `screenshotHtml` again.
2. **Performance NFR / real video-inclusive capture-all duration — run one real capture-all against a real, multi-AC, DoD-complete tenant feature with real video capture, once a staging environment with a connected test repo exists.** Record the actual elapsed duration (now a single combined recording context per run, expected materially faster than a naive per-AC design) as real DoD evidence, and confirm/revise `ppc-s2`'s existing 30-60s threshold for the video-inclusive case. This is the same unresolved root cause as `ppc-s1`'s Follow-up #1 and `ppc-s2`'s Follow-up #1, now carried forward a 5th consecutive time. Owner: Platform Owner, due: before this feature's `/release`, or flagged again at `ppc-s6`'s own DoD if still unresolved.
3. **4 test-plan-named scenarios were not implemented as standalone tests** (see Test Plan Coverage gaps) — 3 confirmed correct by code reading with no plausible failure mechanism, low priority to backfill; not carried forward as an action item since no risk was identified.
4. **`ppc-s1`'s own open Follow-up Actions #2–#4 and `ppc-s4`'s own open Follow-up Actions #1–#2** remain open and are not superseded by this story's own work — tracked separately on their own DoD artefacts.

---

## DoD Observations

1. **`contributingStories` for Metrics 1 and 3 did not include `ppc-s5`, despite `benefit-metric.md`'s own Coverage Matrix explicitly naming it for both — found and fixed in this DoD run.** This is now at least the 3rd time this exact gap has recurred in this feature (`ppc-s1`'s own DoD caught and fixed its own omission; `ppc-s2`'s DoD caught and fixed its own omission, explicitly noting "now the second consecutive story"; `ppc-s4` is a **regression** — its own DoD did not catch or fix this same gap, and `ppc-s4` remains missing from `contributingStories` as of this writing, not fixed by this DoD since it is out of scope for `ppc-s5`'s own artefact). **Strong `/improve` candidate:** the self-correcting pattern (each story's own DoD backfilling its own omission) is not reliable — `ppc-s4` shows it can simply be missed. Strengthens the case (raised at both `ppc-s1`'s and `ppc-s2`'s own DoDs already) for `/benefit-metric` or `/definition` writing `contributingStories` at Coverage Matrix authoring time, rather than relying on each story's own later DoD to notice and self-correct.
2. **A real, final cross-task review subagent (dispatched during `/subagent-execution`, after all 8 tasks individually passed spec + code-quality review) fabricated a "Critical"-labelled finding** claiming a checkpoint commit had corrupted `pipeline-state.json`'s governance data (a guardrails-array replacement, plus an unrelated story's tasks-array mislabeling). Independently verified by diffing the raw JSON directly between the pre-work baseline commit and the claimed corruption point: both arrays were byte-for-byte identical; nothing had changed. Discarded without acting on it, logged to `workspace/capture-log.md` (2026-10-26) rather than silently dropped. **`/improve` candidate:** extends this repo's existing "verify coding-agent dispatch completion independently" rule (CLAUDE.md) — independent verification must also apply to a review subagent's *specific factual claims* about data/state changing between two points, not only to whether a self-reported completion/commit/PR actually happened. A confidently-worded, severity-labelled, SHA-cited finding is not on its own evidence that the underlying claim is true.
3. **This story is itself a real-world confirmation of the two-stage review loop's own value**: 3 of this story's 8 implementation tasks (Tasks 6, 7, 8) had at least one Important finding caught and fixed only by the dedicated code-quality/spec-compliance review pass, never by the implementer's own self-review — including one genuine production bug (`videoOnly` silently dropped before reaching persisted state, Task 7) and one genuine, user-visible layout regression (Task 8's own new E2E test catching a `<video>` overflow bug Task 6 had introduced). Not a story-level deviation — recorded as a positive process signal, same framing as `ppc-s1-dod.md` Observation 3 and `ppc-s2-dod.md` Observation 2.
4. **A CI check briefly showed red post-merge-readiness due to a transient GitHub Actions deploy-group concurrency cancellation** (a second, bookkeeping-only push 33 seconds after the first triggered a duplicate E2E workflow run that got canceled mid-flight by the concurrency group, not a real test failure) — confirmed by checking the run history directly (the first run had already completed with full success) and resolved by re-running the canceled job, which then passed cleanly. Not a deviation in the shipped code; recorded only as a reminder that a canceled CI check is not automatically a regression and is worth checking the run history before treating it as one.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s5 (Self-service video capture, combined across ACs where possible).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE WITH DEVIATIONS) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
