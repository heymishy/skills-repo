# Definition of Ready Checklist

## Definition of Ready: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**Story reference:** artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
**Test plan reference:** artefacts/2026-09-03-product-github-fetch-truncation-fix/test-plans/pgft-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (3 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Sync success rate for large repos — same metric `pst-s1` targeted, short-track (no formal benefit-metric artefact); live-reproduced evidence cited |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | Named residual uncertainty (whether the fix fully resolves production) is explicitly not a coverage gap — the retry mechanism itself is fully covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency on `pst-s1` (merged, PR #819) — already complete, no incomplete-upstream risk |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (mock-fidelity fix scope, retry-class boundaries); no review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No rendered UI at all — server-side adapter only |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-03-product-github-fetch-truncation-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed ("Yes please", approving the split-off of this new short-track story). Recorded transparently, not silently bypassed — matches the identical, already-logged H-GOV gap pattern for `pcr-s1` and `pst-s1`. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced — this story modifies the existing `realFetchPipelineState` implementation function, not the adapter's own set/get wiring mechanism (already built and tested by `pr-s2`) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case for a follow-up fix to a still-partially-unresolved production incident | **Acknowledged — proceed.** Operator (Hamish King) is driving this fix directly in-session, having just diagnosed the live production log evidence himself. Bounded, low-risk retry-loop pattern; the residual uncertainty (does retry fully resolve production) is explicitly named in the NFR profile's own Gaps table as a post-merge observation item, not silently hidden. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" (the one named residual-uncertainty note is explicitly framed as a product-risk note, not a test gap) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion — artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
Test plan: artefacts/2026-09-03-product-github-fetch-truncation-fix/test-plans/pgft-s1-test-plan.md
DoR contract: artefacts/2026-09-03-product-github-fetch-truncation-fix/dor/pgft-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This story adds a
bounded retry (3 total attempts, 500ms/1000ms backoff) around the GitHub
Contents API fetch in realFetchPipelineState, and richer diagnostic
detail (bytes received vs Content-Length) when a JSON-parse failure
still occurs after retries are exhausted. Non-ok HTTP responses
(404/403/rate-limit) are never retried -- immediate failure, unchanged.

Constraints:
- Only two failure classes trigger a retry: a thrown network-level error
  from fetch() itself, and a JSON.parse() failure on an otherwise-ok
  response. Do not retry non-ok HTTP status responses.
- Preserve realFetchPipelineState's external contract exactly:
  Promise<{content: string, encoding: string}> -- callers (syncProductRollup)
  are unchanged.
- Update ONLY the T3 and T6 mocks in tests/check-pr-s2-pipeline-state-fetch-adapter.js
  to add a .text() method alongside their existing .json() method -- do
  not touch T1, T2, T4, T5 (T4 in particular must keep passing unmodified,
  since the non-ok branch never reaches the new .text() call).
- No new npm dependencies.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story changes a production data-fetch path already responsible for one live incident this session, warranting tech-lead-equivalent awareness even though the fix pattern itself (bounded retry) is bounded and well understood. No formal named sign-off required beyond the operator's own direct review in this session.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-03
