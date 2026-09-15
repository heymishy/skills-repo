# Definition of Ready Checklist

## Definition of Ready: Fetch pipeline-state.json content via the Git Blobs API (wsd-s5)

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s5.md
**Test plan reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s5-test-plan.md
**Track:** Short-track (bug found during `wsd-s4`'s own live production re-verification)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: the operator relying on wsd-s2's writer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2 via regression re-run; AC3 via a new behavioural test (T10); AC4 via live verification |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Directly completes wsd-s2/wsd-s3/wsd-s4's unmet benefit |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Internal mechanics change only, no new architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | AC4 is not automatable, live-verification-only | ✅ Acknowledged | Same pattern used three times already this session (wsd-s2, wsd-s3, wsd-s4) for the same live-verification purpose. | Claude Sonnet 5 (orchestrating agent) |
| W2 | This is the THIRD attempted fix for the same underlying gap | ✅ Acknowledged | Each fix closed a genuinely distinct, real bug found only via live production verification (missing context construction → wrong context source → GitHub API file-size ceiling). Each was caught by a new, targeted behavioural test that a small-fixture-only test suite could not have caught. This fix's own new test (T10) explicitly reproduces the real API response shape that caused the failure, closing the specific fixture-fidelity gap that let this one through. | Claude Sonnet 5 (orchestrating agent) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fetch pipeline-state.json content via the Git Blobs API
       -- artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s5.md
Test plan: artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s5-test-plan.md

Goal:
In src/web-ui/adapters/pipeline-state-github-writer.js's fetchState(), GET
the Contents API purely for its sha (always present regardless of file
size), then GET /repos/:owner/:repo/git/blobs/:sha (Git Blobs API, no 1 MB
ceiling) using that sha to fetch content.

Constraints:
- PUT step unchanged -- still uses the sha from the Contents API GET.
- Update tests/check-wsd-s2-github-pipeline-state-writer.js's existing GET
  mocks (T1, T2, T5, T6, T7, T9) to the new two-request shape (Contents
  API meta + Git Blobs API content).
- New test (T10) mocking a Contents API response with NO content field at
  all (mirrors real GitHub >1 MB behaviour) -- writer must still succeed.
- Re-run the full existing regression suite (owle6, acdg-s1, acdg-s2,
  das-s1, dcuf-s1, cdg4, wsd-s4's own test) -- all must pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) -- route
  through the normal worktree -> PR -> merge path, open a draft PR, then
  mark it ready immediately per established practice.
- After merge and production deploy, live-verify AC4 directly.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — found and fixed within the same live-verification session that discovered wsd-s4's own remaining gap, per the operator's own earlier in-conversation direction to fix now.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation, original "Fix now (short-track)" direction)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
