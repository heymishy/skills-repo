## Definition of Ready: Add a fetch timeout to the shared GitHub Contents API adapter

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s14-fetch-timeout.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s14-fetch-timeout-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-14

---

## Contract Review

✅ **Contract review passed** — no mismatches against the 4 ACs. This story's Architecture Constraints explicitly name `fetchGithubContentsResponse`, `fetchArtefact`, and `realFetchRepoPath` as the real, current functions this story extends — verified directly against merged `master` before writing this story.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | tech lead viewing a product's guardrails/standards page |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | M1 (indirect — reliability of the view the metric measures) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Upstream `wugs-s1` (`dodStatus: complete`, already merged) |
| H9 | Architecture Constraints populated | ✅ | Fix in the shared helper, reuse existing error class, overridable timeout for tests |
| H-E2E | Layout-dependent gap check | ✅ | None — purely a backend adapter change, no rendering behaviour changed |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ | This story directly closes an existing, already-recorded `nfr-profile.md` Gaps-table entry — confirmed the gap's own wording ("a reasonable fetch timeout (e.g. 10s)") matches this story's AC1's 10s default exactly |
| H-GOV | ✅ | Same as prior stories in this feature |
| H-ADAPTER | ✅ | No new adapter — extends the existing `fetchGithubContentsResponse` shared helper; the D37 injectable `fetchRepoPath`/`setFetchRepoPath` wiring is explicitly untouched (Out of Scope) |
| H-INF / H-MIG | ✅ | Not triggered |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1-W3, W5 | — | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not independently reviewed | Pending operator sign-off below |

---

## Oversight level

**Medium** (per Epic 1) — DoR artefact shared with operator, no named sign-off strictly required per epic policy, but given this is a follow-up story created mid-retrospective (not part of the original 12-story plan), requesting explicit confirmation below for consistency with this session's own practice.

---

## Standards injection

Domain tags: `[web-ui]`
Matched: `standards/saas-gui/POLICY.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a fetch timeout to the shared GitHub Contents API adapter — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s14-fetch-timeout.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s14-fetch-timeout-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Fix lives in fetchGithubContentsResponse (artefact-fetcher.js) — the
  single shared helper both fetchArtefact and realFetchRepoPath call
  through. Do not duplicate timeout logic per caller.
- Use AbortController, not a manual Promise.race timer pattern.
- Reuse the existing ArtefactFetchError class for the timeout error, with
  a clear message stating a timeout occurred — do not invent a new error
  class, and do not change any calling code (_fetchGuardrailsSectionPiece
  already surfaces .message correctly).
- Timeout duration must be a parameter with a 10000ms default, overridable
  by tests (so tests don't wait 10 real seconds).
- Must not leave a dangling timer either way (normal response or timeout
  fires) — AC3 requires explicit resource-cleanup verification.
- Do not touch fetchRepoPath's own D37 setFetchRepoPath/getFetchRepoPath
  wiring — out of scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Read standards/saas-gui/POLICY.md (web-ui domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only, per epic policy) — requesting confirmation below for consistency with this session's practice on ad-hoc follow-up stories.
**Signed off by:** Hamish King — Platform owner — 2026-08-14

**PROCEED: Yes**
