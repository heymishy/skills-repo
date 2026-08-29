# Definition of Ready Checklist

## Definition of Ready: Increase the session-persist timeout to close the suspend race

**Story reference:** artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
**Test plan reference:** artefacts/2026-08-30-csrf-persist-timeout-race/test-plans/cptr-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation (raise `_PERSIST_TIMEOUT_MS` to 8000, update one pre-existing test bound, add one new test) aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC2/AC3 satisfied by existing `cpr-s1` tests, explicitly named |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct correctness fix, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: `cpr-s1` (merged) — no schema fields declared, check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Chosen approach, declined alternative, and a security guardrail all stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-csrf-persist-timeout-race/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry pattern — same as `pcr-s1`/`p35tf-s1`** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed (selected the corrected fix approach via AskUserQuestion). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A + 1 transparent GAP note, now the 3rd occurrence of the same H-GOV short-track gap — per the standing revisit trigger from `p35tf-s1`'s own decisions.md, this now warrants an actual `/definition-of-ready` SKILL.md revision rather than a 4th ad-hoc note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Consistent with the standing precedent for short-track stories this session; Scenario 4 (the real prod smoke test) will be run post-merge regardless. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Increase the session-persist timeout to close the suspend race — artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
Test plan: artefacts/2026-08-30-csrf-persist-timeout-race/test-plans/cptr-s1-test-plan.md
DoR contract: artefacts/2026-08-30-csrf-persist-timeout-race/dor/cptr-s1-dor-contract.md

Goal:
Change session.js's _PERSIST_TIMEOUT_MS constant from 500 to 8000, update its
comment to reflect the corrected purpose (circuit breaker, not a routine
race -- see decisions.md), update the one pre-existing test assertion in
tests/check-cpr-s1-csrf-persist-race.js bound to the old value, and add one
new test proving a write in the 500-8000ms range now resolves via the real
write rather than a timeout. Do not add scope beyond this.

Constraints:
- Do NOT implement a SIGTERM handler or any process-shutdown mechanism --
  that approach was investigated and found to be a no-op under this app's
  actual fly.toml configuration (auto_stop_machines = 'suspend'). See
  decisions.md for the full reasoning; do not resurrect it.
- Do not touch fly.toml.
- Do not touch csrfGuard's validation logic.
- Run node tests/check-cpr-s1-csrf-persist-race.js and confirm all tests
  pass (including the updated assertion) before considering this done.
- Run the full suite (node scripts/run-all-tests.js) and confirm no other
  regressions.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story fixes a live, user-visible production bug in core session/auth infrastructure, and its own design was corrected once mid-flight after a platform-semantics finding — warrants awareness even though the final fix is a single constant.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed the root-cause finding, the initial (invalidated) approach, and the corrected approach directly in-session, 2026-08-30
