## Epic: Operators get a trustworthy materiality signal when a revision might affect downstream stages

**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Slicing strategy:** User journey

## Goal

When this epic is complete, every time an operator revises an earlier stage (per Epic 1), the system assesses whether the change is likely material to downstream stages — a problem-statement, scope-boundary, or named-constraint change, versus a wording/clarity tweak — and presents that judgment as a suggestion, not an automatic trigger. The operator chooses to flag downstream stages for review, leave them as-is, or handle it differently; nothing regenerates or updates automatically without their explicit go-ahead. Their choice, paired with the model's original suggestion, is recorded so the suggestion's trustworthiness can be measured over time.

## Out of Scope

- **Automatic execution of the suggested action** — the model never regenerates or updates a downstream artefact on its own; the operator always makes the final call. This boundary is explicit in discovery MVP scope and must not be crossed.
- **The underlying reopen/revise mechanism itself** — that's Epic 1; this epic assumes a revision has already landed on disk.
- **Any new skill or SKILL.md for "handling it differently"** — the operator's free-text response in the existing chat session covers that; no new conversational capability is introduced (matches discovery's Out of Scope: "Adding new skills").

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Materiality-suggestion acceptance rate | Not yet established — feature does not exist today | ≥70% acceptance over a 10-suggestion sample | This epic is literally what the metric measures — the suggestion and the operator's paired choice are both built here |
| Earlier-stage revisions completed without a journey restart | 0% — capability does not exist today | ≥1 genuine usage/week, journey continues to completion | Closing the loop (suggestion → operator decision → visible outcome) is part of what makes the full journey — not just the reopen — feel complete and worth using again |

## Stories in This Epic

- [ ] Suggest whether a stage revision is material to downstream stages — `stories/res-s3-suggest-revision-materiality.md`
- [ ] Act on a materiality suggestion without auto-triggering downstream changes — `stories/res-s4-operator-acts-on-materiality-suggestion.md`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** The materiality judgment is a genuinely novel, unproven capability (per discovery's open Assumptions and Risks) — human review at PR is warranted before trusting the heuristic in production, even though the operator always makes the final call at runtime.

## Complexity Rating

**Rating:** 3

The model's materiality judgment logic is untested — whether operators find it trustworthy rather than noisy was an explicitly unconfirmed assumption at discovery, deliberately left open for usage-based validation rather than resolved via `/clarify`.

## Scope Stability

**Stability:** Unstable

If early usage shows the materiality suggestion is unreliable (per the benefit-metric's minimum validation signal), the judgment mechanism itself may need rework mid-epic.
