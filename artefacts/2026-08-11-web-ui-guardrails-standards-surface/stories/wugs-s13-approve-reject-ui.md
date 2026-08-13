## Story: Admin sees real Approve/Reject buttons for pending promotion requests

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, security-engineering]
**Track:** Short-track (bounded UI addition to an already-shipped, already-tested backend — reuses this feature's existing discovery/benefit-metric/epic artefacts; starts at story+test-plan per CLAUDE.md's short-track process)

## User Story

As an **admin** viewing a product's guardrails page,
I want **to see real Approve and Reject buttons next to a pending promotion request, and have them actually work**,
So that **I can resolve a promotion request through the product itself, not only via a direct API call** (per `/trace`'s 2026-08-14 HIGH finding — `wugs-s9` shipped fully-tested backend endpoints with no UI trigger anywhere in the 12-story feature, and no later story ever built one).

## Benefit Linkage

**Metric moved:** Product→org promotion-approval workflow usage
**How:** This story is what makes Metric 2 measurable through the actual product for the first time — `wugs-s8`/`wugs-s9`/`wugs-s10` together built a fully working, fully audit-logged backend round-trip, but with no UI trigger, the metric's own "at least 1 real promotion request submitted **and resolved**" target could only ever be exercised by someone making a direct API call, not a real admin using the web UI.

## Architecture Constraints

- **No new backend surface.** `POST /api/admin/promotions/:requestId/approve` and `POST /api/admin/promotions/:requestId/reject` (both `wugs-s9`, already merged, already role-gated server-side via `isEffectivelyAdmin`) are the only endpoints this story calls. This story is a rendering + client-side wiring change only.
- **Extends `_renderPromotionAction`** (`products.js`), the existing function that already renders either a "Request promotion" button or a static "Promotion requested — pending approval" label depending on request state. This story adds a third rendering branch: when a request is pending AND the viewing session is effectively-admin, render real Approve/Reject buttons instead of the static label. Non-admin sessions continue to see the existing static label, unchanged.
- **Role check threaded through the render call chain, not duplicated.** `isEffectivelyAdmin(req.session)` is already computed server-side by the two endpoints this story calls (defense in depth is already in place — a non-admin forging a request still gets 403, per `wugs-s9`'s own AC3, unaffected by this story). This story additionally computes `isEffectivelyAdmin(req.session)` once in `handleGetProductGuardrailsView` and threads a single boolean down through `_renderGuardrailsSection` → `_renderPromotionAction`, matching the existing `csrfToken`-threading pattern already used for the "Request promotion" button — not a second, independent admin check invented for this story.
- **CSRF-protected, matching the existing "Request promotion" button's own pattern exactly** — a hidden `_csrf` field, the same `csrfToken` already generated and passed down for the sibling button.
- **Client-side fetch + in-place DOM update, not a full page reload** — matching the removed `smug-s1` UI's own `ssPromote`/`ssOptOut` pattern (buttons disable on click, row updates or is removed on success, an alert + button re-enable on failure) — a proven, already-used UX shape in this exact file's history, not a new pattern invented for this story.

## Dependencies

- **Upstream:** `wugs-s9` (the two endpoints this story wires to, already merged), `wugs-s8` (the pending-request state this story renders against, already merged).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an effectively-admin session viewing a product's guardrails page with a pending promotion request for a given path, When the page renders, Then real "Approve" and "Reject" buttons are shown for that path (not the static "pending approval" text).

**AC2:** Given a non-admin session viewing the same page with the same pending request, When the page renders, Then the existing static "Promotion requested — pending approval" text is shown, unchanged from current behaviour — no buttons, no admin-only markup leaked to a non-admin's rendered HTML.

**AC3:** Given an admin clicks "Approve", When the request succeeds, Then a fetch call is made to `POST /api/admin/promotions/:requestId/approve` with the session's real CSRF token, the button is disabled during the call, and on success the row's UI updates to reflect the resolved state without a full page reload.

**AC4:** Given an admin clicks "Reject", When the request succeeds, Then the equivalent fetch call is made to `POST /api/admin/promotions/:requestId/reject`, with the same disable-during-call and in-place-update behaviour as AC3.

**AC5:** Given the approve or reject fetch call fails (network error, or a non-2xx response — e.g. another admin already resolved it concurrently, matching `wugs-s9`'s own AC5 race-safety guarantee), When the failure occurs, Then the button re-enables and a clear error is shown to the admin — the UI never silently does nothing on failure.

**AC6:** Given the two endpoints this story calls already enforce `isEffectivelyAdmin` server-side (`wugs-s9` AC3, unchanged by this story), When a non-admin session somehow triggers a request to either endpoint directly (bypassing this story's own UI-level admin check), Then the existing 403 response still applies — confirmed via a regression run of `wugs-s9`'s own existing AC3 test, not re-implemented here.

## Out of Scope

- **Bulk approve/reject of multiple requests at once** — one at a time, matching `wugs-s9`'s own Out of Scope note (not re-litigated here).
- **A UI for admins to leave review comments on a request** — matching `wugs-s9`'s own Out of Scope note.
- **Any change to the two backend endpoints themselves** — this story is rendering + client-side wiring only, per the Architecture Constraints above.
- **A dedicated admin-wide "all pending promotions across all products" view** — this story only surfaces the button on the same per-product guardrails page where the pending state is already shown today; a cross-product admin queue is a larger, separate feature if ever needed.

## NFRs

- **Performance:** None specific — a single additional fetch call on button click, matching the existing "Request promotion" button's own latency profile.
- **Security:** No new security surface — both endpoints' role-gating is unchanged (AC6 confirms this via regression, not new implementation). The only new client-side logic is a CSRF-protected fetch call, matching the existing sibling button's pattern exactly.
- **Accessibility:** Approve/Reject are real `<button>` elements, keyboard-accessible — matching `wugs-s9`'s own story text, which named this requirement but (per `/trace`'s finding) was never actually built until this story.
- **Audit:** None new — both endpoints already audit-log via `wugs-s10` (unchanged, this story adds no new state-changing logic of its own beyond calling the existing endpoints).

## Complexity Rating

**Rating:** 1 — a UI rendering extension calling two already-shipped, already-tested endpoints; no new backend logic, no new data model, no new role-gating.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High, per epic-3-promotion-approval.md — unchanged for this follow-up)
