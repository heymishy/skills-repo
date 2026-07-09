# Definition of Ready: Signup → onboarding → first feature journey spec (bri-s3.2)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.2-signup-onboarding-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.2-signup-onboarding-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.2-signup-onboarding-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.2-review-1.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.2-signup-onboarding-journey-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer, I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC1–AC5) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1 E2E; AC2–AC4 integration+E2E; AC5 E2E |
| H4 | Out-of-scope section is populated | ✅ | OAuth signup variants → S3.6; multi-user onboarding → S3.3, both named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1, 2026-07-09 — PASS, 0 HIGH findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared for bri-s3.1 dependency; field confirmed present in schema (see dor-contract) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018, ADR-024 cited; no Category E HIGH findings from review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC gap type in the test plan. E2E tooling confirmed configured repo-wide: Playwright (`playwright.config.js`), `tests/e2e/`, per ADR-018 — this IS an E2E story by design; passes cleanly. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists, lists this story under Performance and Security |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply (nfr-profile.md: "None") |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; nfr-profile.md exists |
| H-GOV | Governance approval check | ✅ | Confirmed PASSED — not re-checked this run |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | This story introduces no new injectable adapter — it consumes S3.1's adapter. Not applicable. |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set — skipped |

**All hard blocks pass. No blockers.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | N/A — populated |
| W2 | Scope stability is declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings reported for this story's review pass (Run 1). | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Risk of the walkthrough missing edge cases (e.g. the AC3/AC4 pass-vs-fail visual distinction relies on subjective "clearly distinct" language that a domain expert should confirm matches actual UI design). | Not yet done — outstanding for all 6 Epic 3 stories. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan: "Gap: None identified." | N/A |

**Outstanding warnings requiring action:** W4 (verification script domain-expert review — schedule before or during implementation).

---

## Oversight level

**Medium** (per `epic-3-test-suite.md`). Share this DoR artefact with the tech lead before assigning. No formal sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY

All hard blocks pass. One warning (W4) is outstanding — does not block sign-off but should be scheduled.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signup → onboarding → first feature journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.2-signup-onboarding-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.2-signup-onboarding-journey-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Playwright spec under tests/e2e/, devDependency only, per ADR-018. Do not invoke Playwright from the unit test chain (npm test).
- Any assertion against GET /api/journey/:id must respect the ADR-024 governed response shape (turns, stages, completedStages, stage, ownerId, activeSkill) — partial shapes are forbidden.
- This spec depends on bri-s3.1's mock LLM gateway existing and being wired — sequence implementation accordingly, or coordinate with whichever task delivers bri-s3.1 first.
- Google/GitHub OAuth signup variants and team/multi-user onboarding are explicitly out of scope — do not build them in this story.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not violate ADR-018 or ADR-024. If the file does not exist, note this in a PR comment.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (share DoR artefact with tech lead before assigning)
