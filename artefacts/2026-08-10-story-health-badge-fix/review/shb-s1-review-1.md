## Review: shb-s1 — Epic-nested story rows always show "Unknown" health instead of their real health

**Story:** artefacts/2026-08-10-story-health-badge-fix/stories/shb-s1-per-story-health-badge-fix.md
**Reviewer:** Claude (agent), operator-directed — found via live staging investigation this session
**Date:** 2026-08-10

---

### Category A: Traceability

PASS. Benefit linkage is unusually well-grounded: it cites the exact live, on-page contradiction observed (top rollup vs. 624/624 rows showing Unknown), names the exact three stories whose interaction produced the gap (`a3`, `tmc-s1`/`pvc-s1`, `a4`), and quotes `a3`'s own doc comment explaining the original, still-valid design decision this story must not undo.

### Category B: Scope discipline

PASS. Explicitly declines to change `computeHealthCounts`'s granularity (the correct call — that was a deliberate a3-era decision, not a defect) and explicitly declines to bundle in the two other missing-UI findings from the same investigation session. This is a narrow, additive inheritance fix, not a redesign of the health system.

### Category C: AC quality

PASS. 4 ACs, each Given/When/Then, each independently testable. AC2 and AC3 are explicit regression/fallback guards — AC2 protects the already-correct non-epic-nested path, AC3 protects the genuinely-unmatched fallback case so the fix doesn't overcorrect into fabricating health data. AC4 directly encodes the observed symptom (rollup vs. row-level contradiction) as a testable condition.

### Category D: Completeness

PASS. NFRs correctly scope Correctness as the primary concern (a real, currently-live, 624/624-row defect in the repo's own self-tracked product) and Performance as negligible (one field threaded through an existing pass, no new I/O). Complexity rated 1, correctly — the root cause is fully traced in the story itself, and the fix shape (thread `featureSlug`, change one lookup key) is unambiguous.

### Category E: Architecture compliance

PASS. Correctly identifies this as an inheritance fix (story inherits parent feature's health) rather than a new data source, matching the repo's existing pattern of "no fabricated values, honest fallback for genuinely unmatched data" (referenced directly in the story via the original `a4` developer's own comment). Does not touch `pipeline-state.json` schema or `computeHealthCounts`.

---

### Verdict

**PASS — 0 HIGH findings.** A well-root-caused, tightly-scoped fix to a real, currently-live, highly-visible defect (a page contradicting its own rollup number). The AC2/AC3 regression and fallback-preservation guards show real care for not overcorrecting a "no fabricated data" invariant this repo evidently holds elsewhere. Cleared to proceed to `/test-plan`.
