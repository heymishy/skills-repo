# Story: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**Epic reference:** artefacts/2026-04-28-inflight-learning-capture/epics/ilc-e1.md
**Discovery reference:** artefacts/2026-04-28-inflight-learning-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-28-inflight-learning-capture/benefit-metric.md

## User Story

As a **platform operator**,
I want the **agent to automatically record non-trivial decisions, validated assumptions, discovered patterns, and identified gaps to `workspace/capture-log.md` during any pipeline session — without me having to prompt it**,
So that **learning signals are captured before context pressure strikes, driving M2 (≥80% of sessions contain at least one agent-auto entry) and MM1 (≥80% of total captures are agent-auto)**.

## Benefit Linkage

**Metric moved:** M2 (In-session agent capture rate) and MM1 (Agent vs operator capture ratio)
**How:** This story adds the structural instruction to `copilot-instructions.md` and a capture-triggering reminder to each covered SKILL.md. When these instructions are present and the agent encounters a signal-worthy event, it writes an agent-auto entry to `workspace/capture-log.md` without waiting for operator input. This is the mechanism that makes M2 and MM1 measurable and achievable. Without this story, captures only happen when the operator explicitly invokes `/capture`.

## Architecture Constraints

- ADR-011: This story's implementation — changes to `copilot-instructions.md` (a behavioural change per ADR-011) — is governed by the artefact-first rule. This story artefact is the required prerequisite before the changes may be merged.
- "Group instruction-text-only changes at the same exit point into a single story" (architecture guardrails approved pattern): All SKILL.md capture-instruction additions are grouped here because they are logically the same change (add a capture-triggering reminder) at the same exit point (the moment the agent recognises a signal-worthy event). They have a shared failure mode (the instruction under-fires). Separating them would produce multiple trivially co-located stories with no quality uplift.
- No `pipeline-state.json` schema changes — this story makes no schema changes.

## Dependencies

- **Upstream:** ilc.1 must be DoD-complete — this story's instruction text references `workspace/capture-log.md` and its 5-field schema. The schema must be defined before this story's instruction text can be written accurately.
- **Downstream:** ilc.3 (/checkpoint bridge) can be implemented in parallel, but its ability to find entries depends on the agent-auto writes this story enables.

## Acceptance Criteria

**AC1:** Given the agent self-recording instruction is present in `copilot-instructions.md`, When the agent makes a non-trivial decision during a pipeline session (e.g. selects an implementation approach, accepts or rejects a trade-off, resolves an ambiguity), Then it appends an entry to `workspace/capture-log.md` with `source: agent-auto` and `signal-type: decision` before continuing — without operator prompting.

**AC2:** Given the capture-triggering reminder is present in a covered SKILL.md file, When the skill execution reaches a point where an assumption is validated or invalidated, a reusable pattern is observed, or a gap is identified, Then the SKILL.md instruction prompts the agent to write to `workspace/capture-log.md` before proceeding to the next skill step.

**AC3:** Given an entry is written by the agent (source: agent-auto), When the entry is reviewed, Then it uses the same 5-field schema defined in ilc.1 — date (ISO 8601), session-phase, signal-type (one of the 6 valid values), signal-text, source=agent-auto — with no missing fields.

**AC4:** Given the instruction is present in `copilot-instructions.md`, When a skill session involves only routine, well-understood steps with no decision points or signal-worthy events, Then the agent does not fabricate entries — `workspace/capture-log.md` may contain zero agent-auto entries for that session without the instruction being considered to have failed.

**AC5:** Given the covered SKILL.md files are: `/checkpoint`, `/definition`, `/review`, `/test-plan`, `/definition-of-ready`, `/tdd`, `/systematic-debugging`, `/implementation-review`, When any of these skills is executed, Then the skill's SKILL.md contains a visible capture reminder section that references `workspace/capture-log.md` and the 6 signal types.

## Out of Scope

- The `/capture` operator command — that is ilc.1.
- Promoting entries to `workspace/learnings.md` at session end — that is ilc.3.
- Validating whether entries are genuinely signal-worthy (as opposed to noise) — curation is a human action at checkpoint time; the instruction encourages capture of non-trivial events, not a mechanical filter.
- Adding capture reminders to skills outside the 8 named above in AC5 — the named 8 cover the highest-signal phases; expansion to further skills is post-MVP.
- Measuring MM1 (the ratio) — measurement happens post-delivery over 10 sessions; this story creates the mechanism, not the measurement.

## NFRs

- **Instruction hygiene:** The added instruction text must be concise enough not to consume excessive context. Target: ≤60 words in `copilot-instructions.md` for the self-recording rule; ≤30 words per SKILL.md reminder callout.
- **No new npm dependencies:** Instruction text only — no scripts, no tooling.
- **Wording precision:** The instruction must use imperative language — "Write to `workspace/capture-log.md`" not "Consider writing" — to minimise model-variation under-firing.
