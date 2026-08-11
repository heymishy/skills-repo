## Story: Provide a create/edit form for a guardrail or standard

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead viewing their product's guardrails/standards**,
I want **an "add" or "edit" action next to each entry (or a new-entry form) that lets me write content directly in the web UI**,
So that **I don't have to leave the platform and hand-edit a file in my repo to add or change a guardrail/standard** (closing the gap `smug-s1` deferred — "create one via the API").

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** The form itself is a UI/UX enabler for `wugs-s6`/`wugs-s7` (the actual write); it does not move the metric alone, but without it there is no way to trigger the write path this epic exists to deliver.

## Architecture Constraints

- **Input validation server-side, not just client-side** (Mandatory Constraint pattern used elsewhere in this repo's own guardrails) — the form's submitted content must be validated on the server before being passed to `wugs-s6`'s write adapter, not trusted from client input alone.
- **No user-supplied content in innerHTML without sanitisation (`MC-SEC-01`)** — the form's own rendering of any existing content being edited (pre-filling the textarea) must escape it correctly; this is a form serving as both editor and (indirectly) a render surface for existing untrusted repo content.
- **Reuses `wugs-s2`/`wugs-s3`'s existing view as the entry point** — the "add"/"edit" action is added to those already-built views, not a new standalone page disconnected from the view.

## Dependencies

- **Upstream:** `wugs-s2` only. This story's Add/Edit UI and ACs are all testable against the product-level view alone — org-level editing (once `wugs-s3` exists) reuses the same view-agnostic form, but `wugs-s3` is not a prerequisite for this story. (Deliberately narrowed from an earlier draft that also listed `wugs-s3` — that created a circular dependency once `wugs-s3` was found to depend on `wugs-s6`, which depends on this story; see `decisions.md`'s SLICE entry, 2026-08-11.)
- **Downstream:** `wugs-s6` (the form's submission triggers the write adapter).

## Acceptance Criteria

**AC1:** Given the product-level or org-level guardrails/standards view, When rendered, Then an "Add" action is present for creating a new entry, and an "Edit" action is present next to each existing entry.

**AC2:** Given the "Edit" action is clicked for an existing entry, When the form opens, Then it is pre-filled with that entry's real, current content (fetched fresh, not from a stale cache).

**AC3:** Given a form is submitted with empty/whitespace-only content, When submitted, Then the server rejects it with a clear validation error — no branch/PR is created for empty content.

**AC4:** Given a form is submitted with valid content, When submitted, Then the content and target path (which file, which repo — product or org, based on which section the operator was editing) are passed to the write path (`wugs-s6`) with no client-side-only validation gap.

## Out of Scope

- **Rich text/markdown preview** — plain textarea input is sufficient for MVP; a markdown preview pane is a future enhancement, not blocking.
- **Concurrent-edit conflict handling beyond what GitHub's own Contents API SHA mechanism provides** — `wugs-s6`'s adapter surfaces a GitHub-native conflict error if the file changed since the form was opened; this story does not add a separate optimistic-locking layer.

## NFRs

- **Performance:** Form must open with pre-filled content within 2 seconds of clicking Edit (matches the same live-fetch latency already accepted elsewhere in this feature).
- **Security:** Server-side validation is mandatory (see Architecture Constraints); no `MC-SEC-01` violation in pre-filled content rendering.
- **Accessibility:** Form fields have labels; the Add/Edit actions are keyboard-accessible buttons/links, not click-only divs.
- **Audit:** None at this story's layer — the actual write (`wugs-s6`) is the audited action.

## Complexity Rating

**Rating:** 1 — standard form UI, no new backend mechanism introduced at this story's layer.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)
