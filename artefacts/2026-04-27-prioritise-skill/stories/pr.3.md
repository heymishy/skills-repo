# Story: Detect ambiguous single-framework results and explain divergence when multiple frameworks are run

**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md

## User Story

As a **tech lead or product manager**,
I want to **be told when a single-framework result is ambiguous or when two frameworks produce conflicting rankings, with an explanation of why they diverge at the level of the underlying model**,
So that **I can make an informed choice between conflicting signals rather than being left with a confident-looking artefact that conceals a contested ranking**.

## Benefit Linkage

**Metric moved:** M1 — Session completion rate; M2 — Input quality / rationale completeness
**How:** Without divergence handling, a tie or a conflicting multi-framework result is a session-ending blocker — the operator has no guidance and is likely to abandon (M1 drop). With divergence explanation, the operator can proceed to a decision and complete the session. The divergence explanation also becomes part of the artefact rationale — it is the highest-quality rationale content in a multi-framework session (M2).

## Architecture Constraints

- C6 (from discovery): SKILL.md additions in this story must not break `scripts/check-skill-contracts.js`.
- This story extends the SKILL.md from pr.1/pr.2; no new files.

## Dependencies

- **Upstream:** pr.2 must be complete — divergence detection requires at least one completed scoring pass; multi-pass detection requires two.
- **Downstream:** pr.5 (output format) includes divergence content in the saved artefact — the divergence explanation produced by this story feeds the output section written in pr.5.

## Acceptance Criteria

**AC1:** Given a completed single-framework scoring pass where two or more items have identical scores (a tie), when the skill presents the results, then it identifies the tie explicitly and offers one of three options: (1) run a tiebreaker pass with a second framework, (2) manually reorder the tied items, or (3) accept the tie as a deliberate draw — it does not silently produce an arbitrary ordering.

**AC2:** Given the operator has completed two framework passes on the same candidate list, when the skill compares the rankings, then it identifies any item whose rank changed by two or more positions between frameworks and flags it as a divergence point — it does not flag every minor reorder.

**AC3:** Given a divergence point is identified, when the skill explains it, then the explanation names the specific model difference that causes the divergence (e.g. "WSJF prioritises job-size efficiency — small high-value items rank higher; RICE weights confidence more heavily — items with low confidence scores drop regardless of value") — it does not simply say "these frameworks disagree" without a model-level reason.

**AC4:** Given a divergence explanation has been presented, when the skill asks the operator to resolve it, then it offers three options: (1) accept one framework's ranking as the primary output and note the divergence, (2) manually reorder the divergent items based on the explanation, or (3) run a third framework pass as a tiebreaker — the operator decides; the skill does not choose.

**AC5:** Given the operator chooses to accept one framework's ranking as primary, when the skill records the decision, then the divergence explanation and the operator's resolution choice are both preserved in the scoring record for inclusion in the output artefact by pr.5.

**AC6:** Given only one framework pass has been run and no tie exists, when the skill presents results, then it does not prompt for a second pass unless the operator requests one — it proceeds directly to the output offer.

## Out of Scope

- Automatically running a second framework pass without operator confirmation — the skill recommends; the operator decides
- Resolving divergence by averaging scores across frameworks — the operator's explicit choice is the only valid resolution mechanism
- Workshopping/group facilitation of the divergence discussion — that is pr.4

## NFRs

- **Performance:** None — conversational skill.
- **Security:** None.
- **Accessibility:** Not applicable.
- **Audit:** None.
- **Skill contract:** SKILL.md additions must pass `check-skill-contracts.js`.

## Complexity Rating

**Rating:** 2
**Rationale:** The divergence explanation logic requires accurate characterisation of each framework's ranking model — errors here produce misleading explanations. The language must be calibrated for non-engineer readers (M3 dependency). Known risk; manageable with review.
**Scope stability:** Stable
