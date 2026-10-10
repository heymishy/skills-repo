# Definition of Ready Checklist

## Definition of Ready: Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
**Verification script:** artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep5-s2-verification.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (one new consolidated adversarial test file exercising all 6 real mutating/read routes' own already-implemented 404-not-403 cross-tenant guards, no production code changes anticipated) aligns with all 7 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Tech lead / squad lead" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs (corrected from the original 6 — see D19) |
| H3 | Every AC has ≥1 test | ✅ | All 7 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 4 items (corrected, see D19) |
| H5 | Benefit linkage references a named metric | ✅ | M1 (Journey adoption) |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep5-s2-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` — dependencies `ep5-s1`, `ep1-s1`, `ep2-s1` all show `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites ADR-025 directly, corrected to cite D13's own 404-not-403 convention; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Pure backend adversarial testing, no UI surface — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — all 6 handlers already use the existing `pool` parameter convention |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — no UI surface |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep5-s2-review-1.md` — 0 MEDIUM findings outstanding | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed this session | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |
| W6 | Substantial AC-vs-reality grounding correction, acknowledged | ✅ | D19 — nearly the entire original AC set referenced a fictional `/api/journeys/:id` route surface; retargeted to this feature's real 6 routes with 403→404 corrected. Operator pre-authorized this resolution ("approved by Hamish King, Platform Owner, if needed") rather than requiring a fresh confirmation round-trip | Hamish King |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable.
- 404-not-403 cross-tenant policy (D13) — this story's own entire purpose is proving this convention holds across all 6 real mutating/read routes.
- ADR-025 (tenant scoping on every read/write) — directly tested by every AC in this story.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md

Goal:
Make every test in the test plan pass (7 tests: all integration-style,
calling the 6 real handlers directly with cross-tenant mock data, plus
one aggregate "zero leaks" summary assertion). Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Create ONLY: tests/check-ep5-s2-tenant-isolation-adversarial.js.
  This story is expected to require ZERO production code changes --
  all 6 handlers already implement the ownership-check-before-mutation
  / 404-not-403 pattern correctly (confirmed by code read during
  grounding). If any test reveals a REAL isolation gap (a handler
  actually leaking cross-tenant data), STOP, do not silently fix it as
  if it were expected scope -- report it immediately as a Critical
  finding, since a real production security gap found by this story
  would itself need its own urgent decision, not a quiet one-line fix
  buried in a test-writing task.
- CRITICAL -- do NOT reuse or import mock-pool helpers from other test
  files (check-ep1-s2-journey-stage-create.js, check-ep1-s3-stage-panel.js,
  etc.) -- build a new, self-contained mock pool in this story's own
  test file, matching this repo's own established self-contained-test-
  file convention. Each of the 6 handlers has a distinct SQL query
  shape -- read each handler directly in src/web-ui/routes/journeys.js
  before writing its own mock pool branch (do not assume all 6 share
  one query pattern).
- CRITICAL -- every test must assert BOTH the 404 response code AND
  zero mutation calls (zero INSERT/UPDATE/DELETE/pool.connect() as
  appropriate per handler) -- a 404 alone doesn't prove no side effect
  occurred; both together do.
- For AC1 (GET /journeys/:id) specifically: this is the one case with
  no prior coverage anywhere in this codebase. Read handleGetJourneyCanvas's
  own real query (`SELECT id, name, description FROM customer_journeys
  WHERE id = $1 AND tenant_id = $2`) directly -- the tenant scoping is
  IN the WHERE clause itself, not a separate ownership check like the
  other 5 handlers. Your mock pool for this one test must return zero
  rows when the tenant_id param doesn't match, exactly mirroring real
  Postgres behaviour for this query shape.
- Add a final aggregate test (AC7) that tracks all 6 individual
  pass/fail results and asserts the suite's own total is 6/6 (plus
  itself = 7/7 tests overall), with an explicit "0 cross-tenant leaks
  found" console log line.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. ADR-025 applies directly to every AC in this story.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High (per the parent epic's own "Human Oversight Level: High" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/database-migration-and-tenant-isolation-hardening.md`)
**Sign-off required:** Yes — named human sign-off required before assigning to the coding agent.
**Signed off by:** Hamish King — Platform Owner — 2026-10-10. Pre-authorized in chat ("move onto new story please, approved by Hamish King, platform owner if needed") in lieu of a separate confirmation round-trip, given the grounding corrections (D19) mirror the already-confirmed D8/D13 resolution pattern at a larger scale, not a novel judgment call.
