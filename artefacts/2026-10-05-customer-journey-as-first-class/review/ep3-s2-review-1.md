# Review Report: ep3-s2 — Run 1

**Story reference:** artefacts/[feature]/stories/ep3-s2.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

**9-H1:** AC6 ("health state indicator updates...without requiring a full page reload") is not testable as written. "Without requiring a full page reload" is a negative constraint on implementation, not an observable behaviour. The AC should describe the trigger: "Given a feature mapping is added to a stage, When the Delivery view is active, Then the health indicator on that stage updates within the current page view (without a reload)." The current AC6 has no "Given" condition, no trigger, and no specific observable outcome.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**9-M1:** Health computation is specified as "server-side at render time" in both the NFR and design artefact — but AC6 implies real-time update behaviour (updating when "underlying mappings change... without requiring a full page reload"). These two requirements are in tension: server-side computation at render time requires a page render to update; real-time updates without reload implies client-side reactivity or a polling/push mechanism. This tension must be resolved before the test plan can be written.

**9-M2:** The health state definitions (✅ / ⚠️ / ❌) are clear, but there is a missing case: a stage with no mapped features but with metric keys stored (JSONB `metric_keys` on orphaned mappings). This is logically impossible if cascading deletes are correct (per ep1-s2), but the story should confirm this case is covered by cascade rather than leaving a gap.

---

## LOW findings — note for retrospective

**9-L1:** Summary bar ("X of Y stages have metric coverage") — "metric coverage" in the summary bar means ✅ stages only, but this is not explicit in the AC. "Have metric coverage" could be read as ✅ + ⚠️. Add "where 'metric coverage' means at least one feature mapped AND at least one metric key selected (✅ state only)."

---

## Summary

**Outcome:** FAIL
