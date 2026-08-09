## Review: rps-s1 — Scope the Roadmap tab's early-stage artefact scan to the product actually being viewed

**Story:** artefacts/2026-08-09-roadmap-product-scoping/stories/rps-s1-roadmap-product-scoping.md
**Reviewer:** Claude (agent), operator-directed — found via live browser exploration of the operator's real staging environment
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a directly observed, reproducible live symptom (two different real products rendering byte-identical Roadmap content) and names the exact root cause: `scanRoadmapArtefacts` was designed (story `a5`) before this app had per-product journey/artefact tracking, and its caller never added scoping when that tracking arrived later.

### Category B: Scope discipline

PASS. Out of scope correctly excludes changing `scanRoadmapArtefacts` itself (keeps it a pure, reusable scan; only the caller's filtering changes) and correctly declines to retroactively attribute orphaned artefact folders to any product. It also correctly defers the deeper "why do stale artefact folders exist on the container's disk at all" question to the already-logged, separate E2E-teardown root-cause finding, rather than conflating two different problems into one story.

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable. AC2 and AC3 are the two edge cases that most risk being overlooked in a filtering fix like this (no-match case, and query-failure case) — both are explicit ACs, not left implicit. AC4/AC5 explicitly protect the existing `check-a5-roadmap-tab.js` suite's own coverage from regression, which is good discipline given this story extends a file that already has real, passing tests.

### Category D: Completeness

PASS. NFRs correctly scoped (correctness as the primary concern, negligible performance cost from one additional indexed query). Complexity rated 2, correctly — mechanically small, but the fail-closed reasoning (AC3) and the treatment of the no-match case (AC2) both require real judgment, not just a one-line diff.

### Category E: Architecture compliance

PASS. Reuses the existing `journeys` table and the `_pool` connection already in scope in the exact handler being fixed — no new adapter, no new data-access pattern introduced. The "fail closed" constraint is explicitly stated and matches this codebase's existing `scanRoadmapArtefacts` convention (empty result on any read failure, never an error page) rather than inventing a new failure-handling convention for this one story.

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped, correctly-reasoned short-track fix. The explicit fail-closed requirement and the discipline of not touching `scanRoadmapArtefacts` itself (only its caller) both reduce the risk of this change to the existing, already-tested roadmap-tab feature. Cleared to proceed to `/test-plan`.
