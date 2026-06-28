# Story: Canvas-edit dispatch and audit trail parity

**Epic reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-06-28-definition-canvas/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want clicking "Apply changes (N pending)" to batch all pending canvas edits into a single server request that the definition skill processes as real actions, producing a rewritten artefact and refreshing the canvas,
So that my canvas edits are durably reflected in the definition artefact without requiring a separate chat instruction turn, and so that the audit trail produced by canvas edits is structurally identical to the audit trail produced by conversational-turn edits.

## Benefit Linkage

**Metrics moved:** M1 (audit trail parity — 100% CI gate), M2 (future-phase placement guard — server-side guard in dispatch handler), M3 (round-trip ≤3s P90).
**How:** This story is the dispatch layer that converts accumulated canvas state (pendingReorder + pendingAdds from dic.1–dic.4) into definition skill actions. Without dic.5, the canvas is a visual-only tool with no durable effect. With dic.5, each "Apply changes" produces one definition rewrite, one audit entry per change record, and one refreshed canvas — completing the full operator action loop.

## Architecture Constraints

- **Route:** `POST /api/skills/definition/sessions/:id/canvas-edit`. Registered in `src/web-ui/routes/skills.js`. The route handler is injectable (D37 rule applies for the definition-skill write adapter).
- **Request body schema:** `{ pendingReorder: [{cardId, epicId, phaseId, newIndex}], pendingAdds: [{cardId, epicId, phaseId, title}] }`. No other fields. The handler validates this schema strictly and returns HTTP 400 for any invalid or unrecognised field.
- **Race condition guard:** If a model turn is in-flight for the session when the POST arrives (detectable via `session.streamActive === true`), the handler returns HTTP 409 with body `{ error: 'A model turn is in progress — apply changes after the turn completes.' }`. The client shows an inline error on the "Apply changes" button; the pending state is preserved (not cleared).
- **Phase guard (server-side):** The handler verifies that all `pendingReorder` and `pendingAdds` entries target the current phase (`phaseId` matches the current phase from the session's phase model). Any entry targeting a non-current phase returns HTTP 400 `{ error: 'Canvas edit targets a non-current phase row.' }`. This is belt-and-braces: the client guard (dic.2 AC3, dic.4 AC4/AC5) prevents this in normal use; the server guard holds even if the client guard is bypassed (e.g. direct API call).
- **Path traversal guard (ougl rule):** Any artefact file path derived from the session id or feature slug must be validated: `path.resolve(artefactPath).startsWith(repoRoot + path.sep)`. HTTP 400 if check fails; do not log the raw path.
- **Definition skill write:** The handler calls the definition skill's `applyCanvasEdits(session, changes)` function (injectable adapter). For each change, the function: (a) reads the current `definition.md` artefact, (b) applies the reorder or add operation, (c) writes the updated `definition.md` back to disk using the write-then-read sequence (disk-canonicity rule: write → readFileSync → handoff content), (d) advances the artefact hash.
- **Audit trail:** For each change record in the batch, one audit entry is written using the existing `writeAuditEntry(session, entry)` mechanism. The entry schema is: `{ type: 'canvas-edit', action: 'reorder'|'add', subject: {epicId, storyId|title}, value: {newIndex|title}, origin: 'canvas', sessionId, timestamp }`. The `origin: 'canvas'` field distinguishes it from `origin: 'conversational-turn'` but the schema shape is otherwise identical — M1's CI test asserts this structural identity.
- **Response:** On success, the handler returns `{ ok: true, artefactPath, updatedAt }`. The client clears `session.canvasCards.pendingReorder` and `session.canvasCards.pendingAdds`, resets the pending-changes count to 0, and triggers a canvas refresh (re-fetches and re-renders the definition artefact).
- **`req.session.accessToken`** is the canonical field name for the GitHub token where needed. Never `req.session.token`.
- No new JS file for the client side. The "Apply changes" button click handler is in the existing inline script block.

## Dependencies

- **Upstream:** dic.1 (`session.canvasCards.pendingReorder`), dic.2 (phase model and current-phase concept for server-side guard), dic.3 (`session.canvasCards.pendingAdds`), dic.4 (touch-placed reorders are structurally identical — no dic.4-specific handling needed in dispatch).
- **Downstream:** None within this feature. dic.5 is the terminal story in the definition canvas feature.

## Acceptance Criteria

**AC1:** Given the operator has pending canvas changes (at least one reorder or add) and no model turn is in-flight, when they click "Apply changes (N pending)", then a POST request is sent to `/api/skills/definition/sessions/:id/canvas-edit` with the correct body schema (`{ pendingReorder, pendingAdds }`). The button is disabled and shows "Applying…" while the request is in flight.

**AC2:** Given the POST is sent and the server successfully processes all changes, when the response arrives with `{ ok: true }`, then: (a) the button re-enables and its label returns to "Apply changes (0 pending)"; (b) the pending-changes count resets to 0; (c) the canvas refreshes to show the server-confirmed artefact state; (d) stories added via the canvas (origin `operator`) now appear with `data-origin="model"` (they are in the written artefact and thus model-emitted on next render).

**AC3:** Given a model turn is in-flight (`session.streamActive === true`) when the POST arrives, when the handler processes the request, then: (a) the handler returns HTTP 409 with `{ error: 'A model turn is in progress — apply changes after the turn completes.' }`; (b) the client displays the error message inline on the "Apply changes" button area; (c) the pending state is not cleared; (d) the button re-enables after the error is shown, so the operator can retry.

**AC4:** Given the POST body contains a change targeting a non-current phase row, when the handler validates the request, then the handler returns HTTP 400 with `{ error: 'Canvas edit targets a non-current phase row.' }`. No artefact write occurs. No audit entry is written. (This tests the server-side phase guard independently of the client-side guard.)

**AC5:** Given the POST body is malformed (missing required field, unrecognised field, wrong type), when the handler validates the request, then the handler returns HTTP 400 with a descriptive error message. No artefact write occurs.

**AC6:** Given the POST succeeds and the definition artefact is rewritten, when the audit log is inspected, then: (a) one audit entry exists per change record in the batch (not one entry for the whole batch); (b) each entry has schema `{ type: 'canvas-edit', action, subject, value, origin: 'canvas', sessionId, timestamp }`; (c) the schema is structurally identical to a conversational-turn audit entry of the same action type — same fields, same nesting depth, same types. The M1 CI test (`check-dic5-audit-trail.js`) asserts this identity programmatically.

**AC7:** Given the artefact path is derived from the session id or feature slug, when the handler resolves the path, then `path.resolve(artefactPath).startsWith(repoRoot + path.sep)` is verified before any disk write. If the check fails, the handler returns HTTP 400 without writing. A dedicated test covers this path traversal case and asserts both the 400 response and that no file was written to disk.

**AC8:** Given the `applyCanvasEdits` injectable adapter is not wired (default stub), when any route handler calls it, then it throws `Error('Adapter not wired: applyCanvasEdits. Call setApplyCanvasEdits() with a real implementation before use.')`. The production route initialisation wires the real implementation. A test verifies the stub-throw behaviour; a separate test verifies production wiring.

**AC9:** Given the definition artefact is successfully rewritten, when the disk write completes, then the write-then-read sequence is followed: (1) `definition.md` is written to disk, (2) it is read back via `fs.readFileSync`, (3) the read-back content is used as the handoff to the next stage. `session.artefactContent` is never used directly as handoff after the disk write.

## Out of Scope

- Streaming the artefact rewrite progress to the client — the dispatch is synchronous from the client's perspective (button spinner); no SSE stream for canvas-edit rewrite
- Undo/redo of applied changes — once applied, changes are in the artefact; reverting requires a conversational-turn instruction
- Concurrent canvas-edit batches from the same session — the race condition guard (AC3) prevents this; only one batch can be in-flight per session at a time
- Cross-epic reorder (moving a story between epic columns) — dic.5 dispatch schema does not include a `targetEpicId` field; any POST with an epicId mismatch between card's current epic and request epicId is treated as a schema error (HTTP 400)

## NFRs

- **Security:** Path traversal guard (ougl rule) is mandatory (AC7). `req.session.accessToken` is the canonical token field name. No raw path values logged in production on guard failure.
- **Performance:** M3 target: P90 ≤ 3 seconds from "Apply changes" click to canvas refresh in local dev. The implementation must not introduce unnecessary serialisation (e.g. reading definition.md twice before writing).
- **Audit correctness:** M1 is a CI gate — the `check-dic5-audit-trail.js` test must pass on every PR. Any schema divergence between canvas-edit and conversational-turn audit entries is a blocking defect.
- **Regression:** All dic.1, dic.2, dic.3, dic.4 tests continue to pass.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable
**Rationale:** The dispatch handler touches multiple concerns simultaneously (race condition guard, phase guard, path traversal guard, artefact write, audit trail, injectable adapter wiring) and must be correct across all of them. The complexity score reflects implementation surface area and the zero-tolerance quality bar on M1 (audit parity) and M2 (phase guard) — not ambiguity in the design, which is well-specified.
