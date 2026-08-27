## Story: Overwrite a reopened stage's artefact in place on revision

**Epic reference:** `epics/reopen-and-revise-earlier-stage.md`
**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Domain:** [web-ui]

## User Story

As an **Operator (solo product owner + engineer running the outer loop)**,
I want to **send a revision in a reopened earlier stage's session and have the resulting artefact saved back to its existing file path**,
So that **the correction is captured without creating a second, conflicting version of that stage's output**.

## Benefit Linkage

**Metric moved:** Earlier-stage revisions completed without a journey restart; Recurrence of the original blocking pain
**How:** This is the actual "fix" mechanism — without the artefact updating, reopening a session (res-s1) would be read-only busywork; this closes the loop that lets an operator's correction become durable.

## Architecture Constraints

- Matches "today's model" per discovery clarify Q3 — no new versioning or dated-copy mechanism.
- ADR-023 disk canonicity companion rule: any downstream re-read of this artefact must come from disk, not from `session.artefactContent`.
- CLAUDE.md's disk canonicity rule ("write session.artefactContent to disk, read back via `fs.readFileSync`, use disk content for handoff") — apply this exact write-then-read sequence.
- CLAUDE.md's path traversal guard — the resolved artefact path must be validated (`path.resolve` + `startsWith(repoRoot)`) before writing.

## Dependencies

- **Upstream:** res-s1 (must be able to reopen the session first)
- **Downstream:** res-s3 (materiality suggestion fires off this story's overwrite event)

## Acceptance Criteria

**AC1:** Given an operator in a reopened stage's live session sends a turn that produces a revised artefact, When the model returns new artefact content, Then the file at the stage's existing artefact path is overwritten with the new content — no new file or dated copy is created.

**AC2:** Given the artefact has just been overwritten, When any other part of the system (e.g. a later stage's session, or `/trace`) reads that artefact path afterward, Then it receives the new content, not the pre-revision content — proving the disk write completed before any downstream read.

**AC3:** Given an operator reopens a stage but does NOT send any revision turn (only asks a question, gets an answer, and navigates away), When the stage's artefact file is checked afterward, Then it is byte-identical to before the reopen — a reopen with no revision does not touch the artefact.

**AC4:** Given the artefact write fails (e.g. disk error), When this occurs, Then the operator sees an explicit error in the chat session — the failure is not silently swallowed, and no partial or corrupt artefact is left on disk.

## Out of Scope

- Any versioning, diffing, or "preserve the pre-revision copy" mechanism — explicitly excluded per discovery's clarify Q3 resolution.
- Deciding whether the revision is material to downstream stages — that's res-s3.

## NFRs

- **Performance:** None identified beyond existing artefact-write latency.
- **Security:** Path traversal guard applies per CLAUDE.md's mandatory rule — resolved path must stay within the repo root.
- **Accessibility:** N/A.
- **Audit:** The overwrite is logged with journeyId, stage name, and timestamp (feeds the "Recurrence of the original blocking pain" metric's manual-report cross-reference).

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
