# Definition of Done: Feature artefact lookup falls back to the archived directory when the primary path is gone

**PR:** https://github.com/heymishy/skills-repo/pull/825 | **Merged:** 2026-09-03 (commit `d33b76f9`)
**Story:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**Test plan:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/test-plans/aada-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/dor/aada-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (regression) | ✅ | `AC1: file found at the primary (non-archived) path` | automated test (`tests/check-aada-s1-archived-directory-fallback.js`) | None |
| AC2 | ✅ | `AC2: result is not null -- the exact case this story fixes` + both files found | automated test | None |
| AC3 (regression) | ✅ | `AC3: null returned for a genuinely nonexistent feature, unchanged from before this fix` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Implementation matched the DoR contract exactly — a single new conditional branch in `listLocalArtefacts`, no regressions found during development.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 primary path unaffected | ✅ | ✅ | |
| AC2 archived path found | ✅ | ✅ | The exact case this story fixes |
| AC3 neither path — still null | ✅ | ✅ | |

**TDD verification performed (RED confirmed, not assumed):** before committing, the fix was temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code. Confirmed AC2 fails with exactly the expected value (`null` instead of the real archived files), while AC1/AC3's regression guards correctly pass either way.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible added cost | ✅ | One additional `fs.existsSync` check, only reached when the primary path is already confirmed absent |
| Security — no new external input | ✅ N/A | `featureSlug` already trusted and used for the primary path today |
| Accessibility | ✅ N/A | No UI change in this story |
| Audit | ✅ N/A | No new data write or access path |

`nfr-profile.md` status: `Active` — no NFR gaps identified at DoR, none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `aada-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric this whole investigation thread (`ppg-s1`, `fal-s1`, `pefl-s1`) has targeted.

---

## Outcome

**COMPLETE**

Smallest of the 3-story sequence agreed with the operator (archived-directory fallback → featureSlug-scoped story links → the full feature-page redesign). Zero regressions, genuine RED→GREEN TDD verification, clean full-suite run (605 files, 1 pre-existing unrelated failure).

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions for this merge commit (`d33b76f9`) whenever convenient — verify via git-ancestor check against whatever commit is actually deployed, not by run ID alone, per the lesson from `fal-s1`'s own DoD (an operator approval can land on a later, superseding run).
2. **Optional live confirmation, next time `2026-04-14-skills-platform-phase3` is viewed in production**: confirm `/features/2026-04-14-skills-platform-phase3` now shows its real artefacts instead of "No artefacts found." Not blocking — automated coverage already proves this behaviour.
3. **Stories 2 and 3 of the agreed sequence remain to be scoped**: featureSlug-scoped story links (fixing the `p3.3` slug-collision as a structural side effect), and the full feature-page redesign itself (one page per feature, per-story accordion, feature-level resume only — not per-story, since journeys are tracked one-per-feature, confirmed via direct code reading of `journey-store.js`).

---

## DoD Observations

1. **Same recurring deploy-topology gap, seventh occurrence this session.** Consistent with every prior DoD.
2. **This story is a direct byproduct of a design-review conversation, not a pre-planned fix.** Found while gathering real content for a mockup (reading `2026-04-14-skills-platform-phase3`'s own artefact folder to populate it with real data), not through a dedicated audit. Worth noting as a positive pattern: building mockups with real data, rather than lorem ipsum or invented content, surfaces real defects as a side effect of the design process itself — this is the second time this session that's happened (the first being the `p3.3` slug-collision, found the same way, in the same investigation).
