# Review Report: ep3-s2 — Run 2

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
**Date:** 2026-10-08
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## Re-review context

Run 1 (2026-10-07) found 1 HIGH finding: **9-H1** (AC6's "without requiring a full page reload" was a bare negative constraint, no Given/When/Then trigger, not testable as written) and a directly-related MEDIUM, **9-M1** (AC6 implied real-time client-side reactivity, which contradicts the story's own "server-side at render time" architecture constraint — a genuine tension, not just a wording issue).

Both resolved together in this revision: AC6 rewritten as "Given a feature mapping is added, removed, or its metric keys updated on a stage, When that save completes and the Delivery view re-renders (the same server round-trip the save action itself already triggers — consistent with this story's own 'server-side at render time' architecture constraint, not a separate client-side reactivity mechanism), Then the stage's health indicator and the summary bar reflect the new state in that render — no additional manual refresh beyond the save action itself is needed." This has a real trigger (the save action's own existing round-trip), a real mechanism consistent with the stated architecture (server-side render-time computation, not client-side polling/push), and an observable outcome (the indicator reflects the new state in that render) — resolving 9-H1's testability gap and 9-M1's architecture tension in the same edit, since the tension was never real: "no reload" never meant "no save round-trip," it meant "no *extra* manual refresh beyond what saving already does."

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**9-M1 — RESOLVED** (see Re-review context above).

Carried over from Run 1, unaddressed (not blocking):

**9-M2:** The health state definitions (✅ / ⚠️ / ❌) are clear, but there is a missing case: a stage with no mapped features but with metric keys stored (JSONB `metric_keys` on orphaned mappings). This is logically impossible if cascading deletes are correct (per ep1-s2), but the story should confirm this case is covered by cascade rather than leaving a gap.

---

## LOW findings — note for retrospective

Carried over from Run 1, unaddressed:

**9-L1:** Summary bar ("X of Y stages have metric coverage") — "metric coverage" in the summary bar means ✅ stages only, but this is not explicit in the AC. "Have metric coverage" could be read as ✅ + ⚠️. Add "where 'metric coverage' means at least one feature mapped AND at least one metric key selected (✅ state only)."

---

## Summary

**Outcome:** PASS
