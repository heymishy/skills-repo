# Review Report: ep5-s1 — Run 1

**Story reference:** artefacts/[feature]/stories/ep5-s1.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**12-M1:** AC4 ("idempotent — safe to run twice without error") — "without error" is a partial definition of idempotency. A truly idempotent migration must also produce no duplicate schema objects (tables, indexes, constraints) on re-run. The AC should say "safe to run twice — tables and indexes already exist are detected and no error is raised; no duplicate tables or indexes are created."

**12-M2:** AC3 (`feature_journey_stage_mappings` table) does not specify the FK relationships (only that the columns exist). The design artefact specifies `journey_stage_id` FK → `journey_stages` and `journey_id` FK → `journeys` with cascading delete. The migration AC must include the FK constraints and cascade behaviours as testable assertions.

---

## LOW findings — note for retrospective

**12-L1:** AC5 (indexes) — the index list is `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)`. Missing: `journeys(product_id)` (used in ep4-s2's `ORDER BY created_at` query joining from product page) and `feature_journey_stage_mappings(feature_slug)` (used for "feature not found" lookup in ep2-s3). These are performance considerations, not correctness blockers, but should be evaluated before the migration is final.

---

## Summary

**Outcome:** PASS
