# Review Report: No-product, CLI-authored features are reachable within one click from the /dashboard landing page — Run 1

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Date:** 2026-09-10
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category B (Scope discipline) — The story's Out of Scope section explicitly defers "fixing the sidebar's own `noProductJourneyCount`" to a follow-up, which is a reasonable scope boundary on its own. But the story doesn't address the resulting UX inconsistency this creates: once this story ships, the dashboard body's new entry point will (per the discovery's own "No product (N)" framing this story's Architecture Constraints inherit) correctly account for not-yet-backfilled `pipeline-state.json` features, while the sidebar's existing "No product" link — visible on the *same page load*, via `renderShellWithNav`/`getProductsNavSummary` — will still show the old, potentially lower, Postgres-only count. An operator could see two different "No product" numbers on one screen at once, which reads as a bug even though each number is individually "correct" for what it measures.
  Risk if proceeding: A visibly inconsistent count between the new dashboard entry point and the existing sidebar link could itself become a new "something looks broken" report — trading one discoverability gap for a smaller, but real, consistency gap.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add an AC constraining the dashboard-body entry point to either (a) not display a numeric count at all (binary presence only, matching what AC1–AC4 as currently written actually require), or (b) explicitly note the possible mismatch as an accepted, temporary limitation until the sidebar's own count is fixed in a follow-up.

- **[1-M2]** Category E (Architecture compliance) — This story's own out-of-scope prose ("consistent with the 'no new npm dependencies / reuse existing rendering patterns' architecture guardrail (ADR-009)") repeats the same mis-citation as `wnl-s1`/`wnl-s2`: the real ADR-009 in `.github/architecture-guardrails.md` is "Evaluation and write-back workflows must be separate triggers," unrelated to npm dependencies. `CLAUDE.md` already documents this exact class of mistake as previously made and corrected elsewhere in this codebase.
  Risk if proceeding: Same as the other two stories — a coding agent following the citation finds unrelated content.
  To acknowledge: run /decisions, category RISK-ACCEPT — or correct the citation before `/test-plan`.

## LOW findings — note for retrospective

- **[1-L1]** Category D (Completeness) — Complexity Rating's own justification is unusually detailed (correctly explaining the `repoRoot`-vs-`pool`/`tenantId` signature-shape reconciliation as the real source of complexity) — this is good practice, not a defect, noted here only because it's a positive pattern worth carrying into future stories' own Complexity Rating write-ups, not something to fix in this story.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS

**Category scores:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |

Category E (Architecture compliance): 1 MEDIUM finding (1-M2, the ADR-009 mis-citation) — otherwise strong: Architecture Constraints explicitly cites and correctly applies ADR-028 (the single most relevant guardrail for this story), names the exact canonical builder to reuse (`_mergeStateFeaturesIntoJourneyList`) and the exact function to avoid relying on alone (`getProductsNavSummary`), with the root-cause reasoning grounded in direct code reading rather than assumption.
