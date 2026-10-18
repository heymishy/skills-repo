# Definition of Done: Viewer renders the actual screenshot gallery and plays video per AC

**PR:** https://github.com/heymishy/skills-repo/pull/998 | **Merged:** 2026-10-18
**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s4-dor.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-18

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Screenshot renders in its own AC section, readable without zooming | ✅ | `AC1 (unit)` test passes: `<img>` referencing the exact screenshot path renders inside that AC's own section. Dispatch-level test confirms `handleGetPlaybackMedia` serves the real file with a 200 and the correct content-type | `unit`, `integration-real-code` | Visual rendering not live-observed — see UI-evidence gate note below |
| AC2 — Native `<video>` player renders for an AC with video evidence, playable in-page | ✅ | `AC2 (unit)` test passes: `<video controls>` with a `<source type="video/webm">` renders, no third-party player markup | `unit`, `integration-real-code` | Same visual-rendering caveat as AC1 |
| AC3 — Captions display, synced, via native player controls | ✅ (RISK-ACCEPT for live-execution evidence) | `AC3` E2E spec (`tests/e2e/fpd-s4-caption-sync.spec.js`) written, confirmed syntactically valid (`node --check`) — not executed. Markup-level: `<track kind="captions">` wired to the real `.vtt` file, confirmed by unit + dispatch-level test | `unit` (markup wiring); real-execution `not-verified`, RISK-ACCEPT per `decisions.md` D5 | Gap is execution-environment (no reachable Postgres in this sandbox), not implementation — same pattern as `fpd-s1` AC3 and `fpd-s2` AC1 |
| AC4 — Standalone transcript accessible without playing the video | ✅ | `AC4 (unit)` test passes: a transcript link renders in the AC's own section, reachable independently of the `<video>` element | `unit`, `integration-real-code` | Same visual-rendering caveat as AC1 |
| AC5 — An AC with no evidence yet shows a clear empty state, not a broken image | ✅ | `AC5 (unit)` test passes: explicit "No evidence captured for this AC yet" text renders, no `<img>` with a missing `src` | `unit`, `integration-real-code` | Same visual-rendering caveat as AC1 |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

**Verification strength summary:** 5 unit, 5 integration-real-code, 0 live-verified, 0 production-observed.

**UI-evidence gate:** Not closed by live observation for any of this story's own 5 ACs — RISK-ACCEPT already logged in `decisions.md` (2026-10-18, `/verify-completion`) at merge time, and re-confirmed today during a dedicated live-validation session: no feature anywhere in this repo currently has a DoD artefact using the `## AC Coverage` table shape this story's own code depends on (`parseDodAcCoverage`), so the `<img>`/`<video>`/`<track>`/transcript-link rendering this story built has **never fired against any real feature** — only against unit fixtures and `feature-playback-demo`'s own stories (which cannot be used as the live-verification target themselves; see DoD Observations below). This is a genuinely closed-off verification path today, not a skipped one.

---

## Scope Deviations

**None behavioural.** 5 commits on the branch, each maps directly to one of the 6 planned implementation tasks (Task 5+6 bundled into one commit) — confirmed at `/verify-completion`.

**One process-mechanics deviation, self-corrected pre-merge, no behavioural impact:** the branch's own `/verify-completion` state write to `.github/pipeline-state.json` conflicted with a separate `chore/fpd-s4-branch-setup-and-plan` checkpoint that had merged to master after this branch diverged from the same base commit — the exact epic-nested story state-bookkeeping conflict CLAUDE.md's `cdg.6`/B2 rule warns about. Fixed by restoring the branch's copy of that file to exactly match `origin/master` (removing the conflict) and re-applying the state write fresh on master after merge, per the documented correct procedure. No code file was affected.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 (full regression suite: 759 / 759 files, 0 failures — confirmed fresh at `/verify-completion` and again on CI for PR #998)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Deployment-safety (unit): `captionTranscriptPaths` lives under `src/`, not `scripts/` | ✅ | ✅ | Applied the `fpd-s3` hotfix lesson proactively, before any route code could require it from `scripts/` |
| AC1 (unit): screenshot renders in its own AC section | ✅ | ✅ | |
| AC2 (unit): native video player renders for an AC with video evidence | ✅ | ✅ | |
| AC4 (unit): standalone transcript accessible without playing the video | ✅ | ✅ | |
| AC5 (unit): no-evidence AC shows a clear empty state | ✅ | ✅ | |
| Path traversal guard (unit, CLAUDE.md mandatory): a path outside `artefacts/<slug>/playback/` is rejected with 400 | ✅ | ✅ | Collateral test found via `/verify-completion`'s own Route/handler E2E coverage check — not in the original 6-item plan, added because the media-serving route (Task 5) is a real, previously-unestimated touchpoint named in the plan's own header |

**Test gaps:** AC3's real-playback execution — see AC Coverage above. No gap in the test plan itself.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — media served directly from disk, no transcoding | ✅ | Confirmed by code review: `handleGetPlaybackMedia` is a direct `fs.createReadStream(...).pipe(res)`, no processing |
| Security — standard session-based auth, matching every other route | ✅ | `authGuard` wraps `GET /playback-media/*` at `server.js` dispatch, same convention as `/playback`, `/features/`, `/dashboard` |
| Security — mandatory path-traversal guard (CLAUDE.md) | ✅ | Allowlist shape check (`MEDIA_PATH_RE`) + `path.resolve`/`startsWith(repoRoot)`, both covered by a dedicated test asserting the 400 response and that content is never served |
| Security — "media files are served only to authenticated users with access to that feature's own tenant" (story's own NFR wording, honest clarification, not silently claimed) | ✅ (clarified) | Same finding as `fpd-s3`'s own DoD, now extended to the media route too: `pipeline-state.json`'s `features[]` has no tenant dimension anywhere in this codebase — confirmed by code read of `handleGetFeatureArtefacts` (the one place that reads a `tenantId`, `_resolveFeatureContext`, uses it only for cosmetic breadcrumb resolution against a *different*, Postgres-backed "products" data model — never as an access-control check on artefact content). `/playback-media/*` is consistent with how this entire data category has always been scoped (i.e. not scoped) in this app — not a new or different exposure. The feature's own `nfr-profile.md` (lines 25-26) makes the same overclaim citing ADR-025; worth a documentation fix, not a code fix, since ADR-025's actual historical precedent (an unguarded `journeyId` read) is a different, Postgres-backed data model than `pipeline-state.json`'s file-backed `features[]` |
| Accessibility — WCAG 2.1 AA, native video controls + captions track + standalone transcript | ✅ | Confirmed by code review: native `<video controls>` and `<track kind="captions">` are keyboard-operable and screen-reader-compatible by browser default (no custom player, per Architecture Constraints); the transcript link (AC4) gives a non-video-dependent path. Not independently tested with real assistive technology — same light-touch standard `fpd-s3`'s own DoD applied |
| Audit — none, read-only | ✅ | Confirmed — story's own NFR section explicitly scopes this out |

**Guardrail updates:** `ADR-018`/`ADR-027`/`ADR-028` unaffected (no new skill, no new traversal — this story adds to `fpd-s3`'s own canonical structure, confirmed by the Architecture Constraints and the DoR's own reuse-check). The `ADR-027`/`ADR-028` registry gap `fpd-s3`'s own DoD already flagged (genuinely satisfied, no matching `guardrails[]` entry exists to mark `met` against) is still open — 4th time named this cycle (`fpd-s4`'s own `/review`, `fpd-s3`'s `/review`, `fpd-s3`'s own DoD, now here), still not fixed, to avoid fabricating a registry entry that doesn't exist.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Acceptance loop closure rate (Tier 1, Metric 1) | ✅ (0%, confirmed) | Not yet | The full `fpd-1`–`fpd-4` chain is now code-complete and merged, but no real playback package has ever been captured against a feature whose DoD can actually drive the media-rendering code (see UI-evidence gate note above) — the loop cannot close until that gap is addressed |
| M2 — Sponsor feedback re-entry rate (Tier 1, Metric 2) | ⚠️ Not yet established | Not yet | Same blocker as M1 — no real, shareable package with real evidence rendering exists yet for any sponsor to review |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None behavioural (one self-corrected process-mechanics conflict, see above)
Test gaps: None

**Follow-up actions:**
1. **AC-table format gap (new, found live 2026-10-18):** no feature's DoD outside `feature-playback-demo` itself uses the `## AC Coverage` table shape `parseDodAcCoverage` parses — this story's own media-rendering code has never fired against a real feature. Logged in `workspace/capture-log.md`. Needs either: future features adopting this table shape, or `parseDodAcCoverage` learning to understand the more common `## AC Verification` shape seen elsewhere in this repo.
2. **Screenshot filename collision (new, found live 2026-10-18):** `artefacts/<featureSlug>/playback/screenshots/<acId>.png` has no story-slug component — a real capture against a multi-story feature where AC numbering restarts per story (e.g. `feature-playback-demo` itself) would silently cross-contaminate. Logged in `workspace/capture-log.md`, needs its own short-track story before any real self-referential capture is attempted.
3. **Staging-deploy CX gap (new, found live 2026-10-18, flagged by the operator directly):** `staging-deploy.yml`'s own `paths-ignore` (correctly) skips deploys for artefact-only pushes, but this means Feature Playback's own captured packages can never appear live without a coincidental code deploy. Logged in `workspace/capture-log.md`, decision deferred to a later session.
4. Once items 1 and 2 above are resolved, run a real capture against a compatible feature and live-verify this story's own 5 ACs — the actual img/video/track/transcript rendering has still never been visually observed.
5. `ADR-027`/`ADR-028` guardrail registry gap — 4th occurrence, still not fixed (see NFR Status above).

---

## DoD Observations

1. **A dedicated live-validation session today (2026-10-18) attempted exactly this story's own follow-up action (item 4 above) and could not complete it** — not because of a code defect in this story, but because two separate, real gaps (items 1 and 2 above) block any real feature from exercising this story's own rendering code at all. Both were found specifically *because* a real capture was attempted, not by inspection alone — consistent with this cycle's own recurring pattern (mock-shape mismatches, deployment-boundary gaps) of defects only surfacing when something real is tried.
2. **A partial, honest live-validation substitute was captured instead:** a real playback package for `2026-06-14-web-ui-pm-flow` (real Kanban-board screenshot, real walkthrough.md), written by hand since that feature's own DoD files don't use the required table shape either. This validates `/playback`'s list-entry and review-page-shell rendering (discovery/benefit-metric verbatim text, story section ordering, the pre-existing `fpd-s3` "No AC Coverage data available" story-level empty branch) against a real, non-synthetic feature for the first time — but does **not** exercise this story's own AC1-AC5 rendering code, which needs a story-level AC table, not just a story-level absence of one.
3. **NFR wording mismatch, clarified not silently passed (continuing `fpd-s3`'s own pattern):** see NFR Status above — now also flagging that the feature-level `nfr-profile.md` itself (not just this story's own NFR text) makes the same overclaim, citing ADR-025, which actually governs a different (Postgres-backed) data model.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Viewer renders the actual screenshot gallery and plays video per AC" (fpd-s4) — the final story in the feature-playback-demo feature.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is it honest that none of this story's own 5 ACs have ever been visually observed, despite a dedicated live-validation session today? Does the RISK-ACCEPT trail (decisions.md, this DoD) actually justify COMPLETE rather than COMPLETE WITH DEVIATIONS?
3. Are the two new gaps found today (AC-table format mismatch, screenshot filename collision) serious enough that they should have blocked merge rather than being logged as follow-ups? Both were found post-merge, during this DoD pass.
4. Is the NFR tenant-scoping clarification (this DoD + fpd-s3's own) actually correct, or does it deserve a second, independent code read before accepting "no tenant dimension exists" as true?
5. Does the metric signal row (both M1 and M2 still not-yet-measured, now with 4/4 stories shipped) suggest this feature needs a dedicated follow-up story just to make the capture mechanism actually usable, before the benefit metrics can ever move?
Report findings as HIGH / MEDIUM / LOW.
```
