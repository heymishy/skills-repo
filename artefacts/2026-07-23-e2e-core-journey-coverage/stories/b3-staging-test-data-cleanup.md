## Story: Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **have a designed, working strategy for cleaning up the real users, products, and Stripe test-mode customers that Scenario A and Scenario B create on staging every time CI runs**,
So that **staging does not accumulate unbounded test data over time, which the discovery artefact flagged as an open risk this feature must not ship without addressing**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story does not move m1's pass/fail signal directly, but protects the gate's long-term reliability — unbounded staging data growth risks slower page loads, harder-to-debug staging state, and eventually staging environment degradation that would itself start producing false E2E failures unrelated to real regressions.

## Architecture Constraints

- None identified beyond reusing A1's staging-auth-stub audit logging (which test run created which staging user) and A3's `e2e-test-` naming convention for created products/features — checked against `.github/architecture-guardrails.md`.
- **RISK-ACCEPT reference:** this story resolves the open RISK logged in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md` ("Staging test-data accumulation") — the chosen option (nightly cleanup job / naming-convention + manual purge / accept-and-monitor) must be recorded back into that decisions.md entry, not left as "tracked, not yet resolved."

## Dependencies

- **Upstream:** A1 (auth-stub audit logging), A3 (naming convention for created records) — this story's cleanup mechanism needs both to reliably identify which staging records were E2E-generated.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the accumulated set of E2E-generated staging records (users, products, Stripe test customers) tagged with the `e2e-test-` naming convention (established by A3) after several CI runs, When a manually-triggered purge script (`scripts/cleanup-e2e-staging-data.js` or equivalent) is run against staging, Then E2E-tagged records older than a defined retention window (e.g. 7 days) are removed from staging, and non-E2E (real, manually-created) staging records are left untouched.

<!-- [1-M1, resolved 2026-07-23]: mechanism chosen at /review — naming-convention (e2e-test- tag) + manually-triggered purge script, not a scheduled nightly job. Simpler for a solo-operator repo; no scheduled-job infrastructure to build/maintain. AC1 reworded from conditional ("whichever option is selected") to a concrete, single mechanism. -->

**AC2:** Given a staging record that is NOT tagged as E2E-generated (e.g. the operator's own manual testing account), When the cleanup mechanism runs, Then that record is never deleted — the tagging/identification check is a positive allowlist match on the E2E marker, not a heuristic that could false-positive on real data.

**AC3:** Given the cleanup mechanism is implemented, When `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s "Staging test-data accumulation" RISK entry is inspected, Then it is updated to record the chosen option and confirmation that it is implemented and running, closing the previously open decision.

## Out of Scope

- Cleaning up any non-staging environment (production) — staging only
- A fully general-purpose data lifecycle/retention tool — scoped narrowly to E2E-generated records from this feature's two scenarios

## NFRs

- **Performance:** Cleanup mechanism runtime is not user-facing and has no hard latency requirement — the manually-triggered purge script has no fixed deadline.
- **Security:** Cleanup mechanism must not have broader delete permissions than strictly required to remove E2E-tagged records (e.g. scoped Postgres/Stripe test-mode API credentials, not full-admin access).
- **Accessibility:** Not applicable.
- **Audit:** Every cleanup run logs what was deleted (record type, ID, creation timestamp) for post-hoc review if something unexpected is removed.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

<!-- Resolved at /review 2026-07-23: mechanism chosen (naming-convention + manually-triggered purge script), no longer an open decision. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
