# Definition of Done: sdg.1 — Reference upload modal UI

**PR:** https://github.com/heymishy/skills-repo/pull/413 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-21-strategy-and-data-hub/stories/sdg.1.md
**Test plan:** artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.1-test-plan.md
**DoR artefact:** artefacts/2026-06-21-strategy-and-data-hub-dor-sdg-1/definition-of-ready.md
**Assessed by:** Claude (agent) — retroactive, ~5 weeks post-merge
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Journey start gate offers strategy/data grounding after "new product" selection | `tests/e2e/reference-upload.spec.js` | None |
| AC2 | ✅ | Modal displays `<input type="file" accept=".md">` with instructions | Same E2E spec | None |
| AC3 | ✅ | Extension/size/UTF-8 validation with per-file error messages | `tests/check-sdg1-reference-upload.js` T2-T4 | None |
| AC4 | ✅ | Files written to `artefacts/[slug]/reference/[filename]` via `fs.writeFileSync` | Same file, T5 | None |
| AC5 | ✅ | Skip option closes modal, journey proceeds without files | E2E spec | None |
| AC6 | ✅ | `journey.referenceFiles` populated after upload | Same file, T6 | None |

## Scope Deviations

None found on review — implementation matches the story's stated out-of-scope list (no non-.md support, no dedup, no post-upload editing).

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (`tests/check-sdg1-reference-upload.js`) plus E2E coverage
**Tests passing in CI:** 8 / 8, re-confirmed live on current master (2026-07-30, ~5 weeks post-merge) — still green, no drift

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T8 (`check-sdg1-reference-upload.js`) | ✅ | ✅ | Includes T7: path traversal filename rejected (NFR-sec-pathtraversal) |

**Gaps:** None.

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility (ARIA on file input/errors) | ⚠️ | Not independently re-verified in this retroactive pass — no automated accessibility test found; flagged as unverified, not failed |
| Security — path traversal guard | ✅ | T7 explicitly covers this |
| Character encoding — UTF-8 only | ✅ | T4 |
| Error handling — invalid files don't block valid ones | ✅ | T8 |

## Metric Signal

**Gap found:** No `benefit-metric.md` artefact exists for this feature (checked `artefacts/2026-06-04-strategy-data-grounding/` and `artefacts/2026-06-21-strategy-and-data-hub/` — only `discovery.md`/`definition.md`/`design.md`/`ideate.md` present). The DoR references "benefit-metric.md M1 (Strategy content utility)" but that file was never found. Recorded as `not-yet-measured` — evidence note: "no benefit-metric artefact exists to measure against; this is a process gap predating this DoD pass, not a new finding."

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** (1) Accessibility NFR unverified — recommend a manual keyboard/screen-reader smoke test if this modal sees real usage. (2) Missing `benefit-metric.md` is a pipeline-process gap — the feature never had a completed `/benefit-metric` artefact despite the DoR citing one; flagged for `/improve`, not blocking.

## DoD Observations

1. This story (along with sdg.2, sdg.3) was implemented and merged on 2026-06-25/26 but `pipeline-state.json` was never updated afterward — the feature sat showing `stage: "definition-of-ready"` for over five weeks despite half the epic being done. This DoD pass is retroactive, run ~5 weeks after merge, prompted by the operator asking "what's next" and surfacing this feature as still-pending. Tagging as an `/improve` candidate: consider whether `/branch-complete` or merge tooling should prompt for DoD scheduling automatically, since this gap went undetected for over a month.
2. A stale local branch `feature/sdg.1` (last commit 2026-06-26, ~231K lines behind current master) was found during this session and should be deleted — fully superseded by the merge, no unique content.
