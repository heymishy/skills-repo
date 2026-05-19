## Story: Spike side-trip — create and record feasibility spikes from journey

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Spike artefact coverage — proportion of identified unknowns with a formal spike record.

## User Story

As an **operator blocked by an unknown at any journey stage**,
I want to create a spike artefact and record its outcome from within the journey,
So that the investigation is formally documented and the journey can proceed based on a recorded decision (PROCEED / REDESIGN / DEFER).

## Benefit Linkage

**Metric moved:** Spike artefact coverage — unresolved unknowns are now captured as first-class artefacts rather than informal discussions.
**How:** The current friction (open VS Code, create `artefacts/<slug>/spikes/`, write the spike.md manually) means most spikes are either undocumented or only documented after the fact. An inline "Create spike" form makes the spike a zero-friction action at the moment the unknown is identified — at any journey stage, not just after a formal /review finding.

## Architecture Constraints

- Spike artefact written to: `artefacts/<feature-slug>/spikes/<title-slug>-spike.md`. The title-slug is derived server-side from the title field (lower-cased, spaces → hyphens, non-alphanumeric stripped).
- Path traversal guard: both the feature slug and the generated title-slug must be validated before composing the path. Reject any component containing `..`, `/`, or `\`.
- The spike file format must match the structure used by the `/spike` skill (title, question, scope limit, done condition, status: OPEN, outcome: blank).
- Outcome recording updates the existing spike file — the handler reads the file, locates the outcome field, sets it, and writes back. It does not create a new file.
- A spike in OPEN state shows a visual indicator in the journey stage panel ("⚡ Spike in progress: <title>") — this is a display-only flag, not a gate.
- No new npm dependencies.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — journey infrastructure required.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the operator is at any stage of an active journey, when they view the stage panel, then a "Create spike" button is visible.

**AC2:** Given the operator clicks "Create spike", when the spike form opens, then it contains: Title (required), Question (required — must be a specific answerable question), Scope limit in hours (numeric, required), Done condition (required), and initial Outcome placeholder showing the three options: PROCEED / REDESIGN / DEFER (not yet set).

**AC3:** Given the operator fills in all required fields and submits, when the server processes the create, then a spike artefact file is created at `artefacts/<feature-slug>/spikes/<title-slug>-spike.md` with status OPEN, outcome blank, and all form fields populated — and a success message shows the file path created.

**AC4:** Given a spike artefact has been created (status OPEN), when the operator views the journey stage panel, then a "⚡ Spike in progress: <title>" indicator is visible — this indicator is present at all journey stages until the spike outcome is recorded.

**AC5:** Given a spike is OPEN and the operator clicks "Record outcome" on the spike indicator, when the outcome form opens, then they can select PROCEED, REDESIGN, or DEFER, add an outcome summary (required), and submit — the spike file is updated with the outcome and the "in progress" indicator disappears.

**AC6:** Given the operator submits a spike title that resolves to a path outside the `artefacts/<feature-slug>/spikes/` directory (e.g. a title containing `../`), when the server validates the path, then a 400 response is returned and no file is written.

**AC7:** Given a spike artefact already exists at the computed path (duplicate title), when the operator tries to create another spike with the same title, then a 409 Conflict response is returned — the existing file is not overwritten.

## Out of Scope

- Blocking journey progression when a spike is OPEN — the visual indicator is informational only; the operator can continue the journey while a spike is open.
- AI-assisted spike question refinement — the form is a plain HTML form.
- Multiple concurrent open spikes are permitted — there is no limit on the number of OPEN spikes per feature.

## NFRs

- **Security:** Feature slug is read from the server-side journey session. Title-slug is derived server-side. Neither is accepted from the client as a path component.
- **Security:** Path traversal guard for both slug components before any file write.
- **Integrity:** The outcome-recording handler uses read-modify-write on the spike file — it does not replace the whole file, only updates the outcome field.

## Complexity Rating

**Rating:** 2 — path sanitisation for title-slug + outcome update (read-modify-write on a structured file).
**Scope stability:** Stable.
