# Definition of Done: Wrap kanban board HTML in the shared page shell so design-system tokens resolve

**PR:** #682 (commit `641d57ac`) | **Merged:** 2026-08-08 (confirmed via `git log`: `641d57ac kbsf-s1: Wrap kanban board HTML in the shared page shell so design tokens resolve (#682)`)
**Story:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 (product-scope response shell-wrapped, tokens resolve) | Yes | Unit test `sendKanbanHtml_wrapsResponseInSharedShell_forProductScope` in `tests/check-kbsf-s1-kanban-shell-wrapping.js` (confirmed passing, see Test Plan Coverage below); E2E visual test `tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js` recorded 1/1 pass at pre-merge verification with a real `.kb-card` `border-left-color` computed-style assertion and reviewed screenshot | Unit + E2E visual | None |
| AC2 (org-scope response shell-wrapped identically) | Yes | Unit test `sendKanbanHtml_wrapsResponseInSharedShell_forOrgScope` in `tests/check-kbsf-s1-kanban-shell-wrapping.js` | Unit | None |
| AC3 (tenant-scope `?view=board` response shell-wrapped identically) | Yes | Unit test `sendKanbanHtml_wrapsResponseInSharedShell_forTenantScope` in `tests/check-kbsf-s1-kanban-shell-wrapping.js` | Unit | None |
| AC4 (existing kanban E2E/unit suites pass unchanged) | Yes | Pre-merge verification (`verification-scripts/kbsf-s1-verification.md`) records the full existing kanban unit suite (13 files: `check-s1.1-*`, `check-s1.2-*`, `check-s2.1-*`, `check-s2.2-*`, `check-s3.1-*` through `check-s3.4-*`, `check-psh-s6-*`, `check-psh-s7-*`, `check-kfd1-*`, `check-kanban-consolidation`, `check-kanban-view`) re-run with zero regressions, and the E2E regression set (`psh-s7-org-kanban.spec.js`, `s3.1-drag-to-advance.spec.js`, `s3.2-within-column-reorder.spec.js`) passing 7/8, with the 8th (`psh-s6-product-kanban.spec.js`) isolated as a pre-existing failure (confirmed via `git stash` to fail identically on unmodified master, unrelated to this fix) | Full regression re-run (pre-merge) | None -- pre-existing failure explicitly isolated as not-a-regression in the verification artefact |

## Scope Deviations

None. The story's own "Out of Scope" section explicitly excludes sidebar/breadcrumb nav-parity, any visual/interaction redesign, and a dedicated Kanban nav entry -- all three are accepted-as-declared, not gaps.

## Test Plan Coverage

The fresh test result supplied for this backlog pass (`check-kbsf-s1-kanban-shell-wrapping.js: null passed, null failed`) was anomalous, so per the task guardrails it was independently re-run rather than taken at face value: `node tests/check-kbsf-s1-kanban-shell-wrapping.js` produced **3 passed, 0 failed** (`sendKanbanHtml_wrapsResponseInSharedShell_forProductScope`, `_forOrgScope`, `_forTenantScope` -- all PASS), matching the pre-merge verification record exactly. The `null`/`null` figures appear to be a harness reporting artefact for this run, not evidence of a code regression.

The E2E visual test (`tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js`) and the full pre-existing kanban regression suite were not re-run in this session (no fresh numbers were supplied for them). Evidence for those is the pre-merge verification artefact (`verification-scripts/kbsf-s1-verification.md`, dated 2026-08-08): E2E visual test 1/1 pass with screenshot review; full unit regression suite across 13 files, zero regressions; E2E regression suite 7/8 pass with the 8th isolated as pre-existing and unrelated.

## NFR Status

| NFR | Story's stated expectation | Status |
|-----|------------------------------|--------|
| Performance | Negligible -- same `renderShell()` cost every other HTML route already pays | Met (no new cost introduced; not independently re-measured, consistent with unchanged rendering path) |
| Security | None identified -- reuses the existing, already-audited `renderShell()` wrapper | Met |
| Accessibility | Improves incidentally -- shell provides standard `<title>`, nav landmarks, theme toggle | Met (structural improvement is inherent to using `renderShell()`, confirmed present in the reviewed screenshot) |
| Audit | Not applicable | N/A |

## Metric Signal

No benefit-metric artefact exists for this story -- it is explicitly short-track ("Benefit-metric reference: None — short-track skips benefit-metric"). The benefit was stated directly and qualitatively: `s2.1`'s shared-token CSS, shipped and marked done, had never actually rendered in production because the kanban routes bypassed `renderShell()`. This fix's benefit signal is the E2E visual test's computed-style assertion plus the reviewed screenshot confirming real (non-default) colours and borders now render -- there is no quantitative metric tracked for this fix.

## Outcome

**COMPLETE**
**Follow-up actions:** None. (The sidebar/breadcrumb nav-parity and dedicated Kanban nav entry items remain explicitly out of scope per the story, not deferred defects.)

## DoD Observations

All four ACs have direct, current test evidence; the one test-count anomaly supplied for this backlog pass was independently re-verified and resolved to a clean pass, so no gap is being carried forward. No incidents or reports of unstyled kanban boards found in git history since the 2026-08-08 merge.
