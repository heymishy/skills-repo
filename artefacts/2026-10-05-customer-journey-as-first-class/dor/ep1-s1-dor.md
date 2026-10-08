# Definition of Ready Checklist

## Definition of Ready: Create journey entity: POST route, Postgres insert, and journey canvas shell

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope section populated | ✅ | 5 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep1-s1-review-2.md` — PASS, 0 HIGH findings (Run 2, 2026-10-08; Run 1's 2 HIGH findings resolved) |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `ep5-s1`, `ep5-s3` (the `customer_journeys` table) — both merged, verified live in both staging and production. No other unmet dependency. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story's own Architecture Constraints populated (ADR-025/ADR-027/ADR-016); no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — canvas styling/drag-and-drop is `ep1-s4`'s scope |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | **Applies.** This story introduces the first real consumer of the `customer_journeys` table, which has no boot-time wiring yet (confirmed: `scripts/migrate-schema-journeys.js` is not called from `server.js`, and is not present in the deployed Docker image at all). Per D37: (1) the table-creation SQL is additive/idempotent (`CREATE TABLE IF NOT EXISTS`, not a throwing stub, matching the established `credits`/`tenant_plan` precedent exactly — D37's "stub must throw" rule applies to adapter *functions*, not to idempotent schema DDL, so this is the correct, consistent exception); (2) this DoR's own AC list below includes the boot-wiring as an explicit AC; (3) the implementation plan must name boot-wiring as a separate task from the route-handler task; (4) the wiring test (test plan's own "(boot)" test) asserts the real `CREATE TABLE IF NOT EXISTS customer_journeys` statement is present in `server.js`, not merely that *some* migration call exists. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this story's own canvas shell is intentionally minimal (name + empty state only); the design system reference applies starting `ep1-s3`/`ep1-s4` |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | `review/ep1-s1-review-2.md`'s own carried-over MEDIUM findings (1-M1: AC4 mixes redirect + empty-state render into one AC; 1-M2: benefit linkage is thin) are acknowledged here, not blocking — AC4's own test already separates the two concerns in practice (redirect tested in AC1, empty-state render tested separately in AC4's own test) | RISK-ACCEPT — acknowledged, not reworked, matching this session's established short-track precedent for MEDIUM findings |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- Route dispatch, auth-guard, and tenant-scoping conventions all directly apply — this is a new route handler following the exact established pattern (`authGuard`, `requireNonViewer`, `req.session.tenantId`, dual `res.status/res.writeHead` response modes).
- Full file (417 lines) read in full before implementing, per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Create journey entity: POST route, Postgres insert, and journey canvas shell -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies (product/constraints.md #11)
- Create ONLY: src/web-ui/routes/journeys.js (new file, plural -- do NOT
  touch the existing routes/journey.js, singular, which is a completely
  unrelated platform file). Export two handlers: one for POST /journeys,
  one for GET /journeys/:id.
- Modify server.js ONLY to: (1) add the two dispatch entries (POST
  /journeys, GET /journeys/:id via a regex path match), following the
  exact /products/new and /products/:id dispatch pattern immediately
  above/below them for consistency; (2) add the customer_journeys
  CREATE TABLE IF NOT EXISTS statement to the existing boot-time inline
  migration block (alongside credits/stripe_events/tenant_plan), using
  the exact same SQL already proven in scripts/migrate-schema-journeys.js
  (do not invent new SQL -- copy it). This is a SEPARATE task from the
  route-handler task (D37 wiring requirement) -- implement and test it
  independently.
- POST /journeys MUST be wrapped in authGuard + requireNonViewer, matching
  /products/new POST's own exact pattern. GET /journeys/:id MUST be
  wrapped in authGuard only (read access, matching /products/:id GET's
  own pattern).
- Use req.session.tenantId for all tenant scoping -- never req.session.token
  (canonical field name rule). The POST handler's own insert MUST use
  req.session.tenantId, never any tenantId value from req.body (AC3's own
  explicit requirement).
- Support BOTH response modes in both handlers: `if (res.status) { ... }
  else { res.writeHead(...); res.end(...); }` -- matching
  handlePostProductConfirm's own exact dual-mode convention, so this
  repo's established mock-based test style continues to work.
- Render the canvas shell via renderShellWithNav(pool, tenantId, opts),
  matching handleGetProductView's own usage -- do not build a new shell
  wrapper.
- Add new tests to a NEW file tests/check-ep1-s1-journey-create.js,
  mirroring check-psh-s3-product-creation.js's own makeMockPool/mock
  req/res conventions exactly.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Yes (standard-track story, first real route handler for this feature)
**Signed off by:** Hamish King — Platform Owner — 2026-10-08 (per operator's own explicit "let's... start on ep1s1" instruction)
