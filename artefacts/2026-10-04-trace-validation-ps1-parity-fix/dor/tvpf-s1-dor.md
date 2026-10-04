# Definition of Ready Checklist

## Definition of Ready: Fix validate-trace.ps1's discovery_approved false positive

**Story reference:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/stories/tvpf-s1-fix-discovery-approved-false-positive.md
**Test plan reference:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/test-plans/tvpf-s1-test-plan.md
**Contract proposal:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/dor/tvpf-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator relying on npm test's trace-validation gate on Windows" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 4 tests, 1:1 |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Trust in npm test's trace-validation signal on Windows (short-track — operational metric, not a formal benefit-metric artefact) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same gap as `pcr-s1`'s own precedent. Logged in `decisions.md`, 2026-10-04 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block states "None" — no upstream story declared |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with real line numbers from both `.ps1` and `.sh`; no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent (CLI script, no UI) |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states "None identified" explicitly — per H-NFR's own stated exemption, no feature-level NFR profile required when the story declares no NFRs |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is "None identified" — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Same gap as `pcr-s1`'s own precedent (`pcr-s1-dor.md`). Satisfied via the operator's own direct in-session instruction to proceed as short-track. Logged in `decisions.md`, 2026-10-04 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — this is a PowerShell script fix, not a web-ui route/adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption (not silently bypassed — both logged transparently in `decisions.md`, matching `pcr-s1`'s own established precedent for this exact gap).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every other story this session; not re-logged separately given the tiny, mechanical scope of this fix |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table item (AC4's POSIX-shell dependency) is explained/mitigated, not "UNCERTAIN" | — |

---

## Standards injection

**Domain tags:** None — story's own `Domain` field explicitly states "None — governance tooling script, not web-ui/api/auth/data/security."
Story has no `domain` field match — skipped silently, per the skill's own documented behaviour for this case.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix validate-trace.ps1's discovery_approved false positive — artefacts/2026-10-04-trace-validation-ps1-parity-fix/stories/tvpf-s1-fix-discovery-approved-false-positive.md
Test plan: artefacts/2026-10-04-trace-validation-ps1-parity-fix/test-plans/tvpf-s1-test-plan.md
Contract: artefacts/2026-10-04-trace-validation-ps1-parity-fix/dor/tvpf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- PowerShell 5.1+ compatible — zero external module dependencies (matches
  validate-trace.ps1's own existing header constraint)
- Modify ONLY Check-DiscoveryApproved's internal logic in scripts/validate-trace.ps1
  — do not touch any other function or check in that file
- Do NOT modify scripts/validate-trace.sh — it already has correct behaviour
- Match validate-trace.sh's own per-line approved/draft regex semantics exactly
  (status.*approved / status.*draft, case-insensitive, evaluated per-line not
  whole-file) — this is a parity fix, not a redesign
- Add new tests to the EXISTING tests/check-p3.5-validate-trace.js file —
  do not create a second test file for the same script
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
