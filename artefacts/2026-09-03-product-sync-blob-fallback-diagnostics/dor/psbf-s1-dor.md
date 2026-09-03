# Definition of Ready Checklist

## Definition of Ready: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**Story reference:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
**Test plan reference:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/test-plans/psbf-s1-test-plan.md
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
| H5 | Benefit linkage field references a named metric | ✅ | Sync success rate for large repos — same metric `pst-s1`/`pgft-s1` targeted, now addressing the empirically-confirmed root cause; live-reproduced evidence cited |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | Named residual uncertainty (whether the fix fully resolves production) is explicitly not a coverage gap — the detection+fallback mechanism itself is fully covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency on `pgft-s1` (merged, PR #820) — already complete, no incomplete-upstream risk |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (retry-loop extraction, D37 adapter pattern reuse, PostHog reuse); no review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No rendered UI at all — server-side adapter/module only |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed ("Yes please, include any and all logging or diagnostics we need"). Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ⚠️ **See below** | This story DOES introduce a new injectable adapter (`realFetchBlobBySha`/`setPipelineStateBlobFetchAdapter`/`getPipelineStateBlobFetchAdapter`) — the D37 four-part rule applies and is satisfied: (1) stub default throws (matches the existing `realFetchPipelineState` pattern exactly), (2) this DoR's own AC2/AC3 cover the production wiring, (3) the implementation plan names wiring `server.js` as a distinct task from the adapter-function task, (4) AC2's own test asserts the Blobs mock returns *differentiated, correct* content (not just proof a setter was called) — matching the D37 rule 4 bar directly. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A/handled), with H-GOV and H-ADAPTER notes recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case for the third fix in an active, live production incident | **Acknowledged — proceed.** Operator (Hamish King) is driving this fix directly in-session, having personally diagnosed the truncation symptom on production twice now. Bounded, well-documented GitHub API fallback pattern; the residual uncertainty (does the Blobs API fallback fully resolve production) is explicitly named in the NFR profile's own Gaps table as a post-merge observation item. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table has one named 🟡-equivalent residual-uncertainty note, framed as a product-risk note, not a test gap | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog — artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
Test plan: artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/test-plans/psbf-s1-test-plan.md
DoR contract: artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/dor/psbf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Root cause (confirmed
live in production, twice): GitHub's Contents API only reliably returns
complete `content` for files under ~1MB; this repo's own connected
pipeline-state.json is 1.34MB, so the base64 content field arrives
truncated, and the SEPARATE JSON.parse(decoded) in syncProductRollup
(not the one pgft-s1 already fixed) throws with no retry and no
diagnostics. Fix: detect the mismatch via GitHub's own `size` field,
fall back to the Git Blobs API (using the always-present `sha` field,
no such size ceiling), and record diagnostics to logs + PostHog
(posthog-server.js's existing capture/captureException functions).

Constraints:
- Extract the existing retry-with-backoff loop from realFetchPipelineState
  (pgft-s1) into a shared _fetchTextWithRetry(url, headers) helper --
  do not duplicate the retry logic for the new Blobs adapter function.
- New adapter function realFetchBlobBySha follows the EXACT same D37
  pattern as realFetchPipelineState: throw-on-unwired stub default,
  set/get pair, wired in server.js.
- Diagnostics (captureException) fire whenever truncation is DETECTED,
  regardless of whether the Blobs fallback then succeeds -- not only on
  total failure.
- Reuse posthog-server.js's existing capture/captureException functions
  unchanged -- no new PostHog integration code, only new call sites.
- Preserve syncProductRollup's external contract and behaviour exactly
  for the non-truncated (common) case -- AC4's regression test must
  show zero new API calls or log lines in that path.
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

**Oversight level:** Medium — this is the third fix in an active production incident chain, changing a shared data-fetch path already responsible for two prior live incidents this session, warranting tech-lead-equivalent awareness even though the fix pattern itself (documented GitHub API fallback) is well understood. No formal named sign-off required beyond the operator's own direct review in this session.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-03
