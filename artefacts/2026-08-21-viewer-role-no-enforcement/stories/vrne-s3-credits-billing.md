# Story: Wire the viewer-write-block gate to Credits/billing routes

**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/benefit-metric.md`
**Domain:** [web-ui, security, auth, payments]

## User Story

As an **admin who assigned a teammate the `viewer` role**,
I want **that teammate to be denied when they attempt to start a billing checkout**,
So that **a viewer cannot initiate a real financial transaction (a Stripe Checkout session) on the tenant's behalf**.

## Benefit Linkage

**Metric moved:** Viewer role actually enforces read-only access (Tier 1); Enumerated viewer-role write actions blocked (Tier 3)
**How:** `/billing/checkout` creates a real Stripe Checkout session for the org's plan — a financial-adjacent action a read-only-intended role should never be able to trigger. Gating it moves both metrics for this route.

## Architecture Constraints

- **Reuse the shared gate built in `vrne-s1`** — do not duplicate role-check logic in `routes/billing.js`.
- `/billing/checkout` is gated only by `authGuard` today (confirmed at `/definition` via direct read of `routes/billing.js:135` — no role check beyond session presence).
- `/webhook/stripe` is explicitly out of scope — it is a Stripe-signature-verified server-to-server webhook, not a user-triggerable UI action, and has no role/session concept to gate.
- **Deny by default** — same standard as `vrne-s1`/`vrne-s2`.
- None else identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** `vrne-s1` — must be DoD-complete before this story wires the shared gate to `/billing/checkout`.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a session with `role: 'viewer'`, When the person submits `POST /billing/checkout`, Then the response is a real denial — no Stripe Checkout session is created.

**AC2:** Given a session with `role: 'engineer'`, `'product'`, or `'admin'`, When that person submits `POST /billing/checkout`, Then the request proceeds exactly as before this story (no regression to legitimate plan-upgrade flows).

**AC3:** Given the gate denies a viewer-role request on `/billing/checkout`, When the denial occurs, Then it is logged the same way as `vrne-s1`'s AC5 (person ID, tenant ID, timestamp, route).

**AC4:** Given `/webhook/stripe` receives a genuine, signature-verified Stripe webhook call, When the call is processed, Then it is unaffected by this story's gate (confirms the gate was not accidentally applied to a route that has no session/role concept at all).

## Out of Scope

- Products/Features and Skill session routes — covered by `vrne-s1`/`vrne-s2`.
- Edge-case routes — covered by `vrne-s4`.
- `/webhook/stripe` — explicitly excluded per Architecture Constraints above.
- Any change to Stripe's own webhook signature verification or credit-provisioning logic — this story only adds a role gate to the checkout-initiation route.

## NFRs

- **Performance:** No new query pattern — reuses `vrne-s1`'s gate.
- **Security:** Prevents a read-only-intended role from initiating a real payment-adjacent action. AC2 and AC4 are the regression guards.
- **Accessibility:** Not applicable.
- **Audit:** AC3 — every denial logged.

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
