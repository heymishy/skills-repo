# Definition of Done: wsap-s2 — fix currentStoryId field mismatch

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/893 | **Merged:** 2026-09-15 (merge commit `ff0a453f`)
**Test plan:** artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-31-webui-story-artefact-path-fix/dor/wsap-s2-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-wsap-s1-story-scoped-artefact-paths.js` AC1 corrected to use `setStoryList()` (the real production entry point) — all 14 assertions pass | automated test (corrected) | None |
| AC2 | ✅ | New `check-wsap-s2-per-story-routing-uses-storylist.js` — 10 assertions, full 3-story cycle through real production entry points, distinct `currentStoryId` per story, correct termination | automated test (new) | None |
| AC3 | ✅ | 17-file existing regression suite (139 checks) all pass unchanged | automated test re-run | None |
| AC4 | ✅✅ | **Live-verified in full, end to end, against the exact production feature that surfaced the bug.** Resumed `new-feature-2b74a292`'s actual stuck journey post-deploy. The `test-plan` skill session correctly scanned `artefacts/new-feature-2b74a292/test-plans/` (the per-story subdirectory) instead of the flat file — direct qualitative confirmation the deployed code uses the new path. Then drove a real stage completion: Fly logs show `{"event":"artefact_auto_saved","artefactPath":"artefacts/new-feature-2b74a292/test-plans/ep1-s3-test-plan.md", ...}` — a genuine per-story path, not the shared flat `test-plan.md` file the bug had been collapsing everything onto. | Live production verification — direct Fly log inspection of the real event, not a self-report or assumption | None |

**Confirmed in CI, not just locally:** all 8 required PR #893 checks passed before merge, including `Validate traceability chain` after two pre-existing, unrelated schema/governance gaps it surfaced were resolved (see Scope Deviations).

---

## Scope Deviations

1. **CI's "Validate traceability chain" check surfaced two pre-existing, unrelated data gaps** while validating this PR: two feature records (created via the `wsd-s2`/`wsd-s5` GitHub-API writer) missing schema-required `name`/`health` fields, and `new-feature-2b74a292`'s own `discovery.md` still showing a stale `Status: Draft` despite the feature having progressed through benefit-metric, design, 13-story definition, review, and multiple DoR cycles. Fixed both directly (bundled into this PR as pipeline bookkeeping, per CLAUDE.md's exemption for state/artefact-only changes) — the `discovery.md` status correction was made only after the operator's own explicit in-conversation confirmation, not unilaterally.
2. **Live verification required an additional, separate intervention**: the `review` and `test-plan` skill sessions for this feature intermittently described completing a stage in prose without emitting the actual `---ARTEFACT-START---`/`---ARTEFACT-END---` marker block their own protocol requires — a distinct, pre-existing skill-reliability issue (observed with `claude-haiku-4-5`, the model wired for this feature), unrelated to `wsap-s2`'s own scope. Worked around by explicitly re-prompting the skill to emit the markers; not something this story's fix needed to (or should) address.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T4, all implemented
**Tests passing in CI:** all PR #893 checks green; locally, `check-wsap-s1-story-scoped-artefact-paths.js` 14/14, `check-wsap-s2-per-story-routing-uses-storylist.js` 10/10, 17-file regression suite 139/139

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 | ✅ | ✅ | Corrected existing test now exercises the real `setStoryList()` path |
| T2 | ✅ | ✅ | New end-to-end multi-story cycle test |
| T3 | ✅ | ✅ | Full 17-file regression suite, unchanged |
| T4 | ✅ | ✅✅ | Live-verified against the real, originally-affected production feature — the strongest possible confirmation |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| None new | ✅ N/A | Single-field correction |

---

## Metric Signal

Not applicable — this is a bug fix with no formal benefit-metric artefact for this short-track feature folder. The qualitative outcome is unambiguous: per-story artefact collapse (a real data-loss bug affecting every multi-story feature run through the web UI) is fixed and live-verified.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **Data recovery for `new-feature-2b74a292`'s already-lost stories remains outstanding** — 12 of 13 stories' pre-fix test-plan/DoR content was overwritten before this fix; only `ep1-s1` through `ep1-s3` now have correctly-scoped, freshly-regenerated per-story artefacts (produced during this live verification itself). The remaining 10 stories (`ep2-s1` through `ep4-s3`) still need their test-plan/DoR stages re-run to produce real per-story content, since the flat files they previously collapsed onto have already been overwritten.
2. **This feature is not connected to a GitHub product/repo link** (`_dasOwnerRepo` never resolved during live verification — no `artefact_commit_*` events fired) — its artefacts exist only on the container's ephemeral local disk, not committed to `origin/master`. They will be lost on the next redeploy unless a product link is established. This is a separate, pre-existing characteristic of this feature, not a `wsap-s2` regression — flagged for the operator's awareness, not a code defect.
3. **The `review`/`test-plan` skill sessions' intermittent failure to emit artefact markers** (Scope Deviation 2) is worth a future `/improve` look — a real, separate reliability gap in the skill-completion protocol, unrelated to this story's own scope.
