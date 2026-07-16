# Definition of Ready: Triage the pre-existing baseline test failures (tst-s1)

**Story reference:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Test plan reference:** artefacts/2026-07-16-baseline-test-triage/test-plans/tst-s1-triage-pre-existing-baseline-failures-test-plan.md
**Review artefact:** artefacts/2026-07-16-baseline-test-triage/review/tst-s1-review-1.md
**Contract:** artefacts/2026-07-16-baseline-test-triage/dor/tst-s1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section populated | ✅ | |
| H5 | Benefit linkage references a named metric | ✅ | Operational-efficiency/signal-quality, short-track (no formal benefit-metric artefact), evidenced by repeated real RISK-ACCEPT entries across bri-* waves |
| H6 | Complexity rated | ✅ | Rating 3, Unstable |
| H7 | No unresolved HIGH findings from review | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No upstream schema dependency — pcr-s1 (the only upstream) is merged |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-16-baseline-test-triage/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips it by design, same pattern already logged for pcr-s1 |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF / H-MIG | N/A | N/A | |

**All hard blocks pass**, with the H-GOV note recorded transparently (same precedent as `pcr-s1`'s DoR).

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified or "None — confirmed" | ✅ | |
| W2 | Scope stability declared | ✅ | Unstable, by design for a triage story |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Review Run 1 found 0 MEDIUM |
| W4 | Verification script reviewed by domain expert | ⚠️ | Acknowledged — proceed. RISK-ACCEPT logged in decisions.md, same rationale as pcr-s1 (bounded infra/process story, operator reviewed story/ACs/DoR directly) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | |

---

## READY / BLOCKED determination

## ✅ READY

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Triage the pre-existing baseline test failures — artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
Test plan: artefacts/2026-07-16-baseline-test-triage/test-plans/tst-s1-triage-pre-existing-baseline-failures-test-plan.md
DoR contract: artefacts/2026-07-16-baseline-test-triage/dor/tst-s1-dor-contract.md

Goal:
Investigate and categorize all 69 currently-failing test files (per the
story's "Current, freshly-verified state" section) into (a) Fixed, (b)
Deferred/RISK-ACCEPT, or (c) Investigated-and-classified (check-md-3-adr.js
only). Fix everything that is small and bounded. Do not silently skip any
file — every one of the 69 must appear in the triage report.

Process:
1. Run `node scripts/run-all-tests.js` fresh on this worktree first, to
   confirm you see the same ~69 failures the story lists (a small drift is
   fine, e.g. a flaky file; a large drift means re-verify against the
   story's list before proceeding).
2. For each failing file: run it standalone (`node <file>`), read the actual
   failure output, read the file's source and (if relevant) the production
   code it tests. Do not guess the root cause from the filename alone.
3. Give priority investigation to tests/check-md-3-adr.js -- it is the one
   file NOT in the existing tests/known-baseline-failures.json snapshot.
   Determine specifically whether it is a genuinely new regression (in which
   case: find what introduced it via `git log`, and fix it) or a pre-existing
   gap that was simply never snapshotted (in which case: document and defer
   like any other category (b) file).
4. Fix what's small and bounded: stale path references, missing files that
   should exist and are cheap to create/restore, outdated content-marker
   assertions, missing test-mode env vars, etc. Verify each fix by re-running
   that file standalone before moving to the next.
5. For anything requiring a real product/architecture decision (e.g. a
   missing skill file whose correct location or content is ambiguous), do
   NOT invent a fix — log it as a RISK-ACCEPT in
   artefacts/2026-07-16-baseline-test-triage/decisions.md with the real root
   cause and a named revisit trigger, and leave it failing (category b).
   Group entries by common root cause where several files share one, rather
   than writing 40 near-identical entries.
6. Write artefacts/2026-07-16-baseline-test-triage/triage-report.md listing
   every one of the 69 files with its category and one-sentence reason.
7. Write tests/check-tst-s1-baseline-triage.js implementing U1-U8 from the
   test plan.
8. Refresh tests/known-baseline-failures.json per AC4.
9. Run node scripts/run-all-tests.js one final time in full, then
   node scripts/ci-test-regression-check.js against the refreshed baseline,
   and confirm zero unaccounted regressions (AC5, IT1).
10. Update .github/pipeline-state.json for tst-s1 via `node bin/skills
    advance`/`gate-advance` (never edit the JSON directly).

Constraints:
- Do NOT modify scripts/run-all-tests.js's discovery/grandfather-list logic,
  package.json's scripts.test entry, or .gitattributes.
- Do NOT touch any file belonging to a currently-open bri-*, tir-*, or other
  in-flight feature's branch or PR.
- Do NOT attempt to fix all 69 to fully green — a bounded, honestly-triaged
  subset fixed plus an accurate, transparent deferred list is the actual
  goal, not a fully-green suite.
- Conflict marker verification (per CLAUDE.md D40): scan every file you
  touch for <<<<<<< / ======= / >>>>>>> before git add, especially if you
  cherry-pick or rebase during this work.
- Open a draft PR when done. Never merge or self-merge. Never push directly
  to origin/master.
- If you get stuck on a file whose fix genuinely requires a human decision,
  log it as category (b) and move on — don't block the whole story on one
  file.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches the shared CI regression-gate baseline used by every future story.
**Sign-off required:** No formal sign-off beyond this DoR, consistent with `pcr-s1`'s precedent.
**Signed off by:** Hamish King (Founder/Operator), via direct in-session instruction to short-track this story, 2026-07-16.
