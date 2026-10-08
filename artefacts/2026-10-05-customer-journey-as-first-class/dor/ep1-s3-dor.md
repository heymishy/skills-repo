# Definition of Ready Checklist

## Definition of Ready: Stage side panel: edit all optional attributes

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ⚠️→✅ | AC1's interaction half, AC4, AC5 covered by a real, written Playwright spec that cannot execute this session (no DATABASE_URL) — logged honestly in `decisions.md` (D5), not an unflagged gap and not a RISK-ACCEPT (the test exists, it just hasn't run yet in this environment) |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M3 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep1-s3-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; AC1(interaction)/AC4/AC5 explicitly classified as written-but-unexecuted, not silently dropped |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `ep1-s2` (the stage insert path + canvas rendering this story extends), `csb-s1` (the `customer_journey_stages` table's own boot-wiring, merged and verified live via Fly boot log). All merged |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story's own Architecture Constraints populated (ADR-025, WCAG 2.1 AA focus trap, design-system reference); no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A (treated with equal rigor regardless) | None of AC1/AC4/AC5 are CSS-layout-dependent in B2's strict sense (no visual alignment/breakpoint/pixel assertion) — they are focus-management/DOM behaviours. Per D5, given a real Playwright spec anyway rather than relying on the gate's narrower literal scope |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter or new table introduced — this story only adds a new route (`PATCH`) against the already-wired `customer_journey_stages` table (boot-wiring fixed in `csb-s1`) via the existing shared `_pshPool` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema shape change; all 8 optional columns already exist on `customer_journey_stages` (confirmed live via `ep5-s3`) |
| H-DESIGN | Design-token compliance gate | ✅ | `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md` read in full (required by this story's own Architecture Constraints). No existing named layout pattern matches a click-to-open side panel exactly; implementation reuses the closest two precedents (`html-shell.js`'s off-canvas drawer for the mobile <768px behaviour, `products.js`'s `ep4s1-pods-modal` dialog for ARIA/focus-restore structure), extended with a genuine Tab-cycling focus trap per AC5 (the existing modal precedent explicitly does not have one). Color tokens, spacing, radius, input styling all drawn directly from `DESIGN.md`'s own token table — no new colors/fonts introduced |

**All hard blocks PASS** (H3 passes via the written-but-unexecuted route, not an unflagged gap).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None outstanding from `review/ep1-s3-review-1.md` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names AC1(interaction)/AC4/AC5 explicitly (written-but-unexecuted, not UNCERTAIN) | — |
| W6 | New custom browser-only behaviour with no automated run this session | ⚠️ | The focus-trap/Escape spec cannot be verified by this session before merge — relies on careful implementation against the WCAG pattern and the operator (or a future DATABASE_URL-backed CI run) executing it post-merge | RISK-ACCEPT — logged in `decisions.md` D5; operator notified explicitly in this DoR and in the eventual DoD |

---

## Standards injection

**Domain tags:** `[web-ui]`, `[accessibility]`, `[security]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- CSRF-guard call convention mandatory from first implementation (per `jcg-s1`/`ep1-s2`'s own precedent) — applies to the new `PATCH` handler.
- FORBIDDEN-vs-NOT_FOUND policy (404, not 403) confirmed via `handlePostProductModule`/`handlePostJourneyStage` — applies to both the journey-ownership and the new stage-ownership check this handler needs.
- Design-token/layout-pattern consultation requirement (design-system reference doc) satisfied — see H-DESIGN above.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stage side panel: edit all optional attributes -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s3-test-plan.md

Goal:
Make every test in the test plan pass (the unit tests; the E2E spec is
written but cannot run in this environment -- implement it carefully
against the stated WCAG pattern regardless). Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (add handlePatchJourneyStage;
  extend handleGetJourneyCanvas to SELECT all stage columns, embed the
  full stage data as JSON for the client panel, render the side-panel
  markup with all 8 fields, and render a moment-of-truth indicator on
  any stage card whose moment_of_truth is true), server.js (ONE new
  dispatch entry for PATCH /journeys/:id/stages/:stageId, wrapped in
  authGuard + requireNonViewer), a NEW test file
  tests/check-ep1-s3-stage-panel.js (mirroring the established
  makeMockPool/makeMockRes/CSRF-fixture conventions), and a NEW e2e spec
  tests/e2e/ep1-s3-stage-panel-focus-management.spec.js (mirroring
  bmau-s1-bulk-assign-rerender.spec.js's own withAuth/real-HTTP pattern;
  this file is NOT added to npm test's own chain or to
  .github/workflows/e2e.yml's Scenario A/B file lists).
- handlePatchJourneyStage MUST call csrfGuard(req, res) as its FIRST
  statement.
- Journey ownership AND stage ownership (the stage must belong to the
  journey named in the URL) BOTH checked via SELECT before any UPDATE --
  404 (not 403) on either failure, never trusting tenant_id from the
  request body.
- field MUST be validated against the fixed allowlist (description,
  customer_actions, touchpoints, channel, emotion, pain_points,
  opportunities, moment_of_truth) before building the UPDATE statement.
  channel/emotion values MUST additionally be validated against their
  own fixed enum sets server-side. Reject anything else with 400.
- No full-page reload on save -- autosave success must be shown via an
  in-place indicator near the edited field (not a page navigation), and
  the moment_of_truth toggle must update that specific stage card's own
  visible indicator via a targeted DOM change (the stage id is already
  available as a data attribute from ep1-s2), not a reload.
- The side panel needs a genuine keyboard focus trap (Tab/Shift+Tab
  cycle within its own focusable elements while open) -- the existing
  ep4s1-pods-modal in products.js explicitly does NOT have one (its own
  comment says so); do not copy that limitation here, this story's AC5
  requires the real thing. Escape closes the panel and returns focus to
  the stage card that opened it (capture document.activeElement before
  opening, matching ep4s1-pods-modal's own _triggerBtn pattern).
- Reuse DESIGN.md's token set (var(--surface), var(--line), var(--ink),
  var(--accent), etc. -- see html-shell.js's own :root definitions) for
  all new styling. Below 768px, the panel should behave like a full-
  width overlay rather than a fixed-width side panel, matching the
  design system's own off-canvas-drawer precedent "in spirit" (DESIGN.md
  section "Responsive behavior" requires explicit mobile behaviour for
  every new pattern -- "not specified" is not acceptable).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when the unit tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Yes (standard-track story, carries the AC1(interaction)/AC4/AC5 written-but-unexecuted RISK-ACCEPT)
**Signed off by:** Hamish King — Platform Owner — 2026-10-08 (per operator's own "continue" instruction, resuming ep1-s3 after the csb-s1 prerequisite fix)
