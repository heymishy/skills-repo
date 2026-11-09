# Definition of Ready: Bounded production-log scan with pattern-match notification

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s4-bounded-production-log-scan-test-plan.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-09

---

## Contract Proposal

See `coha-s4-bounded-production-log-scan-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed** — proposed script and scheduled workflow map cleanly to AC1-AC4, including AC4's explicit manual-gap handling (consistent with the test plan's own acknowledged External-dependency gap, not a silent skip).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer..." |
| H2 | ≥3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1-AC3 automated; AC4 has an acknowledged manual scenario (not silently uncovered) |
| H4 | Out-of-scope populated | ✅ | Remediation; pattern-UI; other observability vendors |
| H5 | Benefit linkage references a named metric | ✅ | "Production-defect detection latency" |
| H6 | Complexity rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ | review/coha-s4-review-1.md: PASS, 0 HIGH, 0 MEDIUM, 1 LOW (non-blocking) |
| H8 | No uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC4 gap type `External-dependency`, explicitly acknowledged in the test plan's Coverage gaps table with a stated handling (manual scenario, 🟡) |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream coha-s1 declared — **schemaDepends: []**: code-level adapter call, not a schema field dependency; passes vacuously with honest empty declaration. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 constraints stated (triggered-and-bounded mandate, credential handling, retention window, CI-gate-verifiable assertion, external-CLI wiring task); review Category E had no HIGH findings |
| H-E2E | N/A | ✅ N/A | No UI; hasLayoutDependentGaps: false |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md exists, Active |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance framework applies |
| H-NFR3 | Data classification not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares Performance/Security/Audit NFRs; profile exists |
| H-GOV | Approved By | ✅ | "Hamish King — Platform Owner — 2026-11-08". M1: positive |
| H-ADAPTER | D37 check | ✅ N/A | No new injectable adapter for notification send (reuses coha-s1); the new `flyctl` external-command dependency is not a `setX()`-shaped injectable adapter in the D37 sense, but the story's own Architecture Constraints already correctly names it as a separate implementation-plan task regardless |
| H-INF | N/A | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | N/A | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | N/A | ✅ N/A | `hasDesignSystemTrack` not set |

**Result: 18/18 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Performance/Security/Accessibility/Audit all stated |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ N/A | — | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — single cross-story RISK-ACCEPT in decisions.md (2026-11-09) |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Both gap-table entries (AC4 baseline event, flyctl CLI real-environment behaviour) have stated, non-UNCERTAIN mitigations |

**Outstanding decisions to log:** W4 — already logged once for all 4 coha stories.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bounded production-log scan with pattern-match notification — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s4-bounded-production-log-scan-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions; test runner is node scripts/run-all-tests.js.
- New script: scripts/production-log-scan.js. Treat wiring/testing the flyctl CLI invocation as its own implementation-plan task, distinct from the pattern-match logic, per the story's own Architecture Constraints.
- Requires coha-s1 to exist on the branch (import its adapter module).
- Mandatory: the scan must be triggered-and-bounded (scheduled workflow, runs and exits) — never a persistent/long-running process (product/mission.md, product/constraints.md #11).
- FLY_API_TOKEN read only from GitHub Actions secrets — never logged, never included in the notification payload.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech-lead-awareness checkpoint only
**Signed off by:** Hamish King (Platform Owner), acting as this personal-scope project's own tech-lead-equivalent awareness checkpoint; DoR artefact reviewed before assignment, 2026-11-09.
