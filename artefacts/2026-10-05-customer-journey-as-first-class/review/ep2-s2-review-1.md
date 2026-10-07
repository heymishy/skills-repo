# Review Report: ep2-s2 — Run 1

**Story reference:** artefacts/[feature]/stories/ep2-s2.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

**6-H1:** AC4 (upsert on `journey_stage_id` + `feature_slug`) is listed as an AC but is actually an NFR/implementation constraint. An AC must describe observable behaviour: "Given I map the same feature to the same stage a second time, When the save completes, Then the stage shows one mapping for that feature, not two." The current AC4 describes database internals ("upsert"), which is not observable behaviour. This matters because a naive implementation could delete-then-insert (not a true upsert) and pass a database-level AC while having different race-condition behaviour.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**6-M1:** AC1 (metric key picker) says "available DoD metric keys from that feature's record in `pipeline-state.json`" — but `pipeline-state.json` story records don't have a standardised `dodMetrics` field in the schema. The story assumes this field exists. The test plan will need to know the exact path within the `pipeline-state.json` structure where these keys are found. This should be specified in the AC or NFR.

**6-M2:** AC5 (cross-tenant guard) — the guard condition is "cross-tenant `journey_stage_id`" but the story also maps a `feature_slug` which is not tenant-scoped (features are in `pipeline-state.json`, not in Postgres). The guard only needs to verify the stage belongs to the requester's tenant. The AC is correct in what it checks but would benefit from a note clarifying that feature_slug itself is not a tenant-scoped value.

---

## LOW findings — note for retrospective

**6-L1:** Dependency on ep2-s1 is correct — but ep2-s1 is the feature picker modal only; ep2-s2 extends it with metric key selection. The story should note whether ep2-s2 modifies the picker modal or opens a second step. The design artefact describes "after selecting a feature, operator optionally selects metric keys" — this should be explicit in the story ACs rather than implied.

---

## Summary

**Outcome:** FAIL
