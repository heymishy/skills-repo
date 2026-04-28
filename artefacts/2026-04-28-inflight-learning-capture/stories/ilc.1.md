# Story: Define `workspace/capture-log.md` schema and `/capture` operator command

**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Discovery reference:** artefacts/2026-04-28-inflight-learning-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-28-inflight-learning-capture/benefit-metric.md

## User Story

As a **platform operator**,
I want to **invoke `/capture [signal text]` at any point during a pipeline session**,
So that **the signal is appended to `workspace/capture-log.md` before context pressure can cause it to be lost, contributing to M1 (lower signal loss rate) and M2 (measurable in-session capture rate)**.

## Benefit Linkage

**Metric moved:** M1 (Signal loss rate) and M2 (In-session agent capture rate)
**How:** Completing this story creates the file convention (`workspace/capture-log.md`) and the operator-triggered capture path (`/capture` command) that act as the durability layer for M1, and provides the write target that M2 counts entries from. Without this story, ilc.2 (agent self-recording instruction) has no defined file to write to, and ilc.3 (checkpoint bridge) has no source to read from.

## Architecture Constraints

- ADR-011: This story is the story artefact required before the `copilot-instructions.md` instruction changes in ilc.2 and ilc.3 may be merged.
- No `pipeline-state.json` schema changes — the `workspace/capture-log.md` file is a plain markdown append file, not a schema-governed artefact. It is not committed to the repository; it is created at runtime by the agent or operator.
- No new npm dependencies — the file is plain markdown; no parser required.

## Dependencies

- **Upstream:** None — this is the foundation story. ilc.2 and ilc.3 depend on this story's schema being defined.
- **Downstream:** ilc.2 (agent self-recording) and ilc.3 (/checkpoint bridge) both depend on the file convention and schema defined here.

## Acceptance Criteria

**AC1:** Given a pipeline session is active and `workspace/capture-log.md` does not yet exist, When the operator invokes `/capture [signal text]`, Then the file is created and a single entry is written to it containing all five required fields: `date` (ISO 8601), `session-phase` (name of the current pipeline phase), `signal-type` (one of: decision / learning / assumption-validated / assumption-invalidated / pattern / gap), `signal-text` (the provided signal text), `source` (operator-manual).

**AC2:** Given `workspace/capture-log.md` already exists with one or more entries, When the operator invokes `/capture [signal text]`, Then the new entry is appended at the end of the file without modifying or removing any existing entries.

**AC3:** Given an entry written by `/capture`, When the entry is reviewed by the operator or a downstream skill, Then all five required fields are present and the `source` field value is exactly `operator-manual`.

**AC4:** Given the operator invokes `/capture` without any signal text (i.e. bare `/capture`), When the invocation is processed, Then the agent prompts the operator for signal text before writing — it does not write a blank entry.

**AC5:** Given `workspace/capture-log.md` exists with entries from a previous session, When `/capture` is invoked in a new session, Then the new entry is appended after all existing entries; the file is never truncated or overwritten on new-session invocation.

**AC6:** Given the story is implemented and delivered, When `workspace/capture-log.md` is created at runtime, Then the path `workspace/capture-log.md` is listed in the repository's `.gitignore` file (or an equivalent exclusion mechanism), ensuring the file is never accidentally committed.

## Out of Scope

- Agent self-recording without operator prompting — that is ilc.2.
- Promotion of entries to `workspace/learnings.md` — that is ilc.3.
- Signal quality scoring, deduplication, or automated curation — post-MVP.
- Committing `workspace/capture-log.md` to the repository — this file is a runtime workspace file, not a committed artefact. It is in `.gitignore` (or treated as untracked) to avoid polluting commits.
- Dashboard or query interface over `workspace/capture-log.md` — post-MVP.

## NFRs

- **Durability:** Append-only write pattern. The file must not be truncated or overwritten by any operation in scope.
- **Portability:** Plain markdown format — no dependencies on parsers, schema validators, or tools beyond reading the file as text.
- **No external dependencies:** The `/capture` command implementation must not introduce new npm packages or external tools.

## Complexity Rating

**Rating:** 1 — Well understood, clear path. The schema is fully defined, the file operation is a plain markdown append, and the `/capture` command is a pure instruction-text addition to `copilot-instructions.md`.
**Scope stability:** Stable
