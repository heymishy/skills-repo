## Story: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done

**Track:** Short-track (bug fix — found via direct investigation, not a new feature)

**Note:** This story was narrowed during implementation. The original version also proposed a fix to `/review`'s artefact save path (AC1–AC3 below in the prior draft); that premise was found to be wrong before any code was committed — see `artefacts/2026-09-30-web-ui-artefact-routing-fixes/decisions.md`, Decision 1, for the full finding. This version covers only the confirmed drift-guard gap.

## User Story

As a **platform owner running real feature work through the deployed web UI**,
I want **`benefit-metric`, `decisions`, and `definition-of-done` to be covered by the same Sonnet-routing drift guard as design/definition/review/test-plan/definition-of-ready**,
So that **a governance-critical skill silently drifting back onto Haiku is caught automatically for all 8 governance-critical skills, not just the original 5**.

## Benefit Linkage

Directly closes a real, live gap found auditing `2026-09-28-weeb-ui-learnings-and-improvements`: that feature's `benefit-metric.md` was a full duplicate of its own `discovery.md`, produced by a real `/benefit-metric` web-UI session running on Haiku. Confirmed via direct code read of `src/web-ui/config/model-routing.js` (`benefit-metric` absent from `DRIFT_GUARD_SONNET_SKILLS`) and `fly secrets list -a wuce-staging` / `-a skills-framework` (no `WUCE_MODEL_OVERRIDE_BENEFIT_METRIC` on either environment) — this gap is still live today, unrelated to the corrected review-path finding in `decisions.md`.

## Architecture Constraints

- No new npm dependencies.
- `checkModelRoutingDrift`/`DRIFT_GUARD_SONNET_SKILLS` (`src/web-ui/config/model-routing.js`, psrc-verify-s3) is the existing, real drift-guard mechanism — this story extends its list, it does not build a new mechanism (ADR-028: one canonical builder, reuse it).
- `computeArtefactSavePath` (`src/web-ui/routes/skills.js`) is **not** touched by this story — see decisions.md Decision 1 for why the originally-planned change there was reverted before commit.
- D37 not applicable — no injectable adapter introduced.

## Dependencies

None.

## Acceptance Criteria

**AC1 (drift-guard extension):** Given `benefit-metric`, `decisions`, and `definition-of-done` are added to `DRIFT_GUARD_SONNET_SKILLS`, When `checkModelRoutingDrift(envVars)` is called with no `WUCE_MODEL_OVERRIDE_<SKILL>` set for any of the 3, Then all 3 appear in the returned drift array — exactly like the existing 5 skills already do.

**AC2 (existing 5 skills unaffected):** Given the drift-guard extension, When `checkModelRoutingDrift` is called with all 8 skills' overrides correctly set to a Sonnet model, Then the drift array is empty — the extension adds coverage, it does not change existing behaviour for the original 5.

## Out of Scope

- The originally-planned `/review` save-path fix — dropped; see decisions.md Decision 1. `computeArtefactSavePath`'s existing flat-path-for-review behaviour is correct and unchanged.
- Giving `review-artefact-splitter.js`'s silent no-op (when the model's own output lacks the `"## Story: [slug]"` marker) an operator-visible signal instead of only a `console.warn` — a real, separate finding surfaced while investigating this story, flagged as a follow-up candidate, not fixed here.
- Setting the real `WUCE_MODEL_OVERRIDE_BENEFIT_METRIC`/`_DECISIONS`/`_DEFINITION_OF_DONE` Fly secrets on `wuce-staging`/production — a DoD-time operator action (matching `psrc-verify-s2`'s own precedent), not part of this story's code change.
- Repairing any other, not-yet-found feature whose artefacts may show a similar Haiku-drift content pattern — flagged as a follow-up audit, not fixed here.
- `benefit-metric`/`decisions`/`definition-of-done` are not story-scoped skills and are not added to `_STORY_SCOPED_ARTEFACT` — that map is unrelated to this story's scope.

## NFRs

- **Performance:** Not applicable — a 3-element array extension to an existing, already-small constant list, no runtime cost change.
- **Security:** Not applicable — no new input surface.
- **Accessibility:** Not applicable — backend-only.
- **Audit:** Not applicable — no new write path; this is a config extension, not a new data-producing feature.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
