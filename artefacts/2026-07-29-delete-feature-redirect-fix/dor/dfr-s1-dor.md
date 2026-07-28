# Definition of Ready Checklist

## Definition of Ready: Fix "Delete feature" to redirect back to the owning product, not the generic journeys list

**Story reference:** artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md
**Test plan reference:** artefacts/2026-07-29-delete-feature-redirect-fix/test-plans/dfr-s1-fix-delete-feature-redirect-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operator-reported friction, logged in capture-log.md, no formal benefit-metric artefact per short-track convention |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design, same precedent as stis-s1/pcr-s1 |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuses existing productId field, no new pattern |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs, no UI surface change beyond redirect target |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story (none identified beyond existing conventions) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential (tenant-scoped product/feature data, same as existing) |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new adapter — reuses the existing productId field/column, no new setX()/injectable pattern introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No /review run (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Solo-operator posture, same basis as prior short-track stories this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix "Delete feature" to redirect back to the owning product, not the generic journeys list — artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md
Test plan: artefacts/2026-07-29-delete-feature-redirect-fix/test-plans/dfr-s1-fix-delete-feature-redirect-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Two coordinated changes, both required (fixing only one leaves the other
  half broken):
  1. src/web-ui/routes/features.js — the delete-feature success handler's
     client-side script (search for `window.location.href="/journey"`,
     around line 256) must redirect to `/products/` + the feature's
     productId instead, falling back to `/journey` only when productId is
     genuinely unset (AC3) -- never redirect to `/products/undefined`.
  2. src/web-ui/adapters/journey-store-pg.js — `listJourneys()`'s SELECT
     statement does not select `product_id`, and its row-mapping object
     literal does not map it back to `productId`. Add both -- this is the
     real root-cause fix (AC2); without it, AC1's redirect fix silently
     regresses to the old /journey fallback for any journey rehydrated
     from Postgres after a server restart.
- Read the current code at both call sites before writing anything -- do
  not guess at exact current line numbers, they may have shifted slightly
  since this story was written.
- Do not touch the DELETE endpoint itself, the confirmation dialog, or
  CSRF/audit handling -- only the post-delete redirect target and the
  productId rehydration gap.
- AC2's integration test needs a real Postgres connection (DATABASE_URL) --
  if unavailable locally, retrieve it safely via the established
  Fly-secrets convention (flyctl ssh into the relevant staging app,
  printenv DATABASE_URL, pipe to a job-scoped temp file, use inline, delete
  immediately after) -- never from a stale local .env file, and never
  print/log/commit the value.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — modifies a shared production route file (`routes/features.js`) and a shared data-access module (`journey-store-pg.js`), and closes a genuine data-integrity gap (productId silently lost on rehydration) beyond the originally-reported UX symptom — warranting awareness even though it's small and low-risk.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King — Platform owner — requested this follow-up directly, 2026-07-29
