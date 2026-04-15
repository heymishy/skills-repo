# Agent Behaviour Observability — Candidate Approaches

This document catalogues candidate approaches for adding observability to coding agent sessions on the skills platform. The goal is to surface what actions an agent took, which tools it invoked, and whether its changes were consistent with the implementation plan — without requiring manual log review.

No implementation is included in Phase 3. The only Phase 3 deliverable from this story is the Phase 4 backlog registration.

---

## Candidate 1: Structured trace logging

**Mechanism:** The agent writes a structured JSON event log for each top-level action taken during a session — tool invocations, file edits, decision points, and commit operations. The log is appended to a session trace file and committed alongside the code change. A post-session parser validates the event sequence against the implementation plan.

**Effort:** Medium

**Tradeoff:** Requires consistent log schema discipline across all agent implementations. Adding structured logging to every tool call introduces serialisation overhead and couples the agent runtime to the log format. Schema drift across agent versions creates parsing failures.

---

## Candidate 2: Session replay via Copilot chat export

**Mechanism:** Export the VS Code Copilot Chat JSONL transcript at session end and process it with `scripts/parse-session-timing.js` to extract the action sequence, tool call durations, and decision branch points. The extracted summary is stored alongside the implementation plan for post-hoc audit.

**Effort:** Low

**Tradeoff:** Limited to VS Code sessions; no real-time observability. Requires the operator to maintain a transcript archive and run the export step consistently. Gaps in transcript coverage between sessions are undetectable from the export alone.

---

## Candidate 3: Behaviour diff gate on PR

**Mechanism:** A CI gate reads the implementation plan task list and compares it against the PR diff. Tasks not covered by the diff are flagged as uncovered; files changed that are not in the task list are flagged as out-of-scope. The gate produces a coverage report that is posted as a PR comment.

**Effort:** High

**Tradeoff:** Requires machine-readable implementation plans with explicit file-level task mappings. High coupling between the plan format and the diff checker. Plan deviations that are intentional (e.g. discovered during implementation) trigger false positives unless an override mechanism is provided.

---

**Phase 3 Scope:** No agent behaviour observability implementation is included in Phase 3. The only Phase 3 deliverable from this story is the Phase 4 backlog registration below. Implementation approach selection is a Phase 4 decision.
