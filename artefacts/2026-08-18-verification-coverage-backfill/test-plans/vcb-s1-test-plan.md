# Test Plan: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass (vcb-s1)

**Story:** artefacts/2026-08-18-verification-coverage-backfill/stories/vcb-s1-backfill-rpc-s1-and-jrf-s1-verification-gaps.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1: `rpc-s1`'s Connect-repo form inputs have real, non-empty aria-labels | AC1 | Behavioural | New `NFR-Accessibility` test in `tests/check-rpc-s1-connect-repo.js`: asserts `rpc-connect-owner`, `rpc-connect-repo`, `rpc-create-name` each carry a real `aria-label` matching the already-shipped markup |
| T2: `jrf-s1`'s IT5 widened to a real, scoped regression pass | AC2 | Regression | New `IT6` in `tests/check-jrf-s1-new-feature-redirect.js`: runs every test file that exercises the REAL production `handlePostProductFeature` handler (found via `grep -rl "handlePostProductFeature" tests/*.js`, 9 files) and asserts all pass — closes the gap that the original IT5 only ever called a local, hand-copied reimplementation, never the real handler |
| T3: both new/widened tests pass with no regressions introduced | AC3 | Regression | Both files run clean; the 9 related files T2 spawns also independently confirmed clean |

## Scope note (deviation from the story's literal Architecture Constraints)

The story's Architecture Constraints ask `jrf-s1`'s IT5 to "actually run the full regression suite... per the DoR contract's original Coding Agent Instructions." A literal full-639-file `npm test` run spawned from inside a checked-in test file would reintroduce the exact CPU-contention/recursion anti-pattern this repo already found and removed once (`check-md-3-adr.js`, fixed by `mar-s1`, 2026-08-08 — see `.github/architecture-guardrails.md`). The story's own text anticipates this with an explicit alternative: "a clearly-scoped, correctly-baselined subset matching the DoR contract's original intent." T2 implements that alternative: every test file that actually exercises the real production handler this story's fix targets (9 files), which is a materially stronger regression check than the original two-isolated-calls IT5, without the recursion risk.

## Out of Scope (per story)

- Any change to `rpc-s1`'s or `jrf-s1`'s actual production code.
- Broader audit for other stories with similarly incomplete verification.

## NFR Test Coverage

Accessibility — T1 is itself the NFR test.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
