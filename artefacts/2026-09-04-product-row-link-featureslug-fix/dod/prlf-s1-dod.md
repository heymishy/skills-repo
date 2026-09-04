# Definition of Done: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**PR:** https://github.com/heymishy/skills-repo/pull/826 | **Merged:** 2026-09-04 (commit `03d0ae84`)
**Story:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**Test plan:** artefacts/2026-09-04-product-row-link-featureslug-fix/test-plans/prlf-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-product-row-link-featureslug-fix/dor/prlf-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `epic-nested item with differing slug/featureSlug: href uses featureSlug` | automated test (`tests/check-prlf-s1-featureslug-row-links.js`) | None |
| AC2 (regression) | ✅ | `top-level item with no featureSlug: href falls back to slug` | automated test | None |
| AC3 | ✅ | `real p3.3 collision fixture: href resolves to the correct feature, not the ambiguous story slug` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One recorded, non-blocking item — real work discovered and resolved within this same story, not silently absorbed:

1. **A full-suite run surfaced a real, expected downstream test break, fixed properly.** `check-shb-s1-story-health-badge-fix.js`'s own test helper (`healthAttrForSlug`) located a row by matching `href="/features/<storySlug>"` — this story's own intentional behaviour change (epic-nested rows now link via `featureSlug`) made that assumption false. Fixed the helper to anchor on `data-search` instead (a field this story's own fix never touches, still carries the raw story slug unchanged) — not a workaround around a real regression, since the underlying behaviour `shb-s1`'s own AC1–AC4 verify (health inheritance) is completely unaffected and all 5 of its assertions still pass with the corrected helper.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 featureSlug used for epic-nested items | ✅ | ✅ | |
| AC2 top-level item unaffected | ✅ | ✅ | |
| AC3 real p3.3 collision resolves correctly | ✅ | ✅ | |

**TDD verification performed (RED confirmed, not assumed):** before committing, the fix was temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code. Confirmed AC1/AC3 fail with exactly the raw story slug instead of the resolved feature slug, while AC2's regression guard correctly passes either way.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new computation | ✅ | `item.featureSlug` already present by the time this function runs, confirmed via code review |
| Security — no new external input | ✅ N/A | `featureSlug` already trusted, sourced from the same read that produces `item.slug` today |
| Accessibility | ✅ N/A | Link's own `aria-label` and visible text unchanged; only `href` target changes |
| Audit | ✅ N/A | No new data write |

`nfr-profile.md` status: `Active` — no NFR gaps identified at DoR, none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `prlf-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric this whole investigation thread has targeted.

---

## Outcome

**COMPLETE**

Story 2 of the agreed 3-story sequence (archived-directory fallback → featureSlug-scoped story links → the full feature-page redesign). Zero regressions in the fix's own scope; one real, expected downstream test-helper fix, made transparently rather than patched around. Genuine RED→GREEN TDD verification, clean full-suite run (606 files, 1 pre-existing unrelated failure).

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions for this merge commit (`03d0ae84`) whenever convenient — verify via git-ancestor check against whatever commit is actually deployed, not by run ID alone, per the lesson from `fal-s1`'s own DoD.
2. **Optional live confirmation, next time `skills-framework`'s product page is viewed in production**: click the `p3.3` row under "Platform Structural Integrity" and confirm it lands on `/features/2026-04-14-skills-platform-phase3`, not the ambiguous `/features/p3.3`.
3. **Story 3 of the agreed sequence remains to be scoped**: the full feature-page redesign — one page per feature, per-story accordion, feature-level-only "Resume conversation" (not per-story, confirmed via `journey-store.js`'s own one-journey-per-feature data model).

---

## DoD Observations

1. **Same recurring deploy-topology gap, eighth occurrence this session.**
2. **A third example this session of a full-suite run catching a real regression the DoR's own "estimated touch points" wouldn't have predicted** — `shb-s1`'s own test file wasn't an obviously "related" file for a link-href change, yet it broke because it depended on an implementation detail (which slug appears in the href) this story deliberately changed. Combined with `ppg-s1`'s and `prlf-s1`'s own identical pattern this session, this is now a recurring, well-evidenced signal — worth a standing DoR-template note, not a per-story anecdote each time.
