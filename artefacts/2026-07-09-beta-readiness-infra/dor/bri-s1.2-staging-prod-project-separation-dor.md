# Definition of Ready: Separate staging and prod PostHog projects with isolated API keys

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.2-staging-prod-project-separation-test-plan.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.2-staging-prod-project-separation-dor-contract.md
**Assessed by:** Copilot (definition-of-ready skill)
**Date:** 2026-07-10

---

## Contract Review

Contract Proposal checked against the story's 4 ACs and the test plan: no mismatches found. The proposed `resolvePostHogApiKey()` function and server-startup wiring map directly onto AC1–AC4. The deferred live cross-contamination check (ADR-018/PAT-06) is correctly excluded from both the contract and the test plan's scope — consistent treatment across story, test plan, and this DoR. No hard block from Contract Review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want staging and production to write to entirely separate PostHog projects..., So that test-driven flag toggles...never pollute prod analytics..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1 unit + 1 integration; AC2: 1 unit + 1 integration; AC3: 1 unit; AC4: 2 unit + 1 integration |
| H4 | Out-of-scope section is populated | ✅ | Auto-provisioning second project; historical data migration |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 3 — Zero staging/prod PostHog cross-contamination |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09): 0 HIGH, 0 MEDIUM, 1 LOW. Outcome: PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan: "None at the AC level for this story." The deferred live check is a story-level PROCEED-BLOCKED condition, not an AC gap, and is explicitly logged as such |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 and ADR-018/PAT-06 both cited and accurate — ADR-018 governs Playwright/E2E framework, PAT-06 is the "execution pre-condition gate on runtime artefact existence" approved pattern, both correctly applied to the deferred live cross-contamination check. Review Run 2: 1-M1 (ADR-018 not cited) resolved since Run 1 |
| H-E2E | CSS-layout-dependent AC with no E2E tooling and no RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC. The one live/E2E-flavoured check (cross-contamination) is explicitly gated via PAT-06, not silently skipped — satisfies the spirit of H-E2E even though it isn't itself a CSS-layout item |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` includes secrets-management and audit-logging rows applying to bri-s1.2 |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | Not regulated |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal" checked |
| H-ADAPTER | Injectable adapter wired by this story (D37) | ✅ | (a) AC1/AC2 and their integration tests ARE the production-wiring verification for this story — this story's entire purpose is the env-based key selection wired into `server.js` startup, so the wiring AC is effectively already present, not a gap. (b) No new adapter/default stub introduced — this story configures which project the S1.1 adapter talks to; the stub-throws requirement is inherited from S1.1 and not restated here (correctly — nothing new to restate). (c) Whether `/implementation-plan` names wiring as a distinct task cannot be verified yet — forward requirement, not a block. |

**Hard block result: all PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs are identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | Review Run 2: 0 MEDIUM remaining (1-M1 resolved by adding the ADR-018/PAT-06 constraint). Nothing to acknowledge. | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | `bri-s1.2-staging-prod-project-separation-verification.md` has not yet been reviewed by a human domain expert. Standard posture for this solo-operator repo (W4 expected, not exceptional) — still logged per instruction. | Not yet acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's Coverage gaps: "None at the AC level." No UNCERTAIN items anywhere in the gap table. | — |

Note (LOW, non-blocking, carried forward): review Run 2 still lists **1-L1** — a dependency-chain inconsistency between this story's "Downstream" field and S1.3's "Upstream" field, open across 2 review runs. LOW severity, not a warning-table item, noted here for completeness only.

---

## READY / BLOCKED Determination

**READY.** All hard blocks pass. No open MEDIUM findings. Only W4 (standard solo-operator posture) is open.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Separate staging and prod PostHog projects with isolated API keys — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.2-staging-prod-project-separation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules, consistent with existing src/web-ui/ conventions.
- New module: src/web-ui/modules/posthog-config.js. Wire resolvePostHogApiKey()
  into server.js startup only — do not touch S1.1's posthog-flags.js adapter
  contract itself.
- Do not build automatic second-project provisioning or historical data
  migration — both explicitly out of scope.
- Do not attempt to build or test the live staging-to-prod cross-contamination
  check — per ADR-018/PAT-06 this is a DoR PROCEED-BLOCKED condition deferred
  until Epic 2 (staging environment) and bri-s3.4 are DoD-complete. Do not
  silently assume it passing; do not attempt a workaround inside this story.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular D37 and ADR-018.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — Medium oversight requires engineering-lead awareness, not formal sign-off. Share this DoR artefact with the tech lead for visibility before dispatch.
**Signed off by:** Not required
