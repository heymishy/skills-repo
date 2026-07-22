## Story: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **sign up on real deployed `wuce-staging` via a stubbed GitHub OAuth identity or via email/password, without a live third-party GitHub test account**,
So that **the E2E CI gate (m1) can exercise the real signup path on real staging instead of the local `NODE_ENV=test` mocked harness, without depending on a fragile external OAuth round-trip in CI**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** Without a staging-reachable, CI-safe way to authenticate, no later story in either scenario can run against real staging at all — this story is the load-bearing foundation the metric's entire "0/2 → 2/2 covered" target depends on.

## Architecture Constraints

- **ADR-018 gap identified at /definition (this story resolves it):** ADR-018 ("Playwright is the E2E testing framework... auth bypass is test-fixture-layer only (`NODE_ENV=test` guard)") was written for the existing local-mocked harness, where the server itself runs with `NODE_ENV=test`. `wuce-staging` runs in production mode — the `NODE_ENV=test` guard does not exist there and must not be added to a real deployed environment (that would weaken production auth for all traffic, not just E2E). This story must design a **staging-only, non-production-weakening** stub mechanism — e.g. a dedicated staging-only OAuth test application registered with GitHub scoped to a fixed test identity, or a staging-only signed test-bypass token gated by an environment variable that is never set on the real production Fly app. Once implemented, append an addendum to ADR-018 in `.github/architecture-guardrails.md` documenting the new mechanism, its scope (staging only), and why it does not weaken production auth.
- **ADR-025:** multi-tenancy is enforced at the application layer (tenant_id scoping) — the stub identity/email signup must produce a real, correctly tenant-scoped user/tenant record on staging, not a synthetic record that bypasses tenant provisioning.
- Guardrail: no credentials, tokens, or personal data may be committed to `pipeline-state.json` or any committed artefact — any staging test secrets (OAuth app client ID/secret, test-bypass signing key) must be stored as CI secrets, never hardcoded in spec files or this artefact.

## Dependencies

- **Upstream:** None — this is the foundational story for Epic A.
- **Downstream:** A2, A3, A4, A5 (all of Epic A) and B1 (Epic B) all require this story's auth stub mechanism to authenticate on staging before their own assertions can run.

## Acceptance Criteria

**AC1:** Given a fresh Playwright test run targeting `wuce-staging`'s real base URL, When the spec authenticates using the new staging-safe GitHub OAuth stub mechanism, Then a real user record is created on staging (queryable via the staging database/API) and the response sets a valid session cookie scoped to that user.

<!-- [1-M1, resolved 2026-07-23]: reworded from "no local mocked server is involved" (an architectural property, not a runtime-observable assertion) to a concrete, positive outcome. -->

**AC2:** Given the same Playwright test run, When the spec instead signs up via email/password against real staging, Then a real user record is created and a valid session is established, independent of the GitHub stub path.

**AC3:** Given the staging-safe auth stub mechanism, When inspected against the real production Fly app configuration (`fly.toml`, not `fly.staging.toml`), Then the stub mechanism's enabling environment variable or test-only OAuth app credential is confirmed absent from production — production auth behaviour is unchanged.

**AC4:** Given the new mechanism is implemented, When `.github/architecture-guardrails.md`'s ADR-018 section is inspected, Then it contains an addendum documenting the staging-safe stub mechanism, its scope (staging only), and the reasoning that it does not weaken production auth.

## Out of Scope

- A live, non-stubbed GitHub OAuth round-trip against a real GitHub test account — explicitly deferred per discovery's clarification (stubbed/mocked only)
- Google OAuth stubbing — not in discovery's MVP scope
- Any change to the production (`wuce.fly.dev`) auth flow — this story is additive to staging only

## NFRs

- **Performance:** Auth stub round-trip (stub OAuth or email signup) completes in under 5 seconds against real staging network latency.
- **Security:** Stub-enabling credentials/tokens are staging-only CI secrets, never committed to the repo or logged in plaintext; the stub mechanism cannot be triggered against the production Fly app under any environment variable state that could plausibly exist on production.
- **Accessibility:** Not applicable — this story is test infrastructure, not user-facing UI.
- **Audit:** The stub auth mechanism's usage is logged (which test run created which staging user) to support the B3 cleanup story's ability to identify and purge E2E-generated records.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
