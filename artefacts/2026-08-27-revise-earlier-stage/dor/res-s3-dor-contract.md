# Contract Proposal: Suggest whether a stage revision is material to downstream stages

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Date:** 2026-08-28

---

## What will be built

Immediately after res-s2's overwrite completes and hands forward the pre-revision content, within the same turn-handling flow:

1. Run a **deterministic section-diff** between pre- and post-revision content, checking specifically whether the Problem Statement, MVP Scope boundary, or a named Constraint section's text changed. This resolves the test-design risk flagged in the test plan (Test Gaps and Risks table) — classification is a deterministic diff, not an LLM judgment call, so AC2/AC3 are reliably testable.
2. If any of those sections changed: classification is "material". Otherwise: "minor".
3. Generate a one-sentence rationale via a model call, referencing which section changed (for "material") or confirming no scope/constraint impact (for "minor") — the *rationale text* may vary run-to-run, but the *classification* does not.
4. Present classification + rationale in the same chat turn's response as the revision confirmation.
5. Log the suggested classification with a joinable key (e.g. a `suggestionId`) that res-s4 can pair with the operator's later choice.

## What will NOT be built

- Acting on the suggestion (accept/override) — res-s4.
- Any downstream artefact regeneration.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `materialityCheckReceivesBothPreAndPostRevisionContent` + `materialityCheckFiresImmediatelyAfterOverwriteCompletes` | unit / integration |
| AC2 | `materialityClassifiesProblemStatementChangeAsMaterial` + `materialityClassifiesConstraintChangeAsMaterial` | unit |
| AC3 | `materialityClassifiesWordingOnlyChangeAsMinor` + `materialityClassifiesTypoFixAsMinor` | unit |
| AC4 | `suggestedClassificationRecordedInSessionLog` + `suggestionAndOperatorChoiceAreJoinableInTheLog` | unit / integration |

## Assumptions

- "Problem Statement," "MVP Scope boundary," and "named Constraint" map to the section headings already used in `discovery.md` (this feature's own discovery artefact uses exactly these heading names) — the diff checks section-level text, not word-level diffs, to avoid false "material" positives on pure formatting changes within a section.
- The rationale-generation model call is not on the critical path for the classification itself — if it fails, the classification (material/minor) still fires and is logged; only the rationale sentence would need a fallback (e.g. "Rationale unavailable").

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (chat-turn handler, extended)
Services: model/LLM call for rationale generation only (not classification)
APIs: none new

## Schema dependency (H8-ext)

This story's Dependencies block names res-s2 as upstream.
`schemaDepends: ["prStatus", "dodStatus"]` — confirm res-s2's fields before assuming the pre-revision handoff (res-s2 AC5) is available to build on.
