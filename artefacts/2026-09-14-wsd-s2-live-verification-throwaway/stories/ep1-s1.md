## Story: Advance wsd-s2 feature stage via GitHub API
**Epic reference:** artefacts/2026-09-14-wsd-s2-live-verification-throwaway/epics/wsd-s2-write-verification.md
**Discovery reference:** artefacts/2026-09-14-wsd-s2-live-verification-throwaway/discovery.md
**Benefit-metric reference:** artefacts/2026-09-14-wsd-s2-live-verification-throwaway/benefit-metric.md
## User Story
As a **Platform operator**,
I want **the feature's own stage to be advanced from `discovery` to the next stage via the authenticated operator's GitHub token, confirming the write lands on `origin/master`**,
So that **the wsd-s2 GitHub API write mechanism is verified in production**.
## Benefit Linkage
Live GitHub Contents API write verification — this story completes the verification by triggering and observing the actual write mechanism.
## Architecture Constraints
None identified — this is a pure mechanism verification, no architectural patterns apply.
## Dependencies
None
## Acceptance Criteria
Given the feature is at `discovery` stage in `pipeline-state.json`,
When wsd-s2's write mechanism is triggered to advance the stage,
Then a new commit appears on `origin/master` with the updated `pipeline-state.json`, advancing the feature's stage field to reflect the next phase.
## Out of Scope
- Implementing any new functionality
- Touching any files other than `pipeline-state.json`
- Keeping this feature after verification is complete
## NFRs
None
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
