# Definition of Ready Checklist

## Definition of Ready: Wire identifyTenantGroup() into the real session-bootstrap path

**Story reference:** artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md
**Test plan reference:** artefacts/2026-09-12-tenant-group-identification-gap/test-plans/tgid-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Hamish (Founder/Operator)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6 tests map to the 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Restores `bri-s1.4`'s own stated intent, references the specific PostHog-dashboard-Groups gap |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — reuses `identifyTenantGroup`/`resolveTenantIdFromRequest` exactly as already built and tested by `bri-s1.4` |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend-only session-bootstrap logic |
| H-NFR | NFR profile or explicit "None" field | ✅ | Matches `bri-s1.4`'s own NFRs exactly (performance, security) |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — reuses the existing `posthogFlagsAdapter` `bri-s1.1`/`bri-s1.4` already built and D37-compliant |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Fully covered by automated tests reusing an already-tested adapter contract | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui, data]`
**Matched standards files:** none additional beyond `bri-s1.4`'s own already-matched set

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire identifyTenantGroup() into the real session-bootstrap path — artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md
Test plan: artefacts/2026-09-12-tenant-group-identification-gap/test-plans/tgid-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE change is scoped to src/web-ui/modules/flag-bootstrap.js's bootstrapFlags() function.
- Reuse identifyTenantGroup/resolveTenantIdFromRequest from src/web-ui/modules/posthog-flags.js exactly as already built -- do not modify posthog-flags.js itself.
- Apply the same _withTimeout wrapper pattern already used for isEnabled() calls in this file.
- Re-run tests/check-bri-s1.3-server-side-bootstrap.js and tests/check-bri-s1.4-tenant-level-targeting.js unmodified -- both must still pass, confirming zero regression.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped fix reusing two already-tested functions, operator explicitly requested this backlog item be worked)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
