# DoR Contract Proposal: Build an idempotent anonymized seed script for staging

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.4-anonymized-seed-script.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
**Date:** 2026-07-10

---

## What will be built

An idempotent seed script (e.g. `scripts/seed-staging.js`) that populates the staging Neon branch with ≥2 synthetic tenants, each with representative rows across tenant-scoped tables (`products`, `credits`, `user_roles`, etc.), respecting the ADR-025 `tenant_id`-scoping model. The script's DB connection is an injectable adapter (D37), defaulting to a mock in test mode and a real Postgres connection in production. It runs automatically as a post-deploy step (invoked by S2.5's pipeline) and logs a success/failure summary with row counts.

## What will NOT be built (explicit exclusions)

- No Stripe billing/subscription seed data (per story Out of Scope) — covered separately by S3.5
- No configurable seed volume/scale (per story Out of Scope) — MVP is a fixed small set of synthetic tenants
- No real Neon database writes in the automated test suite — all tests use the injected mock adapter (D37)
- No implementation of S2.5's pipeline invocation itself — this story only proves the script is invokable as a single entrypoint; automatic triggering is S2.5's scope (cross-referenced, not duplicated)

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — ≥2 synthetic tenants with representative rows | Unit: T1 (≥2 distinct tenant_id values), T2 (representative rows per tenant-scoped table), T3 (ADR-025 tenant_id scoping present on every row) |
| AC2 — idempotent re-run | Unit: T4 (identical row count on second run), T5 (no unique-constraint error on second run) |
| AC3 — zero real PII | Unit: T6 (synthetic email domain pattern), T7 (denylist scan against real-data patterns, best-effort) |
| AC4 — automatic post-deploy execution | Integration: IT1 (single CLI-invokable entrypoint, exit code 0, summary stdout). Manual: Scenario 4 — real staging deploy, confirm seed step runs automatically (External-dependency, partial — cross-referenced against S2.5's own AC3 test, which asserts the pipeline calls this script) |
| NFR-Performance | Mocked timing: elapsed < 30s against the mock adapter (real DB round-trip time is a lighter-weight partial gap, not fully tested) |
| NFR-Security | T6/T7 (zero real PII, same as AC3) |
| NFR-Audit | IT1 (stdout summary line with tenant/row counts) |

## Assumptions

- The seed script exposes a `seed(adapter)` function callable with an injected adapter, plus a CLI entrypoint that swaps in the mock via a test-mode flag/env var.
- Idempotency is achieved via `INSERT ... ON CONFLICT DO NOTHING` or an equivalent pre-check — not via a full table wipe-and-reseed (which would not be idempotent in the sense the AC requires, and would risk clobbering any manually-inserted test data from other stories' manual scenarios).
- This story does not implement the deploy-pipeline invocation itself; S2.5's own test plan (its AC3/IT1) is the authoritative test of "the pipeline calls this script as its next step."

## Estimated touch points

- `scripts/seed-staging.js` (new file) — the seed script itself, with an injectable DB-connection adapter (D37)
- `tests/` — new test file for T1–T7, IT1 (e.g. `tests/check-bri-s2.4-anonymized-seed-script.js`)
- No changes to existing `src/web-ui/adapters/` modules expected — this is a new, standalone script, not a modification to the existing journey-store adapter

## Contract Review

Checked against the story's 4 ACs and the test plan's AC Coverage table — no mismatch found. AC4's "automatic" claim is correctly split between this story's IT1 (invokability) and S2.5's own test plan (actual pipeline wiring) — cross-referenced, not silently assumed by either side.

### D37 injectable-adapter compliance (H-ADAPTER)

The story's Architecture Constraints states "D37: the seed script's DB connection is injected, consistent with other adapters, not hardcoded" but does not, in its current text, explicitly state the CLAUDE.md D37 rule's stub-throws requirement ("Stub defaults MUST throw, not return empty/null"). Per the D37 rule, this DoR contract supplies the missing pieces explicitly so they are not silently absent at implementation time:

- **(a) Production wiring AC:** AC4 already covers "the seed script executes automatically as part of that deploy," and Scenario 4/S2.5's own AC3 test verify the wiring in practice. This DoR contract makes explicit that the production wiring requirement is satisfied by AC4 + the cross-referenced S2.5 test, not left implicit.
- **(b) Stub-throws constraint:** Added explicitly to the Coding Agent Instructions below — the default/stub DB-connection adapter (used before a real implementation is wired) MUST throw `Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.')` rather than silently returning an empty/no-op connection. This is a DoR-time addition since the story text did not state it; it is now part of the binding contract for implementation.
- **(c) Wiring-as-separate-task:** Per task scope, this is a forward requirement for `/implementation-plan` — the plan must name "wire the real Postgres adapter in the script's production entrypoint" as a distinct task from "write the seed logic + injectable setter," not bundled into one task.

With (a) and (b) now explicit in this contract, H-ADAPTER does not block DoR sign-off.
