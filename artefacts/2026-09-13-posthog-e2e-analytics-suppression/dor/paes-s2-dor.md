# Definition of Ready Checklist

## Definition of Ready: Suppress PostHog feature-flag-evaluation analytics noise for E2E/synthetic test traffic

**Story reference:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s2-suppress-feature-flag-eval-e2e-noise.md
**Test plan reference:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator of this project's real PostHog analytics" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 9/9, each AC covered (AC1/AC2/AC3 get 2 tests each) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track operational hygiene fix — directly closes `paes-s1`'s own recorded Follow-up Action |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — confirmed the `sendFeatureFlagEvents` option exists in the installed `posthog-node` package's own type definitions before writing the story |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No rendered UI — backend module only |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Audit all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — modifying the existing `evaluateFlag`/`groupIdentify` adapter implementation, not introducing a new injectable seam |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Behavioural tests against the existing, already-established `FakePostHogCtor` harness | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Suppress PostHog feature-flag-evaluation analytics noise for E2E/synthetic test traffic — artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s2-suppress-feature-flag-eval-e2e-noise.md
Test plan: artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Export isE2ETestIdentity from src/web-ui/modules/posthog-server.js
  (already defined there by paes-s1, currently unexported).
- src/web-ui/modules/posthog-config.js: in evaluateFlag, when
  isE2ETestIdentity(distinctId) is true, pass
  { groups: ..., sendFeatureFlagEvents: false } to
  client.isFeatureEnabled() -- do NOT skip the evaluation itself.
- src/web-ui/modules/posthog-config.js: in groupIdentify, when
  isE2ETestIdentity(groupKey) is true, return without calling
  client.groupIdentifyImmediate() at all.
- Do NOT touch posthog-flags.js.
- Re-run tests/check-bri-s1.2-staging-prod-separation.js and
  tests/check-pla-s1-posthog-module.js unmodified -- all existing
  assertions must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, additive guard reusing an existing helper and a documented SDK option; operator explicitly requested this fix as a direct continuation of paes-s1's own recorded follow-up)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-13

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
