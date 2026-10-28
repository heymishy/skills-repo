# Review: actr-s3 — Extend bulk "Capture all" to include auto-resolved targets

**Run:** 1
**Date:** 2026-10-28
**Scope:** Category C+D only (short-track exception)

## Findings

None — 0 HIGH, 0 MEDIUM. ACs are testable against `buildCaptureAllList`'s existing pure-function test harness (`tests/check-capture-all.js` pattern), extended with an auto-resolved-targets fixture list. AC1's 3-AC/2-included/1-skipped scenario gives a concrete, unambiguous expected count rather than a vague "works correctly" assertion. AC5's progress-count check closes the one real regression risk this story could introduce (undercounting `captureAllLock.setTotal`). Architecture Constraints correctly keep `buildCaptureAllList` itself I/O-free, pushing the actual resolution calls into `handlePostCaptureAll`, consistent with the module's existing design.

## Verdict

**PASS** — 0 HIGH findings. Proceed to `/definition-of-ready`.
