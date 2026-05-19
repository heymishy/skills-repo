## Story: Decisions side-trip — log architectural decisions from journey

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Reduction in decision-logging friction; decisions captured during delivery rather than retrospectively.

## User Story

As an **operator at any stage of a web UI journey**,
I want to log an architectural decision from within the journey stage panel,
So that I capture the decision and its rationale at the moment it is made — without switching to a text editor.

## Benefit Linkage

**Metric moved:** Decision log coverage — proportion of architectural decisions with a recorded artefact entry.
**How:** The current friction (open VS Code, find decisions.md, format the entry, save, return to web UI) causes decisions to be either skipped entirely or written much later from memory. An inline form removes all friction and makes the decision-log a live document rather than a retrospective one.

## Architecture Constraints

- The write target is the feature's `decisions.md` artefact at `artefacts/<feature-slug>/decisions.md`. The path is derived from the journey's active feature slug.
- Path traversal guard (NFR-sec-pathtraversal): the resolved file path must be validated against the repo root before any write.
- Write is append-only — the handler reads the existing file (if present), appends the new entry in the standard decisions.md format, and writes the result. It never truncates or replaces the file.
- If the file does not exist it is created with a minimal header. The header format matches `.github/templates/decisions-log.md` (or the decisions format used in existing feature artefacts).
- D37: any new adapter must throw by default; real implementation wired in `server.js`.
- No new npm dependencies.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — journey infrastructure and feature-slug context required.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the operator is at any stage of an active journey, when they view the stage panel, then a "Log decision" action is visible (button or icon in the stage toolbar).

**AC2:** Given the operator clicks "Log decision", when the decision form opens, then it contains four required fields — Title, Context, Decision, Rationale — and one optional checkbox: "RISK-ACCEPT (log as an accepted risk)".

**AC3:** Given the operator fills in all required fields and submits, when the server processes the write, then a new decision entry is appended to `artefacts/<feature-slug>/decisions.md` in the standard format (date, title, context, decision, rationale; RISK-ACCEPT flag if checked), and a success message shows the file path that was written.

**AC4:** Given the target `decisions.md` file does not exist yet, when the operator submits a decision, then the file is created with a minimal header (`# Decisions — <feature-slug>`) followed by the new entry — no error is returned.

**AC5:** Given the operator submits a decision with a missing required field (Title, Context, Decision, or Rationale), when the form is submitted, then the write is rejected server-side with a 400 response listing the missing fields, and no file write occurs.

**AC6:** Given a write error occurs (e.g. disk full, permission denied), when the handler catches it, then no partial write is left on disk, and the operator sees an error message with the reason — the journey stage is unaffected.

**AC7:** Given the operator submits a valid decision, when the write succeeds, then the form is cleared and the journey stage panel returns to its normal view — no full page navigation occurs.

## Out of Scope

- Editing or deleting existing decision entries — append-only in this story.
- Showing a history or list of prior decisions in the form — the operator can view decisions.md directly.
- Writing decisions to a remote GitHub repository — local disk only.
- Any AI-assisted decision drafting — the form is a plain HTML form, not a skill chat session.

## NFRs

- **Security:** The file path is derived entirely server-side from the journey's active feature slug. The client sends only the decision field values. The slug is never accepted from the client as a path component.
- **Security:** Path traversal guard: `path.resolve(target)` must start with `repoRoot + path.sep` before any write; return HTTP 400 otherwise.
- **Audit:** Each decision entry includes the ISO 8601 date of the write (set by the server, not the client).

## Complexity Rating

**Rating:** 1 — bounded form + file write; well-understood pattern from ougl.5 (gate-confirm disk write).
**Scope stability:** Stable.
