# Definition of Done: Extend the discovery-artefact-scan suggestion pattern to stage-level fields

**PR:** https://github.com/heymishy/skills-repo/pull/990 | **Merged:** 2026-10-14
**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-14-journey-authoring-experience/dor/jae-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `extractProblemStatement` extracts raw text correctly (unit); `getFieldSuggestions` reaches a real `discovery.md` fixture end to end (integration) | `unit` + `integration` | None |
| AC2 | ✅ | Clicking a suggestion fills the field's own value; no PATCH fires until the field is blurred | `unit` | None |
| AC3 | ✅ | No suggestions when no `product_id`, and separately when the linked feature has no readable `discovery.md` — both degrade gracefully | `unit` | None |
| AC4 | ✅ | No suggestion button rendered for a field that already has a real value | `unit` | None |
| AC5 | ✅ | `getFieldSuggestions` scopes identically to `getPersonaSuggestions` for the equivalent cross-tenant/product scenario — direct comparison, not assumed | `integration` | None |

### Verification strength summary
- `unit`: 4
- `integration`: 2 (one AC — AC1 — covered by both a unit and an integration test)
- `live-verified`: partial (AC3 only) — attempted 2026-10-14 on `wuce-staging.fly.dev`: created a journey linked to the "skills-framework" product and opened the stage-edit panel; no suggestion button appeared for `customer_actions`/`pain_points`, confirming the no-match path degrades gracefully in a real deployed environment (AC3). Did not confirm the suggestion-RENDERS path (AC1) live — no product on staging was found, in the time available, with a `journeys`-table `feature_slug` pointing at a feature whose `discovery.md` has a non-empty Problem Statement and is readable from the deployed app's own `repoRoot`. Follow-up action #1 below is narrowed accordingly.

---

## Scope Deviations

None. All 5 ACs implemented exactly as scoped. The Out of Scope section's items (LLM generation, suggestions for other fields, any change to `jcx-s4`'s own persona mechanism) were correctly not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 6/6
**Tests passing in CI:** confirmed via PR #990 — all CI checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit) | ✅ | ✅ | |
| AC1 (integration) | ✅ | ✅ | Real temp `discovery.md` fixture, not mocked |
| AC2 | ✅ | ✅ | |
| AC3 | ✅ | ✅ | Both no-product_id and no-readable-discovery.md sub-cases |
| AC4 | ✅ | ✅ | |
| AC5 | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Same cost profile as `jcx-s4`'s own already-proven persona scan |
| Security | ✅ | AC5 directly verifies no new cross-tenant exposure; `extractProblemStatement` remains a pure file-read function |
| Accessibility | ✅ | Suggestion buttons reuse `jcx-s4`'s own already-accessible native-`<button>` pattern exactly |
| Audit | ✅ N/A | No new mutating action — accepting a suggestion goes through the existing per-field PATCH path |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Fields populated without manual prompting | `[UNKNOWN BASELINE]` — pending pre-release DB query (per `jae-s1`'s own DoD follow-up action, not yet run) | Not yet | This story is the suggestion half of M2's own mechanism; `jae-s1`'s template is the other half |

**Measurement-ready gate:** Not yet — needs the pre-release baseline query (`jae-s1`'s own open follow-up) before a meaningful post-release comparison is possible.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE — NO DEVIATIONS**

**Follow-up actions:**
1. **Owner: future session.** Partially done, 2026-10-14 (see Verification strength summary above — the no-match/AC3 path is confirmed live). Still open: find or set up a staging journey whose product genuinely has a linked feature with readable discovery content, and confirm a suggestion button actually renders and fills correctly (AC1) — this remains unconfirmed in the real deployed environment.
2. **Owner: future session, product.** Per `discovery.md`'s own named risk, check real usage data once available: does the deterministic scan have enough real coverage (are most new journeys linked to a feature with its own discovery.md)? If coverage is low, this is the trigger to bring forward the AI-generation fast-follow rather than waiting out a longer measurement window.
3. **Owner: future session.** `jae-s1`'s own DoD follow-up (run the real pre-release baseline DB query for M2) should happen now that all 3 epic stories are merged — the "pre-epic" baseline window has closed.

---

## DoD Observations

1. All 3 stories in this epic (`jae-s1`, `jae-s2`, `jae-s3`) shipped with their own, mostly-independent file regions inside `journeys.js`, and merged in sequence with zero git conflicts despite running implementation in parallel worktrees off the same master commit. Re-running all 3 stories' own test files together post-merge (rather than trusting each PR's own isolated CI run alone) directly confirmed `jae-s2`'s and `jae-s3`'s both-touch-`openPanel` changes compose correctly — worth keeping as a standing post-merge step whenever 2+ stories in the same epic touch the same shared function.
