# Definition of Ready Checklist

## Definition of Ready: Make product sync fire-and-forget with client-side polling, instead of one long blocking request

**Story reference:** artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
**Test plan reference:** artefacts/2026-09-03-product-sync-timeout-fix/test-plans/pst-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (4 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Sync success rate for large repos — operational reliability, short-track (no formal benefit-metric artefact); live-reproduced failure cited as evidence |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | AC4's real-browser timing is a named DOM-behaviour gap with manual coverage, not an uncovered AC |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (reuse of `_syncsInProgress`/`isSyncInProgress`, unchanged `triggerProductSync`); no review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — AC4's gap is DOM-behaviour (polling/reload timing), not CSS layout |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-03-product-sync-timeout-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed as a separate fast-tracked short-track bug fix (operator selected this path explicitly when offered the choice); recorded transparently here, not silently bypassed. This matches the identical H-GOV gap already logged for `pcr-s1` (`artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`, 2026-07-11) — a genuine skill-design gap (H-GOV assumes every story has a discovery artefact) that short-track stories will keep hitting until SKILL.md is revised to handle this case explicitly. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (12 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case for a fix to a live, currently-broken production route | **Acknowledged — proceed.** Operator (Hamish King) is driving this fix directly in-session, reviewing story/contract/test-plan/DoR as they are produced; this is a bounded, well-understood fix pattern (respond-early, poll-for-completion) applied to a single route. No separate decisions.md entry — this story introduces no architectural choice under CLAUDE.md's decisions.md mandate (reuses existing patterns/infrastructure throughout). |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table has one named 🟡 gap (AC4 DOM-behaviour), not an UNCERTAIN item | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Make product sync fire-and-forget with client-side polling, instead of one long blocking request — artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
Test plan: artefacts/2026-09-03-product-sync-timeout-fix/test-plans/pst-s1-test-plan.md
DoR contract: artefacts/2026-09-03-product-sync-timeout-fix/dor/pst-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This story fixes a live
production bug: POST /products/:id/sync currently blocks the HTTP response
on the full GitHub-fetch-plus-rollup-computation duration, which exceeds the
platform's own reverse-proxy timeout for products with a large connected
pipeline-state.json (confirmed live on skills-framework.fly.dev, 2026-09-03 —
"Unexpected end of JSON input" after 90+ seconds). Fix: return an immediate
acknowledgment before that work starts, run it in the background, and let the
client poll a new lightweight status endpoint until it completes.

Constraints:
- Reuse `_syncsInProgress`/`isSyncInProgress(productId)` (src/web-ui/modules/product-rollup.js)
  unchanged as the source of truth for the new status endpoint — do not build a
  new tracking mechanism.
- Do not change `triggerProductSync`'s own internal logic (GitHub fetch, five
  rollup computations, Postgres UPSERT) — only when the HTTP response is sent
  relative to that work changes.
- The background work's promise chain must have its own `.catch()` that logs
  via console.error (or this repo's established server-side logging call) —
  never let it become an unhandled promise rejection.
- New status endpoint must perform the same tenant/product validation as the
  existing sync trigger endpoint before returning state (NFR-Security, see
  nfr-profile.md).
- Do not touch handleGetProductView's existing isSyncing-driven render logic —
  it already works correctly today; AC5's test guards against regressing it.
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

**Oversight level:** Medium — this story changes a live, shared production route (`POST /products/:id/sync`) and introduces a new endpoint, warranting tech-lead-equivalent awareness even though the fix pattern itself is bounded and well understood. No formal named sign-off required beyond the operator's own direct review in this session.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-03
