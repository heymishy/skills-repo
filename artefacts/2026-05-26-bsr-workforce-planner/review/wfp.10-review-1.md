# Review: wfp.10 — Skill-tag matching for auto-derive allocation mode

**Run:** 1
**Date:** 2026-05-26
**Reviewer:** Copilot /review skill
**Story artefact:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.10.md

---

## FINDINGS

**1-M1 — MEDIUM — M3 label in Benefit Linkage does not match benefit-metric.md**

The Benefit Linkage field states: "M2 (Pre-GM Initiative FTE Cross-Check Coverage) and M3 (Dashboard Adoption Rate)."

In `artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md`, M3 is defined as **Hiring Gap Specificity Rate** — the percentage of net-new hiring gaps surfaced with all three required fields (role, skill tags, initiative slug). "Dashboard Adoption Rate" does not exist as a metric in the benefit-metric artefact.

This is a traceability defect. The /trace skill will report a broken metric reference.

Recommended action: Choose one of the following:
1. Correct the M3 label to "Hiring Gap Specificity Rate" and add a mechanism sentence explaining how improved squad matching reduces the incidence of poorly-specified net-new gaps (plausible if wfp.10 reduces ambiguous net-new entries); or
2. Remove M3 from the benefit linkage if this story only directly moves M2, and update the "So that..." clause accordingly.

Option 2 is preferred: wfp.10's primary mechanism (higher pre-review coverage via tag scoring) directly improves M2. The link to M3 (hiring gap field completeness) is indirect and speculative.

---

## SCORES

| Category | Score | Notes |
|----------|-------|-------|
| A — Traceability | 4 | Epic, discovery, and benefit-metric artefact references all present. M2 reference is correct and the mechanism sentence is specific. One MEDIUM finding (1-M1): M3 label "Dashboard Adoption Rate" does not match the benefit-metric.md definition "Hiring Gap Specificity Rate." |
| B — Scope integrity | 5 | Out-of-scope section covers five explicit Phase 1 boundaries: MIN_COVERAGE_SCORE as CLI flag, partial tag scoring for non-auto modes, multiple squad output, fuzzy tag matching, and requiredTags from sources other than portfolio files. The cross-repo dependency is declared as a delivery risk rather than hidden. |
| C — AC quality | 5 | Six ACs all in GWT format. Specific numeric examples (0.67, 0.33, MIN_COVERAGE_SCORE=0.6). Exact field names and exact warning messages quoted throughout. AC6 specifies the complete summary output format. All six are independently testable without ambiguity. |
| D — Completeness | 5 | All template fields populated. Named persona (Head of Engineering). Four NFRs with explicit criteria including the coverage score formula. Complexity 2 with rationale. Scope stability declared Stable with explicit cross-repo risk flag. |
| E — Architecture compliance | 5 | CommonJS, no new external deps, constant-not-CLI-flag constraint explicit. Extends assign.js without replacing the product-group path — fallback behaviour preserved. _matchScore field behaviour (written on tag-scored entries only, not on fallback entries) is specified in Architecture Constraints. All consistent with architecture-guardrails.md. |

**Overall score: 4.8**

---

## VERDICT: PASS

1 MEDIUM finding (1-M1 — M3 label mismatch in benefit linkage). No HIGH findings. Story does not require rework; the finding is addressable by a one-line correction to the Benefit Linkage field before DoR sign-off, or by acknowledging via /decisions that only M2 is directly measured by this story.

**Notes for /test-plan:**
- AC1 and AC2 are companion tests. Both should use the same roster fixture (same squad, same member skills array) and vary only the requiredTags on the portfolio slug to produce above-threshold vs below-threshold outcomes.
- AC3 (tiebreaker by headcount) requires a fixture with exactly two squads at equal score — verify the headcount field drives selection and not insertion order or alphabetical name.
- AC4 (no requiredTags fallback) should assert both the absence of `_matchScore` on the output entry AND the presence of the stdout log message. These are separate assertions.
- AC5 (no skills in roster) should be tested with a roster where the `skills` field is present but an empty array (`[]`), and also where `skills` is absent entirely — both should produce `_matchScore: 0.0`.
- The MIN_COVERAGE_SCORE constant is at module level. Tests that need to exercise both sides of the threshold boundary without changing the source file should either import and override the constant (if the module exports it) or use fixture data whose scores straddle 0.6.
