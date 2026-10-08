# Definition of Ready Checklist

## Definition of Ready: Drag-and-drop stage reorder with keyboard alternative

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md
**Contract proposal:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep1-s4-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## Contract review

✅ **Contract review passed** — the proposed implementation (new `stages-order` transactional endpoint, native-HTML5 drag wiring reused from `kanban-view.js`, keyboard move buttons reused from `s3.2`'s own precedent, optimistic-UI rollback with the exact quoted toast text) aligns with all 4 ACs and the test plan's own AC-coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ⚠️→✅ | AC1's interaction half and AC2's interaction half are covered by a real, written Playwright spec that cannot execute this session (no `DATABASE_URL`) — logged honestly in `decisions.md` (D6) and the test plan's own gap table, not an unflagged gap and not a RISK-ACCEPT (the test exists, it just hasn't run yet in this environment) — same handling as `ep1-s3`'s own D5 |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 — Journey adoption |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep1-s4-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; AC1(interaction)/AC2(interaction) explicitly classified as written-but-unexecuted, not silently dropped |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` (both present in `pipeline-state.schema.json`) — `ep1-s2`'s stage-insert path (the `position` column this story rebalances) is the upstream dependency; `ep1-s2`'s own pipeline-state entry shows `prStatus: "merged"`, `dodStatus: "complete"` — dependency satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story's own Architecture Constraints populated (no new npm deps, single-transaction requirement, WCAG 2.1 AA keyboard alternative); no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC1's drag interaction is genuinely CSS-layout-dependent (explicit trigger match in the test plan's own Step 3a) — E2E tooling (Playwright) IS configured, Option 1 chosen, a real spec was written. Gate does not block since tooling exists; no RISK-ACCEPT needed |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline (no dedicated `nfr-profile.md` exists for this feature — same established handling as `ep1-s1`/`ep1-s2`/`ep1-s3`'s own DoRs; flagged as a DoD Observation below for consistency, not re-litigated here) |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — this story adds a new route against the already-wired `customer_journey_stages` table via the existing shared pool |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema shape change, `position` column already exists |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent, and genuinely not triggered here — this story reuses existing stage-card styling and `ep1-s3`'s own inline-indicator pattern for the error message; no new colors or layout patterns are introduced |

**All hard blocks PASS** (H3 passes via the written-but-unexecuted route, not an unflagged gap).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None outstanding from `review/ep1-s4-review-1.md` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names AC1(interaction)/AC2(interaction) explicitly (written-but-unexecuted, not UNCERTAIN) | — |
| W6 | New drag/network-failure behaviour with no automated run this session | ⚠️ | The drag-reorder and rollback-on-failure spec cannot be verified by this session before merge — relies on careful implementation against the stated pattern and the operator (or a future `DATABASE_URL`-backed CI run) executing it post-merge | RISK-ACCEPT — logged in `decisions.md` D6; operator notified explicitly in this DoR and in the eventual DoD |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- CSRF-guard call convention mandatory from first implementation — applies to the new `PATCH /journeys/:id/stages-order` handler.
- FORBIDDEN-vs-NOT_FOUND policy (404, not 403) — applies to the journey-ownership check and the stageIds-set validation.
- Transactional write convention (`pool.connect()` → `BEGIN`/`COMMIT`/`ROLLBACK` → `release()`) — this story's own new reference instance, alongside `tenant-admin-bootstrap.js`.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Drag-and-drop stage reorder with keyboard alternative -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md

Goal:
Make every unit test in the test plan pass (11 tests). The E2E spec is
written but cannot run in this environment -- implement the drag and
keyboard-reorder behaviour carefully against the stated pattern
regardless. Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies (native HTML5
  drag-and-drop only, per the story's own NFR).
- Modify ONLY: src/web-ui/routes/journeys.js (add
  handlePatchJourneyStagesOrder; extend handleGetJourneyCanvas's stage
  card markup with draggable="true" and up/down move buttons, and its
  client script with drag wiring, a shared submitOrder() function, and
  optimistic-UI rollback), server.js (ONE new dispatch entry for
  PATCH /journeys/:id/stages-order -- NOT /journeys/:id/stages/order,
  which would collide with the existing /stages/:stageId regex --
  wrapped in authGuard + requireNonViewer), a NEW test file
  tests/check-ep1-s4-stage-reorder.js (mirroring
  check-ep1-s3-stage-panel.js's mock-pool/CSRF-fixture conventions,
  extended with a transactional mock client modeled on
  check-tab-s1-tenant-admin-bootstrap.js's own fake-pool pattern), and a
  NEW e2e spec tests/e2e/ep1-s4-stage-reorder.spec.js (mirroring
  s3.1-drag-to-advance.spec.js's own manual page.mouse drag sequence and
  withAuth/real-HTTP pattern; this file is NOT added to npm test's own
  chain or to .github/workflows/e2e.yml's Scenario A/B file lists).
- handlePatchJourneyStagesOrder MUST call csrfGuard(req, res) as its
  FIRST statement.
- Journey ownership checked via SELECT before any transaction opens --
  404 (not 403) on failure.
- The submitted stageIds array MUST be validated as an EXACT set match
  against the journey's real stage ids (no missing id, no extra id, no
  id from a different journey/tenant) BEFORE opening any transaction --
  reject with 400 and open zero transactions on mismatch.
- Position updates MUST use a real transaction: pool.connect() ->
  client.query('BEGIN') -> one UPDATE per stage (position = its new
  array index) -> client.query('COMMIT'), with ROLLBACK in the catch
  branch and client.release() in finally. This is the exact pattern in
  src/web-ui/modules/tenant-admin-bootstrap.js's
  bootstrapTenantAdminIfNeeded -- reuse it, do not invent a second
  transactional convention. A mid-transaction failure must leave ALL
  stages at their pre-call position values, not just the ones after the
  failure point -- the atomicity test in the plan checks this directly.
- Drag-and-drop: draggable="true" on stage cards; ondragover
  (preventDefault) and a drop handler on the stages list container,
  using event.dataTransfer -- mirror kanban-view.js's existing
  convention exactly (same dataTransfer.setData/getData shape), do not
  invent a different one.
- Keyboard alternative: up/down move buttons on every stage card when
  there are 2+ stages; disabled on the first card's up button and the
  last card's down button; render NO controls at all when there is only
  1 stage. The move-button click handler and the drop handler MUST call
  the same shared submit function (submitOrder) -- this is asserted
  directly by one of the unit tests, mirroring
  check-s3.2-within-column-reorder.js's own equivalent assertion.
- Optimistic UI: on drop/move, reorder the DOM immediately and snapshot
  the pre-action order first. If the PATCH rejects, restore the
  snapshot and show an inline error element (reuse ep1-s3's own
  sw-stage-panel-saved-style inline-indicator pattern, not a new global
  toast component) with the text EXACTLY "Stage order not saved --
  please try again" -- not a paraphrase.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when the unit tests pass -- do not mark ready for
  review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High (per the parent epic's own "Human Oversight Level: High" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-entity-and-stage-management.md`; corrected here from `ep1-s3`'s own DoR, which recorded "Medium" even though it also required and recorded named sign-off in practice — see DoD Observation below)
**Sign-off required:** Yes (High oversight — named human sign-off required before assigning to the coding agent)
**Signed off by:** _[pending]_
