---
name: checkpoint
description: >
  Mid-session and end-of-session state write. Writes workspace/state.json with
  currentPhase, lastUpdated, and checkpoint.resumeInstruction so the next
  session can resume without verbal priming. Use at 55% context budget during
  file-read-heavy phases, and mandatory at session end.
triggers:
  - "/checkpoint"
  - "checkpoint"
  - "save state"
  - "end of session"
  - "session end"
---

# Checkpoint Skill

## Purpose

Write pipeline state to `workspace/state.json` at mid-session (55% context budget) or end-of-session. The write must complete before context compaction fires.

## What is written

- `currentPhase` — the name of the current pipeline phase
- `lastUpdated` — ISO 8601 timestamp of the write
- The cycle block for the active phase (`status` + `artefact` path minimum)
- `checkpoint.writtenAt` — date of the write
- `checkpoint.contextAtWrite` — brief summary of what was in progress
- `checkpoint.resumeInstruction` — instruction for the next session
- `checkpoint.pendingActions` — any actions pending at the time of the write

## State write safety

Always write the complete JSON object (never a delta or append). Write to a temp file first (`state.json.tmp`), verify valid JSON, then rename over the target. A partial write or append produces a concatenated-JSON file that fails `check-workspace-state.js`.

## State update — mandatory final step

The checkpoint is only complete when `workspace/state.json` has been written and verified. Confirm in the closing message: "Pipeline state updated ✅".

> **Capture signal:** Write decisions, patterns, or gaps occurring during this checkpoint session to `workspace/capture-log.md` (source: agent-auto).
