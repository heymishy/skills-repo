## Story: Document /design's place in the pipeline overview

**Short-track:** documentation fix — CLAUDE.md's Pipeline overview table is silently wrong relative to the already-implemented runtime behaviour.

## User Story

As **Hamish King (Founder/Operator)**,
I want **CLAUDE.md's Pipeline overview table to show `/design` where it actually runs**,
So that **I (and any future session) can see the full real pipeline from the documentation alone, without having to read source code to discover a step exists**.

## Background / Investigation

`/design` is a real, complete skill (`skills/design/SKILL.md`) whose own entry condition requires an approved discovery + active benefit-metric, and whose output "unlocks /definition" (`definition`'s entry condition does not itself require a design artefact, confirming design is optional, not a hard gate). Confirmed the web-app journey runtime already includes it correctly: `STAGE_SEQUENCE` (`src/web-ui/modules/journey-store.js:7-16`) lists `design` as step 3, between `benefit-metric` and `definition`. A second, independent copy of the stage order (`STAGE_ORDER`, `src/web-ui/routes/journey.js:1217`) also includes `design` in the same position.

Despite this, CLAUDE.md's own "Pipeline overview" table (the table every session reads at the top of every conversation) lists steps 1-9 and does not mention `/design` at all — an operator or a fresh session reading only CLAUDE.md would have no way to discover this step exists.

**Separate finding (not fixed by this story, flagged for a future story):** `journey.js`'s `STAGE_ORDER` (line 1217) orders `test-plan` before `review`, while `journey-store.js`'s `STAGE_SEQUENCE` and the actual per-story sequence (`PER_STORY_SEQ`, also in `journey.js`) run `review` before `test-plan`. These two hardcoded stage-order lists disagree with each other. `STAGE_ORDER` is only used to order `priorArtefacts` when resuming a journey from disk, so the practical blast radius is limited to that ordering, not to which stages actually run — but it's a real inconsistency worth its own investigation.

## Acceptance Criteria

**AC1:** Given the Pipeline overview table in CLAUDE.md, When read, Then it includes `/design` as a step between `/benefit-metric` and `/definition`, marked as optional (matching that `/definition`'s entry condition does not require it).

**AC2:** Given the Pipeline overview table, When read, Then the entry/exit condition columns for `/design` are consistent with `skills/design/SKILL.md`'s own documented entry condition and output.

**AC3:** Given the existing "Cross-cutting architecture support" and "Support skills available throughout the inner loop" sections of CLAUDE.md, When `/design` is added to the main table, Then it is NOT also duplicated in one of those sections (it belongs in the main numbered sequence, not the cross-cutting list, since it has a real position in the linear pipeline).

## Out of Scope

- Fixing the `test-plan`/`review` ordering disagreement between `STAGE_ORDER` and `STAGE_SEQUENCE` (flagged above as a separate finding).
- Making `/design` a mandatory gate for `/definition` (it is genuinely optional today; changing that would be a real behavioural/product decision, not a documentation fix).
- Any change to `skills/design/SKILL.md` itself.

## Benefit Linkage

Closes a real documentation/reality gap that made a working, already-shipped feature invisible to anyone reading only CLAUDE.md — directly reduces the risk of a future session re-implementing or ignoring `/design` because it didn't know the step existed.

## Complexity Rating

**Rating:** 1 — documentation-only change, no code touched.
**Scope stability:** Stable.
