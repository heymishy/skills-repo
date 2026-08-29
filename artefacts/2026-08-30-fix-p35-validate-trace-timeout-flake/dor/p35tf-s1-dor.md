# Definition of Ready Checklist

## Definition of Ready: Increase check-p3.5-validate-trace.js's pwsh spawn timeout

**Story reference:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
**Test plan reference:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/test-plans/p35tf-s1-increase-pwsh-spawn-timeout-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation (single named timeout constant, both call sites updated) aligns with all 3 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Operational-efficiency metric, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings of any severity |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC3's gap explicitly acknowledged in the test plan's own Coverage gaps section |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | "None identified — checked" |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs (AC3 is timing-dependent, a distinct gap type already declared and covered by W4/manual verification, not a layout gap) |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No data-handling surface in this story |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-08-30)** | No discovery artefact exists — short-track skips /discovery by design. Same gap and resolution as `pcr-s1` (2026-07-11); satisfied via the operator's direct in-session instruction to proceed. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/decisions.md` (2026-08-30) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's one gap (AC3) is explicitly declared, not "UNCERTAIN" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Increase check-p3.5-validate-trace.js's pwsh spawn timeout — artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
Test plan: artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/test-plans/p35tf-s1-increase-pwsh-spawn-timeout-test-plan.md
DoR contract: artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/dor/p35tf-s1-dor-contract.md

Goal:
Introduce one named constant (e.g. PWSH_SPAWN_TIMEOUT_MS = 90000) in
tests/check-p3.5-validate-trace.js and use it at both spawnSync('pwsh', ...)
call sites, replacing the two hardcoded `timeout: 30000` literals. Do not
add scope, behaviour, or structure beyond this single change.

Constraints:
- Do not touch scripts/validate-trace.ps1.
- Do not touch scripts/run-all-tests.js's own outer per-file timeout.
- Confirm the new value stays well within run-all-tests.js's 120000ms
  outer per-file timeout (90000 < 120000 — already satisfied by the
  DoR contract's proposed value; do not increase beyond this without
  re-checking against the outer timeout).
- Run node tests/check-p3.5-validate-trace.js standalone and confirm 5/5
  passing before considering AC2 done.
- Run node scripts/run-all-tests.js twice in immediate succession and
  confirm check-p3.5-validate-trace.js passes cleanly both times before
  considering AC3 done — this is a manual/operator-run smoke check per
  the test plan's own declared gap, not a unit test to write.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story changes shared test infrastructure used by every future story's `/branch-setup` baseline check, warranting awareness even though it is bounded and low-risk.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed the root-cause finding directly in-session and selected this sequencing via AskUserQuestion, 2026-08-30
