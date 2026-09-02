# Definition of Done: ep1-s6 — Audit Logging and PostHog Instrumentation

**PR:** https://github.com/heymishy/skills-repo/pull/812 | **Merged:** 2026-09-02
**Story:** artefacts/new-feature-af17f555/stories/ep1-s6.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s6-test-plan.md
**DoR artefact:** artefacts/new-feature-af17f555/dor/ep1-s6-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

AC1 — every named event (feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation, plus ep1-s5's 3 error events) is logged to server stdout with a `[cross-channel]` prefix and structured fields (`featureSlug`, `stage`, `eventType`, `timestamp`, `operatorId` when available), and emitted to PostHog with the same base fields plus event-specific details, fire-and-forget.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 11/11 tests passing (`tests/check-ep1-s6-instrumentation.js`), covering all 6 success events + the 3 unified error events + operatorId presence/absence + PostHog-failure fire-and-forget + structured-JSON format + a dedicated non-alteration integration test | `tests/check-ep1-s6-instrumentation.js`, sibling regression (52 tests across ep1-s1–s5's own suites), full local suite (592 files), CI's assurance gate + traceability validation + both staging E2E scenarios | None — this story's DoR contract held up under investigation (see Scope Deviations) |

---

## Scope Deviations

**No cross-story bugs found or fixed while implementing this story** — unlike `ep1-s1`/`ep1-s3`/`ep1-s4`, and consistent with `ep1-s5`'s own precedent. The DoR contract's premise (a shared instrumentation helper wired into `ep1-s1`–`ep1-s5`'s existing call sites, unifying with `ep1-s5`'s 3 error events) matched reality exactly.

**One latent format gap fixed as part of the unification, not scope creep:** `ep1-s5`'s original `_logCrossChannelError` log line was `[cross-channel] errorType {...json...}` — not valid JSON immediately after the prefix (`errorType` sat as free text before the JSON object). This story's own NFR ("Server logs are structured JSON, not free-text interpolation") required fixing this as part of building the shared `_logCrossChannelEvent` helper. Fixed by moving `eventType` into the JSON payload itself. `_logCrossChannelError`'s exported name, signature, and all of `ep1-s5`'s own passing tests are unchanged — this is purely an internal format correction, disclosed here per this repo's transparency convention rather than silently folded in.

**Test count deviation (disclosed, not a gap):** test plan speced 9 tests (7 unit + 2 integration); 11 were implemented. The "each of the 6 named event types is logged with the [cross-channel] prefix" precondition (originally one test row) was split into 3 more targeted checks during implementation (one for the 4 events reachable via `handleGetJourneyResume` + `_mergeStateFeaturesIntoJourneyList`, one for `artefact_loaded`, one for `stage_navigation`) because those 3 groups require materially different fixtures (pipeline-state.json fixture vs. artefacts-directory fixture vs. journey-store fixture) and combining them into one test function would have obscured which fixture a failure belonged to. Same AC1 coverage, finer granularity.

**No injectable on/off seam for instrumentation** (not called for by this story's Architecture Constraints — "PostHog client already initialized... no new dependency"). The "instrumentation does not alter the behaviour it observes" integration test therefore does not perform a literal toggle-and-diff; it instead asserts the routing decision, journey record fields, and session-creation outcome exactly match `ep1-s4`'s own `getNextSkill` contract, independent of the new logging calls layered around them. This demonstrates the wiring is additive without requiring new production code (a real on/off flag) purely to make the test cleaner — judged not worth the added complexity for a purely-observational logging layer.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 (test plan speced 9 — see Scope Deviations for the disclosed split)
**Tests passing in CI:** 11/11 local + full local suite (592 files, 1 pre-existing known flake — `check-p3.5-validate-trace.js`, confirmed failing identically on master before this PR, unrelated to this change) + sibling regression (52 tests, `ep1-s1`–`ep1-s5`'s own suites, unmodified) + CI's assurance gate, traceability validation, watermark gate, cross-tenant isolation, lint/typecheck/test/build, Playwright smoke, and both staging E2E scenarios (A/B) — all passing

| Test area | Implemented | Passing | Notes |
|-----------|-------------|---------|-------|
| 4 events via `handleGetJourneyResume`/`_mergeStateFeaturesIntoJourneyList` (feature_discovered, feature_selected, journey_backfilled, session_started_from_cli_progressed_feature) logged with `[cross-channel]` prefix + base fields | ✅ | ✅ | |
| `artefact_loaded` logged with `[cross-channel]` prefix + base fields | ✅ | ✅ | |
| `stage_navigation` logged with `[cross-channel]` prefix + base fields | ✅ | ✅ | |
| PostHog event for `artefact_loaded` includes base fields + `artefactCount`/`loadTimeMs` | ✅ | ✅ | |
| `operatorId` present when available, cleanly absent when not | ✅ | ✅ | |
| ep1-s5's 3 error events covered by the same shape | ✅ | ✅ | |
| PostHog call failure does not throw or block; stdout log still succeeds | ✅ | ✅ | |
| Server logs are structured JSON, not free-text | ✅ | ✅ | |
| `stage_navigation` captures both `fromStage` and `toStage` | ✅ | ✅ | |
| Integration: full session lifecycle emits the expected 5-event sequence, in order, none duplicated | ✅ | ✅ | |
| Integration: instrumentation does not alter the behaviour it observes | ✅ | ✅ | See Scope Deviations for the pragmatic (non-toggle) verification approach |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| All PostHog events include `featureSlug`, `stage`, `eventType`, `timestamp`, `userId`(operatorId) when available | ✅ | Every wired call site passes `stage`; `operatorId` included only when the caller has a real session/actor |
| Server logs structured (JSON) | ✅ | Dedicated test parses the line after the `[cross-channel] ` prefix as JSON; `ep1-s5`'s prior non-JSON format fixed as part of this story |
| PostHog calls fire-and-forget — errors in PostHog do not block session | ✅ | Dedicated test forces `posthog-server.capture` to throw and asserts no exception propagates and the stdout log still succeeds |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Web UI Session Start Share | ✅ (mechanism now shipped) | Not yet measured — requires production traffic through `feature_selected`/`session_started_from_cli_progressed_feature` events after this PR's deploy | Signal: not-yet-measured → measurement infrastructure now exists as of this PR |
| Metric 2 (referenced in DoR's H5 benefit linkage, not previously tracked in this epic's DoDs) | ✅ (mechanism now shipped) | Not yet measured | Signal: not-yet-measured |
| Metric 3 — Handoff Context Load Success | ✅ (mechanism now shipped) | Not yet measured — `artefact_loaded`/`artefact_load_error` events are the direct input signal | Signal: not-yet-measured |

This story is the measurement infrastructure itself — every metric in `benefit-metric.md` now has a real event source, but none has accumulated production signal yet. The next observable step is a `/metric-review` once real traffic has flowed through the deployed instrumentation.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Run `/metric-review` (or equivalent) once production traffic has flowed through the newly-deployed instrumentation, to move Metrics 1, 2, and 3 off `not-yet-measured`.
2. This is the last story in `new-feature-af17f555` — the epic's own status (`artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md`, `pipeline-state.json`'s `epics[0].status`) should be moved to `complete` now that all 6 stories have `dodStatus: complete`.
3. Two disclosed, still-open NFR deferrals remain from earlier stories in this epic and are NOT resolved by this story: `ep1-s3`'s and `ep1-s5`'s own operator-facing disclosure banners (session-header UI work, out of scope for every story in this epic to date). If the operator wants these delivered, a follow-up story is needed.

---

## DoD Observations

1. This is the second story in the epic (after `ep1-s5`) whose DoR contract held up completely under investigation — worth noting for future estimation calibration that not every story in a fast-moving epic needs a mid-implementation scope correction; roughly half did (`ep1-s1`/`ep1-s3`/`ep1-s4`), half didn't (`ep1-s5`/`ep1-s6`).
2. Fixing `ep1-s5`'s latent non-JSON log format as part of building the shared helper (rather than opening a separate bugfix story) was a judgment call — justified here because the fix was small (one field's position), fully covered by both stories' own test suites, and directly required by this story's own NFR text. A larger fix would have warranted its own disclosed cross-story deviation entry the way `ep1-s4`'s two bug fixes did.
3. This closes out `new-feature-af17f555` end to end: discovery through DoD for all 6 stories, driven single-session across `ep1-s1`–`ep1-s6`, with every PR (807–812... wait: this epic's own PRs are #808, #809, #810, #811, #812 — 807 was the earlier DARC feature that motivated re-syncing this feature's artefacts to git in the first place) reviewed and merged by the operator (Hamish King) individually rather than auto-merged.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s6 — Audit Logging and
PostHog Instrumentation, the LAST story in the new-feature-af17f555 epic.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the test-count deviation (9 speced -> 11 implemented) adequately explained, or does it suggest scope drift?
3. Does the metric signal section correctly reflect that measurement INFRASTRUCTURE now exists, without falsely claiming real signal has been collected yet?
4. Are the two still-open disclosure-banner deferrals (from ep1-s3 and ep1-s5) clearly flagged as NOT resolved by this story, so they aren't lost track of once the epic closes?
5. Is the outcome verdict (COMPLETE) correct given zero disclosed AC gaps?
6. Should the epic's own status field be moved to complete as part of this DoD's own state-write, or held for a separate explicit operator decision?
Report findings as HIGH / MEDIUM / LOW.
```
