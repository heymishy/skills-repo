# Definition of Ready Checklist

## Definition of Ready: Temporary CSRF guard diagnostic logging

**Story reference:** artefacts/2026-08-30-csrf-guard-diagnostic-logging/stories/csdl-s1-add-temporary-csrf-guard-diagnostic-logging.md
**Test plan reference:** artefacts/2026-08-30-csrf-guard-diagnostic-logging/test-plans/csdl-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation (two additive `console.info` lines, one shared truncation helper) aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct diagnostic enabler, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — review skipped by design; no findings to resolve |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: upstream `jgcc-s1` (merged) only |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Chosen approach, explicit non-goals (no fix attempted), and required follow-up all stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-csrf-guard-diagnostic-logging/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md — same recurring short-track gap as `pcr-s1`/`p35tf-s1`/`cptr-s1`/`jgcc-s1`** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction (selected "Add temporary diagnostic logging" from an explicit `AskUserQuestion`). This is now the 5th occurrence — flagged again as overdue for a real `/definition-of-ready` SKILL.md revision. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (14 direct passes + 3 explicit N/A + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track — review skipped | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed; this story's own verification is "read real logs after deploy", which is inherently a manual step | **Acknowledged — proceed.** The whole point of this story is a manual live-log read; no automated verification script substitutes for it. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Temporary CSRF guard diagnostic logging — artefacts/2026-08-30-csrf-guard-diagnostic-logging/stories/csdl-s1-add-temporary-csrf-guard-diagnostic-logging.md
Test plan: artefacts/2026-08-30-csrf-guard-diagnostic-logging/test-plans/csdl-s1-test-plan.md
DoR contract: artefacts/2026-08-30-csrf-guard-diagnostic-logging/dor/csdl-s1-dor-contract.md

Goal:
In src/web-ui/middleware/csrf.js, add temporary diagnostic logging to
generateCsrfToken and csrfGuard so a real staging reproduction can be
correlated across the two calls via server logs.

Constraints:
- Never log a full token or full session id -- only an 8-hex-char prefix
  (or the literal string '(empty)' for a falsy value).
- Do not change csrfGuard's pass/fail behaviour or response bytes.
- Use process.env.FLY_MACHINE_ID (fallback 'unknown') for machineId.
- Write tests/check-csdl-s1-csrf-diagnostic-logging.js per the test plan.
- Re-run tests/check-cpr-s1-csrf-persist-race.js and the full suite
  (node scripts/run-all-tests.js); confirm no regressions.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches a security-relevant middleware file in production; the change itself is observability-only but is being deployed specifically to diagnose a still-open, user-visible production bug.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — selected this investigation path directly in-session via explicit choice among offered options, 2026-08-30
