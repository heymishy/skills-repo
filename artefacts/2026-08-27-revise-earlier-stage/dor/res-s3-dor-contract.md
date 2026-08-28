# Contract Proposal: Suggest whether a stage revision is material to downstream stages

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Date:** 2026-08-28

---

## What will be built

Immediately after res-s2's overwrite completes and hands forward the pre-revision content, within the same turn-handling flow:

1. Run a **deterministic section-diff** between pre- and post-revision content, checking specifically whether the Problem Statement, MVP Scope, or Constraints section's text changed (target sections match `discovery.md`'s real heading names — corrected from the assumption's slightly imprecise "MVP Scope boundary"/"named Constraint" phrasing). This resolves the test-design risk flagged in the test plan (Test Gaps and Risks table) — classification is a deterministic diff, not an LLM judgment call, so AC2/AC3 are reliably testable.
2. If any of those sections changed: classification is "material". Otherwise: "minor".
3. **CORRECTED 2026-08-28 (implementation-plan investigation):** generate the one-sentence rationale **deterministically from the diff's own output** (a template referencing which section(s) changed for "material", or a fixed "no scope or constraint impact detected" sentence for "minor") — not via a live model call. Reason: `_skillTurnExecutor`, the only existing model-call mechanism in `skills.js`, is a module-private variable with no exported getter (only a setter, `setSkillTurnExecutorAdapter`) — reaching it from the new `materiality-check.js` module would require adding new coupling between the two modules, or introducing a brand-new, separately-D37-wired adapter just for a one-sentence template. Given the rationale's content is fully derivable from `changedSections` (already computed by step 1) with no genuine need for model judgment, and given the DoR contract's own Assumption #2 already anticipated a fallback path for rationale generation, a deterministic template is the lower-risk choice: it satisfies AC1's "one-sentence rationale" requirement exactly, avoids the coupling/wiring cost, and makes the NFR test (`materialityJudgmentAddsAtMostOneTurnLatency` — at most one additional model call) trivially true with zero additional calls rather than exactly one.
4. Present classification + rationale in the same chat turn's response as the revision confirmation — requires the `_materialityCheckHook` call site in `skills.js` to be awaited and its result forwarded as an SSE event (see Estimated touch points below).
5. Log the suggested classification with a joinable key (e.g. a `suggestionId`) that res-s4 can pair with the operator's later choice — via the existing `_posthog.capture` mechanism (same pattern as res-s1's `earlier_stage_reopened` event), not a new logging mechanism.

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
| AC5 (added 2026-08-28) | `setMaterialityCheckHookWiringResolvesTwoDifferentPairsCorrectly` | unit (wiring, D37 rule #4 — behavioural correctness, not just reference assignment) |

## Assumptions

- "Problem Statement," "MVP Scope boundary," and "named Constraint" map to the section headings already used in `discovery.md` (this feature's own discovery artefact uses exactly these heading names) — the diff checks section-level text, not word-level diffs, to avoid false "material" positives on pure formatting changes within a section.
- The rationale-generation model call is not on the critical path for the classification itself — if it fails, the classification (material/minor) still fires and is logged; only the rationale sentence would need a fallback (e.g. "Rationale unavailable").

## Estimated touch points

**CORRECTED 2026-08-28 (implementation-plan investigation, same class of defect as res-s2's DoR contract — see decisions.md ARCH entry):** the original text below named `journey.js` as the chat-turn handler. Direct code investigation found the actual integration point res-s2 built for this story is `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` — specifically the `_materialityCheckHook`/`setMaterialityCheckHook` D37 adapter (lines ~1460–1467, hook call site ~5089–5102), which currently defaults to a no-op and is called but never awaited (a gap this story must also close — see decisions.md).

Files: `src/web-ui/routes/skills.js` (hook call site: await the hook's return value, forward as an SSE event before the final `done` write — currently fire-and-forget), `src/web-ui/modules/materiality-check.js` (new — deterministic classifier, rationale generation, PostHog audit logging), `src/web-ui/server.js` (D37 wiring task: `setMaterialityCheckHook` → the new module's real implementation)
Services: `_skillTurnExecutor` (reused D37 adapter, already wired for both production and test — NOT a new model-call mechanism) for rationale generation only (not classification); PostHog `_posthog.capture` (reused, same mechanism as res-s1's `earlier_stage_reopened` event) for AC4's audit log
APIs: none new

~~Files: `src/web-ui/routes/journey.js` (chat-turn handler, extended)~~
~~Services: model/LLM call for rationale generation only (not classification)~~
~~APIs: none new~~

## Schema dependency (H8-ext)

This story's Dependencies block names res-s2 as upstream.
`schemaDepends: ["prStatus", "dodStatus"]` — confirm res-s2's fields before assuming the pre-revision handoff (res-s2 AC5) is available to build on.
