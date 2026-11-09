# Definition of Ready: Outbound Teams chat-notification adapter

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s1-outbound-teams-notification-adapter-test-plan.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-09

---

## Contract Proposal

See `coha-s1-outbound-teams-notification-adapter-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed** — the proposed new module, the injectable-adapter shape (throwing stub + setter), and the four AC-to-test mappings align with AC1-AC4 and the test plan's own AC Coverage table. No mismatch found between what the contract proposes and what the ACs require.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer, I want..., So that..." |
| H2 | ≥3 ACs in Given/When/Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has ≥1 test in the test plan | ✅ | AC1-AC4 each covered by unit and/or integration tests |
| H4 | Out-of-scope section populated | ✅ | Slack/other platforms; message formatting for other stories |
| H5 | Benefit linkage references a named metric | ✅ | "CI/CD chain notification coverage" |
| H6 | Complexity rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from review | ✅ | review/coha-s1-review-1.md: PASS, 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 4 constraints stated (inbound-adapter scope correction, secret handling, CI-gate-verifiable dispatch, D37 rule); review Category E (Architecture compliance) had no HIGH findings |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No UI; test plan has zero CSS-layout-dependent ACs (confirmed hasLayoutDependentGaps: false) |
| H-NFR | NFR profile exists or story states "None" | ✅ | artefacts/2026-11-08-cicd-observability-hardening-automation/nfr-profile.md exists, Active |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ N/A | No compliance framework applies to this feature (`complianceFrameworks: []`) |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence if story declares NFRs | ✅ | Story declares Performance/Security/Audit NFRs; feature nfr-profile.md exists |
| H-GOV | Approved By ≥1 non-blank named, non-engineering entry | ✅ | discovery.md: "Hamish King — Platform Owner — 2026-11-08". M1 signal: positive (clearly non-engineering role) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | AC3 = throwing stub (explicit error message matching D37's required shape); AC4 = explicit production-wiring AC with the correct behavioural-correctness bar stated verbatim ("two different message payloads produce two distinctly different webhook POST bodies") — matches D37's own standard exactly, citing the `tir-s1` precedent. Coding Agent Instructions below name wiring as a task distinct from building the handler. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` not set — no UI touched by this story |

**Result: 18/18 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | Performance/Security/Accessibility/Audit all stated in story |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | — | 0 MEDIUM findings for this story |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — see single cross-story RISK-ACCEPT in decisions.md (2026-11-09, covers all 4 coha stories) |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | — | Test plan's Test Gaps and Risks table has one named, mitigated gap (real-secret config, covered by post-deploy smoke check), no UNCERTAIN items |

**Outstanding decisions to log:** W4 — logged once for all 4 coha stories in this feature's decisions.md (2026-11-09 RISK-ACCEPT entry).

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Outbound Teams chat-notification adapter — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s1-outbound-teams-notification-adapter-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions (see package.json scripts; test runner is node scripts/run-all-tests.js).
- New module: src/approval-channel/adapters/teams-outbound-adapter.js — do not extend or modify the existing src/approval-channel/adapters/teams-adapter.js (inbound-only; out of scope per Architecture Constraints).
- D37 (mandatory): the stub default for teamsNotifyAdapter MUST throw, never return a silent success. Treat "wire the real implementation at the chosen entry point" as a SEPARATE implementation-plan task from "build the handler + injectable setter" — do not combine them into one task.
- TEAMS_WEBHOOK_URL is read only from process.env — never hardcoded, never logged, never included in any error payload surfaced to a PR comment or CI log.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests (e.g. exact wiring entry point): add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech-lead-awareness checkpoint only
**Signed off by:** Hamish King (Platform Owner), acting as this personal-scope project's own tech-lead-equivalent awareness checkpoint (no separate engineering role exists in this project); DoR artefact reviewed before assignment, 2026-11-09.
