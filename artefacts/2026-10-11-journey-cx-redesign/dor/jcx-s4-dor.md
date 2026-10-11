# Definition of Ready Checklist

## Definition of Ready: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s4-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Contract Proposal

**What will be built:**
Three new `TEXT` columns on `customer_journeys` (`persona_name`, `persona_role`, `persona_goal`), added via `server.js`'s own inline migration block. A new scan function that, given a journey's `product_id`, finds associated `feature_slug`s via the legacy `journeys` table and reads each matching `artefacts/[feature_slug]/discovery.md`'s "Who It Affects" section as a raw-text suggestion. A persona card UI on the Customer experience tab showing the saved persona (or the editor with suggestions, if unset).

**What will NOT be built:**
Multi-persona support. Structured NLP extraction of name/role/goal from prose (the operator does this manually from the raw suggestion text). Ongoing re-sync if the source discovery artefact changes after the persona is saved.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Temp fixture discovery.md files, scan function unit test + product-scoped integration test | unit, integration |
| AC2 | Empty-scan-result fallback assertion | unit |
| AC3 | Mock-pool `UPDATE` call-shape assertion for the 3 new columns | integration |
| AC4 | Mock-pool read-back assertion after a prior save | integration |
| AC5 | Multi-fixture scan, assert distinct entries not merged | unit |

**Assumptions:**
None beyond what's already stated in the story.

**Estimated touch points:**
Files: `src/web-ui/routes/journeys.js` (persona card rendering + save handler), `src/web-ui/server.js` (inline migration), `src/web-ui/adapters/persona-scanner.js` (new, plain function — reads local `artefacts/` files, no DB query, no injectable adapter needed per the same reasoning as `jcx-s1`'s own D37 N/A determination)
Services: None
APIs: 1 new route (persona save) — read path folds into the existing `GET /journeys/:id` canvas route.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs (revised AC1 wording from `/review` Run 2) and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s4-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s4-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: "None — `product_id` already exists on `customer_journeys`" |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites the ADR-026 reuse-check confirmation (new entity justified), product-scoping rationale, ADR-025 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is layout/position-dependent — data presence and save-state checks only |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | Scan function is a plain local-file reader, same reasoning as `jcx-s1`'s own D37 N/A determination |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — new nullable-default columns, non-breaking |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No sections directly load-bearing beyond `jcx-s1`'s own already-cited shell-rendering note, which this story shares the same page as but does not introduce a new render-site risk for.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s4-test-plan.md

Goal:
Make every test in the test plan pass (7 tests: 3 unit, 3 integration,
1 NFR). Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Constraints:
- The persona suggestion is RAW TEXT from discovery.md's "Who It
  Affects" section -- do NOT attempt structured name/role/goal
  extraction from prose. The operator manually splits it into the 3
  fields. This was an explicit /review finding (1-M1) that revised
  AC1's own wording -- re-read it before implementing to avoid
  over-building.
- The scan is scoped by product_id (via the legacy journeys table's
  own feature_slug-to-product_id association) -- NOT a repo-wide
  scan of every discovery.md. Confirm this scoping is actually
  correct by reading src/web-ui/routes/products.js's own
  getProductsNavSummary function first (same query pattern already
  exists there).
- No injectable adapter -- the scan reads local artefacts/ files
  directly, same reasoning as jcx-s1.
- Single-persona scope -- do not build a multi-persona UI or schema.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing.
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
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-11.
