# Definition of Ready: Cross-tenant isolation journey spec (bri-s3.4)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.4-cross-tenant-isolation-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.4-cross-tenant-isolation-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.4-cross-tenant-isolation-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.4-review-1.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.4-cross-tenant-isolation-journey-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer, I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC1–AC5) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1 unit+integration+E2E; AC2–AC3 integration+E2E; AC4 CI-config; AC5 E2E |
| H4 | Out-of-scope section is populated | ✅ | `TENANT_ORG_ALLOWLIST` model and infra-level pen-testing named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 5 — Cross-tenant isolation suite has zero tolerance for flake or skip |
| H6 | Complexity is rated | ✅ | Rating 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1, 2026-07-09 — PASS, 0 HIGH findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC4's "20 consecutive runs" gap is explicitly acknowledged (Untestable-by-nature, CI-config mitigation documented) |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared for bri-s2.4/bri-s3.1; field confirmed present in schema (see dor-contract) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, ADR-018 cited; scope correctly distinguished from S3.3 (within-tenant vs. cross-tenant); no Category E HIGH findings from review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC gap type (AC4's gap type is Untestable-by-nature, not CSS-layout). E2E tooling confirmed configured repo-wide (Playwright, `tests/e2e/`, ADR-018) — passes cleanly. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists, lists this story under Security (highest-priority spec framing) and Audit |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; nfr-profile.md exists |
| H-GOV | Governance approval check | ✅ | Confirmed PASSED — not re-checked this run |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Given this is (per the story's own framing) "the single most security-critical spec in the entire beta-readiness effort," an unreviewed script carries more risk here than in most other Epic 3 stories — a missed edge case in this guard's regression coverage has outsized cost. | Not yet done — outstanding for all 6 Epic 3 stories; recommend prioritising this story's W4 resolution first given its security criticality. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | AC4's gap has a documented mitigation (dedicated CI job, `--repeat-each=20`, zero-tolerance gate) — not left as an open uncertain item. | N/A |

**Outstanding warnings requiring action:** W4 (verification script domain-expert review — recommend prioritising this story given its security-critical framing).

---

## Oversight level

**Medium**, with the epic explicitly calling out this story by name: "the cross-tenant isolation spec (S3.4) in particular protects a security-critical guarantee (ADR-025) and warrants review." Share this DoR artefact with the tech lead before assigning, with that specific note flagged.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY

All hard blocks pass. One warning (W4) is outstanding — recommend resolving before assignment given this story's stated security criticality, though it does not formally block sign-off.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Cross-tenant isolation journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.4-cross-tenant-isolation-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.4-cross-tenant-isolation-journey-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Playwright spec under tests/e2e/, devDependency only, per ADR-018.
- The guard under test (ADR-025: application-layer tenant_id scoping via requireJourneyAccess/isSameTenant) must return 404, never 403, for cross-tenant access attempts — consistent with the existing FORBIDDEN-vs-NOT_FOUND policy from wuce-multi-tenancy. Do not change this policy.
- Cover all 4 named resource types (products, credits, standards, user_roles) — not just journeys.
- This spec is treated as a required, blocking CI check per its own NFR framing — do not mark ready for review with any failure in this spec unresolved.
- TENANT_ORG_ALLOWLIST org-tenancy isolation and infra/filesystem-level penetration testing are explicitly out of scope — do not build them here.
- AC4 (zero skip/flake over 20 runs) is a CI-configuration task (add a --repeat-each=20 job step with a zero-tolerance gate), not a single-run test assertion — implement it as CI config, not as application code.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not violate ADR-025 or ADR-018. If the file does not exist, note this in a PR comment.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium (epic explicitly names this story for closer review given its security-critical scope)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only, with explicit attention given security criticality
**Signed off by:** Not required (share DoR artefact with tech lead before assigning)
