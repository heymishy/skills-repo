# Definition of Ready Checklist

## Definition of Ready: Journey list page: index of all journeys for the tenant

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md
**Contract proposal:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep4-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## Contract review

✅ **Contract review passed** — the proposed implementation (new read-only `GET /customer-journeys` handler, reused `POST /journeys` with a redirect-aware client submit, product picker reusing an existing query) aligns with all 5 ACs and the test plan's own AC-coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 5 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 — Journey adoption |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep4-s1-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, including the 2 grounding-time corrections (route, AC5) |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` (both present in `pipeline-state.schema.json`) — `ep1-s1` is the upstream dependency (the `customer_journeys` table + `POST /journeys` handler this story reuses). `ep1-s1`'s own pipeline-state entry shows `prStatus: "merged"`, `dodStatus: "complete"` — dependency satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story's own Architecture Constraints cite ADR-025 and ADR-027 directly; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any CSS-layout-dependent trigger pattern — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline — same established handling as every prior story in this feature |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — a new read-only route against already-wired tables, plus reuse of an existing POST handler |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change, both joined tables and their columns already exist |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; the modal reuses `products.js`'s existing `ep4s1-pods-modal` pattern and its existing tokens — no new colors or layout patterns introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None outstanding from `review/ep4-s1-review-1.md` | — |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed and approved by the operator this session | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

No RISK-ACCEPTs required for this story — the first story in this feature without one.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- FORBIDDEN-vs-NOT_FOUND / tenant-scoping convention — applies to the list query's own `WHERE tenant_id = $1` scoping (AC5).
- Modal/dialog pattern (`ep4s1-pods-modal`'s own precedent) — applies to the "New journey" modal.
- CSRF-guard call convention — applies indirectly, since the modal submits to the already-CSRF-guarded `POST /journeys` handler; no new guard needed since no new mutating route is introduced.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Journey list page: index of all journeys for the tenant -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md

Goal:
Make every unit test in the test plan pass (8 tests). No E2E spec is
required for this story. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (add
  handleGetCustomerJourneysList and export it), server.js (ONE new
  dispatch entry for GET /customer-journeys -- NOT /journeys, which is
  already owned by the unrelated handleJourneys/bee.2 route -- wrapped
  in authGuard only, no requireNonViewer since this is read-only), and a
  NEW test file tests/check-ep4-s1-journey-list.js (mirroring
  check-ep1-s4-stage-reorder.js's own mock-pool conventions).
- Do NOT modify handlePostJourneys -- it is reused exactly as it
  already exists.
- The list query joins customer_journeys to products via product_id,
  scoped by WHERE tenant_id = $1, ordered created_at DESC. Stage counts
  come from a second query against customer_journey_stages, grouped by
  journey_id and merged into the journey rows by id -- do not attempt a
  single mega-join; two simpler queries matching this codebase's own
  existing style.
- A journey with product_id = null renders "No product", literally --
  not blank, not "null".
- A description over roughly 140 characters is truncated with a visible
  ellipsis -- pick any reasonable truncation length consistent with
  this; the test only checks that truncation happens, not an exact
  character count.
- The "New journey" modal reuses products.js's own ep4s1-pods-modal
  dialog/focus-restore pattern (role="dialog" aria-modal="true",
  initial-focus-on-open, Escape-to-close, captured _triggerBtn). Fields:
  name (required), description (optional), a product <select> populated
  from an embedded JSON product list (query:
  SELECT product_id, name FROM products WHERE tenant_id = $1, the exact
  query already used elsewhere in products.js).
- The modal's submit handler MUST check response.redirected (or
  response.url being different from the request URL) BEFORE calling
  .json() on the response -- POST /journeys's real HTTP response is a
  302 redirect that fetch() auto-follows, so the success-path response
  body is HTML, not JSON. Only call .json() on the non-redirected
  (error, e.g. 400 missing-name) branch. On a redirected success,
  navigate via window.location.href = response.url.
- Empty state text must be EXACTLY "No journeys yet. Create your first
  journey." -- not a paraphrase.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
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
