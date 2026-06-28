# Benefit Metric: Definition Story Map — Interactive Canvas

**Discovery reference:** `artefacts/2026-06-28-definition-canvas/discovery.md`
**Date defined:** 2026-06-28
**Metric owner:** Hamish King — Platform operator / tech lead
**Reviewers:** (none at definition stage — solo operator pipeline)

> **Product context read:**
> Mission: delivery traceability, empirical improvement cycle grounded in actuals, reduced overhead for developers and tech leads running the pipeline. This feature reduces the overhead of the /definition inner loop specifically — resequencing and editorial correction currently require chat re-instructions that cost 1–3 model turns each. The canvas collapses that cost to a direct manipulation and a single apply action. Roadmap alignment: Phase 2 — interactive surfaces that reduce round-trips for common operator actions.

---

## Tier Classification

**No meta-benefit flag.** This feature moves Tier 1 delivery-efficiency metrics directly, without a platform-hypothesis wrapper. The cost reduction (fewer chat re-instruction turns per definition session) is observable from existing session telemetry once a baseline is established.

---

## Tier 1: Product Metrics (User Value)

### M1: Audit trail parity — canvas edits are structurally indistinguishable from conversational-turn edits

| Field | Value |
|-------|-------|
| **What we measure** | Whether the audit log entry produced by a canvas-originated write (reorder, add, note) has the same schema and field set as the audit log entry produced by a conversational-turn-originated write of the same kind |
| **Baseline** | N/A — canvas edits don't exist today; the baseline is the conversational-turn audit entry shape |
| **Target** | 100% — every canvas-edit type (reorder, add) produces an audit entry whose schema is byte-for-byte identical in structure to the equivalent conversational-turn entry. Zero divergence permitted. |
| **Minimum validation signal** | 100% — any structural divergence is a blocking defect, not a polish item |
| **Measurement method** | Automated test (Node.js unit test, test-plans/dic.5-test-plan.md): for each canvas-edit type, assert that the resulting audit log entry matches the schema of a conversational-turn edit of the same kind. Run on every PR by the check-dic5-audit-trail.js test. |
| **Feedback loop** | If any test fails: block merge. No exception. |

---

### M2: Future-phase placement guard holds across all code paths

| Field | Value |
|-------|-------|
| **What we measure** | Whether any code path (drag-and-drop, touch tap-to-place, add-story flow, direct API call) can place a story into a non-current phase row |
| **Baseline** | N/A — phase rows don't exist today |
| **Target** | Zero incidents in the test suite — the guard must hold for every exercised path |
| **Minimum validation signal** | Zero — a single code path that permits future-phase placement is a blocking defect (not "medium priority") |
| **Measurement method** | Automated test (check-dic2-phase-row-model.js, check-dic3-add-story.js, check-dic5-canvas-edit-dispatch.js): dedicated negative-path tests assert that drag, touch-place, add-story, and direct POST /canvas-edit all reject placement into a non-current phase. Server-side guard (HTTP 400) is tested independently of client-side guard. |
| **Feedback loop** | If any guard test fails: block merge. |

---

### M3: Canvas edit → artefact rewritten → canvas refreshed within 3 seconds (P90, local dev environment)

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time from operator clicking "Apply changes" to the story map refreshing from the server-confirmed artefact state |
| **Baseline** | Not established — canvas edits don't exist |
| **Target** | P90 ≤ 3 seconds in local dev environment (no network latency outside loopback). Not a production SLA — a development reasonableness check. |
| **Minimum validation signal** | P90 ≤ 5 seconds — above 5s the dispatch feels broken, not "just slow" |
| **Measurement method** | Manual smoke test during development: time 10 sequential "apply changes" actions on a definition session with 5 stories across 2 epics. Record P50 and P90. Log in DoR sign-off. Not a CI gate. |
| **Feedback loop** | If P90 > 5s: investigate whether the dispatch is serialising unnecessarily. If P90 > 3s but ≤ 5s: note in DoD actuals, create a follow-on performance story. |

---

## Tier 2: Meta-Metrics (Platform Health)

### MM1: Definition re-instruction turns reduced per session

| Field | Value |
|-------|-------|
| **What we measure** | Average number of chat turns per definition session that are solely resequencing or reordering instructions ("move story X before story Y", "swap these two") — i.e. turns that canvas drag-and-drop directly replaces |
| **Baseline** | Directional: 4 re-instruction turns observed in the 2026-06-21-strategy-and-data-hub definition session (operator's own session note). Sample size of 1; used as a directional anchor. Real baseline established from session logs after 10 definition sessions post-ship. |
| **Target** | ≤1 re-instruction turn per session on average at 30-day review (canvas absorbs >75% of resequencing actions) |
| **Minimum validation signal** | ≤2 — if operators are still using chat for most resequencing after 30 days, the canvas interaction model is not fit for purpose and must be reviewed |
| **Measurement method** | Session log parsing: count turns per session where the user content matches resequencing patterns ("move", "swap", "reorder", "before", "after"). Compare to pre-ship baseline. Measurement owner: Hamish King. |
| **Feedback loop** | If ≥2 re-instruction turns per session at 30-day review: conduct a 30-minute operator think-aloud with a definition session to identify why the canvas interaction is being bypassed. |
