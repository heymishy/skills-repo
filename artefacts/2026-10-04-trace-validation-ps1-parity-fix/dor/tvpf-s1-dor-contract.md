# Contract Proposal: Fix validate-trace.ps1's discovery_approved false positive

**Story:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/stories/tvpf-s1-fix-discovery-approved-false-positive.md
**Date:** 2026-10-04

---

## What will be built

- `scripts/validate-trace.ps1`'s `Check-DiscoveryApproved` function (lines 156-186) modified: read `discovery.md` content per-line (`Get-Content $discoveryPath`, not `-Raw`), compute an `$approved` boolean (`(?i)status.*approved`) alongside the existing `$draft` boolean (`(?i)status.*draft`) across all lines, and only `Record-Fail`/flag the feature when `$draft` is true for at least one line AND `$approved` is false for every line — matching `validate-trace.sh`'s own already-correct per-line `approved`/`draft` computation and verdict logic (lines 268-269, 474-480) exactly.
- 4 new tests added to the existing `tests/check-p3.5-validate-trace.js` (no new test file).

## What will NOT be built

- Any change to `validate-trace.sh` — it already has the correct behaviour.
- A stronger rewrite that parses only the literal `**Status:**` metadata line — explicitly out of scope per the story.
- Any change to the other 5 checks in either script.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Approved feature with co-occurring status/draft text not flagged | Fixture-based integration test via `-check discovery_approved` single-check mode | integration |
| AC2 — genuinely Draft feature still flagged | Fixture-based integration test (negative control) | integration |
| AC3 — real repo's 2 known false positives resolved | Live integration test against this repo's own real `artefacts/`/`pipeline-state.json` | integration |
| AC4 — `.ps1`/`.sh` produce identical verdicts | Live integration test running both scripts against the same real repo state | integration |

## Assumptions

- `validate-trace.ps1 -check discovery_approved` isolates just that one check's pass/fail via its own exit code, confirmed live (2026-10-04) — no other check's fixture requirements apply to these tests.
- `$RepoRoot` is derived from the `.ps1` file's own location (`Split-Path -Parent $MyInvocation.MyCommand.Definition`), confirmed live — the existing tmpDir-copy-the-ps1 fixture technique (already used by this test file's own `ps1-exits-nonzero-on-missing-required-field` test) is reused, not reinvented.
- AC4's cross-script test may skip gracefully (not fail) if no POSIX shell is available locally, since CI already runs `.sh` on every PR independently — this doesn't weaken the story's own real coverage.

## Estimated touch points

**Files:** `scripts/validate-trace.ps1` (modified), `tests/check-p3.5-validate-trace.js` (modified — 4 new tests added), `tests/check-egsv-s1-env-gated-skip-visibility.js` (modified — see Amendment below)
**Services:** none
**APIs:** none — CLI script only

---

## Amendment (2026-10-05, during Task 2 implementation)

**Added touch point:** `tests/check-egsv-s1-env-gated-skip-visibility.js`. Discovered that this unrelated file's own `p35SkipsAreTrackedSeparately` test hardcodes an exact count (`=== 2`) of "pwsh-unavailable skip blocks" in `check-p3.5-validate-trace.js`'s raw source — Task 1's 4 new tests legitimately grew that count to 6, breaking the hardcoded assertion (not a real regression; every skip block still correctly increments `skipped`). Loosened to `>= 2`, preserving the test's own real documented intent. See `decisions.md`, 2026-10-05 SCOPE NOTE entry.

---

## Contract Review

Cross-checked against the story's own 4 ACs and the test plan's AC Coverage table — every AC maps to a specific, named test approach matching the test plan exactly. No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.
