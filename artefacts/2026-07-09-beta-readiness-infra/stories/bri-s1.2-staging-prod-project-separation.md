## Story: Separate staging and prod PostHog projects with isolated API keys

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want staging and production to write to entirely separate PostHog projects with separate API keys,
So that test-driven flag toggles and Playwright-generated events never pollute prod analytics or flag history.

## Benefit Linkage

**Metric moved:** Metric 3 — Zero staging/prod PostHog cross-contamination
**How:** This story is the mechanism that makes contamination structurally impossible rather than merely unlikely — separate projects, separate keys, selected by environment.

## Architecture Constraints

- D37: PostHog client wiring must go through the injectable adapter from S1.1 — the staging vs. prod key is an environment-variable-driven configuration choice, not a code branch.
- Zero-new-npm-dependencies relaxed for web-ui work (discovery.md Constraints).
- ADR-018: the live end-to-end confirmation that staging Playwright activity never reaches the prod PostHog project (originally AC3) requires a real staging environment (Epic 2) and Playwright suite (Epic 3), neither of which exist within this epic. Per Approved Pattern **PAT-06** ("Execution pre-condition gate on runtime artefact existence"), this is a DoR PROCEED-BLOCKED condition, not a plain AC: **this story's live E2E cross-contamination check cannot be verified until at least one Epic 2 story (staging environment) and bri-s3.4 (cross-tenant isolation spec, which exercises real Playwright traffic against staging) are DoD-complete.** The unit-level AC3 above is fully verifiable now; the live confirmation is deferred and tracked as a follow-up check at Epic 3 completion, not silently assumed.

## Dependencies

- **Upstream:** S1.1 (isEnabled() helper) — this story configures which PostHog project that helper talks to.
- **Downstream:** S1.4, S1.5 depend on this separation existing before tenant-level targeting and the named flags are wired.

## Acceptance Criteria

**AC1:** Given the app is running with `NODE_ENV` (or equivalent) set to staging, When any PostHog call is made (event capture or flag evaluation), Then it uses the staging project's API key exclusively.

**AC2:** Given the app is running in production, When any PostHog call is made, Then it uses the production project's API key exclusively — never the staging key.

**AC3:** Given a request is made with the staging environment variable set, When the PostHog client is inspected (unit-level, mocking the PostHog SDK), Then it was constructed with the staging API key — never the prod key, even when both keys are present in the test environment's config.

**AC4:** Given the staging API key is misconfigured or missing, When the app starts, Then it logs a clear startup error identifying which key is missing — it does not silently fall back to the prod key.

## Out of Scope

- Automatically provisioning the second PostHog project via API — the staging project is created once, manually, by Hamish in the PostHog dashboard; this story only wires the app to use it.
- Migrating historical prod event data — not applicable, this only concerns events going forward.

## NFRs

- **Performance:** None identified beyond what S1.1 already covers.
- **Security:** Staging and prod API keys are never both present in the same environment's config — no risk of cross-wiring via a leftover env var.
- **Accessibility:** Not applicable.
- **Audit:** Startup log line records which PostHog project (staging/prod) the app is configured to use, without logging the key value itself.

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
