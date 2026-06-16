# Story: inc2.2 — Add `---CONDITION-JSON---` marker emission instruction to ideate/SKILL.md

**Feature:** 2026-06-15-ideate-web-ux-inc2
**Epic:** Cluster 6 — Conditions sidebar
**Story ID:** inc2.2
**Complexity:** 1
**Human oversight:** high (governed file — SKILL.md)
**Governed file:** true

---

## User Story

As a **platform operator**,  
I want **the /ideate skill to emit `---CONDITION-JSON---` markers when it identifies constraints, dependencies, and outcome conditions during a session**,  
so that **conditions surface in the conditions panel automatically without requiring explicit operator instruction each session**.

---

## Acceptance Criteria

**AC1 — Instruction present in SKILL.md:** `ideate/SKILL.md` contains a `---CONDITION-JSON---` marker emission instruction section, in the same area as the existing `---ASSUMPTION-JSON---` instruction.

**AC2 — All four required fields documented:** The instruction specifies all four fields: `id` (kebab-slug), `text` (plain declarative sentence), `type` (constraint | dependency | outcome), and `source` (operator | model).

**AC3 — Type semantics defined:** The instruction defines what each type means: `constraint` = hard technical or platform constraint that bounds the solution; `dependency` = something this solution depends on that is not yet in place or owned by another team; `outcome` = a condition of satisfaction — what "done" looks like for the opportunity.

**AC4 — Concrete example included:** The instruction includes at least one complete, worked `---CONDITION-JSON---` example with all four fields populated using realistic (not placeholder) content.

**AC5 — When to emit specified:** The instruction specifies when to emit: emit a condition marker when the session identifies a hard constraint, a dependency, or an outcome condition — not for assumptions (those use `---ASSUMPTION-JSON---`). Emit at the point of identification, not batched at end of lens.

**AC6 — Human-in-the-loop verification:** A real multi-turn /ideate session (≥4 turns) is run after the SKILL.md change is merged, confirming that `---CONDITION-JSON---` markers are emitted at appropriate points. Verification artefact written at `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md`.

---

## DoD Entry Condition

Human-in-the-loop verification required before definition-of-done. A real /ideate session of ≥4 turns must be run after merge and the output must show at least one `---CONDITION-JSON---` marker emitted in an appropriate context (not from a test harness). Verification artefact must be present before this story can be marked definition-of-done.

---

## Benefit Linkage

- **M2** (discovery constraint fill rate): inc2.2 is what makes M2 measurable — without the SKILL.md instruction, the model cannot emit condition markers and the panel stays empty.

---

## Out of Scope

- Any changes to the `---ASSUMPTION-JSON---` instruction or any existing SKILL.md behaviour
- Changes to `skills.js` or `chat-view.js` (inc2.1)
- Automated tests of live model emission behaviour (not feasible in Node.js unit test environment — same constraint as iwu.6 AC2/AC3)

---

## Architecture Constraints

- **Governed file:** `ideate/SKILL.md` at `.github/skills/ideate/SKILL.md`. Requires PR with human review and merge by platform maintainer (Hamish King) before taking effect. No automated merge.
- **Additive only:** The SKILL.md change must not modify existing `---ASSUMPTION-JSON---` instruction, existing lensComplete behaviour, or any other existing section. New content only.
- **Modify ONLY:** `.github/skills/ideate/SKILL.md`
- **New verification artefact:** `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md` (human-authored after live session)
- **New test file:** `tests/check-inc2.2-condition-marker-instruction.js`
- **Extend package.json test chain:** append `&& node tests/check-inc2.2-condition-marker-instruction.js`

---

## Non-Functional Requirements

- No credentials in SKILL.md example (MC-SEC-02): use anonymised example content
- SKILL.md change is additive only — does not alter existing emission behaviour

---

## Scope Stability

Stable. This story has the same pattern as iwu.6. The governed file constraint and human-in-the-loop verification requirement are known upfront.

**Schema depends on:** inc2.1 (the conditions panel must be delivered first so the SKILL.md instruction has something to emit into).
