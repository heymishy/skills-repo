# Test Plan: owle.4 — Estimate side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.4-estimate-side-trip.md
**Test file:** tests/check-owle4-estimate-side-trip.js

---

## Technical Test Plan

### T1 — "Add estimate" button only appears at discovery and definition stages

**Type:** Unit / route handler
**Setup:** Four mock journeys at stages: `discovery`, `definition`, `test-plan`, `dor`.
**Action:** GET `/api/journey/:id/stage-controls` for each.
**Assert:** `estimateAvailable: true` for discovery and definition; `estimateAvailable: false` (or field absent) for test-plan and dor.

---

### T2 — Valid E1 submission creates estimation-norms.md with header and row

**Type:** Integration
**Setup:** `workspace/estimation-norms.md` does not exist. Journey with `featureSlug: "test-feature"`.
**Action:** POST `/api/journey/:id/estimate` with `{ pass: "E1", focusHours: 4, complexity: 2, scopeStability: "Stable", notes: "Initial estimate" }`.
**Assert:** (a) HTTP 200. (b) `workspace/estimation-norms.md` now exists. (c) File starts with a Markdown table header row (`| date | feature | pass | focusHours | complexity | scopeStability | notes |`). (d) File contains a data row with `test-feature`, `E1`, `4`, `Stable`, `Initial estimate`. (e) Date column contains today's ISO date (server-set).

---

### T3 — E2 submission appends to existing file, E1 row preserved

**Type:** Integration
**Setup:** `workspace/estimation-norms.md` exists with one E1 row.
**Action:** POST E2 estimate.
**Assert:** (a) File contains both the E1 row and the new E2 row. (b) Table header appears only once.

---

### T4 — Non-numeric focusHours returns 400, no write

**Type:** Unit
**Setup:** Body with `focusHours: "abc"`.
**Action:** POST estimate.
**Assert:** (a) HTTP 400. (b) Response identifies focusHours as invalid. (c) No file write.

---

### T5 — Negative focusHours returns 400, no write

**Type:** Unit
**Setup:** Body with `focusHours: -1`.
**Action:** POST estimate.
**Assert:** HTTP 400; no write.

---

### T6 — Feature slug is read server-side, not from request body

**Type:** Unit / security
**Setup:** Journey with `featureSlug: "correct-feature"`. Request body includes `featureSlug: "injected-feature"`.
**Action:** POST estimate.
**Assert:** Written row contains `correct-feature`, not `injected-feature`.

---

### T7 — Form clears after successful submission (no page navigation)

**Type:** Unit / response format
**Setup:** Valid POST.
**Assert:** Response HTTP 200 with `{ success: true, row: "<appended row string>" }`. (Client-side: on success, form fields are cleared — this is a client rendering behaviour; tested via the rendered form state in integration if browser test tooling is available, or noted as manual smoke-test step.)

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T7 must all fail.

**After implementation — human smoke test steps:**

1. Open a journey at the discovery stage. Confirm "Add estimate" is visible.
2. Navigate to definition. Confirm "Add estimate" still visible.
3. Navigate to test-plan. Confirm "Add estimate" is NOT visible.
4. Return to discovery. Click "Add estimate". Fill in E1 values and submit.
5. Open `workspace/estimation-norms.md`. Confirm header row and E1 data row present.
6. Submit an E2 estimate. Confirm E1 row is still present and E2 row added below.
7. Try submitting with focusHours empty. Confirm 400 error and no write.
