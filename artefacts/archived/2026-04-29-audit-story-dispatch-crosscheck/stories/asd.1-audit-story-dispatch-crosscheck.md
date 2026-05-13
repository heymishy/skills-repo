## Story: Cross-check audit gate PR against pipeline-state dispatch record

**Epic reference:** Short-track — no parent epic (bounded audit gate improvement)
**Discovery reference:** N/A — short-track improvement
**Benefit-metric reference:** N/A — short-track improvement

## User Story

As a **platform operator reviewing a merged PR**,
I want the "Governed Delivery Audit Record" to confirm that the PR was legitimately dispatched for the story it claims to deliver,
So that I can trust the audit record shows the correct story and that no unregistered branch has been presented as a governed delivery.

## Benefit Linkage

**Metric moved:** Pipeline governance integrity (no formal metric — short-track improvement)
**How:** The current audit gate resolves the feature slug (via sar.1 PR-body extraction) but never cross-checks whether the specific story in the PR matches the dispatch record in `pipeline-state.json`. A PR could claim `artefacts/2026-04-24-platform-onboarding-distribution/stories/p11.6-start-skill.md` but not be the dispatched agent PR for p11.6. This story adds a function `extractStorySlug(bodyText, featureSlug)` and a `buildDispatchNote()` function, and updates the workflow to extract the story slug, look it up in pipeline-state.json, and show a `Dispatch verified ✅ · Issue #N` or `⚠️ No dispatch record` note in the AC section header of the audit comment.

## Architecture Constraints

- ADR-009: no `contents: write` permission — slug extraction reads `github.event.pull_request.body` (already available). No write operations.
- Zero new npm dependencies — Node.js built-ins only.
- Both new functions must be added to the existing `scripts/extract-pr-slug.js` module (not a new file) so they are co-located with the feature slug extraction, share the same unit-test suite, and are available to the workflow.
- Fail-open: if no story slug is found, or pipeline-state lookup fails, the gate posts a ⚠️ note but does not fail. Governance gate result is unaffected.

## Dependencies

- **Upstream:** sar.1 (extract-pr-slug.js module and resolve_feature slug — must be on master). sar.1 merged as PR #212. ✅
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a PR body containing an artefact path matching `artefacts/<featureSlug>/stories/<storyId>-*.md` (e.g. `` `artefacts/2026-04-24-platform-onboarding-distribution/stories/p11.6-start-skill.md` ``), when `extractStorySlug(bodyText, featureSlug)` is called, then it returns the story ID (e.g. `"p11.6"`).

**AC2:** Given a PR body with no `stories/` path under the given feature slug, when `extractStorySlug(bodyText, featureSlug)` is called, then it returns `""`.

**AC3:** Given a null or empty `bodyText`, when `extractStorySlug` is called, then it returns `""` without throwing.

**AC4:** Given `extractStorySlug` returns a story ID that exists in pipeline-state.json for the feature and has an `issueUrl` set, when `buildDispatchNote("verified", storyId, issueUrl)` is called, then the result contains `"Dispatch verified"`, `"✅"`, and `"Issue #"` followed by the issue number.

**AC5:** Given `extractStorySlug` returns a story ID that is not found in pipeline-state.json under the resolved feature, when `buildDispatchNote("not-found", storyId)` is called, then the result contains `"⚠️"` and `"not found in pipeline-state"`.

**AC6:** Given `extractStorySlug` returns a story ID found in pipeline-state.json but with no `issueUrl` field, when `buildDispatchNote("no-dispatch", storyId)` is called, then the result contains `"⚠️"` and `"No dispatch record"`.

## Out of Scope

- Blocking the gate result (verdict pass/fail) when dispatch record is missing — fail-open is intentional.
- Verifying the issue body itself (content validation of the dispatch issue).
- Cross-checking the staging manifest slug — that is a separate deferred candidate.
- Any change to how artefact hashes, governance checks, or the trace verdict are computed.
- Changes to any file outside `scripts/extract-pr-slug.js`, `.github/workflows/assurance-gate.yml`, and `tests/check-asd1-story-crosscheck.js`.

## NFRs

- **None identified** — string operations on already-available values; no performance, security, or compliance implications.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — story path format `artefacts/<slug>/stories/<id>-*.md` is stable and enforced by the PR template.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared
- [x] Benefit linkage is written
- [x] Complexity rated
- [x] Upstream dependency sar.1 confirmed merged (PR #212)
- [x] NFRs identified (explicitly "None")
- [x] Human oversight level confirmed: Low
