# Definition of Ready: actr-s3 — Extend bulk "Capture all" to include auto-resolved targets

**Story:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s3-auto-resolve-bulk-capture-targets.md
**Test plan:** artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s3-auto-resolve-bulk-capture-targets-test-plan.md
**Review:** artefacts/2026-10-28-auto-capture-target-resolution/review/actr-s3-review-1.md
**Date:** 2026-10-28

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 5 ACs |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ (capture worker/finalise path, new UI affordances both explicitly excluded) |
| H5 | Benefit linkage names a real metric | ✅ `m1` |
| H6 | Complexity rated | ✅ Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH |
| H8 | Test plan covers all ACs | ✅ |
| H8-ext | Cross-story dependency | ✅ Depends on `actr-s2` — must not start until `actr-s2` is merged |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ `artefacts/2026-10-28-auto-capture-target-resolution/nfr-profile.md` |
| H-GOV | Governance approval | ⚠️ No discovery artefact (short-track) — see `decisions.md` GAP entry |
| H-ADAPTER | D37 check | ✅ N/A — no new adapter; reuses `actr-s2`'s resolution function and the existing `fetchArtefact` adapter it wraps |
| H-DESIGN | Design-token compliance | ⚠️ Deferred to implementation — `hasDesignSystemTrack: true` set (reuses `actr-s2`'s per-AC rendering, no new visual pattern of its own). Coding agent must confirm `node scripts/check-design-tokens.js` still passes after this story's changes. |
| H-E2E | E2E tooling gap | ✅ N/A — all 5 ACs are unit/integration tests against `buildCaptureAllList` and `handlePostCaptureAll`, no new CSS-layout-dependent behaviour |

**All hard blocks pass** (H-GOV carries the known, accepted short-track gap; H-DESIGN deferred to implementation).

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Extend bulk "Capture all" to include auto-resolved targets -- artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s3-auto-resolve-bulk-capture-targets.md
Test plan: artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s3-auto-resolve-bulk-capture-targets-test-plan.md

Depends on actr-s2 -- confirm its PR is merged and its per-AC resolution
function is directly reusable (not only reachable from inside
handleGetPlaybackEvidence's own render path) before starting. If actr-s2's
resolution logic is not already factored out as a standalone callable
function, that is this story's own first task -- do not duplicate the
resolution logic inline here.

Goal:
1. Extend src/utils/capture-all.js's buildCaptureAllList to accept a third
   input (auto-resolved targets, same {acId, url, selector} shape as the
   existing captureTargets param) and include an AC in toCapture when EITHER
   a manual or an auto-resolved target exists for it -- manual wins when both
   exist (AC2). Keep this function pure/I-O-free, exactly as it is today --
   do not add a fetch call inside capture-all.js itself.
2. In handlePostCaptureAll (playback-evidence.js), before calling
   buildCaptureAllList, compute actr-s2's per-AC auto-resolution for every AC
   in the group that lacks a manual target (reuse actr-s2's function
   directly -- do not re-implement test-plan/spec fetching here).
3. Confirm captureAllLock.setTotal receives the full merged toCapture.length,
   not the pre-existing manual-only count (AC5) -- this is the one easy place
   to regress silently; write the test for it, don't just eyeball the code.

Any AC whose auto-resolution attempt fails must land in skipped exactly as an
AC with no target does today (AC4) -- no new error path, no partial-failure
500.

Run node scripts/check-design-tokens.js before opening the PR.

Update .github/pipeline-state.json via node bin/skills advance (never edit
directly). Open a draft PR. Never merge/self-merge. Never push directly to
origin/master.

Oversight level: Medium -- same real-navigation risk surface as actr-s2, now
exercised across a whole AC group in one request; verify the 3-AC scenario
from AC1 manually against a real journey before calling this done.
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-10-28.
