## Definition of Ready: Style the admin credits page with the shared design system shell

**Story reference:** artefacts/2026-07-24-admin-credits-page-styling/stories/acps-s1.md
**Test plan reference:** artefacts/2026-07-24-admin-credits-page-styling/test-plans/acps-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## Contract Review

Contract aligns with all 4 ACs — pure presentation-layer wrap, no logic touched. **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Hamish King, Founder/Operator |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | Short-track exemption — no benefit-metric artefact exists; benefit stated directly per story's Benefit Linkage field, consistent with `kfd1`'s own short-track precedent |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Short-track — review skipped per CLAUDE.md's short-track path (`/test-plan → /definition-of-ready → coding agent`); no review report exists by design |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies is "None" — not applicable |
| H9 | Architecture Constraints populated | ✅ | References `renderShell` reuse pattern and `kfd1` precedent |
| H-E2E | CSS-layout-dependent gate | ✅ | No CSS-layout-dependent ACs — server-rendered HTML structure checks only, not applicable |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section states "None new" explicitly with reasoning — short-track exemption, no feature-level `nfr-profile.md` required (mirrors `kfd1`'s own precedent for a bounded, single-file restyle) |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable — no compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal (tenant IDs/balances, no PII/payment data — same classification as the kanban feature) |
| H-GOV | Discovery `Approved By` non-blank | ✅ | **Short-track exemption: no discovery artefact exists.** Origin: operator request 2026-07-24 (raised alongside kanban board styling in the same conversation, explicitly deferred to its own short-track story). Same exemption pattern applied as `kfd1` (2026-06-17) and `b3` short-track precedent. |
| H-ADAPTER | Adapter wiring check | ✅ | Not applicable — no new `setX()` adapter introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W2 | NFRs / scope stability | ✅ | — | — |
| W3 | MEDIUM findings | ✅ | None — review skipped (short-track) | — |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed by operator | Pending |
| W5 | No UNCERTAIN gaps | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Style the admin credits page with the shared design system shell — artefacts/2026-07-24-admin-credits-page-styling/stories/acps-s1.md
Test plan: artefacts/2026-07-24-admin-credits-page-styling/test-plans/acps-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse renderShell() (src/web-ui/utils/html-shell.js) exactly as kfd1's detail
  pages already do -- do not hand-roll a new page shell.
- Do NOT touch adminCreditsPost, getAllTenantBalances, getValidTenantIds,
  adjustBalanceWithAudit, or CSRF logic (csrfField/csrfGuard) -- this story
  restyles adminCreditsGet's markup only.
- Run the existing tests/check-sec-perf-s3-admin-credits-csrf.js and
  tests/check-arl-s5-credit-audit-log.js suites unmodified and confirm they
  still pass -- if either needs a change, stop and flag it as an ambiguity
  rather than silently modifying tests that verify logic you're not supposed
  to touch.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Low.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No formal sign-off required for Low oversight — proceed directly (single-file restyle, no logic change, low blast radius).
**Signed off by:** N/A (Low oversight)
