## Review: jpws-s1 — Serialize a journey's Postgres writes so an earlier, incomplete write can never overwrite a later, correct one

**Story:** artefacts/2026-08-09-journey-pg-write-serialization/stories/jpws-s1-journey-pg-write-serialization.md
**Reviewer:** Claude (agent), operator-directed — root-caused during live staging investigation
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a directly observed live symptom (~1000 tenant-less journeys where only ~7 should exist) through to a specific, code-confirmed mechanism (two independent, unawaited `pool.query()` upserts to the same row with no ordering guarantee), not a guess. The story correctly distinguishes this from the separately-logged "why do E2E runs keep creating throwaway data" finding — this race affects real users too, and is the correct, narrower thing to fix here.

### Category B: Scope discipline

PASS. Out of scope explicitly and correctly excludes touching any call site (a real discipline win — the fix is entirely internal to `_pgWrite`), excludes the SQL in `journey-store-pg.js`, and excludes both the E2E-teardown root cause and bulk repair of already-corrupted data. This keeps the change small and contained to exactly the function where the defect lives.

### Category C: AC quality

PASS. 5 ACs, each Given/When/Then, each independently testable. AC3 (per-journey isolation, not a global bottleneck) and AC4 (one failed write doesn't jam the queue) are the two properties most likely to be silently broken by a naive promise-chaining fix, and both are explicit ACs rather than assumed. AC5 is a clean regression guard for the no-PG-adapter case. AC2's "invoked once per call, in order" framing is precise enough to catch both a coalescing bug and a reordering bug in one test.

### Category D: Completeness

PASS. NFRs correctly frame this as a data-integrity fix with a concrete, already-observed blast radius (not hypothetical), alongside a genuine negligible-performance-impact claim backed by reasoning (no new round-trip, no added response latency). Complexity rated 2, correctly — a per-key promise chain is a well-understood pattern, but the four distinct concurrency properties being asserted (order, isolation, failure-tolerance, no-op-preservation) raise the real difficulty above "trivial."

### Category E: Architecture compliance

PASS. Explicitly commits to zero call-site changes and zero SQL changes — the smallest possible blast radius for a fix to a widely-used core function. No new adapter, no D37 concern, no new pattern introduced beyond a standard promise-chaining technique contained entirely within the one function responsible for the defect.

---

### Verdict

**PASS — 0 HIGH findings.** Precisely root-caused, tightly-scoped fix to a real, already-confirmed production data-integrity defect. The explicit ACs for the two properties most likely to be silently broken by a careless fix (per-journey isolation, failure-tolerance) show real anticipation of what could go wrong, not just a happy-path story. Cleared to proceed to `/test-plan`.
