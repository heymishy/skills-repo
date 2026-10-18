# Release Notes — Technical: Feature Playback Demo Package (2026-10-18)

**Release date:** 2026-10-18
**Release type:** Standard
**Stories included:** 6
**Pipeline build:** GitHub Actions (`tools.ci_platform: github-actions`) — see each PR's own checks

---

## Changes

### fpd-s1 — Walkthrough document and screenshots

- **PR:** https://github.com/heymishy/skills-repo/pull/994 | **Merged:** 2026-10-15
- **What changed:** `scripts/playback-capture.js` generates `artefacts/[feature]/playback/walkthrough.md` from a DoD-validated feature's own DoD artefact(s) and `benefit-metric.md`; `captureAcScreenshots` drives Playwright screenshot capture per AC.
- **ACs delivered:** 5 of 5
- **Scope deviations:** None
- **Test coverage:** unit + integration tests passing; AC3 (real-browser capture) RISK-ACCEPTed for execution in this sandbox (unit-tested against mocked Playwright only — see `decisions.md`)

### fpd-s2 — Video walkthrough and accessibility

- **PR:** https://github.com/heymishy/skills-repo/pull/995 | **Merged:** 2026-10-15
- **What changed:** `captureVideoRecording` adds Playwright `recordVideo` capture (`.webm`); `generateCaptionsForVideo` produces captions + standalone transcript via the D37 adapter pattern, unreviewed until explicit confirmation.
- **ACs delivered:** 6 of 6
- **Scope deviations:** None
- **Test coverage:** unit tests passing; AC1 (real recording) RISK-ACCEPTed for execution in this sandbox, same class as fpd-s1 AC3

### fpd-s3 — Viewer route and traceability structure

- **PR:** https://github.com/heymishy/skills-repo/pull/996 (feature) + https://github.com/heymishy/skills-repo/pull/997 (post-merge hotfix) | **Merged:** 2026-10-16 (both)
- **What changed:** New `/playback` (list) and `/playback/:slug` (review) routes in `src/web-ui/routes/playback.js`, wired into `server.js`. Hotfix: moved `parseDodAcCoverage`/`parseBenefitMetricTargets` into `src/utils/dod-parsing.js` after discovering `scripts/` is excluded from the production Docker image.
- **ACs delivered:** all declared ACs
- **Scope deviations:** **Real production incident** — see Known Issues / Limitations and Rollback below.
- **Test coverage:** full regression suite 758/758 on both the original PR and the hotfix

### fpd-s4 — Viewer media playback

- **PR:** https://github.com/heymishy/skills-repo/pull/998 | **Merged:** 2026-10-18
- **What changed:** `renderAcMediaHtml` embeds `<img>`/native `<video>`+`<track>`/transcript link into each AC section of `/playback/:slug`; `handleGetPlaybackMedia` serves media with a path-traversal guard.
- **ACs delivered:** all declared ACs
- **Scope deviations:** Process-mechanics only (pipeline-state.json state-write conflict, self-corrected, no code impact)
- **Test coverage:** dispatch-level tests against real temp-directory files (not mocked `fs`); AC3 (caption sync during real playback) RISK-ACCEPTed for execution, same class as prior stories

### fpd-s5 — Close the real-capture loop

- **PR:** https://github.com/heymishy/skills-repo/pull/999 | **Merged:** 2026-10-18
- **What changed:** `parseDodAcCoverage` now parses both `## AC Coverage` and `## AC Verification` table shapes; screenshot/video paths namespaced by story (`artefacts/[feature]/playback/[story]/screenshots/[AC].png`) to fix a real cross-story AC-numbering collision; `staging-deploy.yml`'s `paths-ignore` no longer skips deploys for playback-only pushes. First real, non-synthetic capture ever rendered live (`pmf.3` AC1).
- **ACs delivered:** 4 of 4
- **Scope deviations:** None (2 DoR contract amendments during implementation, both logged as found, not scope creep)
- **Test coverage:** 6/6 tests; AC4 (real deploy) proven for real during this story's own `/verify-completion`, not RISK-ACCEPTed

### fpd-s6 — Review page coverage summary

- **PR:** https://github.com/heymishy/skills-repo/pull/1001 | **Merged:** 2026-10-18
- **What changed:** `computeAcCoverageSummary`/`renderCoverageSummaryHtml` add an "M of N ACs have captured evidence" summary to `/playback/:slug`, positioned before any per-story section, with text-distinct zero/partial/full states (`MC-A11Y-02`).
- **ACs delivered:** 4 of 4
- **Scope deviations:** None
- **Test coverage:** 9/9 tests (3 unit `computeAcCoverageSummary`, 3 unit `renderCoverageSummaryHtml`, 2 integration, 1 NFR); all 4 ACs `live-verified` against a real browser (initial check used real production data, a second DoD-time check covered the zero/full states a real fixture hadn't exercised)

---

## Dependencies and Prerequisites

None beyond what's already live — this release is additive to the existing `src/web-ui/routes/playback.js` route layer, no new infrastructure.

---

## Configuration Changes

None.

---

## Database / Data Changes

None. No schema or data migration in any of the 6 stories.

---

## Feature Flags

None — this feature ships unconditionally, no flag gating.

---

## Known Issues / Limitations

- **fpd-s3's real production incident (resolved):** the original PR (#996) crash-looped `wuce-staging` for ~10 hours because `scripts/playback-capture.js` (never copied into the production Docker image) was required directly from a production route handler. Fixed in the same-day hotfix PR (#997). Logged in `decisions.md` (2026-10-17 INCIDENT) and `workspace/learnings.md` as a recurring root-cause pattern (second occurrence of the same class as `ic-hotfix1`).
- **Real automated capture is still not built.** `scripts/playback-capture.js` has no CLI entrypoint and has only ever been exercised against a mocked Playwright `page` — every real screenshot in this repo's history (including `fpd-s6`'s own real captures) was produced via an operator's manually-driven, authenticated Chrome session. This is tracked separately (`workspace/capture-log.md`, 2026-10-18) pending a fresh `/discovery` pass, not part of this release.
- **M1/M2/M3 all remain `not-yet-measured`.** The mechanism is proven to work end to end, but no real feature has yet produced and shared a playback package through its own natural workflow.

---

## Rollback

**Procedure:** `git revert` the merge commit(s) for the story being rolled back, push to `master`, then either let `staging-deploy.yml` redeploy staging automatically, or run `fly deploy -a skills-framework` manually for production (production deploys are manual throughout this repo — confirmed no production-deploy GitHub Actions workflow exists).
**Tested:** No — theoretical. Standard git-revert rollback, not tested this specific release cycle. No schema/data migration in any of the 6 stories, so no migration-rollback complexity.
**Estimated duration:** <5 minutes for the revert + push; staging redeploy completes within the same window `staging-deploy.yml` normally takes (observed ~4 minutes during this session's own fpd-s5/fpd-s6 pushes); production redeploy depends on when the operator runs the manual `fly deploy`.
**Complications:** None identified. All 6 stories are additive (new routes, new rendering functions) — no removed or renamed existing behaviour for any other feature to depend on.
**Trigger conditions:** `/playback` or `/playback/:slug` returning 5xx, or the staging/production deploy's own smoke check failing post-deploy (mirrors the deployment checklist below).
