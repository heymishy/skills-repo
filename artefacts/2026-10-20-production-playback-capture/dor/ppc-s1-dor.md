# Definition of Ready: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s1-test-plan.md
**Review artefact:** artefacts/2026-10-20-production-playback-capture/review/ppc-s1-review-2.md
**Assessed by:** Claude (session)
**Date:** 2026-10-21

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Tenant Product Owner |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No layout-dependent ACs |

Full detail (H8-ext, H-NFR family, H-GOV, H-ADAPTER, H-INF/H-MIG/H-DESIGN skip conditions) in `ppc-s1-dor-contract.md`. All hard blocks PASS.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | |
| W2 | Scope stability is declared | ✅ | — | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM remain) | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet walked through before coding starts | RISK-ACCEPT — Hamish King, 2026-10-22, see `decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | |

---

## Coding Agent Instructions

See the full block, including injected standards, in `ppc-s1-dor-contract.md`.

```
## Coding Agent Instructions

Proceed: Yes
Story: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth — artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s1-test-plan.md

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Share the DoR artefact with the tech lead (no named tech lead configured; operator awareness stands in for this solo-operator repo).
**Signed off by:** Hamish King (Platform Owner), 2026-10-22

**Definition of ready: PROCEED**
