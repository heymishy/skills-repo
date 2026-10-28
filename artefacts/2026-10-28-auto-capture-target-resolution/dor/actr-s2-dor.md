# Definition of Ready: actr-s2 — Auto-resolve the single-AC capture target

**Story:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md
**Test plan:** artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s2-auto-resolve-single-ac-capture-target-test-plan.md
**Review:** artefacts/2026-10-28-auto-capture-target-resolution/review/actr-s2-review-1.md
**Date:** 2026-10-28

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 6 ACs |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ (bulk flow, DoD/review artefact reads, test-plan template format all explicitly excluded) |
| H5 | Benefit linkage names a real metric | ✅ `m1` |
| H6 | Complexity rated | ✅ Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH |
| H8 | Test plan covers all ACs | ✅ |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ `artefacts/2026-10-28-auto-capture-target-resolution/nfr-profile.md` |
| H-GOV | Governance approval | ⚠️ No discovery artefact (short-track) — see `decisions.md` GAP entry |
| H-ADAPTER | D37 check | ✅ N/A — no NEW adapter; reuses the existing `fetchArtefact` adapter already wired in `server.js` |
| H-DESIGN | Design-token compliance | ⚠️ Deferred to implementation — `hasDesignSystemTrack: true` set on this story (touches UI in `src/web-ui/`). The new "Auto-detected — Override" block is text-only and reuses this page's existing form/label markup; no new color values are introduced. Coding agent must run `node scripts/check-design-tokens.js` against `playback-evidence.js` before opening the PR — expected PASS, but cannot be confirmed before code exists. |
| H-E2E | E2E tooling gap | ✅ N/A — all 6 ACs are route/render-level tests using fake adapters, no CSS-layout-dependent behaviour |

**All hard blocks pass** (H-GOV carries the known, accepted short-track gap; H-DESIGN deferred to implementation per above — PR must not merge until it shows PASS).

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Auto-resolve the single-AC capture target before falling back to manual entry -- artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md
Test plan: artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s2-auto-resolve-single-ac-capture-target-test-plan.md

Depends on actr-s1 -- confirm its PR is merged and its shared derivation
function is available before starting. Read src/web-ui/routes/playback-
evidence.js in full before editing -- this file is large and has several
established conventions (fetchArtefact injection, _resolveJourney tenant
scoping, _isFormSubmission redirect handling) that must be followed, not
reinvented.

Goal:
Before showing the existing manual capture-target form for an AC
(handlePostCaptureTarget's form, rendered inside handleGetPlaybackEvidence /
_renderPlaybackEvidenceHtml), attempt auto-resolution:
1. If journey.captureTargets already has a manually-set entry for this AC,
   use it -- skip auto-resolution entirely (AC3).
2. Otherwise, fetch the story's own test-plans/<story-slug>-test-plan.md via
   the existing _fetchArtefact/fetchArtefact adapter (same one this file
   already uses for discovery.md/benefit-metric.md in _fetchSummaryContent).
   Parse its E2E section for a "**File:** tests/e2e/....spec.js" line scoped
   to the given acId (sample the real format from
   artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-
   plan.md line 149 before writing the parser -- do not guess the format).
3. If found, fetch that spec file's content via the same adapter and run it
   through actr-s1's shared derivation function.
4. Wrap every step in try/catch -- ANY failure (artefact 404, parse miss, spec
   fetch failure) must silently fall through to today's existing manual form
   (AC5). This must never throw up to the request handler.

Render: when auto-resolution succeeds, show the resolved url/selector read-
only with the spec file path named, plus an "Override" control that reveals
the existing manual form. handlePostCaptureTrigger's own dispatch call
(dispatchCaptureWorkflow) needs no shape change -- it already takes
{acId, url, selector} regardless of source; just make sure the resolved
values (not a blank target) reach it when no manual entry exists.

Run node scripts/check-design-tokens.js against your changed file before
opening the PR -- H-DESIGN is deferred to this step, not pre-checked at DoR.

Update .github/pipeline-state.json via node bin/skills advance (never edit
directly). Open a draft PR. Never merge/self-merge. Never push directly to
origin/master.

Oversight level: Medium -- new read path into tenant repo content feeding a
real browser navigation; verify AC3/AC5's priority and fail-safe behaviour
yourself with a real page load, not just the unit tests, before calling this
done.
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-10-28.
