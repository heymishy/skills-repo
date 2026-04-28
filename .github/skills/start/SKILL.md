---
name: start
description: >
  Greenfield orientation concierge. The first command any new consumer should run.
  In a single turn it describes the governed delivery pipeline, reads current pipeline
  state if any exists, and names the next action to take.
  Use when saying "start", "where am I", "what do I do", "help me get started",
  or "I just cloned this". Always safe to run — no prerequisites.
triggers:
  - "start"
  - "where am I"
  - "what do I do"
  - "help me get started"
  - "I just cloned this"
---

# Start Skill — Greenfield Orientation Concierge

<!-- single-turn-constraint -->
<!-- This skill produces its complete orientation output in a single AI turn.
     Do not ask clarifying questions before presenting orientation.
     Read state files first, then output everything in one response. -->

## Entry condition

None. Always safe to run. No prerequisites.

---

## Behaviour overview

This skill orients a new or returning operator in one turn. It:

1. Reads `workspace/state.json` (if present) to detect pipeline state
2. Reads `product/mission.md` (if present) to personalise the greeting
3. Confirms `.github/skills/` directory exists and contains at least one SKILL.md
4. Outputs the orientation immediately — no multi-step interview, no deferral

---

## Orientation output — single turn

Produce **all** of the following in one response. Do not ask questions before presenting orientation.

### Step 1 — Read context files

Before writing any output, silently read:

- `workspace/state.json` — if it exists, extract `currentPhase` and `lastUpdated`
- `product/mission.md` — if it exists, use the first paragraph to personalise the intro
- `.github/skills/` — confirm the directory exists and contains at least one SKILL.md

### Step 2 — Determine orientation path

**Path A — Greenfield (no pipeline state found):**

Condition: `workspace/state.json` does not exist AND `artefacts/` is empty or absent.

Output:
```
## Welcome to the Skills Delivery Pipeline

[If product/mission.md found: "This pipeline is configured for: [first sentence from mission.md]"]

This is a **governed delivery pipeline** — a structured, skills-based pipeline that
takes a raw idea from discovery through to production, with quality gates at every stage.

**No pipeline state found.** This looks like a new installation.

### What this platform does

The skills pipeline structures your entire delivery lifecycle:
- Discovery → Benefit Metrics → Definition → Review → Test Plan → Definition of Ready
- Inner coding loop: Branch Setup → Implementation → Verify → Branch Complete
- Post-merge: Definition of Done → Trace → Improve

Each step is a `/skill` command you run in Copilot Chat.

### Your first action

Run `/discovery` to start your first feature. Describe your idea or problem in plain
language and the pipeline will structure it for you.

> **Next action:** `/discovery` — describe your idea or problem to get started.

Skills available: [list skill names found in .github/skills/ — one per line, formatted as `/skill-name`]
```

**Path B — Returning operator (pipeline state exists):**

Condition: `workspace/state.json` exists and `currentPhase` is set.

Output:
```
## Welcome back — Skills Delivery Pipeline

[If product/mission.md found: "Pipeline: [first sentence from mission.md]"]

**Current phase:** [currentPhase from workspace/state.json]
**Last updated:** [lastUpdated from workspace/state.json, or "unknown" if absent]

### Where you are

You have an active pipeline session. The last skill run was at the **[currentPhase]** stage.

### Next step

Run `/workflow` to get a full pipeline status report and see exactly what to do next.

> **Next action:** `/workflow` — shows pipeline status and your next skill to run.
```

---

## Rules

- Output the full orientation in **one turn** — do not conduct a multi-step interview before giving orientation
- Read `workspace/state.json` and `product/mission.md` silently before producing output
- If `.github/skills/` directory does not exist or contains no SKILL.md files, warn the operator: "Skills directory not found — this repository may not be fully set up. Run `/bootstrap` to initialise."
- Do **not** include brownfield routing logic (Entry A/B/C) — that is added by p11.7
- Do **not** read `pipeline-state.json` — orientation uses `workspace/state.json` and `product/mission.md` only

---

## State update — mandatory final step

This skill does not modify pipeline state. It is a read-only orientation command.

No write to `.github/pipeline-state.json` is required.

Confirm in your closing message: "Pipeline state updated ✅ (no write required — /start is read-only)."
