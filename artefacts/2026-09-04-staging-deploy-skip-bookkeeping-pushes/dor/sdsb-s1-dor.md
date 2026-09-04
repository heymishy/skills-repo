# Definition of Ready: Staging deploy workflow skips bookkeeping-only pushes to master

**Story:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**Test plan:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/test-plans/sdsb-s1-test-plan.md
**Contract:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/dor/sdsb-s1-dor-contract.md
**Date:** 2026-09-04
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1/AC4/AC5 automated; AC2/AC3 GitHub-native behaviour, RISK-ACCEPTed with manual verification per B2 precedent)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope (MUST/MUST NOT touch) verified against the test plan's own required touchpoints -- no conflict (CLAUDE.md B1/D1 check applied: the two existing regression-guard test files are correctly listed as MUST NOT touch, and neither has an assertion this story's change would break, confirmed by direct reading, not assumption)
- [x] Both related existing governance scripts (`check-no-prod-deploy-on-push.js`, `check-bri-s2.6-smoke-test-promote-gate.js`) read in full and confirmed unaffected by an `on:`-block-only change
- [x] Risk rated, RISK-ACCEPT logged for the one untestable-locally AC pair (AC2/AC3)
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged (this is additive trigger scoping, not a protocol/data-shape/session-structure choice)

## Proceed: Yes

## Notes

This story directly targets the "recurring deploy-topology gap" named in nearly every DoD this session (`pst-s1` through `daga-s1`, ~10 occurrences) and the specific operator-facing confusion incident from `fal-s1` (an approval landing on a superseded, bookkeeping-only run). Given this touches CI/deploy infrastructure -- not explicitly listed in CLAUDE.md's "Platform change policy" enumerated file list (`.github/skills/`, `.github/templates/`, `standards/`, `.github/governance-gates.yml`, `scripts/`) but clearly platform-adjacent in spirit -- this story follows the same PR-gated path already used for every other story this session (draft PR, CI green, explicit merge confirmation), not a direct-to-master bookkeeping push. That governed-PR path is the correct one regardless of the policy's literal file-list scope, since it's the same path this session already used for `daga-s1` (also infra-adjacent: `.dockerignore`, `pipeline-state-writer.js`).
