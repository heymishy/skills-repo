# Definition of Ready Checklist

## Definition of Ready: Navigation and entry points: "Journeys" nav link and product page link

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md
**Contract proposal:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep4-s2-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## Contract review

✅ **Contract review passed** — the proposed implementation (one new `NAV_ITEMS` entry, one new trailing parameter appended to `_renderProductView`, one new scoped query) aligns with all 4 ACs and the test plan's own AC-coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 — Journey adoption |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep4-s2-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` (both present in `pipeline-state.schema.json`) — `ep4-s1` is the upstream dependency (the `/customer-journeys` route this story's nav link targets). `ep4-s1`'s own pipeline-state entry shows `prStatus: "merged"`, `dodStatus: "complete"` — dependency satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Corrected at grounding time to cite the directly-applicable `architecture-guardrails.md` anti-pattern "Ad-hoc cross-cutting surface changes without a story" (navigation structure/`html-shell.js` named explicitly) — a real, not fabricated, applicable guardrail; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any trigger pattern — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline — same established handling as every prior story in this feature |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; the new nav icon matches the existing `NAV_ITEMS` array's own established unicode-glyph convention, no new colors introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None outstanding from `review/ep4-s2-review-1.md` | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed and approved by the operator this session | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

No RISK-ACCEPTs required.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- Shared-surface-module story requirement (`architecture-guardrails.md` anti-pattern) — this IS that required story for the `NAV_ITEMS`/`html-shell.js` change.
- Tenant scoping — the new `customer_journeys` lookup is scoped by `product_id`, whose own tenant ownership is already verified upstream in `handleGetProductView` before this story's new query ever runs.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Navigation and entry points: "Journeys" nav link and product page link -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md

Goal:
Make every unit test in the test plan pass (6 tests). No E2E spec is
required for this story. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/utils/html-shell.js (add ONE new NAV_ITEMS
  entry: { id: 'journeys', label: 'Journeys', href: '/customer-journeys',
  icon: '<pick a single unicode glyph matching the existing array's own
  style, e.g. one NOT already used: not >=, <=, or any of the existing
  entries' own characters> }, placed in the main section, not the
  account section), src/web-ui/routes/products.js (handleGetProductView
  gets ONE new query: SELECT id FROM customer_journeys WHERE
  product_id = $1 ORDER BY created_at ASC LIMIT 1 -- result passed as
  the LAST positional argument to _renderProductView; _renderProductView
  itself gets ONE new trailing parameter, firstJourneyId, rendering a
  "View journey" link in the existing header button row alongside
  Kanban/Roadmap/Standards when truthy, nothing when falsy), and a NEW
  test file tests/check-ep4-s2-nav-and-product-link.js.
- CRITICAL: the new firstJourneyId parameter on _renderProductView MUST
  be appended as the LAST (18th) positional parameter. Do NOT insert it
  anywhere else in the signature -- 18 existing test files
  (check-a1-modules-taxonomy-crud.js, check-a4-module-grouped-rendering.js,
  and 16 others, confirmed by grep) call _renderProductView directly
  with positional arguments, none of which pass this new argument.
  Inserting it anywhere but the end will silently misalign every one of
  those calls' existing arguments onto the wrong parameters -- JavaScript
  does not enforce function arity, so this would NOT throw, it would
  just silently corrupt what those 18 other test files actually render
  and assert on. Run the FULL suite (not just this story's own new test
  file) after this change specifically to catch any such silent
  corruption before committing.
- The "View journey" link must be omitted entirely (not rendered
  disabled, not an empty placeholder) when firstJourneyId is null/falsy.
- The nav link's markup must be a real <a href="..."> element (inherited
  automatically from NAV_ITEMS/_renderNavLink's own existing rendering --
  do not add any custom keyboard-handling code, none is needed).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing -- this story IS the required story artefact for the
  navigation-structure/html-shell.js shared-surface-module change named
  in that file's own anti-patterns table. Do not introduce any OTHER
  shared-surface-module change without its own separate story.
- Open a draft PR when the unit tests pass -- do not mark ready for
  review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low (per the parent epic's own "Human Oversight Level: Low" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/navigation-entry-points-and-journey-list.md`)
**Sign-off required:** No — Low oversight proceeds directly to coding agent assignment per `/definition-of-ready`'s own protocol.
