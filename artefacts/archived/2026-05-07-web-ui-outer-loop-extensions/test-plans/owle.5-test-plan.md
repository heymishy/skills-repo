# Test Plan: owle.5 — Spike side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.5-spike-side-trip.md
**Test file:** tests/check-owle5-spike-side-trip.js

---

## Technical Test Plan

### T1 — "Create spike" button visible at all stages

**Type:** Unit / route handler
**Setup:** Mock journeys at `stage: "discovery"` and `stage: "dor"`.
**Action:** GET `/api/journey/:id/stage-controls`
**Assert:** Both include `spikeAvailable: true`.

---

### T2 — Valid spike creation writes artefact file

**Type:** Integration
**Setup:** Journey with `featureSlug: "test-feature"`. No spikes directory exists.
**Action:** POST `/api/journey/:id/spikes` with `{ title: "Assess SSE scaling", question: "Can the Node.js http server handle 50 concurrent SSE connections?", scopeLimitHours: 4, doneCondition: "Benchmark result shows P95 < 200ms" }`.
**Assert:** (a) HTTP 201. (b) File `artefacts/test-feature/spikes/assess-sse-scaling-spike.md` exists. (c) File contains title, question, scope limit, done condition, `status: OPEN`, and an empty outcome field.

---

### T3 — "Spike in progress" indicator in stage controls when OPEN spike exists

**Type:** Unit
**Setup:** Journey with one OPEN spike file.
**Action:** GET `/api/journey/:id/stage-controls`.
**Assert:** Response includes `openSpikes: [{ title: "...", path: "..." }]`.

---

### T4 — Record outcome updates spike file and clears indicator

**Type:** Integration
**Setup:** OPEN spike file at known path.
**Action:** PATCH `/api/journey/:id/spikes/<title-slug>` with `{ outcome: "PROCEED", summary: "Benchmarks confirmed < 100ms P95" }`.
**Assert:** (a) HTTP 200. (b) Spike file now contains `status: RESOLVED`, `outcome: PROCEED`, and the summary. (c) GET `/api/journey/:id/stage-controls` no longer includes this spike in `openSpikes`.

---

### T5 — Path traversal guard on title-slug

**Type:** Security / unit
**Setup:** POST with `title: "../../etc/passwd"`.
**Action:** POST to spikes endpoint.
**Assert:** HTTP 400; no file written outside `artefacts/<featureSlug>/spikes/`.

---

### T6 — Title containing only special characters returns 400

**Type:** Unit
**Setup:** `title: "!!!"` (no alphanumeric characters — slug would be empty).
**Action:** POST to spikes endpoint.
**Assert:** HTTP 400; no file write.

---

### T7 — Duplicate title returns 409, existing file not overwritten

**Type:** Integration
**Setup:** Spike file already exists at the computed path.
**Action:** POST second spike with same title.
**Assert:** (a) HTTP 409. (b) Existing spike file content is unchanged.

---

### T8 — Feature slug is read server-side

**Type:** Security / unit
**Setup:** Journey with `featureSlug: "correct-slug"`. Request body includes `featureSlug: "injected"`.
**Action:** POST spike.
**Assert:** Spike file written under `artefacts/correct-slug/spikes/`, not `artefacts/injected/spikes/`.

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Open any journey stage. Confirm "Create spike" button is visible.
2. Click it. Fill in all fields and submit. Confirm file created at expected path with status OPEN.
3. Confirm "⚡ Spike in progress: Assess SSE scaling" indicator appears in the stage panel.
4. Click "Record outcome". Select PROCEED, add summary, submit. Confirm file updated and indicator gone.
5. Try creating a second spike with the same title. Confirm 409 error.
6. Try creating a spike with `title: "../../bad"`. Confirm 400 error.
