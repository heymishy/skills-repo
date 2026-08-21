## Story: Improve the cramped Plan/Status radio-button layout on /admin/credits

**Epic reference:** None — short-track, UX finding from live production use
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported problem below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **admin using `/admin/credits` to manage tenant plan state**,
I want **the Plan/Status control to be legible and easy to scan**,
So that **I can quickly see and change a tenant's plan without parsing two cramped radio-button groups packed into one table cell**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track UX fix) — closes a real usability complaint from the operator, live-confirmed on production (2026-08-21): `tpac-s1`'s Plan/Status control (`admin-credits.js`, the `<td class="tpac-plan-state">` cell) packs two 3-option radio-button `<fieldset>`s (Plan: trial/paid; Status: active/past_due/canceled) plus a submit button into a single table cell, alongside the existing Tenant ID/Balance/Top-up columns — described directly by the operator as "terrible" UX. This gets worse as more tenant rows are added (currently 4 real tenants, each row repeating the full 6-radio-button layout).
**How:** A clearer control (e.g. two compact `<select>` dropdowns instead of 2×3 radio buttons, or a more deliberate layout) directly fixes the reported friction without changing the underlying mechanism (`setPlanState`, `POST /api/admin/plan/set`) at all.

## Architecture Constraints

- **Reuse the existing mechanism as-is** — `setPlanState(tenantId, plan, status)`, the `POST /api/admin/plan/set` route, and its validation (`VALID_PLANS`, `VALID_STATUSES`) are all correct and already tested (`tpac-s1`, DoD-complete); this story only changes the HTML/CSS presentation of the control, not the underlying write path.
- **Preserve AC1's distinctness requirement** — `tpac-s1`'s own AC1 requires Plan and Status to remain "two visibly distinct fields — not implying they're the same thing." Any redesign must keep this distinction clear (e.g. don't merge them into one combined dropdown of "trial-active", "paid-active", etc., which would obscure that they're independent axes).
- **Mirror the existing `admin-credits.js`/`team-management.js` established page patterns** where reasonable (e.g. if switching to `<select>` elements, match the existing form-control styling already used elsewhere on this page for the Top-up input).

## Dependencies

- **Upstream:** `tpac-s1` (merged, DoD-complete) — this story restyles the control that story built, without touching its underlying logic.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the `/admin/credits` page renders with N tenant rows, When an admin views the Plan/Status column, Then each row's control is visually compact and scannable — no longer 6 radio buttons plus a submit button crammed into one cell per row.

**AC2:** Given the redesigned control, When an admin changes a tenant's plan and/or status and submits, Then it still calls `POST /api/admin/plan/set` with the same request shape `tpac-s1`'s existing tests already assert — no change to the wire contract.

**AC3:** Given the redesigned control, When rendered, Then Plan and Status remain two visibly distinct, separately labelled fields (per `tpac-s1`'s own AC1 requirement) — not merged into a single ambiguous control.

**AC4:** Given the redesigned control, When keyboard-navigated, Then it remains fully operable via keyboard alone and meets the existing WCAG 2.1 AA floor `tpac-s1`'s own NFRs already required.

## Out of Scope

- **Any change to `setPlanState`, `checkJourneyCap`, or the `POST /api/admin/plan/set` route's validation/contract** — reused exactly as-is.
- **The Balance/Top-up/Adjust controls on the same page** — untouched; this story is scoped to the Plan/Status cell only.
- **The separate, narrower "Settings → Credits" tab's own duplicate table** (a different, pre-existing, non-admin-scoped view) — not in scope; if that view also needs Plan/Status shown, that's a separate decision.

## NFRs

- **Performance:** None identified — presentation-only change.
- **Security:** None identified — no change to the admin-gated write path.
- **Accessibility:** WCAG 2.1 AA hard floor, matching `tpac-s1`'s own existing requirement — must not regress.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — presentation-only change to one existing, already-tested control; no new logic.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
