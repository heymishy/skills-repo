# Story rrc.3: Integrate `constraint-index.md` reading into `/discovery`

**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/benefit-metric.md`

## User Story

As a **platform maintainer**,
I want the `/discovery` skill to check for an existing `constraint-index.md` and `discovery-seed.md` in the relevant system's reference folder at session start,
So that when I run `/discovery` for a feature touching a reverse-engineered system, the known legacy constraints and system context are surfaced automatically — not only if I remember to look for them.

## Benefit Linkage

**Metric moved:** MM1 — Discovery pre-population time saved
**How:** Without this story, `discovery-seed.md` and `constraint-index.md` exist but are only used if the operator thinks to mention them. This story closes the loop by making `/discovery` proactively surface them — the mechanism that actually reduces the operator's focus time.

## Architecture Constraints

- SKILL.md-only change to `/discovery/SKILL.md`: no code, no scripts, no new npm dependencies.
- The integration point is `/discovery` Step 1 (Reference materials scan), where the skill already reads `product/` context files. Adding a reference corpus check is consistent with this existing pattern.
- `/discovery` must not fail or block if no reference corpus exists — the check must be conditional (`if present`).
- Checked against `.github/architecture-guardrails.md` — no additional constraints apply.

## Dependencies

- **Upstream:** rrc.1 must be complete first — `discovery-seed.md` format must be defined before `/discovery` can be instructed how to read it. rrc.2 must be complete first — `constraint-index.md` format must be defined before `/discovery` can surface it.
- **Downstream:** None — this is the final story in Epic 1.

## Acceptance Criteria

**AC1:** Given the updated `/discovery` SKILL.md, When an operator starts a `/discovery` session and a `discovery-seed.md` exists in `artefacts/[system-slug]/reference/`, Then the skill reads it and surfaces the pre-populated problem framing, known constraints, and personas to the operator before asking the standard discovery questions — prefilling those sections in the draft discovery artefact.

**AC2:** Given the updated `/discovery` SKILL.md, When a `constraint-index.md` exists in `artefacts/[system-slug]/reference/`, Then the skill adds a "Known legacy constraints" section to the discovery artefact populated from the constraint index entries, and notes their source (`constraint-index.md` / extraction date).

**AC3:** Given the updated `/discovery` SKILL.md, When neither `discovery-seed.md` nor `constraint-index.md` exists for the system under discussion, Then the skill proceeds with the standard discovery flow without any error, warning, or reference to a missing corpus — the change is invisible when no corpus exists.

**AC4:** Given the updated `/discovery` SKILL.md, When `check-skill-contracts.js` runs, Then it reports 40 skills and all contract markers intact (the `/discovery` SKILL.md already has its required contract markers; this story must not remove or break them).

**AC5:** Given the updated `/discovery` SKILL.md, When the operator explicitly states that the pre-populated constraints are incorrect or out of date, Then the skill accepts the operator's override and proceeds with the overridden values — the corpus seed is advisory, not mandatory.

## Out of Scope

- Reading `decompose-input.md` in `/discovery` — deferred (Output 11 is out of scope for this feature).
- Modifying the `/discovery` approval gate or any discovery section other than Reference materials and Constraints — this story only adds a read step, not a new question or approval requirement.
- Any change to the discovery artefact template — the "Known legacy constraints" section is surfaced as a standard Constraints section using the existing template.

## NFRs

- **Size:** `/discovery` SKILL.md additions for this story: ~15–20 lines maximum.
- **Security:** None — documentation/instruction change only.

## Complexity Rating

**Rating:** 1 — adding a conditional read step to an existing well-structured reference materials scan.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
