# Definition of Ready Checklist

## Definition of Ready: Show the Products sidebar during skill chat sessions

**Story reference:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Test plan reference:** artefacts/2026-08-06-nav-products-wiring-expansion/test-plans/npwe-s1-test-plan.md
**Review artefact:** artefacts/2026-08-06-nav-products-wiring-expansion/review/npwe-s1-review-2.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-08-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator working through a skill session..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 5 items |
| H5 | Benefit linkage field references a named metric | ✅ | Navigation continuity metric, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level reuse of `pan-s1`, not a schema field dependency |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuse note + D37 pool-wiring resolution (review finding 1-M1, fixed); Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | All 4 ACs are server-rendered HTML string assertions — no visual/layout dependence |
| H-NFR | NFR profile exists | ⚠️ N/A | Story has explicit NFRs field (4 categories) — no separate feature-level nfr-profile.md for this short-track feature |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No feature-level NFR profile for short-track; story-level NFRs cover Performance/Security/Accessibility/Audit directly |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story NFR section is populated — proceeds without a separate nfr-profile.md per pcr-s1 short-track precedent, see decisions.md GAP entry |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-08-06)** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via operator's direct in-session instruction to proceed. |
| H-ADAPTER | D37 adapter wiring check | ✅ | This story DOES introduce a new adapter (`setDbPool`/`getDbPool` on `skills.js`). AC coverage: wiring is named in Architecture Constraints, stub throws by default (mirrors `mtrr-s1`'s `export-data-source.js` precedent exactly, which itself throws: "Adapter not wired: database pool not wired"), and the implementation plan must name server.js wiring as a task separate from the 13 render-function changes. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 15/15 (11 direct passes + 4 explicit N/A), with the H-GOV and H-NFR-profile notes recorded transparently, matching established short-track precedent.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 2: 0 MEDIUM (1-M1 from Run 1 already resolved directly, not deferred) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case across 13 call sites | Acknowledged — proceed, RISK-ACCEPT logged in decisions.md (2026-08-06) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Standards injection

Domain tags: `[web-ui]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`. Appended to the coding agent instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Show the Products sidebar during skill chat sessions — artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
Test plan: artefacts/2026-08-06-nav-products-wiring-expansion/test-plans/npwe-s1-test-plan.md
DoR contract: artefacts/2026-08-06-nav-products-wiring-expansion/dor/npwe-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- D37 (mandatory): add setDbPool(pool)/getDbPool() to skills.js, mirroring
  mtrr-s1's export-data-source.js precedent exactly -- default stub throws
  ("Adapter not wired: database pool not wired. Call setDbPool() with a real
  Pool before use."), never returns null/empty. Wire it in server.js as a
  SEPARATE task from the 13 render-function changes, matching the existing
  `if (process.env.DATABASE_URL) { ... }` pattern used for every other
  Postgres-backed adapter in that file.
- Reuse getProductsNavSummary(pool, tenantId) and the products/activeProductId/
  noProductJourneyCount renderShell params EXACTLY as the 3 already-wired call
  sites use them -- do not invent a second data-fetch pattern.
- AC4 is a regression guard: capture HTML snapshots of the ~50 excluded call
  sites BEFORE making any change, then diff after -- this is the single most
  important test in this story; a passing AC1-3 with a failing AC4 is not a
  complete implementation.
- Do NOT touch journey.js's sub-pages, artefact.js, features.js, admin pages,
  or settings.js -- explicitly out of scope, deferred to a follow-on story.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.

## Applicable standards (domain: web-ui)

[Full content of .github/standards/web-ui/web-ui-patterns.md -- inject here
per standards-injection.js's algorithm]

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — real regression risk touching a widely-used file (`skills.js`) across 13 call sites, even though the underlying pattern is well-proven; warrants tech-lead-equivalent awareness before assigning, not formal named sign-off.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King (Platform maintainer / Product owner) — 2026-08-06
