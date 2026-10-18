## Story: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Domain:** [auth]

## User Story

As an **operator / engineer**,
I want **`scripts/playback-capture.js` to run as a real CLI that authenticates against `wuce-staging` and captures one real screenshot without me driving a browser**,
So that **the walking-skeleton proof exists that the whole mechanism works end to end, before any generalisation is built on top of it**.

## Benefit Linkage

**Metric moved:** M1 — Real capture coverage on new DoD-complete features; M2 — Manual capture time per feature
**How:** This story is the foundational proof: if a CLI can authenticate and capture one real screenshot with zero manual Chrome-driving, the mechanism M1/M2 depend on is no longer theoretical — it is the first real data point either metric has ever had.

## Architecture Constraints

- **Reuses the existing `GET /test/session` route unchanged (ADR-026)** — confirmed at `/clarify` that `tests/e2e/fixtures/auth.js` already calls this exact route for every local E2E test; this story's own CLI is simply a new caller of the same mechanism, authenticated via the staging-secret branch of `_isTestEndpointAllowed` instead of the `NODE_ENV=test` branch. No new route, no widened blast radius.
- **No credentials in logs (auth-patterns.md)** — `E2E_STAGING_AUTH_STUB_SECRET` must never appear in stdout, error messages, or any saved artefact. Read from `process.env` only, per `product/constraints.md` #12.
- **No new npm dependencies** — Playwright is already a devDependency, already used by `tests/e2e/*.spec.js`.

## Dependencies

- **Upstream:** None — this is the first story in the epic.
- **Downstream:** `rpca-s2` (selector generalisation), `rpca-s3` (video capture) both build directly on this story's own auth mechanism.

## Acceptance Criteria

**AC1:** Given `E2E_STAGING_AUTH_STUB_SECRET` is set as an environment variable and a valid feature slug is passed as a CLI argument, When `node scripts/playback-capture.js [feature-slug]` is run, Then it successfully authenticates against `wuce-staging` (receives a real `session_id` cookie from `GET /test/session`) with no interactive browser login step.

**AC2:** Given a successful authentication, When the CLI navigates to one real, hand-picked AC's own stable UI state on `wuce-staging`, Then it captures a real screenshot and saves it to `artefacts/[feature-slug]/playback/[story-slug]/screenshots/[acId].png` — the exact path convention `captureAcScreenshots` already uses.

**AC3:** Given the CLI is run without `E2E_STAGING_AUTH_STUB_SECRET` set, When it starts, Then it fails immediately with a clear, named error message identifying the missing environment variable — not a confusing auth error surfaced from the staging server itself, and not a silent hang.

**AC4:** Given a real capture run completes (success or failure), When its full output (stdout, stderr, and any saved file) is inspected, Then the secret value does not appear anywhere in it.

## Out of Scope

- **Generalising beyond one hand-picked AC** — this story proves the mechanism works for a single AC; `rpca-s2` generalises it to every AC in a story.
- **Video capture** — `rpca-s3`'s own scope.
- **Production capture** — epic-level Out of Scope, not revisited per story.

## NFRs

- **Performance:** None beyond what the existing E2E suite's own `GET /test/session` call already establishes as acceptable latency.
- **Security:** Secret handling per `product/constraints.md` #12 and `auth-patterns.md`'s "no credentials in URLs or logs" — covered directly by AC4.
- **Accessibility:** Not applicable — no new UI surface, a CLI tool.
- **Audit:** None — read-only capture of already-rendered state, no new mutating action against the staging app itself.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
