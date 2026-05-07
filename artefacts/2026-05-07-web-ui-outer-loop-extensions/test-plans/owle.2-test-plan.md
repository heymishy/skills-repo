# Test Plan: owle.2 — Decisions side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.2-decisions-side-trip.md
**Test file:** tests/check-owle2-decisions-side-trip.js

---

## Technical Test Plan

### T1 — "Log decision" button visible at all stages

**Type:** Unit / route handler
**Setup:** Mock journey at `stage: "discovery"` and separately at `stage: "test-plan"`.
**Action:** GET `/api/journey/:id/stage-controls`
**Assert:** Both responses include `logDecisionAvailable: true` — the button appears at all stages.

---

### T2 — Valid form submission appends to decisions.md

**Type:** Integration / route handler
**Setup:** Journey with `featureSlug: "test-feature-slug"`. File `artefacts/test-feature-slug/decisions.md` does not exist.
**Action:** POST `/api/journey/:id/decisions` with body `{ title: "Use SSE", context: "Need streaming", decision: "Use SSE not polling", rationale: "Lower latency" }`.
**Assert:** (a) Response HTTP 200. (b) `artefacts/test-feature-slug/decisions.md` now exists. (c) File contains a header line `# Decisions — test-feature-slug`. (d) File contains all four field values. (e) File contains a server-set ISO 8601 date.

---

### T3 — Append to existing decisions.md preserves prior content

**Type:** Integration
**Setup:** `artefacts/test-feature-slug/decisions.md` exists with one prior entry containing a known marker.
**Action:** POST a second decision.
**Assert:** (a) File contains both the prior marker and the new entry. (b) Prior entry is not modified or deleted.

---

### T4 — RISK-ACCEPT flag recorded when checkbox checked

**Type:** Unit
**Setup:** Valid form body with `riskAccept: true`.
**Action:** POST to decisions endpoint.
**Assert:** Written file entry contains a `RISK-ACCEPT` label.

---

### T5 — Missing required field returns 400, no write

**Type:** Unit
**Setup:** Body missing `rationale` field.
**Action:** POST to decisions endpoint.
**Assert:** (a) HTTP 400. (b) Response body identifies `rationale` as missing. (c) No file write occurred (verify via spy on fs.writeFileSync or by asserting file absent/unchanged).

---

### T6 — Path traversal guard

**Type:** Security / unit
**Setup:** Journey with `featureSlug: "../../etc/passwd"`.
**Action:** POST to decisions endpoint.
**Assert:** HTTP 400; no file written outside `artefacts/`.

---

### T7 — Write error does not leave partial file

**Type:** Unit
**Setup:** Stub the file writer to throw after partial content.
**Assert:** (a) Handler returns an error response. (b) No partial decisions.md exists on disk. (c) Journey stage object is unchanged.

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T7 must all fail.

**After implementation — human smoke test steps:**

1. Open any journey stage. Confirm "Log decision" button is visible.
2. Click it. Confirm form appears with Title, Context, Decision, Rationale, RISK-ACCEPT checkbox.
3. Submit with all fields filled. Confirm success message shows file path.
4. Open the file in the editor. Confirm entry is appended with all fields and today's date.
5. Submit a second decision. Confirm first entry is still present.
6. Submit with a blank Title. Confirm 400 error and no file write.
7. Check the form clears after successful submission (no page navigation).
