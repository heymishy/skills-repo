# Test Plan: owle.3 — Trace side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.3-trace-side-trip.md
**Test file:** tests/check-owle3-trace-side-trip.js

---

## Technical Test Plan

### T1 — "Run trace" button visible at all stages

**Type:** Unit / route handler
**Setup:** Mock journey at `stage: "discovery"` and separately at `stage: "dor"`.
**Action:** GET `/api/journey/:id/stage-controls`
**Assert:** Both responses include `traceAvailable: true`.

---

### T2 — Fully-linked artefact tree returns PASSED

**Type:** Unit / trace logic
**Setup:** Synthetic artefact tree with `discovery.md`, `benefit-metric.md`, `stories/s1.md`, `test-plans/s1-test-plan.md`, `dor/s1-dor.md` all present and cross-referencing correctly.
**Action:** Call trace logic module directly (or GET `/api/journey/:id/trace`).
**Assert:** Response `{ status: "passed", findings: [] }`.

---

### T3 — Missing test-plan returns HAS-FINDINGS

**Type:** Unit / trace logic
**Setup:** Same tree as T2 but `test-plans/s1-test-plan.md` absent.
**Action:** Call trace logic.
**Assert:** (a) `status: "has-findings"`. (b) `findings` array contains one entry with `type: "missing-test-plan"` and the expected file path.

---

### T4 — Missing discovery.md returns FAILED

**Type:** Unit / trace logic
**Setup:** Artefact directory exists but contains no `discovery.md`.
**Action:** Call trace logic.
**Assert:** (a) `status: "failed"`. (b) `findings` contains an entry for missing discovery.

---

### T5 — Empty artefact directory returns HAS-FINDINGS (not error)

**Type:** Unit / trace logic
**Setup:** Feature slug with an empty `artefacts/<slug>/` directory.
**Action:** Call trace logic.
**Assert:** (a) `status: "has-findings"` or `"failed"` (not an unhandled throw). (b) A finding for "no artefacts found" or "missing discovery" is present. (c) No uncaught exception.

---

### T6 — Second button click replaces prior result

**Type:** Integration / route handler
**Setup:** Journey with a trace result already stored.
**Action:** GET `/api/journey/:id/trace` twice.
**Assert:** The second response reflects the current artefact state, not the first-call result. If a new finding was introduced between the two calls (via a mock), the second result shows it.

---

### T7 — Path traversal guard on artefact file reads

**Type:** Security / unit
**Setup:** Feature slug containing `../` characters.
**Action:** GET `/api/journey/:id/trace`.
**Assert:** HTTP 400; no file reads attempted outside `repoRoot/artefacts/`.

---

### T8 — Trace completes within 2 seconds for 10 stories / 50 files

**Type:** Performance / unit
**Setup:** Synthetic artefact tree with 10 stories and 50 files (file reads stubbed to return in-memory content — no actual fs I/O timing).
**Assert:** The trace logic function completes without timing out in a synchronous call (no async timeout errors in the test run).

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Open any journey stage. Confirm "Run trace" button is visible.
2. Click "Run trace" on a journey with a complete artefact chain. Confirm "✓ Chain OK" is shown.
3. Delete one test-plan file. Click "Run trace" again. Confirm "⚠ Has findings" and the missing file is listed.
4. Click "Run trace" a second time. Confirm the prior result is replaced (not stacked).
5. Open a fresh journey with no artefacts. Click "Run trace". Confirm no error — shows "No artefacts" or findings list.
