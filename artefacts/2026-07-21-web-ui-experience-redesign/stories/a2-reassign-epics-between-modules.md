## Story: Reassign an epic to a different module

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, refining a product's module organisation over time)**,
I want to **move an epic from one module to another**,
So that **my module organisation stays accurate as I learn more about how a product's epics actually relate, without having to delete and recreate anything**.

## Benefit Linkage

**Metric moved:** Time to identify the least-healthy area of a large product
**How:** A module grouping that can't be corrected as understanding improves becomes stale and untrustworthy — reassignment keeps the grouping (and therefore the at-a-glance health read) accurate.

## Architecture Constraints

- Depends directly on A1's module schema — an epic's module assignment must reference the same per-product-scoped module record, not a duplicated or denormalised copy of the module name.
- None additional identified beyond A1's constraints — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** A1 (Modules taxonomy CRUD) must exist — there must be at least two modules to reassign between.
- **Downstream:** A4 (module-grouped rendering) reads the current assignment state this story writes.

## Acceptance Criteria

**AC1:** Given an epic currently assigned to Module X, When the operator reassigns it to Module Y, Then the epic's module reference updates to Y, and it no longer appears under X on next render.

**AC2:** Given an epic with no module assigned (in the "Unassigned" bucket), When the operator assigns it to a real module, Then it moves out of "Unassigned" and appears under the chosen module.

**AC3:** Given an epic assigned to Module X, When the operator reassigns it to Module X again (the same module it's already in), Then the operation is a no-op — no error, no duplicate assignment record, no change in displayed state.

**AC4:** Given a reassignment request for an epic belonging to product A but naming a module that belongs to product B, When the reassignment is submitted, Then it is rejected — an epic cannot be assigned to a module scoped to a different product.

## Out of Scope

- Bulk reassignment of multiple epics at once — only single-epic reassignment is in scope.
- Reassigning individual stories directly to a module (bypassing their parent epic) — modules group at the epic level only in this MVP.

## NFRs

- **Performance:** Reassignment reflects in the UI within 200ms of the action (matching the mockup's live-update behaviour).
- **Security:** Same tenant/product-scoping enforcement as A1 — a reassignment request is rejected if the epic and target module don't belong to the same product.
- **Accessibility:** The reassignment control (dropdown or equivalent) is keyboard-operable.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
