# Definition of Ready Checklist

## Definition of Ready: Free node positioning persisted across reloads

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Test plan reference:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (new position-update route, D13-pattern ownership check, client drag handler with no reload on success, failure toast) aligns with all 6 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs (AC6 added during /review fix-up) |
| H3 | Every AC has ≥1 test | ✅ | All 6 covered, 0 gaps |
| H4 | Out-of-scope section populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/ic-s2-review-2.md` — PASS, 0 HIGH/MEDIUM open |
| H8 | Test plan has no uncovered ACs | ✅ | 1 gap (AC1, E2E, not a HIGH-risk gap — real test written) |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dorStatus` — dependency `ic-s1` shows `dorStatus: "signed-off"` — satisfied (sibling story in the same not-yet-implemented walking-skeleton epic; code-level sequencing is enforced at `/subagent-execution` time, not at DoR) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites D13, D6, ADR-026, and `web-ui-patterns.md`'s reload-vs-patch rule |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC1 is `CSS-layout-dependent`; E2E tooling (Playwright) IS configured and a real spec is named — gate passes without needing a RISK-ACCEPT |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-10-infinite-canvas/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Platform Owner — 2026-10-10 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — a 2-column `ADD COLUMN IF NOT EXISTS` addition is not a breaking/tracked migration by this repo's own convention (matches `ep5-s1`'s own precedent) |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | RISK-ACCEPTed, see `decisions.md` | Hamish King |
| W5 | No UNCERTAIN items in gap table | ✅ | Gap table has 1 entry (AC1), not UNCERTAIN — it's a confirmed E2E test with a known pre-existing local-run limitation | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **"Client-side DOM patch vs. full page reload after a POST action"** — directly applicable and load-bearing for this story. Default to patching in place (the node just stays where dropped), never `window.location.reload()` on save success — reload would discard the in-progress drag gesture's own visual state on every single drag, a materially worse UX than `ep3-s2`'s own reload-after-save pattern, which was correct for a different, static page interaction (a form-style Save button), not a live drag. Confirmed in Architecture Constraints below.
- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable, no new adapter.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Free node positioning persisted across reloads -- artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md

Goal:
Make every test in the test plan pass (6 tests: 3 unit, 2 integration,
1 E2E). Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm runtime dependencies beyond drawflow
  (already added in ic-s1).
- New position-update route: ownership-check-before-mutation, 404 not
  403 for cross-tenant (D13), single pool.query() UPDATE, no
  transaction (D6). Mirror the exact pattern of the other mutating
  routes in journeys.js -- read handlePostFeatureMapping or
  handleDeleteFeatureMapping first as your template.
- CRITICAL -- on save SUCCESS, do NOT call window.location.reload().
  The node stays where the operator dropped it; only a background
  PATCH persists it. This is a DIFFERENT page-interaction shape from
  ep3-s2's own D18 reload-after-save pattern (that was for a static
  Save-mapping form button, not a live drag gesture) -- do not copy
  that pattern here. See web-ui-patterns.md's own "Client-side DOM
  patch vs. full page reload" rule.
- On save FAILURE, show a visible toast matching ep1-s4's own
  "Stage order not saved -- please try again" style convention,
  adapted for position-save wording.
- Migration: add position_x, position_y as nullable DOUBLE PRECISION
  columns to customer_journey_stages in scripts/migrate-schema-journeys.js
  (the existing file, not a new one), using ADD COLUMN IF NOT EXISTS --
  idempotent, no backfill.
- Write the E2E spec (tests/e2e/ic-s2-canvas-drag-position.spec.js)
  reusing the seedJourneyWithStages helper already established by
  ep1-s4-stage-reorder.spec.js -- do not reinvent seeding. It will
  SKIP locally without DATABASE_URL set -- this is expected and
  matches ep1-s3/ep1-s4's own precedent, not a bug to fix.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. ADR-025 and ADR-026 apply.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-10.
