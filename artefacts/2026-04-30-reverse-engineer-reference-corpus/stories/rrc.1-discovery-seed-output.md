# Story rrc.1: Add Output 9 — `/discovery` pre-population seed to `/reverse-engineer`

**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/benefit-metric.md`

## User Story

As a **platform maintainer**,
I want `/reverse-engineer` to produce a `discovery-seed.md` file in `artefacts/[system-slug]/reference/` at the end of any INITIAL or DEEPEN pass,
So that when I start a `/discovery` run for a feature touching that system, the known problem framing, PARITY REQUIRED constraints, and system personas are already structured and ready to hand to the skill — eliminating the need to re-read the full report to reconstruct this context.

## Benefit Linkage

**Metric moved:** MM1 — Discovery pre-population time saved
**How:** Producing `discovery-seed.md` directly in `/reverse-engineer` is the prerequisite that makes MM1 measurable — without this output the seeded /discovery path cannot be tested at all.

## Architecture Constraints

- SKILL.md-only change: no code, no scripts, no new npm dependencies.
- Output 9 must be added to the outputs table in `/reverse-engineer` SKILL.md (preserves check-skill-contracts.js compliance — contracts check outputs by count, not by name, so adding a new numbered output is safe).
- `discovery-seed.md` format must mirror the key structural sections of `.github/templates/discovery.md` so `/discovery` can treat it as a partial draft.
- Checked against `.github/architecture-guardrails.md` — no additional constraints apply; this is a new output file format within an existing skill.

## Dependencies

- **Upstream:** `/reverse-engineer` v2 SKILL.md (commit `83f29c7`) must be the base — this story extends that version.
- **Downstream:** rrc.3 (`/discovery` integration) consumes `discovery-seed.md` as its input; rrc.3 cannot be written until rrc.1 defines the format.

## Acceptance Criteria

**AC1:** Given the `/reverse-engineer` SKILL.md, When an operator completes an INITIAL or DEEPEN pass for any system, Then the skill instructs the operator to produce an `artefacts/[system-slug]/reference/discovery-seed.md` file as Output 9, using a defined format: system name, problem framing (from REVIEW-disposition rules and known failure modes), known constraints block (all PARITY REQUIRED rules), and a personas block (identified user types from the system).

**AC2:** Given the updated SKILL.md, When the `check-skill-contracts.js` governance check runs, Then it reports no failures (40 skills, all contract markers intact, output count consistent with schema).

**AC3:** Given the `/reverse-engineer` SKILL.md, When an operator's Q0 outcome is C (no useful corpus achievable — DEFER), Then the SKILL.md does not instruct Output 9 production (it would be empty/misleading; DEFER outcome produces no reference outputs).

**AC4:** Given the `discovery-seed.md` format defined in the SKILL.md, When the format is compared to `.github/templates/discovery.md`, Then each section in `discovery-seed.md` corresponds to a named section in the discovery template — so a `/discovery` skill run can treat the seed as pre-filled draft content.

**AC5:** Given the updated SKILL.md, When a VERIFY pass completes (no new rules discovered), Then the SKILL.md instructs the operator to review and update Output 9 if PARITY REQUIRED rules changed since the last pass — keeping the seed consistent with the current corpus state.

## Out of Scope

- The `/discovery` skill reading `discovery-seed.md` automatically — that is rrc.3.
- Output 11 (`decompose-input.md`) — deferred to a future story (see discovery out of scope).
- Validation that `discovery-seed.md` content is accurate for any specific system — this is a format and instruction story, not a correctness verification story.

## NFRs

- **Size:** The SKILL.md additions for this story must not push total `/reverse-engineer` SKILL.md size past 650 lines.
- **Readability:** `discovery-seed.md` format must be plain markdown, readable by a human without tooling.
- **Security:** None — this is a documentation/instructions change with no executable code.

## Complexity Rating

**Rating:** 1 — well understood; adding a new output instruction to an existing well-structured SKILL.md.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
