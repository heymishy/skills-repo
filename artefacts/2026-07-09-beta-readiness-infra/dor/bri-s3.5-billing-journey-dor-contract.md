## Contract Proposal — Billing journey spec (bri-s3.5)

**What will be built:**
- A unit test for the pre-flight usage-gate function, asserting it blocks over-limit actions with a human-readable message (not a raw 402) and allows under-limit actions, with exactly-at-limit and one-under-limit boundary cases.
- Integration tests calling the Stripe webhook handler directly (no browser, no real Stripe call) for three mocked event types: `checkout.session.completed` (upgrade), a payment-failure event, and a cancellation/downgrade event — each asserting the tenant/session plan-state store reflects the new state correctly.
- A Playwright spec, `tests/e2e/bri-s3.5-billing-journey.spec.js`, tagged `@mocked` `@billing`, covering AC1–AC4 through the browser UI using Stripe test-mode checkout and mocked webhook payloads, and AC5 (zero real Stripe calls) via a call-count spy.

**What will NOT be built:**
- Real Stripe webhook delivery testing (`@live`, pre-release only) — a smaller follow-on, not built in this story.
- Per-seat/usage-based billing — explicitly deferred in `2026-07-09-team-identity-roles`'s discovery; this spec covers the existing single-plan-per-tenant model only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration: mocked `checkout.session.completed` webhook upgrades tenant to paid; E2E: browser-driven Stripe test-mode checkout confirms plan reflects paid | Integration + E2E |
| AC2 | Unit: usage-gate function blocks over-limit with human-readable message; E2E: browser-driven confirmation of the same UI-visible error | Unit + E2E |
| AC3 | Integration: mocked payment-failure webhook reflects failure state (not silently ignored); E2E: browser-driven confirmation | Integration + E2E |
| AC4 | Integration: mocked cancellation webhook downgrades plan and restricts usage gates; E2E: browser-driven confirmation | Integration + E2E |
| AC5 | E2E: call-count spy on the real Stripe API client confirms zero real calls/charges; config check confirms only test-mode key prefixes used | E2E + NFR config check |

**Assumptions:**
- Stripe test mode is already configured for staging per discovery's env-var defaults — this story consumes existing Stripe test-mode configuration, it does not set up Stripe test mode itself.
- The existing plan-limit fix (`f87bd515`) and its human-readable error pattern remain the reference implementation this story's AC2 test asserts consistency with — no change to that error message's wording is proposed by this story.
- Webhook events are synthetic/mocked payloads shaped like real Stripe test-mode events, not sourced from a live Stripe webhook — per the story's own Architecture Constraints.

**Estimated touch points:**
Files: `tests/e2e/bri-s3.5-billing-journey.spec.js` (new), Stripe webhook handler module (read-only test consumption, no behavioural change expected unless a genuine gap is found — any such gap requires a DoR contract amendment per ADR-008), usage-gate function (consumed, tested).
Services: S3.1's mock LLM gateway (consumed for `@mocked` variant, since billing flows still touch skill sessions for usage gating), Stripe test mode (consumed, no live charges).
APIs: Stripe test-mode checkout API, mocked webhook endpoint (consumed, not modified).

---

## Contract Review

Reviewed against all 5 ACs and the test plan's Unit/Integration/E2E/NFR sections. No mismatches found — the test plan's AC Coverage table maps 1:1 (AC1 integration+E2E, AC2 unit+E2E, AC3–AC4 integration+E2E, AC5 E2E) and the Out of Scope sections in both story and test plan agree.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream: S3.1 (mock LLM gateway) for the `@mocked` variant (billing flows still touch skill sessions for usage gating).

Code-level/module consumption dependency, not a `pipeline-state.json` field-read dependency in the strict H8-ext sense. Declaring the schema dependency anyway, keyed on sequencing:

`schemaDepends: ["dorStatus"]` — referring to `bri-s3.1`'s story-level `dorStatus` field in `pipeline-state.json`. Field confirmed present in `pipeline-state.schema.json`.

**H8-ext: PASS** — declared field `dorStatus` exists in `pipeline-state.schema.json`.
