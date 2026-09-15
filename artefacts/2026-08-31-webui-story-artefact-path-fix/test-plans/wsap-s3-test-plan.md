# Test Plan: Multi-story commit gating and review cadence (wsap-s3)

**Story:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s3-multi-story-commit-and-review-cadence.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural (new) | New `tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js` — mocked product-linked feature, 2 stories, both stories' `test-plan` completions via the real `handlePostTurnStreamHtml` path; asserts both commits fire with distinct, story-scoped paths. |
| T2 | AC2 | Behavioural (new) | Same file — DoR completion with `advanceToNextStory` returning a real next story; asserts `handlePostGateConfirm` redirects to `test-plan`, not `review`, and the newly-registered session's `skillName` is `test-plan`. |
| T3 | AC3 | Regression (corrected) | `tests/check-ougl7-dor-and-journey-complete.js`'s `T7.3` updated to assert the new redirect target. |
| T4 | AC3 | Regression | 7 additional files re-run unchanged: `check-wsap-s1-story-scoped-artefact-paths.js`, `check-wsap-s2-per-story-routing-uses-storylist.js`, `check-ougl6-perstory-stage-routing.js`, `check-dtra-s1-auto-start-review-after-definition.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`, plus the full 17-file suite already covered by `wsap-s2`'s own test plan. |
| T5 | AC4 | Live verification | Post-deploy: continue driving stories (on the fresh e2e-proof feature, or `new-feature-2b74a292`) through the outer loop; confirm every story's artefacts commit to GitHub and review does not re-run between stories. |

## Regression coverage

T3/T4 together are the full existing regression surface for journey/story routing and GitHub-commit gating in this codebase.

## Out of Scope (per story)

- Adding a `storyId` field to `completedStages`'s own data shape.
- Recovering `new-feature-2b74a292`'s already-lost story content.
- Auditing the review skill's own multi-story LLM output correctness.
