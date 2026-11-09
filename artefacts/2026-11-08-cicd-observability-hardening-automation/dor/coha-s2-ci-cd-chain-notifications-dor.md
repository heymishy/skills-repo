# Definition of Ready: CI/CD chain notifications (announce, status, auto-retry visibility)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s2-ci-cd-chain-notifications-test-plan.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-09

---

## Contract Proposal

See `coha-s2-ci-cd-chain-notifications-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed** — the proposed shared notify module and its three functions map cleanly to AC1-AC4; the retry-notification path correctly defers to the existing, unmodified `isDeployGroupEviction()` rather than re-implementing the decision, matching the story's own Architecture Constraints.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer..." |
| H2 | ≥3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1-AC4 all covered |
| H4 | Out-of-scope populated | ✅ | `isDeployGroupEviction()` logic; PR-branch notifications |
| H5 | Benefit linkage references a named metric | ✅ | "CI/CD chain notification coverage; Manual CI toil reduction for known-flaky patterns" |
| H6 | Complexity rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ | review/coha-s2-review-1.md: PASS, 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | Coverage gaps: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies lists upstream coha-s1 — **schemaDepends: []** declared in this contract: the dependency is a code-level function call (`coha-s1`'s exported `sendTeamsNotification`/adapter), not a `pipeline-state.json` schema field. No field is depended upon, so there is nothing to check against `pipeline-state.schema.json`; the check passes vacuously with this honest empty declaration rather than a fabricated field name. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 constraints stated; review Category E had no HIGH findings |
| H-E2E | N/A | ✅ N/A | No UI; hasLayoutDependentGaps: false |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md exists, Active |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance framework applies |
| H-NFR3 | Data classification not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares Performance/Audit NFRs; profile exists |
| H-GOV | Approved By | ✅ | "Hamish King — Platform Owner — 2026-11-08". M1: positive |
| H-ADAPTER | D37 check | ✅ N/A | This story introduces no new injectable adapter — it is a caller of coha-s1's, per its own Architecture Constraints ("No new injectable adapter here") |
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
| W5 | No UNCERTAIN gap-table items | ✅ | — | Test Gaps table's one named gap (real GitHub Actions event timing) is mitigated by post-merge smoke test, not UNCERTAIN |

**Outstanding decisions to log:** W4 — already logged once for all 4 coha stories.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: CI/CD chain notifications (announce, status, auto-retry visibility) — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s2-ci-cd-chain-notifications-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions; test runner is node scripts/run-all-tests.js.
- Requires coha-s1 to exist on the branch (import its adapter module) — do not stub or reimplement coha-s1's send function; if coha-s1 has not yet merged to master, this story's branch should be based on or rebased onto coha-s1's branch per CLAUDE.md's standard PR flow.
- Do not modify isDeployGroupEviction() or deploy-group-auto-rerun.yml's existing `if:` gate semantics — only add a notification call downstream of the existing result.
- Changes to .github/workflows/*.yml go via branch + PR, never direct to master (CLAUDE.md Platform change policy).
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
