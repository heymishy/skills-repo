# Review Report: ep2-s2 — Run 2

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Date:** 2026-10-08
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## Re-review context

Run 1 (2026-10-05) found 1 HIGH finding: **6-H1** (AC4 described a database-internals implementation detail — "upsert on `journey_stage_id` + `feature_slug`" — rather than observable behaviour; a naive delete-then-insert implementation could pass a database-level AC like that while having different, incorrect race-condition behaviour). Resolved in this revision: AC4 rewritten to "Given I map the same feature to the same stage a second time..., When the save completes, Then the stage shows exactly one mapping for that feature — not two — and its saved metric keys reflect the most recent selection." — purely observable outcome, no implementation mechanism named, and explicit about metric-key freshness so a delete-then-insert and a true upsert are both held to the same observable bar.

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

Carried over from Run 1, unaddressed (not blocking, per this story's own HIGH-only gate):

**6-M1:** AC1 (metric key picker) says "available DoD metric keys from that feature's record in `pipeline-state.json`" — but `pipeline-state.json` story records don't have a standardised `dodMetrics` field in the schema. The story assumes this field exists. The test plan will need to know the exact path within the `pipeline-state.json` structure where these keys are found. This should be specified in the AC or NFR.

**6-M2:** AC5 (cross-tenant guard) — the guard condition is "cross-tenant `journey_stage_id`" but the story also maps a `feature_slug` which is not tenant-scoped (features are in `pipeline-state.json`, not in Postgres). The guard only needs to verify the stage belongs to the requester's tenant. The AC is correct in what it checks but would benefit from a note clarifying that feature_slug itself is not a tenant-scoped value.

---

## LOW findings — note for retrospective

Carried over from Run 1, unaddressed:

**6-L1:** Dependency on ep2-s1 is correct — but ep2-s1 is the feature picker modal only; ep2-s2 extends it with metric key selection. The story should note whether ep2-s2 modifies the picker modal or opens a second step. The design artefact describes "after selecting a feature, operator optionally selects metric keys" — this should be explicit in the story ACs rather than implied.

---

## Summary

**Outcome:** PASS
