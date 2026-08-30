# Definition of Ready Checklist

## Definition of Ready: Add the missing CSRF field to the in-chat gate-confirm button

**Story reference:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
**Test plan reference:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/test-plans/jgcc-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation (pre-compute token at the one call site, pass as parameter, embed in the form) aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct correctness fix, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Chosen approach, declined alternative, and dead-scaffolding note all stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-journey-gate-confirm-missing-csrf/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md — same recurring short-track gap as `pcr-s1`/`p35tf-s1`/`cptr-s1`** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed. This is now the 4th occurrence — per the standing revisit trigger, this should now genuinely prompt a `/definition-of-ready` SKILL.md revision adding an explicit short-track branch to H-GOV, not a 5th ad-hoc note. |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Consistent with standing session precedent; Scenario 3 (real prod smoke test) will be run post-merge. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add the missing CSRF field to the in-chat gate-confirm button — artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
Test plan: artefacts/2026-08-30-journey-gate-confirm-missing-csrf/test-plans/jgcc-s1-test-plan.md
DoR contract: artefacts/2026-08-30-journey-gate-confirm-missing-csrf/dor/jgcc-s1-dor-contract.md

Goal:
In src/web-ui/routes/skills.js, add a hidden _csrf field to the in-chat
gate-confirm form (the ougl.4 branch inside _renderChatPage). Compute the
token at _renderChatPage's one call site (inside handleGetChatHtml, which
is already async and already has req in scope) and pass it as a new
trailing parameter -- do not make _renderChatPage itself async.

Constraints:
- Do not touch the definition-of-ready branch's plain <a href> link.
- Do not resurrect _renderChatPage_forTest (confirmed dead, unexported,
  unused -- leave it as-is).
- Match journey.js's own already-correct sibling form's pattern exactly:
  _csrf.csrfField(token) as the form's first child.
- Run the 5 existing chat-page-adjacent test files and confirm all pass
  unchanged before considering this done.
- Run the full suite (node scripts/run-all-tests.js) and confirm no other
  regressions.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this fixes a live, user-visible, unconditional production bug blocking a core workflow action (advancing a journey stage) for every operator, warranting awareness even though the fix itself is small and well-scoped.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed the root-cause finding directly in-session (live staging reproduction) and confirmed proceeding, 2026-08-30
