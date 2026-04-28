## Epic: Outer loop attribution model — governance prerequisite

**Discovery reference:** `artefacts/2026-04-24-platform-onboarding-distribution/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-24-platform-onboarding-distribution/benefit-metric.md`
**Slicing strategy:** Risk-first — Initiative 3 (governance model) is the highest-risk prerequisite for all surface investment in Initiatives 1 and 2. The bounded attribution model decision and H-GOV enforcement are the biggest unknowns; delivering them first de-risks the entire feature.

## Goal

When this epic is complete, every discovery artefact and benefit-metric artefact produced by the pipeline has required `contributors`, `reviewers`, and `approved-by` sections in its template. Running `/definition-of-ready` on a story whose parent discovery was produced by an engineer alone — with no named non-engineering sign-off — fires a hard block. The block message is unambiguous: it names the missing field, explains why it is required, and tells the operator exactly how to resolve it. Non-engineering participation in the outer loop is structurally required, not advisory.

## Out of Scope

- The Teams bot channel or any non-git distribution mechanism for non-technical consumers (WS0.7 — a subsequent feature gated on this epic's completion).
- Section-level attribution (individual ACs or sections having their own sign-off) — the bounded attribution model decision in this epic is scoped to artefact-level sign-off only; section-level is a Phase 5 WS6 evolution if warranted.
- SKILL.md changes for skills not in the outer loop attribution chain: `/test-plan`, `/review`, `/trace`, `/definition-of-done` are unchanged.
- Plain-language translation layer for non-technical artefact consumers (WS0.8 — subsequent feature after WS0.7).
- Enforcement of reviewer attribution (confirming that named reviewers actually performed a review) — the MVP is structural presence of `approved-by`, not verification of the review process.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M3 — Non-engineering attribution rate | 0% — no attribution fields exist; no non-engineering sign-off on any artefact | ≥1 artefact with non-engineering `approved-by` within 60 days of DoD | Adds the structural mechanism (template fields + H-GOV block) that makes non-engineering attribution measurable and required |
| MM2 — H-GOV hard block hypothesis | H-GOV block does not exist | H-GOV fires at least once in CI; team seeks resolution rather than bypass | Implements H-GOV in DoR — the hypothesis can only be validated once the mechanism exists |

## Stories in This Epic

- [ ] p11.1 — Add attribution sections to `/discovery` template and SKILL.md
- [ ] p11.2 — Add attribution fields to `/benefit-metric` template and SKILL.md
- [ ] p11.3 — Implement H-GOV hard block in `/definition-of-ready` SKILL.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Changes to core outer loop SKILL.md files (`/discovery`, `/benefit-metric`, `/definition-of-ready`) affect every future feature run through the pipeline. ADR-011 requires a story artefact chain for these changes — this epic provides that chain. The bounded attribution model decision (artefact-level vs section-level sign-off) must be a documented ADR before p11.3 is dispatched.

## Complexity Rating

**Rating:** 2
**Reason:** Attribution field design is straightforward but the bounded attribution model decision introduces ambiguity that must be resolved before H-GOV can be scoped precisely. p11.1 and p11.2 are complexity 1; p11.3 is complexity 2.

## Scope Stability

**Stability:** Unstable for p11.3 until bounded attribution model decision is documented. Stable for p11.1 and p11.2.
