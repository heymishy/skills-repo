## Definition of Ready: Give every captured error an environment-specific fingerprint so a production error never joins a staging error group

**Story reference:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md
**Test plan reference:** artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-posthog-env-separation/dor/pes-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** A few lines in `scrubEvent` and one constant, five new tests, one list edit in an existing test; all 6 ACs map to a test or a named live scenario. The exclusion list (bridge, coha-s7, destination, secrets, second project, deploy) has zero test assertions against it. The tests that pin exact keys are named as a deliberate change in the story and the plan.

## Short-track entry-condition note
Short-track (CLAUDE.md: `/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV are vacuously satisfied, as for `sff-s1`.

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator relying on production error alerts" |
| H2 | At least 3 ACs Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 UT1+UT4, AC2 UT2, AC3 UT3, AC4 IT1, AC5 and AC6 live scenarios |
| H4 | Out of scope populated | ✅ | 5 exclusions |
| H5 | Benefit linkage names a metric | ✅ | Metric 4 (Production-defect detection latency) |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | AC5 and AC6 live-only, acknowledged in the plan; `schemaDepends: []` |
| H9 | Architecture Constraints populated | ✅ | Names ADR-025 and ADR-011 |
| H-E2E, H-NFR, H-NFR2, H-NFR3, H-GOV, H-ADAPTER, H-INF, H-MIG, H-DESIGN | N/A or vacuous | ✅ | No UI, no adapter, no schema; NFRs inline |

**Hard blocks: 19/19 passed** (2 vacuous).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | NFRs stated; stability Stable; no review |
| W4 | ⚠️ Pending operator | Verification script not yet walked by a human |
| W5 | ⚠️ Pending operator | Two accepted unknowns: PostHog may not apply the fingerprint as documented, and the fingerprint may over-split by route. Both are caught by the live AC5 check, so the story must not close on automated tests alone |

## Standards injection
Domain tags: `[web-ui, observability, privacy]`. `web-ui` matched: `.github/standards/web-ui/web-ui-patterns.md` (read it; little of it is engaged). `observability` and `privacy` are not keys in `.github/standards/index.yml`: no standards injected for them. The binding constraint is the story's own fail-closed rule.

## Oversight level
**Low** - a few lines in a scrubber with tests; no new route, adapter or schema. It is privacy-sensitive, so the canary tests are the guard and the live check AC5 is mandatory. No named sign-off required.

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md
Test plan: artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s1-test-plan.md
Contract: artefacts/2026-11-15-posthog-env-separation/dor/pes-s1-dor-contract.md

Goal:
Write UT1 to UT4 and IT1 first and confirm they FAIL against the current scrubber; then add the fingerprint in scrubEvent. Do not add scope beyond the 6 ACs.

Constraints:
- Fingerprint = [fpEnv, code, route] where fpEnv is the environment only when it is exactly 'staging' or 'production', else 'unknown'; code is the already allow-listed value; route is the already sanitised pattern. Never read or copy any incoming fingerprint or any other input text.
- Add $exception_fingerprint to KEPT_KEYS; the ONLY existing test edits are the sorted key list in scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId (line ~27). Do not weaken any canary or leak test.
- Update the comment above the removed-fingerprint line accurately (the incoming value is still ignored).
- Do not change the bridge, coha-s7, scripts, workflows or any other src file.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md before implementing.
- ASCII only; verify the non-ASCII count after each edit (learnings D60). Node built-ins only.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree.
- Open a draft PR when tests pass - do not mark ready for review. The operator merges. Do not deploy production.
- After merge (orchestrator): scenarios 5 and 6; the story is COMPLETE only if staging events get a new issue id different from 01a1dd12-795d-7763-827f-9a246fad8d00.

Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory, pending operator confirmation.