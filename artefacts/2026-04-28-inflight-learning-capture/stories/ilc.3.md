# Story: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Discovery reference:** artefacts/2026-04-28-inflight-learning-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-28-inflight-learning-capture/benefit-metric.md

## User Story

As a **platform operator**,
I want `/checkpoint` to read new entries from `workspace/capture-log.md` and surface them for promotion to `workspace/learnings.md`**,
So that **signals captured during the session are durably promoted before the session closes, completing the M1 (zero signal loss) and MM2 (learnings.md growth rate) feedback loop**.

## Benefit Linkage

**Metric moved:** M1 (Signal loss rate) and MM2 (Learnings.md growth rate)
**How:** This story closes the loop. ilc.1 and ilc.2 ensure signals are written to `workspace/capture-log.md` during a session. But if `/checkpoint` doesn't read and promote them, they remain in the capture-log indefinitely and may still be missed. This story makes `/checkpoint` explicitly surface new captures for operator review and promotion — so that learnings.md grows from in-session signals, not only from after-the-fact reflections at session end.

## Architecture Constraints

- ADR-011: This story modifies the `/checkpoint` convention section in `copilot-instructions.md` (a behavioural change per ADR-011). This story artefact is the required prerequisite before the change may be merged.
- ADR-004: `/checkpoint` is defined in `copilot-instructions.md` (session conventions section) — not as a standalone SKILL.md. The implementation modifies the checkpoint convention text in `copilot-instructions.md`.
- "Group instruction-text-only changes at the same exit point into a single story": The checkpoint bridge is a distinct exit point (end of session) from the self-recording instruction (mid-session). Correct to keep as a separate story.

## Dependencies

- **Upstream:** ilc.1 must be DoD-complete — the bridge reads from `workspace/capture-log.md` using the schema defined in ilc.1. ilc.2 should also be complete so there are realistic agent-auto entries to bridge, but this story can be implemented in parallel since the bridge logic is independent of how entries got into the file.
- **Downstream:** None — ilc.3 is the final story in the epic.

## Acceptance Criteria

**AC1:** Given `workspace/capture-log.md` contains one or more entries that were not present at the start of the current session (i.e. entries written during this session), When `/checkpoint` runs at session end, Then it reports the count of new capture entries found — e.g. "3 new captures found in capture-log.md since last checkpoint."

**AC2:** Given `/checkpoint` has found new capture entries, When it presents them for review, Then it shows each entry's `signal-type` and `signal-text` and asks the operator which entries to promote to `workspace/learnings.md` — the operator can confirm all, select specific ones, or skip promotion entirely.

**AC3:** Given the operator confirms one or more entries for promotion, When the promotion is executed, Then each promoted entry is appended to `workspace/learnings.md` under a heading derived from its `signal-type` field (e.g. a `decision` entry is appended under a `## Decisions` or equivalent section), and the entry text includes the original `date` and `session-phase` for traceability.

**AC4:** Given `workspace/capture-log.md` contains no entries written since the last checkpoint (either because the file is empty or all entries predate the session), When `/checkpoint` runs, Then it reports "No new captures to promote" — it does not silently skip the capture-log check.

**AC5:** Given the operator skips promotion of all entries (replies "skip" or "none"), When `/checkpoint` completes, Then the session's state-write and closing sequence proceed normally — the bridge is non-blocking; capture-log entries are not deleted or modified even if not promoted.

## Out of Scope

- Automated promotion without operator review — curation is always a human action. The bridge surfaces entries; the operator decides what becomes a durable learning.
- Deleting or archiving `workspace/capture-log.md` entries after promotion — the file is append-only; promoted status is implicit (entries before the last checkpoint timestamp have already been reviewed).
- Changes to the checkpoint state-write flow (writing `workspace/state.json`) — this story adds a capture-review step before the existing state-write, it does not replace or alter the state-write.
- Promotion of entries to any file other than `workspace/learnings.md` — the only promotion target in MVP is learnings.md.

## NFRs

- **Non-blocking:** If `workspace/capture-log.md` does not exist, `/checkpoint` must complete normally — the bridge step is skipped with a note ("capture-log.md not found — skipping capture review"), not an error.
- **Idempotent:** Running `/checkpoint` twice without new captures in between must not produce duplicate promotions or error states.
- **Instruction conciseness:** The added checkpoint convention text must be ≤80 words to avoid bloating the checkpoint instruction block.
