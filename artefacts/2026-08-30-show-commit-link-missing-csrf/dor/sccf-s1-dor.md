# Definition of Ready Checklist

## Definition of Ready: CSRF field on the live-injected gate-confirm form

**Story reference:** artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md
**Test plan reference:** artefacts/2026-08-30-show-commit-link-missing-csrf/test-plans/sccf-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — the DoR contract's own open assumption (exact shape of `csrfToken`'s plumbing into `_renderChatPage`) was resolved by direct inspection before implementation: the parameter already exists (added by `jgcc-s1`) at position 6, in scope where the `script` block is built. Implementation matched the contract exactly once that was confirmed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC3 is manual/live, explicitly documented as a coverage gap with rationale |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct correctness fix, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — review skipped by design |
| H8 | Test plan has no uncovered ACs | ✅ | AC3's gap is explicitly documented, not silent |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: `jgcc-s1`, `csdl-s1` (both merged) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Chosen approach, non-goals, and required follow-up all stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-show-commit-link-missing-csrf/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md — same recurring short-track gap, 6th occurrence** | Satisfied via the operator's direct in-session instruction to proceed, after reviewing the confirmed root-cause finding. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A-with-gap-noted + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track — review skipped | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | AC3's manual live-validation step is unreviewed by anyone but the implementer | **Acknowledged — proceed.** Same live-reproduction method already validated twice this session (found both `jgcc-s1`'s gap and this one). |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | AC3's gap has a stated, non-uncertain rationale | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: CSRF field on the live-injected gate-confirm form — artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md
Test plan: artefacts/2026-08-30-show-commit-link-missing-csrf/test-plans/sccf-s1-test-plan.md
DoR contract: artefacts/2026-08-30-show-commit-link-missing-csrf/dor/sccf-s1-dor-contract.md

Goal:
In src/web-ui/routes/skills.js, add a CSRF_TOKEN JS variable declaration
alongside GATE_CONFIRM_URL/NEXT_STAGE_LABEL, and embed a hidden _csrf input
referencing it inside showCommitLink()'s injected gate-confirm form.

Constraints:
- Do not touch the already-correct server-rendered ougl.4 branch (jgcc-s1's fix).
- Do not remove csdl-s1's diagnostic logging (separate follow-up).
- Write tests/check-sccf-s1-show-commit-link-csrf-field.js per the test plan.
- Re-run tests/check-jgcc-s1-chat-gate-confirm-csrf-field.js, the 5 other
  chat-page-adjacent test files, and the full suite; confirm no regressions
  beyond any pre-existing, unrelated failures (verify against baseline).
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- After merge and deploy, live-validate on wuce-staging using the same
  reproduction method that found this bug (fresh journey, single click,
  zero idle wait) before considering this story truly done.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — third fix attempt at the same user-reported production bug; directly affects a core workflow action for the common case of a freshly-created journey.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed the confirmed root-cause finding (real staging logs, single-machine confirmation) directly in-session and selected "Yes, fix it now", 2026-08-30
