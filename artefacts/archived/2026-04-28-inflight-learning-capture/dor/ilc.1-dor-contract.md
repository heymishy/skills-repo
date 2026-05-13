# DoR Contract: Define `workspace/capture-log.md` schema and `/capture` operator command

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
**Approved at:** 2026-04-28

---

## What will be built

An instruction block added to `copilot-instructions.md` defining the `/capture [signal text]` operator command. The block specifies:
- How `/capture` creates `workspace/capture-log.md` if absent, or appends to it if present
- The 5-field entry schema: `date` (ISO 8601), `session-phase`, `signal-type`, `signal-text`, `source`
- The 6 valid `signal-type` values: `decision`, `learning`, `assumption-validated`, `assumption-invalidated`, `pattern`, `gap`
- The blank-entry guard: prompt the operator before writing when no signal text is provided
- The append-only rule: the file is never truncated or overwritten
- The new-session rule: new-session invocations append after all existing entries; no truncation
- Source value for operator-invoked entries: `operator-manual`

A single line added to `.gitignore`: `workspace/capture-log.md`

## What will NOT be built

- Agent self-recording without operator prompting — that is ilc.2
- Promotion of entries to `workspace/learnings.md` — that is ilc.3
- Any script, parser, or npm package — this is pure instruction text and a `.gitignore` change
- Any SKILL.md changes — those are ilc.2
- Committing `workspace/capture-log.md` to the repository

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1: /capture creates file with 5 fields | Unit test reads `copilot-instructions.md` — asserts all 5 field names present in the instruction block | Unit |
| AC2: Subsequent /capture appends without modifying existing entries | Synthetic fixture — two successive appends to temp file, assert prior content unchanged | Unit |
| AC3: source=operator-manual always present | Synthetic entry string — assert `source: operator-manual` in the instruction spec | Unit |
| AC4: Bare /capture prompts before writing | Unit test reads `copilot-instructions.md` — asserts blank-entry guard instruction present | Unit |
| AC5: New-session invocation appends, never truncates | Synthetic two-cycle write — assert no truncation on second write | Unit |
| AC6: workspace/capture-log.md listed in .gitignore | Unit test reads `.gitignore` — asserts `workspace/capture-log.md` entry present | Unit |

## Assumptions

- `copilot-instructions.md` exists at repo root and has a session conventions section suitable for inserting the `/capture` instruction block.
- `.gitignore` exists at repo root.
- The instruction text is the only deliverable — no runtime script is needed.
- `workspace/capture-log.md` is a runtime workspace file and will not exist in the repository; tests that reference it use the file as a concept (reading the instruction text about it) rather than the file itself.

## Estimated touch points

**Files:** `copilot-instructions.md`, `.gitignore`
**Services:** None
**APIs:** None
