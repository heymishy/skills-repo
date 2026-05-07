## Story: Estimate side-trip — record E1/E2 estimate from journey

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Estimation norm capture rate — proportion of features with E1 and E2 entries in estimation-norms.md.

## User Story

As an **operator at the discovery or definition stage of a journey**,
I want to record an E1 or E2 estimate from within the journey stage panel,
So that I build estimation norms over time without having to manually edit workspace/estimation-norms.md.

## Benefit Linkage

**Metric moved:** Estimation norm capture rate.
**How:** Currently, recording an estimate requires the operator to open `workspace/estimation-norms.md` in an editor, copy the row format, and append — a flow-breaking manual step that most operators skip. An inline form in the journey removes all friction at the moment the estimate is relevant (E1 at discovery approval, E2 at definition completion).

## Architecture Constraints

- Write target: `workspace/estimation-norms.md` — appended at the end of the file (never truncated). If absent, the file is created with a Markdown table header.
- The entry format must match the structure expected by `scripts/parse-session-timing.js` and the `/estimate` skill output: columns are `date`, `feature`, `pass` (E1/E2), `focusHours`, `complexity` (1/2/3), `scopeStability` (Stable/Unstable), `notes`.
- The write is append-only; concurrent writes from the same server are safe because the endpoint processes one write at a time (no parallel write race — the endpoint is synchronous at the write step).
- Path traversal guard applies — `workspace/estimation-norms.md` path is hardcoded server-side; no client-supplied path component.
- No new npm dependencies.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — journey infrastructure required.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the operator is at the discovery or definition stage of a journey, when they view the stage panel, then an "Add estimate" button is visible.

**AC2:** Given the operator clicks "Add estimate", when the estimate form opens, then it shows: pass selector (E1 / E2), focus hours (numeric input, required), complexity selector (1 / 2 / 3, required), scope stability selector (Stable / Unstable, required), and notes (optional free-text).

**AC3:** Given the operator fills in all required fields and submits, when the server writes the entry, then a new row is appended to `workspace/estimation-norms.md` containing: today's date (ISO 8601, server-set), the feature slug from the active journey, pass type, focus hours, complexity, scope stability, and notes — and a success message shows the appended row content.

**AC4:** Given `workspace/estimation-norms.md` does not exist, when the operator submits a valid estimate, then the file is created with a Markdown table header (`| date | feature | pass | focusHours | complexity | scopeStability | notes |`) followed by the separator row and the new entry.

**AC5:** Given the operator submits with focusHours set to a non-numeric value or less than 0, when the server validates the input, then a 400 response is returned with the validation error, and no write occurs.

**AC6:** Given the operator submits an E1 estimate and later submits an E2 estimate for the same feature, when both are written, then both rows are present in the file as separate entries — the E1 row is not modified or deleted.

**AC7:** Given the operator is at a stage other than discovery or definition (e.g. test-plan), when they view the stage panel, then the "Add estimate" button is not visible.

## Out of Scope

- Displaying a history of prior estimates in the form — the form is write-only; operators read estimation-norms.md directly.
- Computing E3 (actuals) — E3 is a post-delivery comparison written by /improve.
- Any integration with `scripts/parse-session-timing.js` — the written format must be compatible but the script is not called by this story.

## NFRs

- **Security:** Feature slug used in the entry is read from the server-side journey session, never from the request body.
- **Data integrity:** Append writes use a read-modify-write cycle: read the file, append the row, write the full result atomically — a partial write that corrupts the table is unacceptable.

## Complexity Rating

**Rating:** 1 — bounded form + file append; straightforward implementation.
**Scope stability:** Stable.
