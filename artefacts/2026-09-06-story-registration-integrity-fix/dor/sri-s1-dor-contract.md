# Contract Proposal — Fix epic/flat story render duplication and missing story registration

**Story:** artefacts/2026-09-06-story-registration-integrity-fix/stories/sri-s1-fix-story-render-duplication-and-missing-registration.md
**Date:** 2026-09-06

---

## What will be built

`getFeatureStoryStructure` (`src/web-ui/adapters/feature-story-structure.js`) extended to exclude, from its returned `flatStorySlugs`, any slug already present in any epic's `storySlugs`. One new filter step; no change to `groupArtefactsByStory`'s own logic.

Data corrections to `.github/pipeline-state.json` (bundled in the same branch, per the "state and artefact updates — no standalone PR required" convention, since it accompanies this story's own code change):
- `2026-04-14-skills-platform-phase3`: add `p3.18`, `p3.19`, `p3.20`, `p3.21`, `p3.22` (bare strings) to `e1-governance-chain-integrity`'s `stories[]`.
- `2026-04-19-skills-platform-phase4-opus`: add a `stories[]` array (bare strings, derived from each file's own `Epic reference` header) to each of its 4 epics — 23 slugs total.
- `2026-05-05-web-ui-model-first-chat`: add a flat `stories[]` entry with `id: 'mfc.2'` (minimal object, matching `mfc.1`'s shape; `stage`/`health` best-effort since no DoR/DoD artefact exists for `mfc.2` — flagged as an assumption below).
- `2026-05-26-bsr-workforce-planner`: add `wfp.11` (bare string) to `wfp-planning-dashboard`'s `stories[]`, alongside its existing siblings `wfp.11a`/`wfp.11b`.

No change to `phase3`'s or `wucp`'s existing flat story objects (`p3.3`–`p3.13`, `wucp.0`–`wucp.4`) — those are left exactly as-is; the fix is render-time dedupe, not data removal, since those flat objects carry real DoR/PR/dodDate tracking data that must not be lost.

## What will NOT be built

- No fix for `ougl`'s dot/dash slug-format mismatch or `wuce`'s missing sprint-0/sprint-2 epics — both logged as follow-ups in `workspace/capture-log.md` (2026-09-06), out of scope per story.
- No backfill of full tracking objects (DoR status, PR links, etc.) for phase4-opus's 23 newly-registered stories or phase3's existing epic-only bare-string members (`p3.1a`–`p3.2b`).
- No change to `deriveTypeFromPath` or any other artefact-type derivation.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: dedupe confirmed at both `getFeatureStoryStructure` and `groupArtefactsByStory` level | Unit |
| AC2 | Unit test: flat-only slug (no epic membership) unaffected | Unit (regression guard) |
| AC3 | Data-integrity test reading the real, committed `pipeline-state.json` directly | Unit (data assertion) |
| AC4 | Manual verification scenario against 2 originally-affected + 4 newly-registered real production features, post-merge | Manual |

## Assumptions

- `mfc.2`'s `stage`/`health` fields are best-effort defaults (`stage: 'definition'`, `health: 'green'`) since no DoR, test-plan, or DoD artefact exists for it to derive a more accurate stage from — confirmed via direct directory listing (only `mfc.1` has `dor`/`dod`/`test-plans` entries). This registers it for correct rendering; it does not assert a false completion state.
- Epic-nested bare-string registration (no accompanying flat object) is sufficient for correct artefact-grouping, confirmed by reading `groupArtefactsByStory`: it only needs the slug to exist somewhere in the combined epic+flat slug list to correctly match filenames — the object body (DoR status, etc.) is not consumed by the grouping logic at all.

## Estimated touch points

**Files:** `src/web-ui/adapters/feature-story-structure.js` (dedupe filter), `.github/pipeline-state.json` (data corrections, 4 features), new `tests/check-sri-s1-story-registration-integrity.js`
**Services:** None
**APIs:** None
