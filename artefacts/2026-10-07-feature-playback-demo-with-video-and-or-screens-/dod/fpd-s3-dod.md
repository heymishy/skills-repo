# Definition of Done: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**PR:** https://github.com/heymishy/skills-repo/pull/996 (feature) + https://github.com/heymishy/skills-repo/pull/997 (post-merge hotfix, see Scope Deviations) | **Merged:** 2026-10-16 (feature), 2026-10-16 (hotfix)
**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s3-dor.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Viewer lists DoD-validated features with a playback package, each opening its own review page | ✅ | `AC1 (unit)` test passes (fixture-based list filtering). Dispatch-level integration test exercises the real handler against real files on disk. **Live-confirmed 2026-10-17**: operator navigated to `https://wuce-staging.fly.dev/playback` post-hotfix-deploy and observed the correct, genuinely-styled rendering (no feature currently has a package, so the empty-state branch was the one exercised — see AC5) | `unit`, `integration-real-code`, `production-observed` (list/empty-state path only — see AC5 note) | None |
| AC2 — Review page opens with scope/benefit summary, verbatim from discovery.md/benefit-metric.md | ✅ | `AC2 (unit)` test passes. Dispatch-level integration test confirms real discovery.md/benefit-metric.md content renders verbatim | `unit`, `integration-real-code` | None — visual rendering of this specific page not yet live-observed (no real package exists to click through to; see decisions.md) |
| AC3 — Per-story AC sections sourced from the DoD artefact's own AC Coverage table | ✅ | `AC3 (unit)` test passes. Dispatch-level integration test confirms real DoD AC text renders correctly, reusing `parseDodAcCoverage` (ADR-026) | `unit`, `integration-real-code` | None — same visual-rendering caveat as AC2 |
| AC4 — Per-story sections ordered consistently with `pipeline-state.json`'s own epic/story structure, not alphabetised | ✅ | `AC4 (unit)` test passes, deliberately using a fixture where alphabetical order would differ from real order — confirms no accidental re-sort | `unit` | None |
| AC5 — A DoD-validated feature with no package does not appear in the list | ✅ | `AC5 (unit)` test passes. **Live-confirmed 2026-10-17**: every real feature in this repo currently has no package, and the operator observed the correct "No DoD-validated features with a playback package yet" message, not an error or a stale/incorrect list | `unit`, `production-observed` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

**Verification strength summary:** 5 unit, 2 integration-real-code, 2 production-observed.
**UI-evidence gate:** Partially closed by direct live observation (AC1, AC5 — the list/empty-state rendering path). AC2–AC4's own visual rendering (the per-feature review page) remains RISK-ACCEPTed — no real playback package exists anywhere in the repo yet to click through to and observe. See `decisions.md`'s `[PARTIALLY RESOLVED]` note.

---

## Scope Deviations

**One real, significant deviation — a post-merge production incident, not a scope change.** The merged PR (#996) crash-looped `wuce-staging` for ~10 hours: `src/web-ui/routes/playback.js` required `../../../scripts/playback-capture` directly, but `scripts/` is never copied into the production Docker image (`Dockerfile`'s own explicit COPY allowlist). This was not caught by any pre-merge check — the full local test suite (758/758) passed cleanly throughout review/verify-completion, because no test in this repo runs from a filesystem layout where `scripts/` is actually absent. The operator noticed the outage directly and flagged it; root-caused and fixed in a follow-up PR (#997): extracted the two needed functions into `src/utils/dod-parsing.js` (always deployed), with `scripts/playback-capture.js` re-exporting from there unchanged. Verified against the actual failure mode (renamed `scripts/` out of the way locally, confirmed clean boot) before pushing. Full regression suite: 758/758, 0 failures, on both the original PR and the hotfix.

This is **not** new scope — `src/utils/dod-parsing.js` contains the exact same two functions (`parseDodAcCoverage`, `parseBenefitMetricTargets`) that were already correctly implemented and tested in `fpd-s1`'s own `scripts/playback-capture.js`; only their *location* changed, to actually reach the deployed container. No AC's own behaviour changed. This incident, and the fact that it is the **second** occurrence of the exact same root-cause class in this repo (`ic-hotfix1`, `workspace/learnings.md`), is logged in full in `decisions.md` (2026-10-17 INCIDENT entry) and promoted to a dedicated recurring-root-cause entry in `workspace/learnings.md`, at the operator's own explicit request.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (6 planned + 1 collateral dispatch-level test found via `/verify-completion`'s own mandatory Route/handler E2E coverage check)
**Tests passing in CI:** 7 / 7 (full regression suite: 758 / 758 files, 0 failures — confirmed fresh on both PR #996 and the hotfix PR #997)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): viewer lists only DoD-validated features with a package | ✅ | ✅ | |
| AC2 (unit): scope/benefit summary sourced verbatim | ✅ | ✅ | |
| AC3+AC4 (unit): per-story AC sections, real epic/story order preserved | ✅ | ✅ | |
| ADR-028 compliance (integration): one canonical traversal, not re-derived | ✅ | ✅ | |
| Rendering (unit): list/review-page HTML content checks | ✅ | ✅ | |
| Route/handler (integration): real handlers against real files on disk | ✅ | ✅ | Found and closed a real gap — the original plan only tested pure render helpers, not the handlers end to end |

**Test gaps:** None in the test plan itself. The production incident was a **deployment-boundary** gap, not a test-coverage gap — no unit, integration, or E2E test in this repo's own convention exercises "does this `require()` path actually reach the deployed container," which is exactly why it went uncaught. The `/improve` candidate for a dedicated CI check is named in `decisions.md` and `workspace/learnings.md`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no specific SLA, reads already-existing files/state | ✅ | Confirmed by code review — no new heavy computation, route reads `pipeline-state.json` and a handful of small markdown files per request |
| Security — standard session-based auth, matching every other route | ✅ | `authGuard` wraps both `/playback` and `/playback/:slug` at `server.js` dispatch, same convention as `/features/`, `/dashboard`, etc. |
| Security — "no tenant-crossing data exposure" (honest clarification, not silently claimed) | ✅ (clarified) | `pipeline-state.json`'s own `features[]` array has no tenant dimension at all in this data model — every authenticated user of this web-ui instance can already see every feature via the existing `/features` route, with zero tenant filtering on that same data source (confirmed by code read of `handleGetFeatureArtefacts`). `/playback` is identical in this respect — not a new or different exposure, just consistent with how this data has always been scoped (or rather, not scoped) in this app. The NFR's own "tenant-crossing" wording describes a property this data model doesn't have, not a gap this route introduces. |
| Accessibility — WCAG 2.1 AA, native HTML structure | ✅ | Confirmed by code review: semantic `h1`–`h4`, `ul`/`li`, reuses `escHtml` throughout (no unescaped interpolation) |
| Audit — none, read-only | ✅ | Confirmed — story's own NFR section explicitly scopes this out, consistent with the route's read-only nature (unlike `/features`, which does log an audit event for a different, pre-existing reason) |

**Guardrail updates:** `ADR-018` (Playwright, devDependency-only) already `met` from `fpd-s1`'s own DoD — unaffected by `fpd-s3` (no Playwright usage in this story at all). `ADR-027` (ordinary application code, not a skill) and `ADR-028` (one canonical traversal) are both genuinely satisfied by this story's own implementation (confirmed via the dedicated `decisions.md` entry and the ADR-028 compliance test), but **neither has a matching entry in the feature's own `guardrails[]` array** — the registry's own machine-readable block only goes up to `ADR-025` (a pre-existing gap, first found at `fpd-s4`'s own `/review` this cycle, not fixed here to avoid fabricating a registry entry that doesn't exist).

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Acceptance loop closure rate (Tier 1, Metric 1) | ✅ (0%, confirmed) | Not yet — the navigable viewer structure now exists and is confirmed live, but no feature anywhere has a real package to review yet (`fpd-s1`'s own capture has never been run for real); the full closure loop needs `fpd-s4` too | `not-yet-measured`, not a gap — expected at this point |
| M2 — Sponsor feedback re-entry rate (Tier 1, Metric 2) — **first assessed by any story** | ⚠️ Not yet established | `fpd-s3` makes the package structurally navigable in-app for the first time, but no real sponsor-sharing or feedback event has occurred (no package exists yet to share) | `not-yet-measured`, not a gap — this is the correct, honest state for a metric whose own mechanism doesn't exist until a real package is shared |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: One — a real post-merge production incident (crash-loop), root-caused, fixed, and verified within 24 hours; not a behavioural or scope change (see above)
Test gaps: None

**Follow-up actions:**
1. Once a real playback package exists for any feature (after `fpd-s1`'s capture script is actually run for real, or `fpd-s4` ships), live-verify `/playback/:slug`'s own visual rendering — still open, logged in `decisions.md`'s `[PARTIALLY RESOLVED]` note and `workspace/state.json` `pendingActions`.
2. `/improve` candidate (now doubly-justified — 2nd occurrence of the same root cause): build a CI/pre-commit check that greps every file under `src/` for a `require(...)` path resolving into `scripts/` and fails the build. Named concretely in both `decisions.md` and `workspace/learnings.md`.
3. Proceed to `fpd-s4` (viewer media playback — renders the actual screenshots/video into the structure this story established), the final story in the feature.

---

## DoD Observations

1. **Production incident (major, fully documented elsewhere):** see Scope Deviations above and the dedicated `decisions.md` 2026-10-17 INCIDENT entry and `workspace/learnings.md` recurring-root-cause entry for full detail. Flagged here as an `/improve` candidate per item 2 above.
2. **Guardrail registry gap, confirmed again (3rd time this cycle, not fixed):** `ADR-027`/`ADR-028` genuinely apply and are genuinely satisfied, but have no registry entry to mark `met` against. First found at `fpd-s4`'s own `/review`, recurring here. Worth a dedicated small fix to `architecture-guardrails.md`'s own registry block, named 3 times now without being acted on.
3. **NFR wording mismatch, clarified not silently passed:** the story's own Security NFR describes "tenant-crossing data exposure" protection for a data source (`pipeline-state.json`) that has no tenant dimension at all. Documented honestly in the NFR Status table above rather than claiming a protection that doesn't meaningfully apply.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure" (fpd-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the production incident (crash-loop) adequately documented, and is the "not new scope" framing for the hotfix actually justified by the diff, or does it deserve closer scrutiny?
Report findings as HIGH / MEDIUM / LOW.
```
