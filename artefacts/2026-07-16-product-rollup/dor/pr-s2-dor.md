# Definition of Ready: Sync a product's connected repo and show aggregate DoD status (pr-s2)

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s2.md
**Test plan reference:** artefacts/2026-07-16-product-rollup/test-plans/pr-s2-test-plan.md
**Contract:** artefacts/2026-07-16-product-rollup/dor/pr-s2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-17

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs (including AC5, added at this DoR pass — see H-ADAPTER below). No CSS-layout-dependent behaviour, no mismatch between the contract's stated test approach and the test plan's actual coverage.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | "As the Founder/Operator (Hamish King)..." |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 11 tests across 5 ACs, no gaps |
| H4 | Out-of-scope section is populated | ✅ | Other dimensions, freshness UI, automatic sync all correctly deferred |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (fixed same-session) |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists upstream pr-s1. `schemaDepends: []` — pr-s2 consumes pr-s1's Postgres row directly (repo_owner/repo_name), not any pipeline-state.json field of pr-s1's own story entry. No fields declared, none to fail against. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-020, ADR-025, D37, mock-shape rule, MC-SEC-02, ADR-018 all cited; Category E score 3/5 in review, no HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By`: "Hamish King — Founder/Operator — 2026-07-17" — non-blank, not engineer-only |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ (fixed at this DoR pass) | This story introduces a new Contents API adapter. The original 4 ACs did not scope its production wiring — **FAIL found and fixed during this DoR run**: added AC5 to the story (production wiring in `server.js` + a behavioural test proving two different repos return two different, correctly-fetched results — not just that a setter was called), and added 2 corresponding tests to the test plan. Re-checked: now ✅. |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set |

**All hard blocks pass** (H-ADAPTER required a fix during this DoR run — see note above; re-verified after the fix).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | N/A — populated |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — finding 2-M1 was fixed, not just acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md`, RISK-ACCEPT entry covering all 7 stories, 2026-07-17 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | N/A — no gaps |

---

## Oversight level

**High** (per `pr-e1-foundation.md`) — solo-operator posture. Named sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass (H-ADAPTER fixed during this run), all warnings resolved or explicitly acknowledged.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Sync a product's connected repo and show aggregate DoD status — artefacts/2026-07-16-product-rollup/stories/pr-s2.md
Test plan: artefacts/2026-07-16-product-rollup/test-plans/pr-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Follow sign-off.js's handleArtefactRead pattern exactly for the Contents
  API call — same auth header shape, same base64 decode approach.
- The Contents API fetch MUST be wired behind an injectable adapter with a
  throw-on-unwired stub default (D37) — mirror repo-adapter.js's existing
  pattern. Wire the real implementation in server.js as a task separate
  from the handler itself (D37 rule 3). The wiring test (AC5) must assert
  an observable, differentiating outcome (two different repos -> two
  different correct results), not just that a setter was called (D37 rule 4).
- Mock test data for the Contents API MUST match GitHub's real response
  shape (base64-encoded content field) — do not invent a convenient mock
  shape for this new file type.
- The cache table must be scoped by product_id, following the same
  tenant_id-scoping convention as the products/standards tables (ADR-025).
- OAuth token must never be persisted to the cache table or logged (MC-SEC-02).
- Do not build any rollup dimension other than DoD status, the freshness/
  refresh UI, or automatic sync — all out of scope for this story.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular ADR-020 and ADR-025.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-17
