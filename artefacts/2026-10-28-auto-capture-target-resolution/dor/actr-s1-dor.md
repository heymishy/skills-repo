# Definition of Ready: actr-s1 — Derive capture target from E2E spec

**Story:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
**Test plan:** artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s1-derive-capture-target-from-e2e-spec-test-plan.md
**Review:** artefacts/2026-10-28-auto-capture-target-resolution/review/actr-s1-review-1.md
**Date:** 2026-10-28

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 6 ACs (AC1, AC2, AC2b, AC3, AC4, AC5) |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ (names CLI wiring, manual-fallback format, capture worker explicitly) |
| H5 | Benefit linkage names a real metric | ✅ `m1` |
| H6 | Complexity rated | ✅ Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH |
| H8 | Test plan covers all ACs | ✅ |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ `artefacts/2026-10-28-auto-capture-target-resolution/nfr-profile.md` |
| H-GOV | Governance approval | ⚠️ No discovery artefact exists (short-track) — see `decisions.md` GAP entry, same precedent as `pcr-s1`/`tst-s1`/`jlc-s1`/`cfg-s1` |
| H-ADAPTER | D37 check | ✅ N/A — no adapter involved; pure parsing function, no I/O |
| H-DESIGN | Design-token compliance | ✅ N/A — `hasDesignSystemTrack` not set; no UI touched by this story |
| H-E2E | E2E tooling gap | ✅ N/A — no CSS-layout-dependent AC; all 5 ACs are unit-testable pure-function behaviour |

**All hard blocks pass** (H-GOV carries the known, accepted short-track gap).

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Derive capture target (URL + selector) from a story's own E2E spec -- artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
Test plan: artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s1-derive-capture-target-from-e2e-spec-test-plan.md

Goal:
Add a shared, pure function that derives BOTH a capture url and a CSS selector
from an E2E spec file's own text, extending the existing selector-only logic
(deriveSelectorFromSpec, scripts/playback-capture.js, rpca-s2). Relocate the
combined logic to a shared module reusable from both scripts/playback-capture.js
(Node fs CLI context) and src/web-ui/routes/playback-evidence.js (adapter-fed
string content in actr-s2) -- the function takes raw spec text as a string
parameter, never a file path.

Read scripts/playback-capture.js's existing deriveSelectorFromSpec/
buildCaptureList (lines ~319-390) and tests/check-rpca-s2-selector-derivation-
from-e2e-specs.js yourself before writing anything -- this is an extension of
existing, tested logic, not a rewrite. Confirm your relocation does not change
deriveSelectorFromSpec's existing behaviour (AC1, AC5) -- that test suite must
still pass unchanged against the relocated code.

New capability: find the nearest page.goto('...') call scanning FORWARD from
the AC's own tagged match -- same direction as the existing selector scan,
confirmed against 3 real spec files (tests/e2e/fpd-s4-caption-sync.spec.js,
tests/e2e/jcx-s3-emotion-curve.spec.js, tests/e2e/ppc-s5-video-lazy-load.spec.js)
before this plan was written; an earlier draft of this story assumed the
opposite direction and was wrong -- do not reintroduce a backward scan.
Bound the forward scan so it stops at the next AC-tag match (if any) in the
same file (AC2b) -- otherwise a later AC's own goto in a multi-AC file would
be misattributed to an earlier AC, the same class of bug rpca-s2-hotfix1
already fixed for the selector side of this scan. If the found value is not
a same-origin relative path (does not start with a single '/' -- reject both
absolute https://... URLs and protocol-relative //... values), return
url: null instead of the found string (AC3) -- this is a security-relevant
guard, not optional polish; see decisions.md's 2026-10-28 SECURITY entry for
why.

Do not wire this function into any real call path yet -- that is actr-s2's
job. Do not touch .github/scripts/ppc-capture-worker.js or
selectors-manual.json.

Update .github/pipeline-state.json via node bin/skills advance (never edit
directly). Open a draft PR. Never merge/self-merge. Never push directly to
origin/master.

Oversight level: Low
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-10-28.
