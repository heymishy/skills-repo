## Definition of Ready: Send the environment-specific fingerprint as a string

**Story reference:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s2-string-fingerprint.md
**Test plan reference:** artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-posthog-env-separation/dor/pes-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One expression and its tests; all 5 ACs map to a test or a named live scenario; the exclusion list (bridge, workflow, destination, secrets, deploy) has zero test assertions against it.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for sff-s1 and pes-s1.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator relying on production error alerts" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 5 ACs |
| H3 | Every AC has a test | ✅ | AC1 UT1+UT5, AC2 UT2, AC3 UT3+UT4+IT1, AC4 and AC5 live |
| H4 | Out of scope populated | ✅ | 1 line, 5 exclusions |
| H5 | Benefit linkage names a metric | ✅ | Metric 4 |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []` |
| H9 | Architecture Constraints populated | ✅ | Names ADR-025 and ADR-011 |
| Others (E2E, NFR, GOV, ADAPTER, INF, MIG, DESIGN) | N/A or vacuous | ✅ | No UI, adapter or schema |

**Hard blocks: 19/19 passed** (2 vacuous).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Verification script not walked by a human |
| W5 | ⚠️ Pending operator | PostHog may reject a string for a further reason; caught only by AC4. This is the second wire-type miss in this feature, so the story must not close on automated tests alone |

## Standards injection
Domain tags `[web-ui, observability, privacy]`: `web-ui` matched (`.github/standards/web-ui/web-ui-patterns.md`); `observability` and `privacy` are not keys in `.github/standards/index.yml`.

## Oversight level
**Low** (a one-line scrubber change with tests), with the live check mandatory.

## Coding Agent Instructions
```
Proceed: Yes
Story: artefacts/2026-11-15-posthog-env-separation/stories/pes-s2-string-fingerprint.md
Test plan: artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s2-test-plan.md
Goal: edit pes_UT1 to UT4 and pes_IT1, add pes_UT5; confirm they FAIL on the array; then change the fingerprint to a string joined with '|'. No scope beyond the 5 ACs.
Constraints: same three fixed inputs only; ASCII only (verify the count); only the named tests change; no other src, script or workflow change; do not edit pipeline-state.json or workspace/state.json from the worktree; draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.