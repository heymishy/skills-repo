## Story: Deploy WUCE_MODEL_OVERRIDE Fly secrets for all 5 governance-critical skills, on both environments

**Epic reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/epics/route-governance-skills-to-sonnet.md
**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/benefit-metric.md
**Domain:** [platform, ai-infra]

## User Story

As **the platform owner**,
I want **`design`, `definition`, `review`, `test-plan`, and `definition-of-ready` to actually route to Sonnet on both `wuce-staging` and production**,
So that **the 2026-09-15 and 2026-09-29 failure modes stop recurring in real usage, not just in a verification session**.

## Benefit Linkage

**Metric moved:** Governance-critical skill completion integrity; Manual restart incidents (Tier 1, `benefit-metric.md`)
**How:** Sets 5 `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secrets as permanent config on both real environments, using `psrc-s1`'s already-built, already-tested per-skill override mechanism.

## Architecture Constraints

- **Hard dependency on `psrc-verify-s1`:** do not run this story unless `psrc-verify-s1`'s AC4 go/no-go decision is recorded as "go" in `decisions.md`.
- No code changes — this story is pure operational configuration (Fly secrets), consistent with `psrc-s1`'s own design intent (per-skill override without a code deploy).
- Both environments must be set — a staging-only fix reproduces the exact gap this feature exists to close (the mechanism existed in code since 2026-09-15 but was never actually deployed anywhere).

## Dependencies

- **Upstream:** `psrc-verify-s1` (hard — schema/config dependency: this story reads that story's own go/no-go decision).
- **Downstream:** `psrc-verify-s3` depends on these secrets existing to check against.

## Acceptance Criteria

**AC1:** Given `psrc-verify-s1` recorded a "go" decision, When `fly secrets set WUCE_MODEL_OVERRIDE_DESIGN=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_DEFINITION=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_REVIEW=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY=claude-sonnet-4-6 -a wuce-staging` is run, Then `fly secrets list -a wuce-staging` shows all 5 secrets present.

**AC2:** Given the same, When the equivalent command is run with `-a skills-framework` (production), Then `fly secrets list -a skills-framework` shows all 5 secrets present.

**AC3:** Given both environments now have the secrets set, When a real session runs any of the 5 skills against either environment, Then the resolved model (confirmed via a fresh `$ai_generation` PostHog event) is `claude-sonnet-4-6` (or whatever Sonnet version `getActiveModel()`/the override literal resolves to), not `claude-haiku-4-5`.

**AC4:** Given the secrets are set, When `discovery` or `ideate` are run (unaffected skills), Then their existing Sonnet-default routing is confirmed unchanged — no regression to the two skills already correctly routed.

## Out of Scope

- The verification itself (`psrc-verify-s1`'s job).
- The drift guard (`psrc-verify-s3`'s job).
- Any Fly secret unrelated to model routing.

## NFRs

- **Performance:** Sonnet is slower and more expensive per-call than Haiku — accepted trade-off per this feature's own discovery.md (reliability prioritised over cost/latency for these 5 gating skills; not quantified further, logged as an open Tier 2/3 consideration).
- **Security:** No new credentials introduced — `WUCE_MODEL_OVERRIDE_*` values are plain model-id strings, not secrets in the sensitive sense, but still set via `fly secrets set` per this repo's own established convention for all `WUCE_*` env config.
- **Accessibility:** Not applicable.
- **Audit:** `fly secrets list` output for both environments, captured in this story's own verification evidence, is the audit trail.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
