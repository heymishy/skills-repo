# Definition of Done: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**PR:** https://github.com/heymishy/skills-repo/pull/827 | **Merged:** 2026-09-04 (commit `4d570296`)
**Story:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**Test plan:** artefacts/2026-09-04-feature-artefact-page-story-grouping/test-plans/fapg-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-feature-artefact-page-story-grouping/dor/fapg-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `groupArtefactsByStory: p3.3/p3.4-style filenames classified...` + `handleGetFeatureArtefacts: multi-story feature renders the accordion` | automated test (`tests/check-fapg-s1-group-artefacts-by-story.js`) | None |
| AC2 (regression) | ✅ | `handleGetFeatureArtefacts: single-story feature has no accordion` | automated test | None |
| AC3 | ✅ | `getFeatureStoryStructure: real story list extracted, including bare-string shapes` | automated test | None |
| AC4 (regression) | ✅ | `getFeatureStoryStructure: null for a repo with no .github directory` + `handleGetFeatureArtefacts: no local pipeline-state.json -- flat rendering, no crash` | automated test | None |
| AC5 (regression) | ✅ | `handleGetFeatureArtefacts: feature-level resume link still renders inside the grouped layout` | automated test | None |
| AC6 (regression) | ✅ | `tests/check-pdt-s4-story-breadcrumb.js` — 7/7 passing unmodified | automated test (reused, not rewritten) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Implementation matched the DoR contract's own 5-part plan precisely — no regressions found during development, no test-helper fixes needed (unlike `ppg-s1`, `fal-s1`, `prlf-s1`, each of which found and fixed one). This is the second story this session with zero implementation-time deviations (the first being `pefl-s1`), and the largest by scope of any story in this session's own sequence — both design-risk points (query approach, single-story UX) were resolved with the operator via `AskUserQuestion` before writing the story, rather than discovered mid-implementation.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (7 new + 1 reused unmodified)
**Tests passing in CI:** 8 / 8 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC3 story structure read from local disk | ✅ | ✅ | Including bare-string story shapes |
| AC4 (data-layer) null when file absent | ✅ | ✅ | |
| AC1 (data-layer) classification, no cross-contamination | ✅ | ✅ | Real filenames from the actual investigated feature |
| AC1 (route-level) accordion renders | ✅ | ✅ | |
| AC2 single-story unaffected | ✅ | ✅ | |
| AC4 (route-level) graceful fallback | ✅ | ✅ | The exact `alrf-s4`-named "volumeless container" scenario |
| AC5 resume links unaffected | ✅ | ✅ | |
| AC6 breadcrumb unchanged | ✅ | ✅ | `check-pdt-s4-story-breadcrumb.js`, unmodified |

**TDD verification performed (RED confirmed, not assumed):** before committing, the entire new module was temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed a genuine `MODULE_NOT_FOUND` failure, proving the new tests exercise real, necessary code rather than passing vacuously (a stronger form of RED-state confirmation than a value-mismatch assertion, since the code path literally cannot execute without the fix).

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — local read replaces a heavier query for this purpose | ✅ | `fal-s1`'s own conditional Postgres taxonomy-scan confirmed untouched via code review; new logic is a synchronous local file read only |
| Performance — no behaviour change for the common case | ✅ | AC2's own regression-guard test |
| Security — no new external input | ✅ N/A | Reads a file already accessible via `repoRoot`, the same trust boundary `listLocalArtefacts` already operates within |
| Availability — graceful degradation | ✅ | AC4's own tests |
| Accessibility — native `<details>`/`<summary>` | ✅ | Confirmed via code review; no custom JS state management |

`nfr-profile.md` status: `Active` — no NFR gaps identified at DoR, none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `fapg-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric this entire investigation thread has targeted.

---

## Outcome

**COMPLETE**

Story 3 of 3 in the agreed sequence (`aada-s1` → `prlf-s1` → `fapg-s1`), closing out the full feature-artefact-page redesign that began with the operator's own live-production review of `fal-s1`/`pefl-s1`'s results. Zero regressions, genuine RED→GREEN TDD verification (including a structurally-stronger `MODULE_NOT_FOUND` RED confirmation), clean full-suite run (607 files, 1 pre-existing unrelated failure). Both real design-risk points were resolved collaboratively before implementation rather than discovered as surprises mid-build.

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions for this merge commit (`4d570296`) whenever convenient — verify via git-ancestor check against whatever commit is actually deployed, not by run ID alone, per the lesson from `fal-s1`'s own DoD.
2. **Optional live confirmation, next time `skills-framework` is viewed in production**: navigate to `2026-04-14-skills-platform-phase3`'s artefact page (once `aada-s1`'s archived-directory fix and a fresh sync make it findable) and confirm the epic/story accordion renders correctly, and that a single-story feature's own page is unaffected.
3. **The fuller visual redesign** (pipeline-stage timeline, feature header card, promoted resume buttons) explored in the earlier mockup remains explicitly out of scope for this sequence — a candidate for a future story if the operator wants that level of visual polish shipped.

---

## DoD Observations

1. **Same recurring deploy-topology gap, ninth occurrence this session.**
2. **The largest story in this session's own investigation thread shipped with zero implementation-time deviations** — a useful contrast with `ppg-s1`/`fal-s1`/`prlf-s1`, each of which found and fixed one real regression during development despite being individually smaller. The difference: this story's own two hardest design decisions (query approach, single-story UX) were surfaced and resolved explicitly with the operator via `AskUserQuestion` *before* writing the DoR — not decided unilaterally and discovered wrong later. Worth recording as a calibration signal: when a story's complexity comes from genuine architectural ambiguity (not just code volume), resolving that ambiguity collaboratively before implementation measurably reduces mid-build surprises, more so than careful DoR-contract scoping alone (which `ppg-s1`/`fal-s1`/`prlf-s1` all also had, and still hit real regressions).
3. **This closes a 6-story arc traced entirely back to one live-production review conversation** (`ppg-s1` → `fal-s1` → `pefl-s1` → `aada-s1` → `prlf-s1` → `fapg-s1`), each story surfaced by the operator's own inspection of the previous story's shipped result, sometimes producing real new findings along the way (the `p3.3` slug collision, the archived-directory lookup gap) that were never the original ask but were caught and fixed because the operator was looking at real data, not a mockup or a description. Worth naming explicitly as the working pattern that made this arc effective: ship a narrow, well-tested fix, then actually look at the real page again before deciding what's next.
