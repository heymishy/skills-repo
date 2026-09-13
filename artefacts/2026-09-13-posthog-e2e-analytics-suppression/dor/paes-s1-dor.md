# Definition of Ready Checklist

## Definition of Ready: Suppress PostHog analytics capture for E2E/synthetic test traffic

**Story reference:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s1-suppress-e2e-test-analytics.md
**Test plan reference:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator of this project's real PostHog analytics" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 8/8, each AC covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track operational hygiene fix, per its own stated Benefit Linkage — directly requested by the operator |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — single-file fix, reuses existing naming convention, explicit exclusions for the two other PostHog modules |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No rendered UI — backend module only |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Audit all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — `posthog-server.js` is not an injectable-adapter module (its exports are called directly, not wired via a `setX()` pattern) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Behavioural tests against the existing, already-reviewed `installHttpsMock()` harness | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Suppress PostHog analytics capture for E2E/synthetic test traffic — artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s1-suppress-e2e-test-analytics.md
Test plan: artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- src/web-ui/modules/posthog-server.js only, plus extending
  tests/check-pla-s1-posthog-module.js with the new test group.
- Add one small internal guard (e.g. isE2ETestIdentity(value)) checked
  at the top of capture(), identify(), groupIdentify(), and
  captureException() -- do not add per-call-site skip logic anywhere
  else in the codebase.
- Reuse the existing 'e2e-test-' prefix convention (see
  E2E_TEST_EMAIL_PREFIX in src/web-ui/routes/auth-email.js) --
  case-insensitive prefix match, do not invent a new marker or env var.
- capture()'s groups object values must also be checked, not just
  distinctId.
- Must not break the POSTHOG_KEY-unset no-op path (AC6).
- Re-run tests/check-pla-s1-posthog-module.js's existing tests
  unmodified -- all must still pass (AC5).
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, additive guard in one already-well-tested leaf module, operator explicitly requested this fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-13

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
