# DoR Contract Proposal: Provision the wuce-staging Fly app

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md
**Date:** 2026-07-10

---

## What will be built

A new `fly.staging.toml` file at the repository root, declaring a distinct Fly.io app named `wuce-staging`. It reuses the same `Dockerfile` and build/runtime shape as the existing `fly.toml` (prod app, currently named `skills-framework`) — same `[build]`, `[http_service]` (including scale-to-zero settings `auto_stop_machines`/`min_machines_running`), and `[[vm]]` blocks. It differs only in `app` name and, where documented, staging-specific `[env]` keys. Secrets (once other Epic 2 stories wire them in) are set via `fly secrets set --app wuce-staging`, never committed.

## What will NOT be built (explicit exclusions)

- No custom domain/DNS — default `*.fly.dev` URL only (per story Out of Scope)
- No multi-region deployment — single region matching prod (per story Out of Scope)
- No actual Fly.io deploy execution as part of automated tests — a real `fly deploy` requires live Fly.io account/token access not available to this repo's Node test suite
- No changes to `fly.toml` (prod) itself — this story adds a new file, it does not modify the existing prod config
- No Fly-managed Postgres/Redis wiring — that's S2.2/S2.3's scope

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — distinct app builds/starts on Fly.io | Unit: `fly.staging.toml` exists (T1), declares `app = 'wuce-staging'` distinct from prod's app name (T2). Manual: Scenario 1 — real `fly deploy` + Fly dashboard confirmation (External-dependency gap, acknowledged) |
| AC2 — config parity except name/secrets/env | Unit: `[build]`/`[http_service]`/`[[vm]]` sections identical to `fly.toml` (T3); `[env]` key-set diff limited to documented staging-only keys (T4). Manual: Scenario 2 — side-by-side file comparison |
| AC3 — near-zero idle cost | Unit: scale-to-zero config proxy — `auto_stop_machines`/`min_machines_running` present and matching prod (NFR3). Manual: Scenario 3 — real Fly billing review ~1 week post-deploy (External-dependency gap, acknowledged) |
| NFR-Security | Unit: T5 — no hardcoded secret-shaped literals in `fly.staging.toml` |

## Assumptions

- `fly.toml` (prod) continues to exist unmodified and remains the structural reference for parity comparison.
- No staging-specific `[env]` key is currently named; T4's assertion starts as "full `[env]` parity" and will be loosened only if a documented staging-only key is introduced during implementation (not silently).
- Fly CLI (`flyctl`) is available and authenticated for whoever runs the manual verification scenarios — this is an operator/reviewer precondition, not something this story provisions.

## Estimated touch points

- `fly.staging.toml` (new file, repo root)
- `tests/` — new unit test file for T1–T5 (e.g. `tests/check-bri-s2.1-fly-staging-app.js`)
- No `src/` changes — this story is configuration-only

## Contract Review

Checked against the story's 3 ACs and the test plan's AC Coverage table — no mismatch found. Every AC maps to at least one automated test plus an acknowledged manual scenario for the External-dependency portions (live Fly.io build/billing). No hard block from contract review.
