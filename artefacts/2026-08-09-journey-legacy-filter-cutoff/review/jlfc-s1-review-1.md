## Review: jlfc-s1 — Time-bound the journey list's pre-tenancy migration-grace filter so it stops surfacing tenant-less test artifacts as "yours"

**Story:** artefacts/2026-08-09-journey-legacy-filter-cutoff/stories/jlfc-s1-journey-legacy-filter-cutoff.md
**Reviewer:** Claude (agent), operator-directed — found via live browser exploration of the operator's real staging environment
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a directly observed, reproducible live discrepancy (sidebar says 7, actual page shows 1010) and the root cause is traced to a specific, named commit (`2c0fb7ca`, 2026-06-29) that introduced the exact filter clause being narrowed — not a guess, a verified historical anchor for the proposed cutoff.

### Category B: Scope discipline

PASS. Out of scope explicitly and correctly excludes the two adjacent, larger concerns this same investigation surfaced: why tenant-less journeys keep being created (a test/CI-authentication investigation) and cleaning up the already-accumulated ones (a data action) — both correctly deferred rather than bundled into this filter narrowing. The story also explicitly protects the session-level backward-compat path (AC5) from being conflated with the journey-level path being narrowed (AC1-AC3) — these are two different existing checks in the same function, and the review confirms the story doesn't blur them.

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable. AC2/AC3 are well-reasoned regression guards for the two ways the fix could over-correct (breaking genuine legacy visibility, or breaking the missing-`createdAt` edge case) — not just testing the happy path of "the bug is fixed," but also testing that the intentional backward-compat behaviour survives. AC4/AC5 explicitly point at the existing `check-s0.3-journey-list-filter.js` test file's own AC1-AC4 as the regression baseline, which is good practice: it makes cross-referencing existing coverage part of the AC text itself, not left implicit.

### Category D: Completeness

PASS. NFRs correctly frame this as a correctness/security-adjacent fix (an over-broad visibility rule, not a UI cosmetic issue) alongside a negligible performance note. Complexity rated 2, correctly — flagged specifically because getting the cutoff's provenance and the missing-timestamp edge case right both require judgment, not because the diff itself is large.

### Category E: Architecture compliance

PASS. Explicitly commits to a fixed, historically-anchored constant rather than a configurable policy — correct scope for a one-time migration-boundary fix. Explicitly declares journey-creation logic (`handlePostJourney`) untouched, correctly recognizing this story treats a symptom (over-broad list visibility) without needing to touch the separate, larger question of why tenant-less journeys exist at all.

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped, precisely root-caused short-track fix. The explicit, historically-anchored cutoff (tied to the actual commit that introduced the filter being narrowed) is a stronger foundation than an arbitrary date would be, and the story's discipline in separating "narrow this filter" from the two adjacent, larger follow-up concerns (auth root cause, data cleanup) keeps this change small and low-risk. Cleared to proceed to `/test-plan`.
